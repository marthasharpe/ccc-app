import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendGroupCancellationEmail } from "@/lib/email";

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

          // If this is a group plan, create the actual group plan
          if (planName === "Small Group" || planName === "Large Group") {
            const maxMembers = planName === "Small Group" ? 10 : 100;
            const planType = planName === "Small Group" ? "small" : "large";
            
            // Generate unique join code
            const generateJoinCode = () => {
              const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
              const numbers = '23456789';
              let result = '';
              
              // First 4 characters are letters
              for (let i = 0; i < 4; i++) {
                result += letters.charAt(Math.floor(Math.random() * letters.length));
              }
              
              // Last 4 characters are numbers
              for (let i = 0; i < 4; i++) {
                result += numbers.charAt(Math.floor(Math.random() * numbers.length));
              }
              
              return result;
            };

            let joinCode = generateJoinCode();
            let attempts = 0;
            
            // Ensure join code is unique
            while (attempts < 10) {
              const { data: existingPlan } = await supabase
                .from('group_plans')
                .select('id')
                .eq('join_code', joinCode)
                .single();
              
              if (!existingPlan) break;
              joinCode = generateJoinCode();
              attempts++;
            }

            // Create the group plan
            const { data: groupPlan, error: groupError } = await supabase
              .from('group_plans')
              .insert({
                owner_id: userId,
                plan_type: planType,
                max_members: maxMembers,
                join_code: joinCode,
                active: true,
              })
              .select()
              .single();

            if (groupError) {
              console.error("Failed to create group plan:", groupError);
            } else {
              console.log("Successfully created group plan:", groupPlan);
              
              // Get the owner's email from the checkout session
              const ownerEmail = session.customer_email || session.customer_details?.email;
              
              // Add the owner as the first member with admin role
              const { error: memberError } = await supabase
                .from('group_plan_memberships')
                .insert({
                  group_plan_id: groupPlan.id,
                  user_id: userId,
                  role: 'admin',
                  email: ownerEmail,
                });

              if (memberError) {
                console.error("Failed to add owner as group member:", memberError);
              } else {
                console.log("Successfully added owner as group admin");
              }
            }
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

        // Get user ID from subscription metadata
        const canceledUserId = deletedSubscription.metadata?.user_id;
        

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
        } else {
          console.log("Successfully marked subscription as cancelled:", deletedSubscription.id);
        }

        // Handle group plan cleanup if this user owns a group
        if (canceledUserId) {
          try {
            // Check if this user owns any active group plans
            const { data: ownedGroups, error: groupFetchError } = await supabase
              .from('group_plans')
              .select('id, plan_type')
              .eq('owner_id', canceledUserId)
              .eq('active', true);
            

            if (groupFetchError) {
              console.error('Error fetching owned groups:', groupFetchError);
            } else if (ownedGroups && ownedGroups.length > 0) {
              // Process each owned group
              for (const group of ownedGroups) {
                
                // Get member emails before removing them (for notifications)
                const { data: membersToNotify } = await supabase
                  .from('group_plan_memberships')
                  .select('email')
                  .eq('group_plan_id', group.id)
                  .neq('role', 'admin'); // Don't notify the owner

                if (membersToNotify && membersToNotify.length > 0) {
                  // Send email notifications to members about group cancellation
                  const memberEmails = membersToNotify
                    .map(m => m.email)
                    .filter((email): email is string => Boolean(email));
                  
                  if (memberEmails.length > 0) {
                    await sendGroupCancellationEmail({
                      memberEmails,
                      groupType: group.plan_type,
                    });
                  }
                }
                
                // Remove all members from the group
                const { error: removeMembersError } = await supabase
                  .from('group_plan_memberships')
                  .delete()
                  .eq('group_plan_id', group.id);

                if (removeMembersError) {
                  console.error(`Error removing members from group ${group.id}:`, removeMembersError);
                }

                // Deactivate the group plan
                const { error: deactivateError } = await supabase
                  .from('group_plans')
                  .update({ 
                    active: false,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', group.id);

                if (deactivateError) {
                  console.error(`Error deactivating group ${group.id}:`, deactivateError);
                }
              }
            }
          } catch (groupCleanupError) {
            console.error('Error during group cleanup:', groupCleanupError);
          }
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
