'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function PricingPage() {
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
          .eq('status', 'active')
          .single()

        if (subscriptionError) {
          console.log('[Pricing] No active subscription found:', subscriptionError.message)
          setCurrentPlan('free')
          setUserSubscription(null)
        } else {
          console.log('[Pricing] Found subscription:', subscriptionData)
          setCurrentPlan(subscriptionData.plan_id)
          setUserSubscription(subscriptionData)
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

      // Count notes across all tables including video_upload_notes
      const [textResult, fileResult, videoResult, uploadVideoResult] = await Promise.all([
        supabase.from('text_notes').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('file_notes').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('video_notes').select('id', { count: 'exact' }).eq('user_id', user.id),
        // Handle video_upload_notes table that might not exist in all environments
        supabase.from('video_upload_notes').select('id', { count: 'exact' }).eq('user_id', user.id).then(
          result => result,
          error => {
            console.warn('[Pricing] video_upload_notes table might not exist:', error.message)
            return { count: 0 }
          }
        )
      ])

      const textCount = textResult.count || 0
      const fileCount = fileResult.count || 0
      const videoCount = videoResult.count || 0
      const uploadVideoCount = uploadVideoResult.count || 0
      const totalCount = textCount + fileCount + videoCount + uploadVideoCount

      console.log('[Pricing] Notes count:', { textCount, fileCount, videoCount, uploadVideoCount, totalCount })
      setUserNotesCount(totalCount)
      return totalCount
    } catch (error) {
      console.error('[Pricing] Error fetching notes count:', error)
      setUserNotesCount(0)
      return 0
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
      return
    }

    setIsCancelling(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found. Please sign in again.')
      }

      console.log('[Pricing] Cancelling subscription:', userSubscription.stripe_subscription_id)

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscriptionId: userSubscription.stripe_subscription_id
        })
      })

      const data = await response.json()
      console.log('[Pricing] Cancellation response:', data)

      if (!response.ok) {
        console.error('[Pricing] Cancellation failed:', {
          status: response.status,
          data: data
        })
        
        // Provide specific error messages based on the response
        let errorMessage = 'Failed to cancel subscription'
        if (data.error) {
          errorMessage = data.error
        } else if (data.details) {
          errorMessage = `${errorMessage}: ${data.details}`
        }
        
        throw new Error(errorMessage)
      }

      // Success - update local state
      setUserSubscription(null)
      setCurrentPlan('free')
      setShowCancelModal(false)
      
      // Create detailed success message
      let successMessage = 'Your subscription has been cancelled successfully!'
      successMessage += '\n\nYou have been switched to the Free plan.'
      
      if (data.notesDeleted && data.notesDeleted.total > 0) {
        successMessage += `\n\nNote Management:\n• ${data.notesDeleted.total} notes were deleted to comply with Free plan limits`
        successMessage += `\n• ${data.remainingNotes} notes remain in your account`
        
        if (data.notesDeleted.text > 0) successMessage += `\n• Text notes deleted: ${data.notesDeleted.text}`
        if (data.notesDeleted.file > 0) successMessage += `\n• File notes deleted: ${data.notesDeleted.file}`
        if (data.notesDeleted.video > 0) successMessage += `\n• Video notes deleted: ${data.notesDeleted.video}`
        if (data.notesDeleted.video_upload > 0) successMessage += `\n• Video upload notes deleted: ${data.notesDeleted.video_upload}`
        
        successMessage += '\n\nYour 3 oldest notes have been preserved.'
      }
      
      // Add warning if there were Stripe issues but cancellation succeeded
      if (data.warning) {
        successMessage += `\n\nNote: ${data.warning}`
      }
      
      successMessage += '\n\nYou can upgrade again anytime to unlock more features!'
      
      // Show success message
      alert(successMessage)
      
    } catch (error: any) {
      console.error('[Pricing] Error cancelling subscription:', error)
      
      let errorMessage = 'Failed to cancel subscription. '
      
      // Provide helpful error messages
      if (error.message.includes('authentication') || error.message.includes('session')) {
        errorMessage += 'Please try signing out and back in, then try again.'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Please check your internet connection and try again.'
      } else if (error.message.includes('Stripe')) {
        errorMessage += 'There was an issue with payment processing. Please contact support.'
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.'
      }
      
      if (error.message && !error.message.includes('Failed to cancel subscription')) {
        errorMessage += `\n\nError details: ${error.message}`
      }
      
      alert(errorMessage)
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
      features.push({ text: 'Unlimited notes per month', available: true })
    } else {
      features.push({ text: `${plan.limits.notes_per_month} notes per month`, available: true })
    }
    
    // Storage limit
    features.push({ text: `${plan.limits.max_saved_notes} saved notes`, available: true })
    
    // Character limit
    const charLimit = plan.limits.max_text_length.toLocaleString()
    features.push({ text: `${charLimit} character limit per note`, available: true })
    
    // Quizzes
    features.push({ text: 'Generate quizzes', available: plan.features.quizzes })
    
    // PPT uploads
    features.push({ text: 'PPT uploads', available: plan.features.ppt_support })
    
    // YouTube support
    features.push({ text: 'YouTube to Notes', available: plan.features.youtube_support })
    
    // Upload Video
    features.push({ text: 'Upload Video to Notes', available: plan.features.upload_video })
    
    // Export to Notepad
    features.push({ text: 'Export to Notepad', available: plan.features.export })
    
    // Processing Priority
    if (plan.features.priority_generation) {
      features.push({ text: 'Highest processing priority', available: true })
    } else if (plan.id === 'student') {
      features.push({ text: 'Medium processing priority', available: true })
    } else {
      features.push({ text: 'Lowest processing priority', available: true })
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
          Creating checkout...
        </div>
      )
    }
    
    if (isCancelling && plan.id === 'free') {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Cancelling...
        </div>
      )
    }
    
    if (isCurrentPlan) {
      if (userSubscription?.cancel_at_period_end) {
        return 'Cancelling at Period End'
      } else {
        return 'Current Plan'
      }
    }
    
    if (plan.id === 'free' && hasActiveSubscription) {
      return 'Cancel Subscription'
    }
    
    if (plan.id === 'free') {
      return 'Get Started Free'
    }
    
    return 'Choose Plan'
  }

  const isButtonDisabled = (plan: typeof staticPlans[0]) => {
    const isCurrentPlan = currentPlan === plan.id
    return isCurrentPlan || isLoading || isCancelling || subscriptionLoading
  }

  // Cancel Subscription Modal
  const CancelModal = () => {
    if (!showCancelModal) return null

    const notesToDelete = Math.max(0, userNotesCount - 3)
    const willDeleteNotes = notesToDelete > 0

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                willDeleteNotes ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <span className="text-xl">{willDeleteNotes ? '⚠️' : '🔄'}</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Cancel Subscription & Switch to Free Plan
              </h3>
              <p className="text-sm text-gray-600">
                This action will take effect immediately
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              You are about to cancel your subscription and switch to the Free plan. Please review the details below:
            </p>
            
            {loadingNotesCount ? (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm text-gray-600">Checking your notes...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-blue-600 text-lg">📊</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Current Notes Status</h4>
                      <p className="text-sm text-blue-700">
                        You currently have <strong>{userNotesCount} notes</strong> saved
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Free plan allows maximum 3 notes
                      </p>
                    </div>
                  </div>
                </div>

                {willDeleteNotes && (
                  <div className="bg-red-50 rounded-lg p-4 mb-4 border-2 border-red-300">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-red-600 text-xl">🚨</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-red-900">⚠️ DATA LOSS WARNING</h4>
                        <div className="bg-red-100 rounded p-2 mt-2 border border-red-200">
                          <p className="text-sm text-red-800 font-medium mb-1">
                            <strong>{notesToDelete} of your notes will be permanently deleted!</strong>
                          </p>
                          <p className="text-xs text-red-700">
                            • Your <strong>3 oldest notes</strong> will be kept<br/>
                            • Your <strong>{notesToDelete} newest notes</strong> will be deleted forever<br/>
                            • This action <strong>cannot be undone</strong>
                          </p>
                        </div>
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          ⚠️ Consider exporting your notes before proceeding
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!willDeleteNotes && userNotesCount <= 3 && userNotesCount > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-green-600 text-lg">✅</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">Notes Safe</h4>
                        <p className="text-sm text-green-700">
                          All your {userNotesCount} notes will be preserved (within Free plan limit of 3 notes)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 font-medium mb-2">
                What happens when you confirm:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Subscription cancelled immediately</li>
                <li>• Switched to Free plan (2 notes/month, 3 saved notes max)</li>
                {willDeleteNotes && <li>• <strong>{notesToDelete} newest notes deleted permanently</strong></li>}
                <li>• No future charges</li>
                <li>• Can upgrade again anytime</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              disabled={isCancelling}
            >
              Keep Subscription
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling || loadingNotesCount}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
                willDeleteNotes
                  ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                  : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
              }`}
            >
              {isCancelling ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : loadingNotesCount ? (
                'Loading...'
              ) : willDeleteNotes ? (
                `⚠️ Yes, Delete ${notesToDelete} Notes`
              ) : (
                'Yes, Cancel Subscription'
              )}
            </button>
          </div>
          
          {willDeleteNotes && (
            <p className="text-xs text-red-600 text-center mt-2">
              ⚠️ This will permanently delete {notesToDelete} of your notes
            </p>
          )}
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Unlock the full potential of AI-powered note generation
          </p>
          
          {/* Current Subscription Status */}
          {user && userSubscription && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <p className="text-blue-800">
                <strong>Current Plan:</strong> {staticPlans.find(p => p.id === currentPlan)?.display_name || 'Unknown'}
              </p>
              {userSubscription.cancel_at_period_end && (
                <p className="text-orange-600 text-sm mt-1">
                  Subscription will end on {new Date(userSubscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
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
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Save up to 25%
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
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 -right-3">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold ${theme.textClass} mb-2`}>
                    {plan.display_name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {plan.price_monthly === 0 ? (
                      <div className="text-4xl font-bold text-gray-900">Free</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-900">
                          {formatPrice(displayPrice)}
                          {billingCycle === 'yearly' && (
                            <span className="text-lg font-normal text-gray-600">/year</span>
                          )}
                          {billingCycle === 'monthly' && (
                            <span className="text-lg font-normal text-gray-600">/month</span>
                          )}
                        </div>
                        {billingCycle === 'yearly' && (
                          <div className="text-sm text-gray-600">
                            {formatPrice(pricePerMonth)}/month when billed annually
                          </div>
                        )}
                        {billingCycle === 'yearly' && pricing.discountPercentage > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            Save {formatPrice(pricing.yearlySavings)} per year
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
                      setShowCancelModal(true)
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
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades and at the end of your billing cycle for downgrades.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600">
                If you reach your monthly note generation limit, you'll need to upgrade your plan or wait until the next billing cycle. Your saved notes remain accessible.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Our Free plan allows you to try EduScribe with 2 notes per month. You can upgrade anytime to unlock more features and higher limits.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does billing work?
              </h3>
              <p className="text-gray-600">
                You'll be charged at the beginning of each billing cycle. Annual plans offer significant savings compared to monthly billing.
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
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      <CancelModal />
    </div>
  )
} 