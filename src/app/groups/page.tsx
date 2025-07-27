"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Copy, AlertCircle, CheckCircle, Crown } from "lucide-react";
import { GroupPlanWithMembers } from "@/lib/types/groups";
import {
  getMyGroupPlan,
  removeMember,
  formatJoinCode,
  formatMemberCount,
  getPlanTypeDisplayName,
} from "@/lib/groupPlanUtils";

// Helper function to get activity status
function getActivityStatus(lastActivityDate: string | null): {
  status: "active" | "inactive" | "never";
  text: string;
  color: string;
  dotColor: string;
} {
  if (!lastActivityDate) {
    return {
      status: "never",
      text: "Never used",
      color: "text-muted-foreground",
      dotColor: "bg-muted-foreground",
    };
  }

  const lastActivity = new Date(lastActivityDate);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 10) {
    return {
      status: "active",
      text:
        daysDiff === 0
          ? "Active today"
          : `Active ${daysDiff} day${daysDiff === 1 ? "" : "s"} ago`,
      color: "text-green-600",
      dotColor: "bg-green-500",
    };
  } else if (daysDiff <= 30) {
    return {
      status: "inactive",
      text: `Last used ${daysDiff} days ago`,
      color: "text-yellow-600",
      dotColor: "bg-yellow-500",
    };
  } else {
    return {
      status: "inactive",
      text: `Inactive for ${daysDiff} days`,
      color: "text-red-600",
      dotColor: "bg-red-500",
    };
  }
}

function GroupsPageContent() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";

  const [groupPlan, setGroupPlan] = useState<GroupPlanWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  useEffect(() => {
    loadGroupPlan();
  }, []);

  const loadGroupPlan = async () => {
    try {
      setLoading(true);
      const response = await getMyGroupPlan();
      if (response.success) {
        setGroupPlan(response.data || null);
      } else {
        setError(response.error || "Failed to load group plan");
      }
    } catch (err) {
      setError("Failed to load group plan");
      console.error("Error loading group plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJoinCode = async () => {
    if (!groupPlan) return;

    try {
      await navigator.clipboard.writeText(groupPlan.join_code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy join code:", err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!groupPlan) return;

    try {
      setRemovingMember(userId);
      const response = await removeMember({ user_id: userId });

      if (response.success) {
        // Reload the group plan to get updated member list
        await loadGroupPlan();
      } else {
        setError(response.error || "Failed to remove member");
      }
    } catch (err) {
      setError("Failed to remove member");
      console.error("Error removing member:", err);
    } finally {
      setRemovingMember(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading group plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!groupPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Group Plan</h3>
              <p className="text-muted-foreground mb-4">
                You don&apos;t have an active group plan.
              </p>
              <Button
                onClick={() => (window.location.href = "/options")}
                className="cursor-pointer"
              >
                See Plans
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-lg">
              🎉 Your group has been created successfully. Share the join code
              below to invite new members.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Group Plan Info */}
          <h2 className="text-2xl font-bold mb-4">
            {getPlanTypeDisplayName(groupPlan.plan_type)} Plan
          </h2>

          {/* Join Code Section */}
          <p className="text-lg text-muted-foreground mb-3">
            Share this code with others to invite them to your group:
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={formatJoinCode(groupPlan.join_code)}
              readOnly
              className="font-mono text-lg"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyJoinCode}
              className="flex-shrink-0"
            >
              {copySuccess ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {copySuccess && (
            <p className="text-sm text-green-600 mt-1">Join code copied!</p>
          )}

          <div className="border-t border-muted my-8"></div>

          {/* Members List */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold mb-4">Group Members</h2>
            <p className="text-lg text-muted-foreground">
              {formatMemberCount(groupPlan.member_count, groupPlan.max_members)}
            </p>
          </div>
          {groupPlan.memberships.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupPlan.memberships.map((membership) => (
                <div
                  key={membership.user_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        User {membership.user_id.slice(0, 8)}
                        {membership.role === "admin" && (
                          <Badge variant="secondary" className="ml-2">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Joined{" "}
                        {new Date(membership.joined_at).toLocaleDateString()}
                      </div>
                      <div
                        className={`text-xs flex items-center gap-1 ${
                          getActivityStatus(
                            membership.last_activity_date || null
                          ).color
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            getActivityStatus(
                              membership.last_activity_date || null
                            ).dotColor
                          }`}
                        ></div>
                        {
                          getActivityStatus(
                            membership.last_activity_date || null
                          ).text
                        }
                      </div>
                    </div>
                  </div>

                  {membership.role !== "admin" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={removingMember === membership.user_id}
                        >
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this user from your
                            group? They will lose access to group benefits
                            immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleRemoveMember(membership.user_id)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove Member
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <GroupsPageContent />
    </Suspense>
  );
}
