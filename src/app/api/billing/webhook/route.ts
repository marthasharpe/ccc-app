import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Initialize Stripe only if the secret key is available
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
};

const getWebhookSecret = () => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    // Initialize Stripe and get webhook secret
    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Create Supabase client with service role for webhook operations (bypasses RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("Session completed:", {
          sessionId: session.id,
          mode: session.mode,
          paymentStatus: session.payment_status,
          subscriptionId: session.subscription
        });

        // Get the subscription ID from the session
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName;

        console.log("Extracted metadata:", { userId, planName, subscriptionId });

        if (userId && subscriptionId) {
          // Update user's subscription in database
          const { data, error } = await supabase.from("user_subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            plan_name: planName,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).select();

          if (error) {
            console.error("Failed to update user membership:", error);
          } else {
            console.log("Successfully created/updated membership:", data);
          }
        } else {
          console.error("Missing required data:", { userId, subscriptionId, planName });
        }
        break;

      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status in database (direct mapping from Stripe status)
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            status: subscription.status, // active, canceled, past_due, etc.
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Failed to update subscription status:", updateError);
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;

        // Mark subscription as cancelled in database
        const { error: deleteError } = await supabase
          .from("user_subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", deletedSubscription.id);

        if (deleteError) {
          console.error("Failed to mark subscription as cancelled:", deleteError);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
