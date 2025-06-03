import Stripe from 'stripe'

let stripe: Stripe

// Initialize Stripe with proper configuration
export const getServerStripe = () => {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
      appInfo: {
        name: 'EduScribe',
        version: '1.0.0',
      },
    })
  }
  return stripe
}

// Plan pricing (for display purposes) - safe for client-side
export const PLAN_PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  student: {
    monthly: 24.99,
    yearly: 224.99,
  },
  pro: {
    monthly: 49.99,
    yearly: 449.99,
  },
} as const

// Stripe Price IDs - these should match your Stripe dashboard
export const STRIPE_PRICE_IDS = {
  student: {
    monthly: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID || 'price_student_monthly',
    yearly: process.env.STRIPE_STUDENT_YEARLY_PRICE_ID || 'price_student_yearly',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
} as const

export type PlanId = 'free' | 'student' | 'pro'
export type BillingCycle = 'monthly' | 'yearly' 