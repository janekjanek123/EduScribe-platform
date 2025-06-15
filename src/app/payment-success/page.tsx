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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
            style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-cta)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {syncStatus === 'syncing' ? 'Activating your subscription...' : 'Verifying your payment...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="max-w-md mx-auto rounded-2xl p-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Please Sign In</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>You need to be signed in to view this page.</p>
            <button
              onClick={() => router.push('/?signup=true')}
              className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                color: 'var(--bg-primary)',
                boxShadow: 'var(--glow-cta)'
              }}
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-md mx-auto rounded-2xl p-8 text-center" style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--bg-tertiary)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Payment Verification Failed</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
              color: 'var(--bg-primary)',
              boxShadow: 'var(--glow-cta)'
            }}
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto rounded-2xl p-8" style={{ 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
        border: '1px solid var(--bg-tertiary)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ 
            background: 'linear-gradient(135deg, var(--color-cta), var(--color-file))',
            boxShadow: 'var(--glow-cta)'
          }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--bg-primary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {syncStatus === 'success' ? (
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Subscription Activated Successfully!</h1>
          ) : syncStatus === 'error' ? (
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Payment Successful!</h1>
              <div className="rounded-xl p-4 mt-4" style={{ 
                background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 165, 0, 0.05))',
                border: '1px solid rgba(255, 165, 0, 0.3)'
              }}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-video)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Your payment was successful, but there was an issue activating your subscription. Please contact support if your limits don't update within a few minutes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Payment Successful!</h1>
          )}
          
          {sessionData && (
            <p style={{ color: 'var(--text-secondary)' }}>
              Thank you for subscribing to the <strong>{planNames[sessionData.metadata.planId as keyof typeof planNames]}</strong> plan!
            </p>
          )}
        </div>

        {sessionData && (
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="rounded-xl p-6" style={{ 
              background: 'linear-gradient(135deg, var(--bg-primary) 0%, rgba(44, 211, 225, 0.05) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your New Plan</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-cta)' }}>
                    {planLimits[sessionData.metadata.planId as keyof typeof planLimits].notes}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Notes/Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-cta)' }}>
                    {planLimits[sessionData.metadata.planId as keyof typeof planLimits].saved}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Saved Notes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-cta)' }}>
                    {planLimits[sessionData.metadata.planId as keyof typeof planLimits].chars}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Max Text Length</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Included Features:</h4>
                <ul className="space-y-1">
                  {planFeatures[sessionData.metadata.planId as keyof typeof planFeatures].map((feature, index) => (
                    <li key={index} className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-file)' }}>
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
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--glow-cta)'
                }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/generate/text')}
                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-file) 0%, var(--color-text) 100%)',
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--glow-file)'
                }}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
            style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-cta)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading payment status...</p>
        </div>
      </div>
    }>
      <PaymentSuccessPageContent />
    </Suspense>
  )
} 