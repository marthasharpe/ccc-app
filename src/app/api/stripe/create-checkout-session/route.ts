import { NextRequest, NextResponse } from "next/server";
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

const getPlanPriceIds = () => {
  return {
    Individual: process.env.STRIPE_INDIVIDUAL_PRICE_ID!,
    Advanced: process.env.STRIPE_ADVANCED_PRICE_ID!,
    "Small Group": process.env.STRIPE_SMALL_GROUP_PRICE_ID!,
    "Large Group": process.env.STRIPE_LARGE_GROUP_PRICE_ID!,
  };
};

export async function POST(request: NextRequest) {
  try {
    const { planName } = await request.json();

    // Initialize Stripe and get price IDs
    const stripe = getStripe();
    const PLAN_PRICE_IDS = getPlanPriceIds();

    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the price ID for the selected plan
    const priceId = PLAN_PRICE_IDS[planName as keyof typeof PLAN_PRICE_IDS];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.nextUrl.origin}/account?success=true`,
      cancel_url: `${request.nextUrl.origin}/plans?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planName: planName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
