import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";
import { expandQuery } from "@/utils/expandQuery";

// Type definitions for search results
interface KeywordSearchResult {
  id: number;
  paragraph_number: number;
  content: string;
  relevance: number;
}

interface SemanticSearchResult {
  id: number;
  paragraph_number: number;
  content: string;
  similarity: number;
}

interface TransformedSearchResult {
  id: number;
  paragraph_number: number;
  content: string;
  similarity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("Original query:", query);

    // Step 1: Try keyword search first
    let keywordResults = null;
    let keywordError = null;
    
    try {
      const { data, error } = await supabaseService.rpc("search_ccc_paragraphs_keywords", {
        search_query: query,
        match_count: 10,
      });
      keywordResults = data;
      keywordError = error;
    } catch (err) {
      console.error("Keyword search function not available:", err);
      console.log("Falling back to semantic search only");
      keywordError = err;
    }

    if (keywordError) {
      console.error("Keyword search error:", keywordError);
    } else {
      console.log(
        `Keyword search found ${keywordResults?.length || 0} results`
      );
    }

    // If we have good keyword results (5 or more), use them instead of semantic search
    if (keywordResults && keywordResults.length >= 5) {
      console.log("Using keyword search results (sufficient matches found)");

      // Transform keyword results to match expected format
      const transformedResults = keywordResults.map(
        (result: KeywordSearchResult) => ({
          id: result.id,
          paragraph_number: result.paragraph_number,
          content: result.content,
          similarity: result.relevance, // Use relevance score as similarity
        })
      );

      return NextResponse.json({
        results: transformedResults,
        query,
        searchType: "keyword",
      });
    }

    // Step 2: Fall back to semantic search if keyword search didn't find enough results
    console.log(
      "Falling back to semantic search (insufficient keyword matches)"
    );

    // Expand the rewritten query with synonyms for additional coverage
    const expandedQuery = expandQuery(query);

    // Log the full transformation pipeline for auditing
    if (expandedQuery !== query) {
      console.log("Synonym expansion applied:");
      console.log("  After rewrite:", query);
      console.log("  After expansion:", expandedQuery);
    }

    // Generate embedding for the optimized query
    const queryEmbedding = await generateEmbedding(expandedQuery);

    // Search for similar paragraphs using the pgvector function
    const { data: semanticResults, error: semanticError } =
      await supabaseService.rpc("search_ccc_paragraphs", {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 10,
      });

    if (semanticError) {
      console.error("Semantic search error:", semanticError);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Prioritize keyword results: they always appear first, then semantic results
    let finalResults: TransformedSearchResult[] = [];

    // First, add keyword results (if any) - these are always first regardless of score
    if (keywordResults && keywordResults.length > 0) {
      const transformedKeywordResults = keywordResults.map(
        (result: KeywordSearchResult) => ({
          id: result.id,
          paragraph_number: result.paragraph_number,
          content: result.content,
          similarity: result.relevance, // Keep original relevance, no artificial boost needed
        })
      );

      // Sort keyword results by their original relevance score
      transformedKeywordResults.sort(
        (a: TransformedSearchResult, b: TransformedSearchResult) =>
          b.similarity - a.similarity
      );
      finalResults.push(...transformedKeywordResults);
    }

    // Then add semantic results, avoiding duplicates with keyword results
    if (semanticResults && semanticResults.length > 0) {
      const existingIds = new Set(finalResults.map((r) => r.id));
      const newSemanticResults = semanticResults.filter(
        (result: SemanticSearchResult) => !existingIds.has(result.id)
      );

      // Sort semantic results by similarity
      newSemanticResults.sort(
        (a: SemanticSearchResult, b: SemanticSearchResult) =>
          b.similarity - a.similarity
      );
      finalResults.push(...newSemanticResults);
    }

    // Limit to 10 total results (keyword results first, then semantic)
    finalResults = finalResults.slice(0, 10);

    return NextResponse.json({
      results: finalResults,
      query,
      searchType:
        keywordResults && keywordResults.length > 0 ? "hybrid" : "semantic",
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
