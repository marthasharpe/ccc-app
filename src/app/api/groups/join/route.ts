import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { JoinGroupRequest } from '@/lib/types/groups';

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
    const body: JoinGroupRequest = await request.json();
    const { join_code } = body;

    if (!join_code) {
      return NextResponse.json(
        { success: false, error: 'Join code is required' },
        { status: 400 }
      );
    }

    // Find the group plan by join code using service client to bypass RLS
    const cleanedJoinCode = join_code.replace(/[-\s]/g, "").toUpperCase();
    
    // Use service client for join code lookup to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: groupPlan, error: planError } = await serviceSupabase
      .from('group_plans')
      .select('*')
      .eq('join_code', cleanedJoinCode)
      .eq('active', true)
      .single();

    if (planError || !groupPlan) {
      return NextResponse.json(
        { success: false, error: 'Invalid join code' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('group_plan_memberships')
      .select('user_id')
      .eq('group_plan_id', groupPlan.id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Check if the group has reached maximum capacity
    const { count: memberCount, error: countError } = await supabase
      .from('group_plan_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('group_plan_id', groupPlan.id);

    if (countError) {
      console.error('Error counting members:', countError);
      return NextResponse.json(
        { success: false, error: 'Failed to check group capacity' },
        { status: 500 }
      );
    }

    if ((memberCount || 0) >= groupPlan.max_members) {
      return NextResponse.json(
        { success: false, error: 'Group has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Add user to the group
    const { error: joinError } = await supabase
      .from('group_plan_memberships')
      .insert({
        group_plan_id: groupPlan.id,
        user_id: user.id,
        role: 'member',
      });

    if (joinError) {
      console.error('Error joining group:', joinError);
      return NextResponse.json(
        { success: false, error: 'Failed to join group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Successfully joined the group',
        group_plan_id: groupPlan.id,
        plan_type: groupPlan.plan_type,
      },
    });
  } catch (error) {
    console.error('Unexpected error in join group:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}