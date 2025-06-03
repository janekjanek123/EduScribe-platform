import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getServerStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  console.log('[Stripe Webhook] Processing webhook request...')
  
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      console.error('[Stripe Webhook] No signature found')
      return NextResponse.json({ error: 'No signature found' }, { status: 400 })
    }

    // Check required environment variables
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[Stripe Webhook] NEXT_PUBLIC_SUPABASE_URL not configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Use service role key if available, otherwise fall back to anon key
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseKey) {
      console.error('[Stripe Webhook] No Supabase key available (neither service role nor anon key)')
      return NextResponse.json({ error: 'Database authentication not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      // Verify the webhook signature
      const stripe = getServerStripe()
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (error: any) {
      console.error('[Stripe Webhook] Signature verification failed:', error.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      )
    }

    console.log('[Stripe Webhook] Event received:', event.type)

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    )

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('[Stripe Webhook] Processing checkout session:', {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        metadata: session.metadata
      })

      try {
        // Extract metadata
        const { userId, planId, billingCycle } = session.metadata || {}

        if (!userId || !planId || !billingCycle) {
          console.error('[Stripe Webhook] Missing required metadata:', session.metadata)
          return NextResponse.json({ 
            error: 'Missing metadata',
            received: false 
          }, { status: 400 })
        }

        // Calculate subscription period
        const currentPeriodStart = new Date()
        const currentPeriodEnd = new Date()
        
        if (billingCycle === 'yearly') {
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
        } else {
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
        }

        // Update user subscription in database
        const subscriptionData = {
          user_id: userId,
          plan_id: planId,
          billing_cycle: billingCycle,
          status: 'active' as const,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          cancel_at_period_end: false,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString()
        }

        const { data: subscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'user_id'
          })
          .select()
          .single()

        if (subscriptionError) {
          console.error('[Stripe Webhook] Error updating subscription:', subscriptionError)
          return NextResponse.json(
            { 
              error: 'Failed to update subscription',
              received: false,
              details: subscriptionError.message 
            },
            { status: 500 }
          )
        }

        // Initialize usage tracking for current month
        const currentMonth = new Date().toISOString().slice(0, 7)
        const { error: usageError } = await supabase
          .from('user_usage')
          .upsert({
            user_id: userId,
            month_year: currentMonth,
            notes_generated: 0,
            video_notes_count: 0,
            file_notes_count: 0,
            text_notes_count: 0,
            total_saved_notes: 0,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,month_year',
            ignoreDuplicates: true
          })

        if (usageError) {
          console.error('[Stripe Webhook] Warning: Failed to initialize usage tracking:', usageError)
          // Don't fail the webhook for this - it's not critical
        }

        console.log('[Stripe Webhook] Successfully processed subscription:', {
          userId,
          planId,
          billingCycle,
          subscriptionId: subscription?.id
        })

        return NextResponse.json({ 
          received: true,
          processed: 'checkout.session.completed'
        })

      } catch (error) {
        console.error('[Stripe Webhook] Error processing checkout session:', error)
        return NextResponse.json(
          { 
            error: 'Failed to process checkout session',
            received: false 
          },
          { status: 500 }
        )
      }
    }

    // Handle subscription status changes
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription

      console.log('[Stripe Webhook] Processing subscription update:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        metadata: subscription.metadata
      })

      try {
        // Update subscription status in database
        const subscriptionData = subscription as any; // Cast to access all properties
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 
                   subscription.status === 'canceled' ? 'cancelled' : 
                   subscription.status === 'past_due' ? 'expired' : 'active',
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: subscriptionData.current_period_end ? 
              new Date(subscriptionData.current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('[Stripe Webhook] Error updating subscription status:', error)
          return NextResponse.json(
            { 
              error: 'Failed to update subscription status',
              received: false,
              details: error.message 
            },
            { status: 500 }
          )
        }

        console.log('[Stripe Webhook] Successfully updated subscription status')
        return NextResponse.json({ 
          received: true,
          processed: 'customer.subscription.updated' 
        })
        
      } catch (error) {
        console.error('[Stripe Webhook] Error processing subscription update:', error)
        return NextResponse.json(
          { 
            error: 'Failed to process subscription update',
            received: false 
          },
          { status: 500 }
        )
      }
    }

    // Handle other webhook events
    console.log('[Stripe Webhook] Unhandled event type:', event.type)
    return NextResponse.json({ 
      received: true,
      processed: false,
      event_type: event.type 
    })

  } catch (error: any) {
    console.error('[Stripe Webhook] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        received: false,
        message: error.message 
      },
      { status: 500 }
    )
  }
} 