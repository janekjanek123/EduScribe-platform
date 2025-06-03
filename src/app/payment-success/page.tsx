'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

interface SessionData {
  id: string
  payment_status: string
  subscription: {
    id: string
    status: string
  }
  metadata: {
    planId: string
    billingCycle: string
  }
}

interface User {
  id: string
  email: string
}

function PaymentSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'pending' | 'syncing' | 'success' | 'error'>('pending')

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Get authenticated user first
    const getUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[Payment Success] Error getting session:', error)
          setError('Authentication error. Please sign in again.')
          setLoading(false)
          return
        }

        if (!session?.user) {
          console.log('[Payment Success] No authenticated user found')
          setError('Please sign in to view this page.')
          setLoading(false)
          return
        }

        setUser({
          id: session.user.id,
          email: session.user.email || ''
        })

        // Now process the payment session
        const sessionId = searchParams?.get('session_id')
        
        if (!sessionId) {
          setError('No session ID found')
          setLoading(false)
          return
        }

        await verifyAndSyncSession(sessionId, session.access_token)

      } catch (err: any) {
        console.error('[Payment Success] Error getting user:', err)
        setError(err.message || 'Unknown error occurred')
        setLoading(false)
      }
    }

    getUser()
  }, [searchParams])

  const verifyAndSyncSession = async (sessionId: string, accessToken: string) => {
    try {
      // Step 1: Verify the session
      console.log('[Payment Success] Verifying session:', sessionId)
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify session')
      }

      console.log('[Payment Success] Session verified:', data.session)
      setSessionData(data.session)

      // Step 2: Sync the subscription to database
      if (data.session.payment_status === 'paid') {
        console.log('[Payment Success] Payment successful, syncing subscription...')
        setSyncStatus('syncing')

        const syncResponse = await fetch('/api/stripe/sync-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ sessionId })
        })

        const syncData = await syncResponse.json()

        if (syncResponse.ok) {
          console.log('[Payment Success] Subscription synced successfully:', syncData)
          setSyncStatus('success')
        } else {
          console.error('[Payment Success] Failed to sync subscription:', syncData.error)
          // Don't fail the entire flow, just show a warning
          setSyncStatus('error')
        }
      }

    } catch (err: any) {
      console.error('[Payment Success] Error verifying session:', err)
      setError(err.message)
      setSyncStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state if user is not loaded yet
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {syncStatus === 'syncing' ? 'Activating your subscription...' : 'Verifying your payment...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to view this page.</p>
          <button
            onClick={() => router.push('/?signup=true')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    )
  }

  const planNames = {
    student: 'Student',
    pro: 'Pro'
  }

  const planFeatures = {
    student: [
      'Up to 10 notes per month',
      'Max 12 saved notes',
      'Interactive quizzes enabled',
      'YouTube video support',
      'PowerPoint presentation support',
      'Extended text length (up to 15,000 characters)',
      'Copy-paste note content'
    ],
    pro: [
      'Unlimited note generation (150 notes/month)',
      'Max 50 saved notes',
      'Full access to quizzes',
      'YouTube and PowerPoint support',
      'Full text length support (50,000+ characters)',
      'Export to PDF and other formats',
      'Priority generation (faster processing)',
      'Copy-paste note content'
    ]
  }

  const planLimits = {
    student: { notes: '10', saved: '12', chars: '15K' },
    pro: { notes: '150', saved: '50', chars: '50K+' }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {syncStatus === 'success' ? (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Activated Successfully!</h1>
          ) : syncStatus === 'error' ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-yellow-800 text-sm">
                    Your payment was successful, but there was an issue activating your subscription. Please contact support if your limits don't update within a few minutes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          )}
          
          {sessionData && (
            <p className="text-gray-600">
              Thank you for subscribing to the <strong>{planNames[sessionData.metadata.planId as keyof typeof planNames]}</strong> plan!
            </p>
          )}
        </div>

        {sessionData && (
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your New Plan</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {planLimits[sessionData.metadata.planId as keyof typeof planLimits].notes}
                  </div>
                  <div className="text-sm text-gray-600">Notes/Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {planLimits[sessionData.metadata.planId as keyof typeof planLimits].saved}
                  </div>
                  <div className="text-sm text-gray-600">Saved Notes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {planLimits[sessionData.metadata.planId as keyof typeof planLimits].chars}
                  </div>
                  <div className="text-sm text-gray-600">Max Text Length</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Included Features:</h4>
                <ul className="space-y-1">
                  {planFeatures[sessionData.metadata.planId as keyof typeof planFeatures].map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/generate/text')}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Your First Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessPageContent />
    </Suspense>
  )
} 