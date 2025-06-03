import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      )
    }

    const { userId, planId = 'student', billingCycle = 'monthly' } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Use environment variables with validation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Calculate subscription period
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    
    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    }

    // Create subscription
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      status: 'active' as const,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: false,
      stripe_subscription_id: `test_sub_${Date.now()}`,
      stripe_customer_id: `test_cus_${Date.now()}`,
      updated_at: new Date().toISOString()
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single()

    if (subscriptionError) {
      console.error('[Test] Error creating subscription:', subscriptionError)
      return NextResponse.json(
        { error: 'Failed to create subscription', details: subscriptionError.message },
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
      console.warn('[Test] Warning: Failed to initialize usage tracking:', usageError)
    }

    return NextResponse.json({
      success: true,
      message: 'Test subscription created successfully',
      subscription,
      planId,
      billingCycle
    })

  } catch (error: any) {
    console.error('[Test] Error creating test subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create test subscription', details: error.message },
      { status: 500 }
    )
  }
} 