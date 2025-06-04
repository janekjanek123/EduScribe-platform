'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useSupabase } from '@/lib/supabase-provider'
import { PLAN_PRICING } from '@/lib/stripe'

// Static plan data with updated limits per requirements
const staticPlans = [
  {
    id: 'free',
    name: 'free',
    display_name: 'Free',
    description: 'Basic note generation for students',
    price_monthly: 0.00,
    price_yearly: 0.00,
    currency: 'PLN',
    features: {
      notes_generation: true,
      quizzes: false,
      youtube_support: true,
      ppt_support: false,
      export: false,
      copy_paste: true,
      upload_video: false,
      priority_generation: false
    },
    limits: {
      notes_per_month: 2,
      max_saved_notes: 3,
      max_text_length: 5000
    },
    is_active: true
  },
  {
    id: 'student',
    name: 'student',
    display_name: 'Student',
    description: 'Perfect for students with enhanced features',
    price_monthly: PLAN_PRICING.student.monthly,
    price_yearly: PLAN_PRICING.student.yearly,
    currency: 'PLN',
    features: {
      notes_generation: true,
      quizzes: true,
      youtube_support: true,
      ppt_support: true,
      export: true,
      copy_paste: true,
      upload_video: true,
      priority_generation: false
    },
    limits: {
      notes_per_month: 10,
      max_saved_notes: 12,
      max_text_length: 10000
    },
    is_active: true
  },
  {
    id: 'pro',
    name: 'pro',
    display_name: 'Pro',
    description: 'Ultimate plan for power users and professionals',
    price_monthly: PLAN_PRICING.pro.monthly,
    price_yearly: PLAN_PRICING.pro.yearly,
    currency: 'PLN',
    features: {
      notes_generation: true,
      quizzes: true,
      youtube_support: true,
      ppt_support: true,
      export: true,
      copy_paste: true,
      upload_video: true,
      priority_generation: true
    },
    limits: {
      notes_per_month: -1, // unlimited
      max_saved_notes: 50,
      max_text_length: 15000
    },
    is_active: true
  }
]

