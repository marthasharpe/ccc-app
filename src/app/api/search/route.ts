import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { generateEmbedding, rewriteQuery } from '@/lib/openai'
import { expandQuery } from '@/utils/expandQuery'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('Original query:', query)

    // Step 1: Try keyword search first
    const { data: keywordResults, error: keywordError } = await supabaseService.rpc('search_ccc_paragraphs_keywords', {
      search_query: query,
      match_count: 10
    })

    if (keywordError) {
      console.error('Keyword search error:', keywordError)
    } else {
      console.log(`Keyword search found ${keywordResults?.length || 0} results`)
    }

    // If we have good keyword results (5 or more), use them instead of semantic search
    if (keywordResults && keywordResults.length >= 5) {
      console.log('Using keyword search results (sufficient matches found)')
      
      // Transform keyword results to match expected format
      const transformedResults = keywordResults.map((result: any) => ({
        id: result.id,
        paragraph_number: result.paragraph_number,
        content: result.content,
        similarity: result.relevance // Use relevance score as similarity
      }))

      return NextResponse.json({
        results: transformedResults,
        query,
        searchType: 'keyword'
      })
    }

    // Step 2: Fall back to semantic search if keyword search didn't find enough results
    console.log('Falling back to semantic search (insufficient keyword matches)')

    // Rewrite query using LLM to optimize for theological search
    const rewrittenQuery = await rewriteQuery(query)
    console.log('LLM rewritten query:', rewrittenQuery)
    
    // Expand the rewritten query with synonyms for additional coverage
    const expandedQuery = expandQuery(rewrittenQuery)
    
    // Log the full transformation pipeline for auditing
    if (expandedQuery !== rewrittenQuery) {
      console.log('Synonym expansion applied:')
      console.log('  After rewrite:', rewrittenQuery)
      console.log('  After expansion:', expandedQuery)
    }

    // Generate embedding for the optimized query
    const queryEmbedding = await generateEmbedding(expandedQuery)

    // Search for similar paragraphs using the pgvector function
    const { data: semanticResults, error: semanticError } = await supabaseService.rpc('search_ccc_paragraphs', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 10
    })

    if (semanticError) {
      console.error('Semantic search error:', semanticError)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    // Combine keyword results (if any) with semantic results, prioritizing keyword matches
    let finalResults = []
    
    if (keywordResults && keywordResults.length > 0) {
      // Add keyword results first (transformed to match format)
      const transformedKeywordResults = keywordResults.map((result: any) => ({
        id: result.id,
        paragraph_number: result.paragraph_number,
        content: result.content,
        similarity: result.relevance + 0.5 // Boost keyword results
      }))
      finalResults.push(...transformedKeywordResults)
    }

    if (semanticResults && semanticResults.length > 0) {
      // Add semantic results, avoiding duplicates
      const existingIds = new Set(finalResults.map(r => r.id))
      const newSemanticResults = semanticResults.filter((result: any) => !existingIds.has(result.id))
      finalResults.push(...newSemanticResults)
    }

    // Sort by similarity score (higher is better) and limit to 10 results
    finalResults.sort((a, b) => b.similarity - a.similarity)
    finalResults = finalResults.slice(0, 10)

    return NextResponse.json({
      results: finalResults,
      query,
      searchType: keywordResults && keywordResults.length > 0 ? 'hybrid' : 'semantic'
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}