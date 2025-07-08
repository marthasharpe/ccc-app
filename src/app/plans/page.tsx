"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

export default function PlansPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleGetStarted = async (planName: string) => {
    if (!user) {
      // Redirect to login with current page as redirect parameter
      const currentUrl = window.location.pathname;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
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
      name: "Advanced",
      price: "$19.99",
      period: "per month",
      description: "Get more in-depth responses from GPT-4.0",
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
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
        </div>

        {/* Plans Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-lg border border-primary bg-primary/5 shadow-lg scale-105 p-8"
            >
              {/* Plan Header */}
              <div className="text-center mb-6">
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
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                disabled
                onClick={() => handleGetStarted(plan.name)}
              >
                Coming Soon
              </Button>
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
