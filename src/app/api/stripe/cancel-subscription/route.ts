import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('[Cancel] Starting subscription cancellation...')
  
  try {
    // Parse request body first
    const body = await request.json()
    const { subscriptionId } = body
    
    if (!subscriptionId) {
      console.error('[Cancel] No subscription ID provided')
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    console.log('[Cancel] Attempting to cancel subscription:', subscriptionId)

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Cancel] No authorization header')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Cancel] Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('[Cancel] Invalid user token:', userError?.message)
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    console.log('[Cancel] User authenticated:', user.id)

    // Initialize Stripe
    const stripe = getServerStripe()
    if (!stripe) {
      console.error('[Cancel] Failed to initialize Stripe')
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      )
    }

    // Cancel the subscription in Stripe
    console.log('[Cancel] Cancelling subscription in Stripe...')
    let stripeSubscription
    
    try {
      // First, try to retrieve the subscription to see if it exists
      console.log('[Cancel] Retrieving subscription from Stripe first...')
      const existingSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      console.log('[Cancel] Found subscription in Stripe:', {
        id: existingSubscription.id,
        status: existingSubscription.status,
        customer: existingSubscription.customer,
        cancel_at_period_end: existingSubscription.cancel_at_period_end,
        current_period_end: (existingSubscription as any).current_period_end
      })

      // Check if already cancelled
      if (existingSubscription.status === 'canceled') {
        console.log('[Cancel] Subscription already cancelled in Stripe')
        return NextResponse.json({
          success: true,
          message: 'Subscription was already cancelled',
          subscription: {
            id: subscriptionId,
            status: existingSubscription.status,
            cancel_at_period_end: existingSubscription.cancel_at_period_end,
            current_period_end: (existingSubscription as any).current_period_end ? 
              new Date((existingSubscription as any).current_period_end * 1000).toISOString() : null
          }
        })
      }

      // Check if already set to cancel at period end
      if (existingSubscription.cancel_at_period_end) {
        console.log('[Cancel] Subscription already set to cancel at period end')
        return NextResponse.json({
          success: true,
          message: 'Subscription is already set to cancel at period end',
          subscription: {
            id: subscriptionId,
            status: existingSubscription.status,
            cancel_at_period_end: existingSubscription.cancel_at_period_end,
            current_period_end: (existingSubscription as any).current_period_end ? 
              new Date((existingSubscription as any).current_period_end * 1000).toISOString() : null
          }
        })
      }

      // Now try to cancel it
      console.log('[Cancel] Updating subscription to cancel at period end...')
      stripeSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      })
      
      console.log('[Cancel] Stripe cancellation successful:', {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_end: (stripeSubscription as any).current_period_end
      })
    } catch (stripeError: any) {
      console.error('[Cancel] Stripe operation failed:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId,
        decline_code: stripeError.decline_code,
        param: stripeError.param
      })
      
      // Handle different Stripe error types
      let errorMessage = 'Failed to cancel subscription in Stripe'
      let statusCode = 400
      
      if (stripeError.type === 'StripeInvalidRequestError') {
        if (stripeError.code === 'resource_missing') {
          errorMessage = 'Subscription not found in Stripe'
          statusCode = 404
        } else if (stripeError.code === 'subscription_update_failed') {
          errorMessage = 'Subscription cannot be updated'
        } else {
          errorMessage = `Invalid request: ${stripeError.message}`
        }
      } else if (stripeError.type === 'StripeAPIError') {
        errorMessage = 'Stripe API error - please try again later'
        statusCode = 503
      } else if (stripeError.type === 'StripeConnectionError') {
        errorMessage = 'Connection error with Stripe - please try again'
        statusCode = 503
      } else if (stripeError.type === 'StripeAuthenticationError') {
        errorMessage = 'Stripe authentication error'
        statusCode = 500
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: stripeError.message,
          stripeErrorType: stripeError.type,
          stripeErrorCode: stripeError.code,
          subscriptionId
        },
        { status: statusCode }
      )
    }

    // Try to update database if possible (but don't fail if it doesn't work)
    try {
      const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
      const adminSupabase = createClient(supabaseUrl, serviceKey)
      
      const { error: updateError } = await adminSupabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)
        .eq('user_id', user.id)

      if (updateError) {
        console.warn('[Cancel] Database update failed (but Stripe succeeded):', updateError.message)
      } else {
        console.log('[Cancel] Database updated successfully')
      }
    } catch (dbError) {
      console.warn('[Cancel] Database update error (but Stripe succeeded):', dbError)
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscriptionId,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_end: (stripeSubscription as any)?.current_period_end ? 
          new Date((stripeSubscription as any).current_period_end * 1000).toISOString() : null
      }
    })

  } catch (error: any) {
    console.error('[Cancel] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
} 