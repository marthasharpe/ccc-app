import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveUserResponse } from "@/lib/userResponses";

export async function POST(request: NextRequest) {
  try {
    const { prompt, response, tokensUsed } = await request.json();

    if (!prompt || !response || typeof tokensUsed !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: prompt, response, tokensUsed" },
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

    // Save the response
    const result = await saveUserResponse({
      userId: user.id,
      prompt,
      response,
      tokensUsed,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Response saved successfully",
    });

  } catch (error) {
    console.error("Error saving user response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}