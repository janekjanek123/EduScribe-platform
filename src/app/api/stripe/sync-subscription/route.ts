import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('[Stripe Sync] Manually syncing subscription...')
    
    // Validate environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Stripe Sync] Missing Supabase environment variables:', {
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
      console.error('[Stripe Sync] Authentication missing')
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
      console.error('[Stripe Sync] Invalid user token:', userError)
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('[Stripe Sync] Retrieving session for user:', user.id, 'session:', sessionId)

    // Retrieve the checkout session from Stripe
    const stripe = getServerStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    console.log('[Stripe Sync] Session retrieved:', {
      id: session.id,
      paymentStatus: session.payment_status,
      subscriptionId: session.subscription,
      metadata: session.metadata
    })

    // Verify the session belongs to this user
    if (session.metadata?.userId !== user.id) {
      console.error('[Stripe Sync] Session does not belong to user')
      return NextResponse.json(
        { error: 'Unauthorized session access' },
        { status: 403 }
      )
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('[Stripe Sync] Payment not completed yet:', session.payment_status)
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Extract metadata
    const { userId, planId, billingCycle } = session.metadata || {}

    if (!userId || !planId || !billingCycle) {
      console.error('[Stripe Sync] Missing required metadata:', session.metadata)
      return NextResponse.json(
        { error: 'Missing metadata in session' },
        { status: 400 }
      )
    }

    // Use user's authenticated Supabase client for all operations
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

    // Check if subscription already exists
    console.log('[Stripe Sync] Checking for existing subscription...')
    const { data: existingSubscription, error: checkError } = await userSupabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Stripe Sync] Error checking existing subscription:', checkError)
    }

    if (existingSubscription && existingSubscription.stripe_subscription_id === session.subscription) {
      console.log('[Stripe Sync] Subscription already exists and synced, skipping update')
      return NextResponse.json({
        success: true,
        message: 'Subscription already synced',
        subscription: existingSubscription,
        planId,
        billingCycle
      })
    }

    // Calculate subscription period
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    
    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    }

    // Update or create user subscription in database
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

    console.log('[Stripe Sync] Upserting subscription data:', subscriptionData)

    let subscription
    let subscriptionError

    if (existingSubscription) {
      // Update existing subscription
      const { data: updatedSub, error: updateError } = await userSupabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('user_id', userId)
        .select()
        .single()
      
      subscription = updatedSub
      subscriptionError = updateError
      console.log('[Stripe Sync] Updated existing subscription')
    } else {
      // Create new subscription
      const { data: newSub, error: insertError } = await userSupabase
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
        .single()
      
      subscription = newSub
      subscriptionError = insertError
      console.log('[Stripe Sync] Created new subscription')
    }

    if (subscriptionError) {
      console.error('[Stripe Sync] Error upserting subscription:', subscriptionError)
      
      // If we still can't create/update the subscription, return a partial success
      // The payment was successful, so we don't want to fail completely
      return NextResponse.json({
        success: true,
        message: 'Payment successful, but subscription sync had issues. Please contact support if limits don\'t update.',
        warning: 'Database sync incomplete',
        planId,
        billingCycle,
        error: subscriptionError.message
      })
    }

    // Initialize or update usage tracking for current month
    const currentMonth = new Date().toISOString().slice(0, 7)
    console.log('[Stripe Sync] Setting up usage tracking for month:', currentMonth)
    
    const { error: usageError } = await userSupabase
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
      console.error('[Stripe Sync] Warning: Failed to initialize usage tracking:', usageError)
      // Don't fail the sync for this - usage tracking is less critical
    } else {
      console.log('[Stripe Sync] Usage tracking initialized successfully')
    }

    console.log('[Stripe Sync] Successfully synced subscription:', {
      userId,
      planId,
      billingCycle,
      subscriptionId: subscription?.id
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      subscription,
      planId,
      billingCycle
    })

  } catch (error: any) {
    console.error('[Stripe Sync] Error syncing subscription:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync subscription',
        details: error.message,
        // Don't completely fail - payment was successful
        paymentStatus: 'completed'
      },
      { status: 500 }
    )
  }
} 