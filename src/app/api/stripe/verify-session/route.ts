import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('[Stripe] Verifying session:', sessionId)

    // Retrieve the checkout session from Stripe
    const stripe = getServerStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    console.log('[Stripe] Session retrieved:', {
      id: session.id,
      paymentStatus: session.payment_status,
      subscriptionId: session.subscription,
      metadata: session.metadata
    })

    return NextResponse.json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        subscription: {
          id: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
          status: typeof session.subscription === 'object' ? session.subscription?.status : 'unknown'
        },
        metadata: session.metadata || {}
      }
    })
  } catch (error: any) {
    console.error('[Stripe] Error verifying session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify session' },
      { status: 500 }
    )
  }
} 