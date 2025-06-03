import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    console.log('[Stripe Cancel] Processing subscription cancellation...')
    
    // Validate environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Stripe Cancel] Missing Supabase environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      })
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      )
    }
    
    // Check authentication via Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Stripe Cancel] Authentication missing')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify user with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('[Stripe Cancel] Invalid user token:', userError)
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    console.log('[Stripe Cancel] Cancelling subscription for user:', user.id, 'subscription:', subscriptionId)

    // Cancel the subscription in Stripe
    const stripe = getServerStripe()
    
    // First, retrieve the subscription to verify it belongs to this user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    if (!subscription.metadata?.userId || subscription.metadata.userId !== user.id) {
      console.error('[Stripe Cancel] Subscription does not belong to user')
      return NextResponse.json(
        { error: 'Unauthorized subscription access' },
        { status: 403 }
      )
    }

    // Cancel the subscription at the end of the current period
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    console.log('[Stripe Cancel] Subscription cancelled in Stripe:', {
      id: cancelledSubscription.id,
      status: cancelledSubscription.status,
      cancel_at_period_end: cancelledSubscription.cancel_at_period_end
    })

    // Update the subscription in the database
    const userSupabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    const { error: updateError } = await userSupabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      console.error('[Stripe Cancel] Error updating subscription in database:', updateError)
      // Don't fail the request - Stripe cancellation was successful
    } else {
      console.log('[Stripe Cancel] Successfully updated subscription in database')
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end
      }
    })

  } catch (error: any) {
    console.error('[Stripe Cancel] Error cancelling subscription:', error)
    
    // Check if it's a Stripe error
    if (error.type) {
      return NextResponse.json(
        { 
          error: 'Stripe error: ' + error.message,
          type: error.type
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error.message
      },
      { status: 500 }
    )
  }
} 