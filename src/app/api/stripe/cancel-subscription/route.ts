import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Initialize Stripe only if the secret key is available
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
};

export async function POST() {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id, plan_name")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Initialize Stripe
    const stripe = getStripe();

    // Cancel the subscription at period end (so user keeps access until billing cycle ends)
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update subscription status in database to 'canceling'
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "canceling",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.stripe_subscription_id);

    if (updateError) {
      console.error("Failed to update subscription status:", updateError);
      // Don't fail the request since Stripe cancellation succeeded
    }

    return NextResponse.json({
      success: true,
      message: `Your ${subscription.plan_name} plan will be canceled at the end of your current billing period.`,
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
