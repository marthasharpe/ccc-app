import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import type { UserResponse } from "@/lib/userResponses";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Call the RPC function for semantic search
    const { data: matches, error: searchError } = await supabase.rpc(
      "match_user_responses",
      {
        user_id: user.id,
        query_embedding: queryEmbedding,
        match_count: limit,
      }
    );

    if (searchError) {
      console.error("Semantic search error:", searchError);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    // Transform the results to match UserResponse interface
    const results: UserResponse[] = (matches || []).map((match: {
      id: string;
      user_id: string;
      prompt: string;
      response: string;
      tokens_used: number;
      created_at: string;
      similarity: number;
    }) => ({
      id: match.id,
      user_id: match.user_id,
      prompt: match.prompt,
      response: match.response,
      tokens_used: match.tokens_used,
      created_at: match.created_at,
      similarity: match.similarity,
    }));

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });

  } catch (error) {
    console.error("Error in semantic search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}