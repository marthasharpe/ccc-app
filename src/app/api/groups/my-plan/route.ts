import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { GroupPlanResponse } from "@/lib/types/groups";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the user's owned group plan with stored emails (get most recent if multiple)
    const { data: groupPlans, error: fetchError } = await supabase
      .from("group_plans")
      .select(
        `
        *,
        memberships:group_plan_memberships(*, email)
      `
      )
      .eq("owner_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    const groupPlan = groupPlans?.[0] || null;

    if (fetchError) {
      console.error("Error fetching group plans:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch group plan" },
        { status: 500 }
      );
    }

    if (!groupPlan) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Fetch last activity for all members using service client to bypass RLS
    const memberUserIds =
      groupPlan.memberships?.map(
        (membership: { user_id: string }) => membership.user_id
      ) || [];

    // Use service client for activity lookup to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: lastActivityData, error: activityError } =
      await serviceSupabase
        .from("daily_usage")
        .select("user_id, date")
        .in("user_id", memberUserIds)
        .order("date", { ascending: false });

    if (activityError) {
      console.error("Error fetching member activity:", activityError);
    }

    // Create a map of user IDs to their last activity date
    const lastActivityMap = new Map();
    lastActivityData?.forEach((activity) => {
      if (!lastActivityMap.has(activity.user_id)) {
        lastActivityMap.set(activity.user_id, activity.date);
      }
    });

    // Add activity data to memberships (email is already included)
    const membershipsWithActivity =
      groupPlan.memberships?.map(
        (membership: {
          user_id: string;
          email?: string;
          [key: string]: unknown;
        }) => ({
          ...membership,
          last_activity_date: lastActivityMap.get(membership.user_id) || null,
        })
      ) || [];

    const response: GroupPlanResponse = {
      success: true,
      data: {
        ...groupPlan,
        memberships: membershipsWithActivity,
        member_count: membershipsWithActivity.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in get my group plan:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
