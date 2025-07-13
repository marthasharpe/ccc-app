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
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user and subscription status
    const getUser = async () => {
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
      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      setIsLoading(false);
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
        console.error("Failed to create checkout session:", data.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error starting subscription:", error);
      // TODO: Show error message to user
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
      price: "$39.99",
      period: "per month",
      description: "Ideal for Bible studies, families, or small groups",
      maxUsers: "Up to 10 people",
    },
    {
      name: "Large Group",
      price: "$299.99",
      period: "per month",
      description: "Designed for parishes, schools, and organizations",
      maxUsers: "Up to 100 people",
    },
  ];

  const getButtonText = (planName: string) => {
    return planName === "Individual" ? "Get Started" : "Coming Soon";
  };

  const isButtonDisabled = (planName: string) => {
    return planName !== "Individual";
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
              This feature is coming soon. Want to support this project?{" "}
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
                  disabled={isButtonDisabled(plan.name)}
                  onClick={() => handleGetStarted(plan.name)}
                >
                  {getButtonText(plan.name)}
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
