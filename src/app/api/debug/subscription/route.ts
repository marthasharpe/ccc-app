import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all subscriptions for this user (not just active ones)
    const { data: subscriptions, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // Also check if the table exists and has the right structure
    const { data: tableInfo, error: tableError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .limit(1);

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      subscriptions,
      subscriptionCount: subscriptions?.length || 0,
      tableAccessible: !tableError,
      tableError: tableError?.message
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug info" },
      { status: 500 }
    );
  }
}