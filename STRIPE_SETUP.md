# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for EduScribe.

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Existing Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (you need to create these in Stripe Dashboard)
STRIPE_STUDENT_MONTHLY_PRICE_ID=price_...
STRIPE_STUDENT_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe Dashboard, create the following products and prices:

#### Student Plan
- **Product Name**: "EduScribe Student"
- **Monthly Price**: 24.99 PLN
- **Yearly Price**: 224.99 PLN (save the price IDs)

#### Pro Plan
- **Product Name**: "EduScribe Pro"
- **Monthly Price**: 49.99 PLN
- **Yearly Price**: 449.99 PLN (save the price IDs)

### 2. Configure Webhook

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set **Endpoint URL** to: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook Secret** for your `.env.local`

## Testing the Integration

### Test Mode Setup

1. Use Stripe test mode keys (they start with `pk_test_` and `sk_test_`)
2. Test credit card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`

### Local Testing with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook secret from CLI output to your `.env.local`

## Production Setup

### 1. Switch to Live Mode

1. In Stripe Dashboard, toggle to **Live mode**
2. Update environment variables with live keys (`pk_live_` and `sk_live_`)
3. Update webhook endpoint URL to your production domain

### 2. Webhook Security

- Ensure your webhook endpoint is publicly accessible
- The webhook handler verifies signatures automatically
- Monitor webhook deliveries in Stripe Dashboard

## Flow Overview

### Customer Journey

1. **User clicks plan** → Creates Stripe Checkout Session
2. **Redirects to Stripe** → User enters payment details
3. **Payment success** → Stripe sends webhook to `/api/stripe/webhook`
4. **Webhook processes** → Updates user subscription in Supabase
5. **User redirected** → To `/payment-success` page

### Database Updates

The webhook handler automatically:
- Creates/updates user subscription in `user_subscriptions` table
- Initializes usage tracking in `user_usage` table
- Stores Stripe customer and subscription IDs for future reference

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify endpoint is publicly accessible
   - Check webhook secret matches

2. **Payment succeeds but subscription not updated**
   - Check webhook logs in Stripe Dashboard
   - Verify Supabase service role key has proper permissions
   - Check server logs for webhook processing errors

3. **Checkout session creation fails**
   - Verify Stripe secret key is correct
   - Check price IDs exist and are active
   - Ensure user is authenticated

### Debug Checklist

- [ ] All environment variables are set
- [ ] Stripe webhook is configured and active
- [ ] Price IDs match your Stripe products
- [ ] Supabase service role key has admin permissions
- [ ] App URL matches your domain (for redirects)

## Security Notes

- Never expose secret keys in client-side code
- Webhook signatures are automatically verified
- Use HTTPS in production
- Regularly rotate API keys 