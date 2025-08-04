import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import { saveUserResponse } from "@/lib/userResponses";

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const { prompt, response, tokensUsed } = await request.json();

    if (!prompt || !response || typeof tokensUsed !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: prompt, response, tokensUsed" },
        { status: 400 }
      );
    }

    // Save the response
    const result = await saveUserResponse({
      userId: (user as { id: string }).id,
      prompt,
      response,
      tokensUsed,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
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
});
