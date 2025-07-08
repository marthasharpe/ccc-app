import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = await createClient();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        // Get the subscription ID from the session
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName;

        if (userId && subscriptionId) {
          // Update user's subscription in database
          const { error } = await supabase.from("user_subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            plan_name: planName,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error("Failed to update user subscription:", error);
          } else {
            console.log("User subscription updated successfully");
          }
        }
        break;

      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status in database
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            status: subscription.status,
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
          console.error(
            "Failed to mark subscription as cancelled:",
            deleteError
          );
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
