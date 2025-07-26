import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RemoveMemberRequest } from '@/lib/types/groups';

export async function POST(request: Request) {
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

    // Parse request body
    const body: RemoveMemberRequest = await request.json();
    const { user_id: memberUserId } = body;

    if (!memberUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify that the current user owns a group plan
    const { data: groupPlan, error: planError } = await supabase
      .from('group_plans')
      .select('id')
      .eq('owner_id', user.id)
      .eq('active', true)
      .single();

    if (planError || !groupPlan) {
      return NextResponse.json(
        { success: false, error: 'You do not own an active group plan' },
        { status: 403 }
      );
    }

    // Prevent owner from removing themselves
    if (memberUserId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove yourself from the group' },
        { status: 400 }
      );
    }

    // Verify that the member exists in the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_plan_memberships')
      .select('user_id')
      .eq('group_plan_id', groupPlan.id)
      .eq('user_id', memberUserId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of this group' },
        { status: 400 }
      );
    }

    // Remove the member from the group
    const { error: removeError } = await supabase
      .from('group_plan_memberships')
      .delete()
      .eq('group_plan_id', groupPlan.id)
      .eq('user_id', memberUserId);

    if (removeError) {
      console.error('Error removing member:', removeError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Member successfully removed from the group',
      },
    });
  } catch (error) {
    console.error('Unexpected error in remove member:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}