"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { getUserStatus } from "@/lib/usageTracking";

export default function PlansPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user and subscription status
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Check subscription status
          const status = await getUserStatus();
          setHasActiveSubscription(status.hasActiveSubscription);
          setCurrentPlanName(status.planName || null);
        } else {
          setHasActiveSubscription(false);
          setCurrentPlanName(null);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Set defaults on error
        setHasActiveSubscription(false);
        setCurrentPlanName(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Check subscription status when user changes
          const status = await getUserStatus();
          setHasActiveSubscription(status.hasActiveSubscription);
          setCurrentPlanName(status.planName || null);
        } else {
          setHasActiveSubscription(false);
          setCurrentPlanName(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setHasActiveSubscription(false);
        setCurrentPlanName(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleGetStarted = async (planName: string) => {
    if (!user) {
      // Redirect to login
      router.push("/auth/login");
      return;
    }

    // Don't allow new subscriptions if user already has one
    if (hasActiveSubscription) {
      return;
    }

    setCheckoutLoading(planName);
    setError(null);

    try {
      // Create Stripe checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planName }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(
          data.error || "Failed to create checkout session. Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError(
        "Something went wrong while setting up your subscription. Please check your connection and try again."
      );
    } finally {
      setCheckoutLoading(null);
    }
  };

  const plans = [
    {
      name: "Individual",
      price: "$4.99",
      period: "per month",
      description: "Perfect for personal study and learning",
      maxUsers: "1 person",
    },
    {
      name: "Small Group",
      price: "$24.99",
      period: "per month",
      description: "Ideal for Bible studies, families, or small groups",
      maxUsers: "Up to 10 people",
    },
    {
      name: "Large Group",
      price: "$149.99",
      period: "per month",
      description: "Designed for parishes, schools, and organizations",
      maxUsers: "Up to 100 people",
    },
  ];

  const getButtonText = (planName: string) => {
    console.log("planName", planName);
    return "Coming Soon";
  };

  const isButtonDisabled = (planName: string) => {
    console.log("planName", planName);
    return true;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="text-center">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-6 bg-muted rounded w-2/3 mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          {hasActiveSubscription ? (
            <p className="text-lg max-w-2xl mx-auto">
              To change plans, please cancel your current subscription from your{" "}
              <button
                onClick={() => router.push("/account")}
                className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
              >
                account
              </button>{" "}
              page.
            </p>
          ) : (
            <p className="text-lg max-w-2xl mx-auto">
              Get unlimited usage and other features.
              <br />
              Want to support this project?{" "}
              <a
                href="https://coff.ee/marthasharpe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all cursor-pointer text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Donate to the developer
              </a>
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-destructive font-medium">Payment Error</p>
              </div>
              <p className="text-destructive/80 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="mt-3 border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Plans Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border shadow-lg scale-105 p-8 flex flex-col border-primary`}
            >
              {/* Current Plan Badge */}
              {hasActiveSubscription && currentPlanName === plan.name && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Current
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6 flex-grow">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-2">
                  <div className="text-4xl font-bold">{plan.price}</div>
                  <div className="text-muted-foreground ml-1">
                    {plan.period}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{plan.maxUsers}</p>
              </div>

              {/* CTA Button */}
              {!hasActiveSubscription && (
                <Button
                  className={`w-full mt-auto ${
                    hasActiveSubscription && currentPlanName === plan.name
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  disabled={
                    isButtonDisabled(plan.name) || checkoutLoading !== null
                  }
                  onClick={() => handleGetStarted(plan.name)}
                >
                  {checkoutLoading === plan.name ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    getButtonText(plan.name)
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            You can upgrade or downgrade your plan at any time. Changes take
            effect immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
