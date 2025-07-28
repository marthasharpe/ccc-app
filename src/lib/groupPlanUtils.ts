import {
  GroupPlanWithMembers,
  GroupPlanResponse,
  JoinGroupRequest,
  RemoveMemberRequest,
} from "@/lib/types/groups";

/**
 * Get the current user's owned group plan
 */
export async function getMyGroupPlan(): Promise<GroupPlanResponse> {
  try {
    const response = await fetch("/api/groups/my-plan");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching group plan:", error);
    return {
      success: false,
      error: "Failed to fetch group plan",
    };
  }
}

/**
 * Join a group using a join code
 */
export async function joinGroup(
  request: JoinGroupRequest
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  try {
    const response = await fetch("/api/groups/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error joining group:", error);
    return {
      success: false,
      error: "Failed to join group",
    };
  }
}

/**
 * Remove a member from the group (owner only)
 */
export async function removeMember(
  request: RemoveMemberRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/groups/remove-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error removing member:", error);
    return {
      success: false,
      error: "Failed to remove member",
    };
  }
}

/**
 * Get the current user's group membership
 */
export async function getMyMembership(): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const response = await fetch("/api/groups/my-membership");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching membership:", error);
    return {
      success: false,
      error: "Failed to fetch membership",
    };
  }
}

/**
 * Leave the current group
 */
export async function leaveGroup(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch("/api/groups/my-membership", {
      method: "DELETE",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error leaving group:", error);
    return {
      success: false,
      error: "Failed to leave group",
    };
  }
}

/**
 * Check if a user has group plan benefits (either owner or member)
 * This function is used by the usage tracking system
 */
export async function hasGroupPlanBenefits(): Promise<boolean> {
  // Only check on client side to avoid server-side fetch issues
  if (typeof window === "undefined") {
    return false;
  }

  try {
    // Direct API calls to avoid circular dependencies
    const [ownedPlanResponse, membershipResponse] = await Promise.all([
      fetch("/api/groups/my-plan", {
        cache: "no-store", // Ensure fresh data
      })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
      fetch("/api/groups/my-membership", {
        cache: "no-store", // Ensure fresh data
      })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
    ]);

    // Check if user owns a group plan
    if (ownedPlanResponse.success && ownedPlanResponse.data) {
      return true;
    }

    // Check if user is a member of a group plan
    if (membershipResponse.success && membershipResponse.data) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking group plan benefits:", error);
    return false;
  }
}

/**
 * Get formatted member count display
 */
export function formatMemberCount(count: number, maxMembers: number): string {
  return `${count}/${maxMembers} members`;
}

/**
 * Check if a group is at capacity
 */
export function isGroupAtCapacity(group: GroupPlanWithMembers): boolean {
  return group.member_count >= group.max_members;
}

/**
 * Get plan type display name
 */
export function getPlanTypeDisplayName(planType: "small" | "large"): string {
  return planType === "small" ? "Small Group" : "Large Group";
}

export function getPlanTypeDescription(planType: "small" | "large"): string {
  return planType === "small" ? "up to 10 members" : "up to 100 members";
}

/**
 * Format join code for display (adds dashes for readability)
 */
export function formatJoinCode(joinCode: string): string {
  // Format as XXXX-XXXX for better readability
  return joinCode.length === 8
    ? `${joinCode.slice(0, 4)}-${joinCode.slice(4)}`
    : joinCode;
}

/**
 * Clean join code (remove dashes and spaces, convert to uppercase)
 */
export function cleanJoinCode(joinCode: string): string {
  return joinCode.replace(/[-\s]/g, "").toUpperCase();
}
