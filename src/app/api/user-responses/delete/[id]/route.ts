import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Response ID is required" },
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

    // Delete the user response (only if it belongs to the authenticated user)
    const { error: deleteError } = await supabase
      .from("user_responses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting user response:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Response deleted successfully",
    });

  } catch (error) {
    console.error("Error in delete response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}