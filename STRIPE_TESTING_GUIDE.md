# Stripe Testing Setup Guide

## Prerequisites

- Stripe account with test mode enabled
- Stripe CLI installed (`brew install stripe/stripe-cli/stripe` on macOS)
- Your current `.env.local` already has test keys configured

## Step 1: Enable Plans Page

Your plans page is currently disabled. To enable for testing:

1. Edit `src/app/plans/page.tsx`
2. Change `disabled` to `disabled={false}` on the buttons
3. Remove the "Coming Soon" text

## Step 2: Create Stripe Products & Prices

In your Stripe Dashboard (test mode):

1. **Individual Plan**

   - Create product: "Individual Plan"
   - Create price: $4.99/month recurring
   - Copy price ID to `STRIPE_INDIVIDUAL_PRICE_ID`

2. **Small Group Plan**

   - Create product: "Small Group Plan"
   - Create price: $24.99/month recurring
   - Copy price ID to `STRIPE_SMALL_GROUP_PRICE_ID`

3. **Large Group Plan**
   - Create product: "Large Group Plan"
   - Create price: $149.99/month recurring
   - Copy price ID to `STRIPE_LARGE_GROUP_PRICE_ID`

## Step 3: Set Up Webhook Testing

```bash
# Login to Stripe CLI
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will give you a webhook signing secret - add it to .env.local as:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 4: Test Payment Flow

1. Start your app: `npm run dev`
2. Sign in with a test account
3. Go to `/plans` page
4. Click a plan button
5. Use Stripe test card: `4242 4242 4242 4242`
6. Complete checkout
7. Verify webhook received and subscription created
8. Check `/account` page shows plan name

## Step 5: Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Require Auth**: 4000 0025 0000 3155

## Database Verification

Check subscription was created:

```sql
SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
```

## Clean Up Test Data

```sql
DELETE FROM user_subscriptions WHERE stripe_subscription_id LIKE 'sub_test_%';
```
