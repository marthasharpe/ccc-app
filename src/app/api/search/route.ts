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

    // Step 1: Rewrite query using LLM to optimize for theological search
    // Convert modern/colloquial language into precise Catechism terminology
    console.log('Original query:', query)
    const rewrittenQuery = await rewriteQuery(query)
    console.log('LLM rewritten query:', rewrittenQuery)
    
    // Step 2: Expand the rewritten query with synonyms for additional coverage
    const expandedQuery = expandQuery(rewrittenQuery)
    
    // Log the full transformation pipeline for auditing
    if (expandedQuery !== rewrittenQuery) {
      console.log('Synonym expansion applied:')
      console.log('  After rewrite:', rewrittenQuery)
      console.log('  After expansion:', expandedQuery)
    }

    // Step 3: Generate embedding for the optimized query
    const queryEmbedding = await generateEmbedding(expandedQuery)

    // Search for similar paragraphs using the pgvector function
    const { data: results, error } = await supabaseService.rpc('search_ccc_paragraphs', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 10
    })

    if (error) {
      console.error('Supabase search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      results: results || [],
      query
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}