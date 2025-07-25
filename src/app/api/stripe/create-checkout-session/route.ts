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

    // Validate price ID format (should start with price_)
    if (!priceId.startsWith('price_')) {
      return NextResponse.json(
        { error: "Invalid price ID configuration" },
        { status: 500 }
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
      cancel_url: `${request.nextUrl.origin}/options?canceled=true`,
      customer_email: user.email || undefined,
      metadata: {
        userId: user.id,
        planName: planName,
      },
      subscription_data: {
        description: `Truth Me Up ${planName} Plan`,
        metadata: {
          app_name: 'Truth Me Up',
          plan_type: planName,
          user_id: user.id,
          user_email: user.email || '',
        },
      },
      custom_text: {
        submit: { 
          message: `Thank you for subscribing to Truth Me Up! You're supporting Catholic education and deepening your faith journey.` 
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    // Enhanced error logging for different error types
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // Check if it's a Stripe-specific error
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type?: string; code?: string; message?: string };
      console.error("Stripe error type:", stripeError.type);
      console.error("Stripe error code:", stripeError.code);
      console.error("Stripe error message:", stripeError.message);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
