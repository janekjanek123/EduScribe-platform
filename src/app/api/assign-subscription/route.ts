import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { assignUserSubscription } from '@/services/subscription'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { planId, billingCycle, paymentData } = await request.json()

    // Validate request data
    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'Plan ID and billing cycle are required' },
        { status: 400 }
      )
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      )
    }

    if (!['student', 'pro'].includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    console.log('[Assign Subscription] Processing assignment:', {
      userId: session.user.id,
      planId,
      billingCycle
    })

    // Assign subscription
    const subscription = await assignUserSubscription(
      session.user.id,
      session.access_token,
      planId,
      billingCycle,
      paymentData
    )

    if (!subscription) {
      return NextResponse.json(
        { error: 'Failed to assign subscription' },
        { status: 500 }
      )
    }

    console.log('[Assign Subscription] Successfully assigned subscription:', {
      subscriptionId: subscription.subscription_id,
      planId: subscription.plan_id,
      billingCycle: subscription.billing_cycle
    })

    return NextResponse.json({
      success: true,
      subscription
    })
  } catch (error) {
    console.error('[Assign Subscription] Error:', error)
    return NextResponse.json(
      { error: 'Failed to assign subscription' },
      { status: 500 }
    )
  }
} 