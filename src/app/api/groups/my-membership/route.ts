import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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

    // Find the user's group membership using regular client
    const { data: membership, error: membershipError } = await supabase
      .from('group_plan_memberships')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (membershipError) {
      if (membershipError.code === 'PGRST116') {
        // No membership found
        return NextResponse.json({
          success: true,
          data: null,
        });
      }
      console.error('Error fetching membership:', membershipError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch membership' },
        { status: 500 }
      );
    }

    // Get group plan details using service client to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: groupPlan, error: planError } = await serviceSupabase
      .from('group_plans')
      .select('*')
      .eq('id', membership.group_plan_id)
      .single();

    if (planError || !groupPlan) {
      console.error('Error fetching group plan:', planError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch group plan details' },
        { status: 500 }
      );
    }

    // Combine membership with group plan data
    const membershipWithOwner = {
      ...membership,
      group_plan: {
        ...groupPlan,
        owner: { id: groupPlan.owner_id, email: null }, // Email not available
      },
    };

    return NextResponse.json({
      success: true,
      data: membershipWithOwner,
    });
  } catch (error) {
    console.error('Unexpected error in get my membership:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow users to leave a group
export async function DELETE() {
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

    // Find and remove the user's membership using service client to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteError } = await serviceSupabase
      .from('group_plan_memberships')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error leaving group:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to leave group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Successfully left the group',
      },
    });
  } catch (error) {
    console.error('Unexpected error in leave group:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}