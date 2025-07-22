"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getUserStatus } from "@/lib/usageTracking";
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
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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

          {userStatus?.hasActiveSubscription ? (
            <>
              <h2 className="text-2xl font-bold mb-6">Current Study Option</h2>
              <div className="mb-6">
                <div
                  className="bg-primary/10 border border-primary/20 rounded-lg p-6"
                  data-lastpass-ignore
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {userStatus.planName || "Enhanced Membership"}
                      </h3>
                      <p className="text-muted-foreground">
                        Unlimited daily usage
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-medium">✓ Active</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                        className="text-destructive hover:text-destructive cursor-pointer"
                        data-lastpass-ignore
                      >
                        {isCanceling ? "Canceling..." : "Cancel"}
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
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">Daily Usage</h2>
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
            </>
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
    </div>
  );
}
