import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerStripe, STRIPE_PRICE_IDS } from '@/lib/stripe'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('[Stripe] Creating checkout session - authenticating request');
    
    // Check authentication via Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Stripe] Authentication missing');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Initialize Supabase client with the token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[Stripe] Authentication failed:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
    
    console.log(`[Stripe] User authenticated: ${user.id}`);

    const { planId, billingCycle } = await request.json()

    console.log('[Stripe] Request data:', { planId, billingCycle });

    // Validate request data
    if (!planId || !billingCycle) {
      console.error('[Stripe] Missing required fields:', { planId, billingCycle });
      return NextResponse.json(
        { error: 'Plan ID and billing cycle are required' },
        { status: 400 }
      )
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      console.error('[Stripe] Invalid billing cycle:', billingCycle);
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      )
    }

    if (!['student', 'pro'].includes(planId)) {
      console.error('[Stripe] Invalid plan ID:', planId);
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Check environment variables first
    console.log('[Stripe] Checking environment variables...');
    const envVars: Record<string, string | undefined> = {
      STRIPE_STUDENT_MONTHLY_PRICE_ID: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID,
      STRIPE_STUDENT_YEARLY_PRICE_ID: process.env.STRIPE_STUDENT_YEARLY_PRICE_ID,
      STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      STRIPE_PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    };
    
    console.log('[Stripe] Environment variables status:', Object.keys(envVars).reduce((acc, key) => {
      acc[key] = envVars[key] ? 'SET' : 'MISSING';
      return acc;
    }, {} as Record<string, string>));

    // Get the appropriate Stripe price ID
    console.log('[Stripe] Available price IDs:', STRIPE_PRICE_IDS);
    
    const priceId = STRIPE_PRICE_IDS[planId as keyof typeof STRIPE_PRICE_IDS][billingCycle as keyof typeof STRIPE_PRICE_IDS.student]

    console.log('[Stripe] Selected price ID:', priceId);

    if (!priceId) {
      console.error('[Stripe] Price ID not found:', { planId, billingCycle, availableIds: STRIPE_PRICE_IDS });
      return NextResponse.json(
        { error: 'Price ID not found for the selected plan' },
        { status: 400 }
      )
    }

    console.log('[Stripe] Creating checkout session:', {
      userId: user.id,
      email: user.email,
      planId,
      billingCycle,
      priceId
    })

    // Create Stripe checkout session
    const stripe = getServerStripe()
    
    // Ensure we have the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('[Stripe] NEXT_PUBLIC_APP_URL environment variable is required for redirects')
      return NextResponse.json(
        { error: 'Server configuration error - missing app URL for redirects' },
        { status: 500 }
      )
    }
    
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment-cancelled`,
      customer_email: user.email!,
      metadata: {
        userId: user.id,
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId,
          billingCycle,
        },
      },
      allow_promotion_codes: true,
    })

    console.log('[Stripe] Checkout session created successfully:', checkoutSession.id)

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 