interface UserSubscription {
  plan_id: string
  billing_cycle: string
  status: string
  stripe_subscription_id: string
  current_period_end: string
  cancel_at_period_end: boolean
}

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg max-w-md flex items-center space-x-3`}>
        <span className="text-lg">{icon}</span>
        <p className="font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const [plans] = useState(staticPlans)
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [userNotesCount, setUserNotesCount] = useState(0)
  const [loadingNotesCount, setLoadingNotesCount] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Fetch user's current subscription
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user || !supabase) {
        setCurrentPlan('free')
        setSubscriptionLoading(false)
        return
      }

      try {
        console.log('[Pricing] Fetching user subscription for:', user.id)
        
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select(`
            plan_id,
            billing_cycle,
            status,
            stripe_subscription_id,
            current_period_end,
            cancel_at_period_end,
            subscription_plans (
              display_name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (subscriptionError) {
          console.log('[Pricing] No subscription found:', subscriptionError.message)
          setCurrentPlan('free')
          setUserSubscription(null)
        } else {
          console.log('[Pricing] Found subscription:', subscriptionData)
          console.log('[Pricing] Subscription details:', {
            plan_id: subscriptionData.plan_id,
            billing_cycle: subscriptionData.billing_cycle,
            status: subscriptionData.status,
            stripe_subscription_id: subscriptionData.stripe_subscription_id,
            current_period_end: subscriptionData.current_period_end,
            cancel_at_period_end: subscriptionData.cancel_at_period_end
          })
          
          // Determine the current plan based on subscription status
          if (subscriptionData.status === 'active' || 
              (subscriptionData.status === 'trialing') ||
              (subscriptionData.cancel_at_period_end && new Date(subscriptionData.current_period_end) > new Date())) {
            setCurrentPlan(subscriptionData.plan_id)
            setUserSubscription(subscriptionData)
            console.log('[Pricing] Set as current plan:', subscriptionData.plan_id)
          } else {
            console.log('[Pricing] Subscription not active:', {
              status: subscriptionData.status,
              cancel_at_period_end: subscriptionData.cancel_at_period_end,
              current_period_end: subscriptionData.current_period_end
            })
            setCurrentPlan('free')
            setUserSubscription(subscriptionData) // Still keep subscription data for cancellation purposes
            console.log('[Pricing] Set as free plan but keeping subscription data for cancellation')
          }
        }
      } catch (error) {
        console.error('[Pricing] Error fetching subscription:', error)
        setCurrentPlan('free')
        setUserSubscription(null)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    fetchUserSubscription()
  }, [user, supabase])

  // Refresh notes count whenever the cancel modal is opened
  useEffect(() => {
    if (showCancelModal && user) {
      console.log('[Pricing] Cancel modal opened, refreshing notes count...')
      fetchUserNotesCount()
    }
  }, [showCancelModal, user])

  // Function to fetch user's notes count
  const fetchUserNotesCount = async () => {
    if (!user || !supabase) return 0

    setLoadingNotesCount(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }

      console.log('[Pricing] Fetching accurate notes count for user:', user.id)

      // Use the same API approach as dashboard for consistency and accuracy
      const [videoResponse, fileResponse, textResponse, uploadVideoResponse] = await Promise.all([
        fetch('/api/video-notes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/file-notes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/text-notes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/upload-video', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ])

      let totalCount = 0

      // Count video notes (YouTube)
      if (videoResponse.ok) {
        const videoData = await videoResponse.json()
        if (videoData.success && videoData.data) {
          totalCount += videoData.data.length
          console.log('[Pricing] Video notes count:', videoData.data.length)
        }
      }

      // Count video upload notes
      if (uploadVideoResponse.ok) {
        const uploadVideoData = await uploadVideoResponse.json()
        if (uploadVideoData.success && uploadVideoData.data) {
          totalCount += uploadVideoData.data.length
          console.log('[Pricing] Upload video notes count:', uploadVideoData.data.length)
        }
      }

      // Count file notes
      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        if (fileData.success && fileData.data) {
          totalCount += fileData.data.length
          console.log('[Pricing] File notes count:', fileData.data.length)
        }
      }

      // Count text notes
      if (textResponse.ok) {
        const textData = await textResponse.json()
        if (textData.success && textData.data) {
          totalCount += textData.data.length
          console.log('[Pricing] Text notes count:', textData.data.length)
        }
      }

      console.log('[Pricing] Total accurate notes count:', totalCount)
      setUserNotesCount(totalCount)
      return totalCount
    } catch (error) {
      console.error('[Pricing] Error fetching notes count:', error)
      // Fallback to direct database query if API fails
      try {
        const [textResult, fileResult, videoResult] = await Promise.all([
          supabase.from('text_notes').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('file_notes').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('video_notes').select('id', { count: 'exact' }).eq('user_id', user.id)
        ])

        const fallbackCount = (textResult.count || 0) + (fileResult.count || 0) + (videoResult.count || 0)
        console.log('[Pricing] Fallback notes count:', fallbackCount)
        setUserNotesCount(fallbackCount)
        return fallbackCount
      } catch (fallbackError) {
        console.error('[Pricing] Fallback counting also failed:', fallbackError)
        setUserNotesCount(0)
        return 0
      }
    } finally {
      setLoadingNotesCount(false)
    }
  }

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      router.push('/?signup=true')
      return
    }
    
    if (planId === 'free') {
      // Handle downgrade to free plan - show cancel modal
      if (userSubscription) {
        // Fetch notes count before showing modal
        await fetchUserNotesCount()
        setShowCancelModal(true)
      } else {
        router.push('/dashboard')
      }
      return
    }

    // Don't allow selecting the same plan
    if (planId === currentPlan) {
      return
    }
    
    setIsLoading(true)
    
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found. Please sign in again.')
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planId,
          billingCycle
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout process. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!userSubscription || !user) {
      console.error('[Pricing] Cannot cancel - missing data:', {
        hasUserSubscription: !!userSubscription,
        hasUser: !!user,
        userSubscription: userSubscription
      })
      return
    }

    console.log('[Pricing] Starting cancellation process:', {
      userId: user.id,
      subscriptionId: userSubscription.stripe_subscription_id,
      planId: userSubscription.plan_id,
      status: userSubscription.status,
      fullUserSubscription: userSubscription
    })

    setIsCancelling(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found. Please sign in again.')
      }

      // Extract the actual subscription ID - handle both string and object cases
      let actualSubscriptionId = userSubscription.stripe_subscription_id
      
      // If it's an object (which seems to be the case), extract the ID
      if (typeof actualSubscriptionId === 'object' && actualSubscriptionId && (actualSubscriptionId as any).id) {
        actualSubscriptionId = (actualSubscriptionId as any).id
      }
      
      // If it's a stringified JSON, parse it and extract the ID
      if (typeof actualSubscriptionId === 'string' && actualSubscriptionId.startsWith('{')) {
        try {
          const parsed = JSON.parse(actualSubscriptionId)
          if (parsed.id) {
            actualSubscriptionId = parsed.id
          }
        } catch (e) {
          console.error('[Pricing] Failed to parse subscription ID JSON:', e)
        }
      }

      console.log('[Pricing] Original subscription ID:', userSubscription.stripe_subscription_id)
      console.log('[Pricing] Extracted subscription ID:', actualSubscriptionId)
      console.log('[Pricing] Request payload:', {
        subscriptionId: actualSubscriptionId
      })

      console.log('[Pricing] Cancelling subscription:', actualSubscriptionId)

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscriptionId: actualSubscriptionId
        })
      })

      console.log('[Pricing] Response status:', response.status)
      console.log('[Pricing] Response ok:', response.ok)
      
      const data = await response.json()
      console.log('[Pricing] Cancellation response:', data)

      if (!response.ok) {
        console.error('[Pricing] Cancellation failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        
        // Provide specific error messages based on the response
        let errorMessage = 'Failed to cancel subscription'
        if (data.error) {
          errorMessage = data.error
        }
        
        // Add additional details if available
        if (data.details && data.details !== data.error) {
          errorMessage += `\n\nDetails: ${data.details}`
        }
        
        // Add Stripe error information if available
        if (data.stripeErrorType) {
          errorMessage += `\n\nStripe Error: ${data.stripeErrorType}`
        }
        
        if (data.stripeErrorCode) {
          errorMessage += ` (${data.stripeErrorCode})`
        }
        
        throw new Error(errorMessage)
      }

      // Success - update local state
      setUserSubscription(null)
      setCurrentPlan('free')
      setShowCancelModal(false)
      
      // Show custom toast notification instead of browser alert
      setToast({
        message: t('pricing.cancelModal.successMessage'),
        type: 'info'
      })
      
    } catch (error: any) {
      console.error('[Pricing] Error cancelling subscription:', error)
      setToast({
        message: t('pricing.cancelModal.errorMessage', { error: error.message }),
        type: 'error'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ${staticPlans[0].currency}`
  }

  const getPlanPricing = (plan: typeof staticPlans[0]) => {
    const monthlyPrice = plan.price_monthly
    const yearlyPrice = plan.price_yearly
    const yearlyMonthlyEquivalent = yearlyPrice / 12
    const discountPercentage = monthlyPrice > 0 ? Math.round((1 - yearlyMonthlyEquivalent / monthlyPrice) * 100) : 0
    const yearlySavings = (monthlyPrice * 12) - yearlyPrice
    
    return {
      monthly: monthlyPrice,
      yearly: yearlyPrice,
      yearlyMonthlyEquivalent,
      discountPercentage,
      yearlySavings,
      currency: plan.currency
    }
  }

  const getPlanFeatures = (plan: typeof staticPlans[0]) => {
    const features = []
    
    // Notes generation limit
    if (plan.limits.notes_per_month === -1) {
      features.push({ text: t('pricing.features.unlimited') + ' ' + t('pricing.features.notesGeneration'), available: true })
    } else {
      features.push({ text: `${plan.limits.notes_per_month} ${t('pricing.features.notesGeneration')}`, available: true })
    }
    
    // Storage limit
    features.push({ text: `${plan.limits.max_saved_notes} ${t('pricing.features.savedNotes')}`, available: true })
    
    // Character limit
    const charLimit = plan.limits.max_text_length.toLocaleString()
    features.push({ text: t('pricing.features.characterLimit', { limit: charLimit }), available: true })
    
    // Quizzes
    features.push({ text: t('pricing.features.quizzes'), available: plan.features.quizzes })
    
    // PPT uploads
    features.push({ text: t('pricing.features.pptUploads'), available: plan.features.ppt_support })
    
    // YouTube support
    features.push({ text: t('pricing.features.youtubeSupport'), available: plan.features.youtube_support })
    
    // Upload Video
    features.push({ text: t('pricing.features.uploadVideo'), available: plan.features.upload_video })
    
    // Export to Notepad
    features.push({ text: t('pricing.features.exportNotepad'), available: plan.features.export })
    
    // Processing Priority
    if (plan.features.priority_generation) {
      features.push({ text: t('pricing.features.highestPriority'), available: true })
    } else if (plan.id === 'student') {
      features.push({ text: t('pricing.features.mediumPriority'), available: true })
    } else {
      features.push({ text: t('pricing.features.lowestPriority'), available: true })
    }
    
    return features
  }

  const getButtonContent = (plan: typeof staticPlans[0]) => {
    const isCurrentPlan = currentPlan === plan.id
    const hasActiveSubscription = userSubscription && userSubscription.status === 'active'
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          {t('pricing.buttons.creatingCheckout')}
        </div>
      )
    }
    
    if (isCancelling && plan.id === 'free') {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          {t('pricing.buttons.cancelling')}
        </div>
      )
    }
    
    if (isCurrentPlan) {
      if (userSubscription?.cancel_at_period_end) {
        return t('pricing.buttons.cancellingAtPeriodEnd')
      } else {
        return t('pricing.buttons.currentPlan')
      }
    }
    
    if (plan.id === 'free' && hasActiveSubscription) {
      return t('pricing.buttons.cancelSubscription')
    }
    
    if (plan.id === 'free') {
      return t('pricing.buttons.getStartedFree')
    }
    
    return t('pricing.buttons.choosePlan')
  }

  const isButtonDisabled = (plan: typeof staticPlans[0]) => {
    const isCurrentPlan = currentPlan === plan.id
    return isCurrentPlan || isLoading || isCancelling || subscriptionLoading
  }

  // Redesigned Cancel Subscription Modal
  const CancelModal = () => {
    if (!showCancelModal) return null

    const willDeleteNotes = userNotesCount > 3
    const notesToDelete = Math.max(0, userNotesCount - 3)
    const isHighRisk = willDeleteNotes

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-red-200">
          {/* Header with Warning Icon */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-300">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t('pricing.cancelModal.title')}
            </h3>
          </div>
          
          {/* Warning Message */}
          <div className="mb-6 text-center">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium text-lg leading-relaxed">
                {t('pricing.cancelModal.warningMessage')}
              </p>
              <p className="text-red-700 font-semibold mt-2">
                {t('pricing.cancelModal.irreversible')}
              </p>
            </div>
          </div>
          
          {/* Notes Status Box */}
          {loadingNotesCount ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600 font-medium">{t('pricing.cancelModal.checkingNotes')}</span>
              </div>
            </div>
          ) : (
            <div className={`rounded-lg p-4 mb-6 border-2 ${
              isHighRisk 
                ? 'bg-red-50 border-red-300' 
                : 'bg-blue-50 border-blue-300'
            }`}>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-sm ${isHighRisk ? 'text-red-700' : 'text-blue-700'} font-medium`}>
                    {t('pricing.cancelModal.freePlanLimit')}
                  </div>
                  {isHighRisk && (
                    <div className="text-red-800 font-bold mt-2 text-lg">
                      {t('pricing.cancelModal.notesWillBeDeleted', { count: notesToDelete })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCancelModal(false)}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 font-semibold text-lg transition-colors"
              disabled={isCancelling}
            >
              {t('pricing.cancelModal.keepSubscription')}
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling || loadingNotesCount}
              className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('common.loading')}
                </div>
              ) : loadingNotesCount ? (
                t('common.loading')
              ) : (
                t('pricing.cancelModal.confirmCancel')
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('pricing.subtitle')}
          </p>
          
          {/* Current Subscription Status */}
          {user && userSubscription && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <p className="text-blue-800">
                <strong>{t('pricing.currentPlan')}:</strong> {staticPlans.find(p => p.id === currentPlan)?.display_name || t('pricing.unknown')}
              </p>
              {userSubscription.cancel_at_period_end && (
                <p className="text-orange-600 text-sm mt-1">
                  {t('pricing.subscriptionEndsOn', { date: new Date(userSubscription.current_period_end).toLocaleDateString() })}
                </p>
              )}
            </div>
          )}
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingCycle === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {t('pricing.yearly')}
            </span>
            {billingCycle === 'yearly' && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {t('pricing.saveUpTo')}
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const pricing = getPlanPricing(plan)
            const features = getPlanFeatures(plan)
            const isCurrentPlan = currentPlan === plan.id
            const displayPrice = billingCycle === 'yearly' ? pricing.yearly : pricing.monthly
            const pricePerMonth = billingCycle === 'yearly' ? pricing.yearlyMonthlyEquivalent : pricing.monthly

            // Theme for each plan
            const theme = plan.id === 'pro' 
              ? { 
                  borderClass: 'border-purple-500 border-2', 
                  textClass: 'text-purple-600',
                  buttonClass: 'bg-purple-600 hover:bg-purple-700'
                }
              : plan.id === 'student'
              ? { 
                  borderClass: 'border-blue-500 border-2', 
                  textClass: 'text-blue-600',
                  buttonClass: 'bg-blue-600 hover:bg-blue-700'
                }
              : { 
                  borderClass: 'border-gray-200', 
                  textClass: 'text-gray-600',
                  buttonClass: 'bg-gray-600 hover:bg-gray-700'
                }

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-lg p-8 ${theme.borderClass} ${
                  isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Popular badge for Student plan */}
                {plan.id === 'student' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('pricing.mostPopular')}
                    </span>
                  </div>
                )}

                {/* Current Plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 -right-3">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {t('pricing.currentPlan')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold ${theme.textClass} mb-2`}>
                    {t(`pricing.plans.${plan.id}.name`)}
                  </h3>
                  <p className="text-gray-600 mb-4">{t(`pricing.plans.${plan.id}.description`)}</p>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {plan.price_monthly === 0 ? (
                      <div className="text-4xl font-bold text-gray-900">{t('pricing.free')}</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-900">
                          {formatPrice(displayPrice)}
                          {billingCycle === 'yearly' && (
                            <span className="text-lg font-normal text-gray-600">/{t('pricing.year')}</span>
                          )}
                          {billingCycle === 'monthly' && (
                            <span className="text-lg font-normal text-gray-600">/{t('pricing.month')}</span>
                          )}
                        </div>
                        {billingCycle === 'yearly' && (
                          <div className="text-sm text-gray-600">
                            {formatPrice(pricePerMonth)}/{t('pricing.month')} {t('pricing.whenBilledAnnually')}
                          </div>
                        )}
                        {billingCycle === 'yearly' && pricing.discountPercentage > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            {t('pricing.saveAmount', { amount: formatPrice(pricing.yearlySavings) })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.available ? (
                        <span className="text-green-500 text-xl mr-3 mt-0.5 flex-shrink-0">✅</span>
                      ) : (
                        <span className="text-red-500 text-xl mr-3 mt-0.5 flex-shrink-0">❌</span>
                      )}
                      <span className={`text-gray-700 ${!feature.available ? 'line-through text-gray-400' : ''}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (plan.id === 'free' && userSubscription && userSubscription.status === 'active') {
                      // Fetch notes count before showing modal
                      fetchUserNotesCount().then(() => {
                        setShowCancelModal(true)
                      })
                    } else {
                      handlePlanSelect(plan.id)
                    }
                  }}
                  disabled={isButtonDisabled(plan)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    isButtonDisabled(plan)
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.id === 'free' && userSubscription && userSubscription.status === 'active'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : `${theme.buttonClass} text-white`
                  }`}
                >
                  {getButtonContent(plan)}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            {t('pricing.faq.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pricing.faq.changePlan.question')}
              </h3>
              <p className="text-gray-600">
                {t('pricing.faq.changePlan.answer')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pricing.faq.exceedLimits.question')}
              </h3>
              <p className="text-gray-600">
                {t('pricing.faq.exceedLimits.answer')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pricing.faq.freeTrial.question')}
              </h3>
              <p className="text-gray-600">
                {t('pricing.faq.freeTrial.answer')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pricing.faq.billing.question')}
              </h3>
              <p className="text-gray-600">
                {t('pricing.faq.billing.answer')}
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← {t('pricing.backToDashboard')}
          </button>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      <CancelModal />
    </div>
  )
} 