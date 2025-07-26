import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GroupPlanResponse } from '@/lib/types/groups';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the user's owned group plan
    const { data: groupPlan, error: fetchError } = await supabase
      .from('group_plans')
      .select(`
        *,
        memberships:group_plan_memberships(*)
      `)
      .eq('owner_id', user.id)
      .eq('active', true)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No group plan found
        return NextResponse.json({
          success: true,
          data: null,
        });
      }
      console.error('Error fetching group plan:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch group plan' },
        { status: 500 }
      );
    }

    // Fetch user emails for all members
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching user emails:', usersError);
    }

    // Create a map of user IDs to emails
    const userEmailMap = new Map();
    authUsers?.users.forEach(authUser => {
      userEmailMap.set(authUser.id, authUser.email);
    });

    // Add user info to memberships
    const membershipsWithUsers = groupPlan.memberships?.map((membership: { user_id: string; [key: string]: unknown }) => ({
      ...membership,
      user: { 
        id: membership.user_id, 
        email: userEmailMap.get(membership.user_id) || null
      },
    })) || [];

    const response: GroupPlanResponse = {
      success: true,
      data: {
        ...groupPlan,
        memberships: membershipsWithUsers,
        member_count: membershipsWithUsers.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in get my group plan:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}