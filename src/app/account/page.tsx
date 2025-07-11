"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getUserStatus } from "@/lib/usageTracking";
import { createLoginUrl } from "@/lib/redirectUtils";

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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(createLoginUrl());
        return;
      }
      setUser(user);

      const status = await getUserStatus();
      console.log("status", status);
      setUserStatus(status);

      // Get detailed subscription status
      if (status.hasActiveSubscription) {
        const { data: subscription } = await supabase
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .in("status", ["active", "canceling"])
          .single();
        setSubscriptionStatus(subscription?.status || "active");
      }

      setIsLoading(false);
    };

    getUser();
  }, [supabase.auth, router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCancelSubscription = async () => {
    if (!user || !userStatus?.hasActiveSubscription) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel your ${
        userStatus.planName || "Premium"
      } plan?\n\nYou'll keep access until the end of your current billing period.`
    );

    if (!confirmed) return;

    setIsCanceling(true);
    setCancelMessage(null);

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold mb-6">Account Information</h2>
          <p className="text-lg leading-relaxed mb-6">
            Manage your account settings and view your usage
          </p>

          <div className="border-t border-muted my-8"></div>

          <h2 className="text-2xl font-bold mb-6">Email Address</h2>
          <p className="text-lg leading-relaxed mb-6">{user.email}</p>

          <div className="border-t border-muted my-8"></div>

          {userStatus?.hasActiveSubscription ? (
            <>
              <h2 className="text-2xl font-bold mb-6">Current Plan</h2>
              <div className="mb-6">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {userStatus.planName || "Premium Plan"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Unlimited daily usage
                      </p>
                    </div>
                    <div className="text-right">
                      {subscriptionStatus === "canceling" ? (
                        <div className="text-sm text-orange-600 font-medium">
                          ⏳ Canceling
                        </div>
                      ) : (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ Active
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                      <div className="text-sm text-muted-foreground">
                        {subscriptionStatus === "canceling"
                          ? "Plan will cancel at the end of your billing period"
                          : "Manage your subscription"}
                      </div>
                      {subscriptionStatus !== "canceling" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelSubscription}
                          disabled={isCanceling}
                          className="text-destructive hover:text-destructive cursor-pointer"
                        >
                          {isCanceling ? "Canceling..." : "Cancel Plan"}
                        </Button>
                      )}
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
                <div>
                  <Button
                    size="sm"
                    onClick={() => router.push("/plans")}
                    className="w-full sm:w-auto cursor-pointer mt-4"
                  >
                    View Plans
                  </Button>
                </div>
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
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
