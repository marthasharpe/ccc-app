import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserResponse } from "@/lib/userResponses";

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

    // Perform full-text search using PostgreSQL tsvector
    const { data: matches, error: searchError } = await supabase
      .from("user_responses")
      .select("id, user_id, prompt, response, tokens_used, created_at")
      .eq("user_id", user.id)
      .textSearch("tsv", query, {
        type: "plain",
        config: "english",
      })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (searchError) {
      console.error("Keyword search error:", searchError);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    // Transform the results to match UserResponse interface
    const results: UserResponse[] = (matches || []).map((match) => ({
      id: match.id,
      user_id: match.user_id,
      prompt: match.prompt,
      response: match.response,
      tokens_used: match.tokens_used,
      created_at: match.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });

  } catch (error) {
    console.error("Error in keyword search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}