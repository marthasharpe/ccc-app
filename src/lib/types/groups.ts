export interface GroupPlan {
  id: string;
  owner_id: string;
  plan_type: 'small' | 'large';
  max_members: number;
  join_code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupPlanMembership {
  group_plan_id: string;
  user_id: string;
  joined_at: string;
  role: 'member' | 'admin';
}

export interface GroupPlanWithMembers extends GroupPlan {
  memberships: (GroupPlanMembership & {
    user: {
      id: string;
      email?: string;
    };
  })[];
  member_count: number;
}

export interface CreateGroupPlanRequest {
  plan_type: 'small' | 'large';
}

export interface JoinGroupRequest {
  join_code: string;
}

export interface RemoveMemberRequest {
  user_id: string;
}

export type GroupPlanResponse = {
  success: boolean;
  data?: GroupPlanWithMembers;
  error?: string;
};

export type GroupMembersResponse = {
  success: boolean;
  data?: (GroupPlanMembership & {
    user: {
      id: string;
      email?: string;
    };
  })[];
  error?: string;
};