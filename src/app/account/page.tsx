"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getUserStatus } from "@/lib/usageTracking";
import {
  getMyGroupPlan,
  getMyMembership,
  leaveGroup,
} from "@/lib/groupPlanUtils";
import { Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { joinGroup, cleanJoinCode } from "@/lib/groupPlanUtils";

interface GroupMembership {
  id: string;
  user_id: string;
  group_plan_id: string;
  role: string;
  joined_at: string;
  group_plan: {
    id: string;
    plan_type: "small" | "large";
    max_members: number;
    owner_id: string;
  };
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<{
    isAuthenticated: boolean;
    dailyLimit: number;
    tokensUsed: number;
    remainingTokens: number;
    usagePercentage: number;
    hasActiveSubscription: boolean;
    planName?: string;
  } | null>(null);
  const [isGroupOwner, setIsGroupOwner] = useState(false);
  const [groupMembership, setGroupMembership] =
    useState<GroupMembership | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [leaveGroupMessage, setLeaveGroupMessage] = useState<string | null>(
    null
  );
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);

      const status = await getUserStatus();
      setUserStatus(status);

      // Check if user owns a group plan
      const groupPlanResponse = await getMyGroupPlan();
      setIsGroupOwner(
        groupPlanResponse.success && groupPlanResponse.data !== null
      );

      // Check if user is a member of a group
      const membershipResponse = await getMyMembership();
      setGroupMembership(
        membershipResponse.success && membershipResponse.data
          ? (membershipResponse.data as GroupMembership)
          : null
      );
      setIsLoading(false);
    };

    getUser();
  }, [supabase.auth, router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCancelSubscription = () => {
    if (!user || !userStatus?.hasActiveSubscription) return;
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = async () => {
    setShowCancelDialog(false);
    setIsCanceling(true);
    setCancelMessage(null);

    try {
      const response = await fetch("/api/billing/cancel-membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCancelMessage(data.message);
        // Refresh user status to reflect cancellation
        const status = await getUserStatus();
        setUserStatus(status);
      } else {
        setCancelMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setCancelMessage("Network error. Please try again.");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleLeaveGroup = () => {
    setShowLeaveGroupDialog(true);
  };

  const confirmLeaveGroup = async () => {
    setShowLeaveGroupDialog(false);
    setIsLeavingGroup(true);
    setLeaveGroupMessage(null);

    try {
      const response = await leaveGroup();

      if (response.success) {
        setLeaveGroupMessage("Successfully left the group");
        // Clear group membership and refresh data
        setGroupMembership(null);
        const status = await getUserStatus();
        setUserStatus(status);
      } else {
        setLeaveGroupMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      setLeaveGroupMessage("Network error. Please try again.");
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const handleJoinGroup = () => {
    setShowJoinDialog(true);
  };

  const handleJoinCodeChange = (value: string) => {
    // Auto-format as user types (add dash after 4 characters)
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length <= 8) {
      const formatted =
        cleaned.length > 4
          ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
          : cleaned;
      setJoinCode(formatted);
    }
  };

  const confirmJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      setJoinMessage("Please enter a join code");
      return;
    }

    setIsJoining(true);
    setJoinMessage(null);

    try {
      const cleanedCode = cleanJoinCode(joinCode);
      const response = await joinGroup({ join_code: cleanedCode });

      if (response.success) {
        setJoinMessage("Successfully joined the group!");
        setTimeout(() => {
          setShowJoinDialog(false);
          // Refresh data
          const refreshData = async () => {
            const status = await getUserStatus();
            setUserStatus(status);
            const membershipResponse = await getMyMembership();
            setGroupMembership(
              membershipResponse.success && membershipResponse.data
                ? (membershipResponse.data as GroupMembership)
                : null
            );
          };
          refreshData();
        }, 1500);
      } else {
        setJoinMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error("Error joining group:", error);
      setJoinMessage("Network error. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 sm:px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8" data-lastpass-ignore>
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold mb-6">Email Address</h2>
          <p className="text-lg leading-relaxed mb-6">{user.email}</p>

          <div className="border-t border-muted my-8"></div>

          <h2 className="text-2xl font-bold mb-6">Daily Usage</h2>
          {userStatus?.hasActiveSubscription || groupMembership ? (
            <p className="text-lg mb-6">
              You have unlimited daily usage as part of your study plan.
            </p>
          ) : (
            <div className="mb-6">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      userStatus?.usagePercentage || 0,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{userStatus?.usagePercentage || 0}% used</span>
                <span>
                  {100 - (userStatus?.usagePercentage || 0)}% remaining
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => router.push("/options")}
                className="w-full sm:w-auto cursor-pointer mt-8"
              >
                Get Unlimited Usage
              </Button>
            </div>
          )}

          <div className="border-t border-muted my-8"></div>

          <h2 className="text-2xl font-bold mb-6">Current Study Plan</h2>

          {userStatus?.hasActiveSubscription ? (
            <div className="mb-6">
              <div
                className="bg-muted/30 border rounded-lg p-6"
                data-lastpass-ignore
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-primary">
                      {userStatus.planName || "Enhanced Membership"}
                    </h3>
                    {isGroupOwner && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Unlimited daily usage{" "}
                    {userStatus.planName === "Small Group"
                      ? "for up to 10 members"
                      : userStatus.planName === "Large Group"
                      ? "for up to 100 members"
                      : null}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t" />
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                  <div className="flex gap-3">
                    {isGroupOwner && (
                      <Button
                        size="sm"
                        onClick={() => router.push("/groups")}
                        className="cursor-pointer"
                      >
                        Manage Group
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      className="text-destructive hover:text-destructive cursor-pointer"
                      data-lastpass-ignore
                    >
                      {isCanceling ? "Canceling..." : "Cancel Plan"}
                    </Button>
                  </div>
                </div>
              </div>
              {cancelMessage && (
                <div
                  className={`mt-4 p-3 rounded-md ${
                    cancelMessage.startsWith("Error")
                      ? "bg-destructive/10 border border-destructive/20 text-destructive"
                      : "bg-green-50 border border-green-200 text-green-700"
                  }`}
                >
                  <p className="text-sm">{cancelMessage}</p>
                </div>
              )}
            </div>
          ) : groupMembership ? (
            <div className="mb-6">
              <div
                className="bg-muted/30 border rounded-lg p-6"
                data-lastpass-ignore
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-semibold text-primary">
                    {groupMembership.group_plan?.plan_type === "small"
                      ? "Small Group"
                      : "Large Group"}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Member
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground">
                  Unlimited daily usage as part of group plan
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Joined{" "}
                  {new Date(groupMembership.joined_at).toLocaleDateString()}
                </p>

                <div className="mt-4 pt-4 border-t" />

                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLeaveGroup}
                    disabled={isLeavingGroup}
                    className="text-destructive hover:text-destructive cursor-pointer"
                  >
                    {isLeavingGroup ? "Leaving..." : "Leave Group"}
                  </Button>
                </div>
              </div>
              {leaveGroupMessage && (
                <div
                  className={`mt-4 p-3 rounded-md ${
                    leaveGroupMessage.startsWith("Error")
                      ? "bg-destructive/10 border border-destructive/20 text-destructive"
                      : "bg-green-50 border border-green-200 text-green-700"
                  }`}
                >
                  <p className="text-sm">{leaveGroupMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div
                className="bg-muted/30 border rounded-lg p-6"
                data-lastpass-ignore
              >
                <div className="">
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    No Current Plan
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Get unlimited daily usage with a subscription
                  </p>
                  <div className="mt-4 pt-4 border-t" />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="sm"
                      onClick={() => router.push("/options")}
                      className="cursor-pointer"
                    >
                      See Study Plans
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleJoinGroup}
                      className="cursor-pointer"
                    >
                      Join Existing Plan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-muted my-8"></div>

          <h2 className="text-2xl font-bold mb-6">Account Actions</h2>
          <div className="mb-6 space-y-3">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full sm:w-auto cursor-pointer"
                data-lastpass-ignore
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Join Plan Dialog */}
      <AlertDialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Existing Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the join code provided by the group owner to join their
              plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={confirmJoinGroup} className="space-y-4">
            <div>
              <label
                htmlFor="joinCodeInput"
                className="block text-sm font-medium mb-2"
              >
                Join Code
              </label>
              <Input
                id="joinCodeInput"
                type="text"
                placeholder="XXXX-XXXX"
                value={joinCode}
                onChange={(e) => handleJoinCodeChange(e.target.value)}
                className="font-mono text-center"
                maxLength={9} // 8 characters + 1 dash
                disabled={isJoining}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 8-character code (e.g., ABCD-1234)
              </p>
            </div>

            {joinMessage && (
              <div
                className={`p-3 rounded-md ${
                  joinMessage.startsWith("Error")
                    ? "bg-destructive/10 border border-destructive/20 text-destructive"
                    : joinMessage.includes("Successfully")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                }`}
              >
                <p className="text-sm">{joinMessage}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowJoinDialog(false);
                  setJoinCode("");
                  setJoinMessage(null);
                }}
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isJoining || !joinCode.trim()}>
                {isJoining ? "Joining..." : "Join Plan"}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Membership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your {userStatus?.planName || ""}{" "}
              study plan? You will lose unlimited usage and return to the daily
              limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Keep Membership
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Membership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog
        open={showLeaveGroupDialog}
        onOpenChange={setShowLeaveGroupDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You will lose access to
              unlimited usage and return to the daily limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLeaveGroupDialog(false)}>
              Stay in Group
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
