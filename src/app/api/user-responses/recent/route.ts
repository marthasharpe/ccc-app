import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserResponse } from "@/lib/userResponses";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch recent responses
    const { data: responses, error: fetchError } = await supabase
      .from("user_responses")
      .select("id, user_id, prompt, response, tokens_used, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fetchError) {
      console.error("Error fetching recent responses:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch responses" },
        { status: 500 }
      );
    }

    // Transform the results to match UserResponse interface
    const results: UserResponse[] = (responses || []).map((response) => ({
      id: response.id,
      user_id: response.user_id,
      prompt: response.prompt,
      response: response.response,
      tokens_used: response.tokens_used,
      created_at: response.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });

  } catch (error) {
    console.error("Error fetching recent responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}