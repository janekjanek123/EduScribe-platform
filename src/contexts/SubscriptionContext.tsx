'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider'

interface SubscriptionFeatures {
  notes_generation: boolean
  quizzes: boolean
  youtube_support: boolean
  ppt_support: boolean
  export: boolean
  copy_paste: boolean
  upload_video: boolean
  priority_generation: boolean
}

interface SubscriptionLimits {
  notes_per_month: number // -1 means unlimited
  max_saved_notes: number
  max_text_length: number
}

interface UserUsage {
  notes_generated: number
  video_notes_count: number
  file_notes_count: number
  text_notes_count: number
  total_saved_notes: number
  month_year: string
}

interface SubscriptionContextType {
  planId: string
  planName: string
  features: SubscriptionFeatures
  limits: SubscriptionLimits
  usage: UserUsage
  isLoading: boolean
  canGenerateNotes: boolean
  canSaveNotes: boolean
  canUseQuizzes: boolean
  canUploadPPT: boolean
  canUseYouTube: boolean
  canUploadVideo: boolean
  canExportNotes: boolean
  hasPriorityProcessing: boolean
  refreshUsage: () => Promise<void>
  showUpgradeModal: () => void
}

const defaultLimits: SubscriptionLimits = {
  notes_per_month: 2,
  max_saved_notes: 3,
  max_text_length: 5000
}

const defaultFeatures: SubscriptionFeatures = {
  notes_generation: true,
  quizzes: false,
  youtube_support: true,
  ppt_support: false,
  export: false,
  copy_paste: true,
  upload_video: false,
  priority_generation: false
}

const defaultUsage: UserUsage = {
  notes_generated: 0,
  video_notes_count: 0,
  file_notes_count: 0,
  text_notes_count: 0,
  total_saved_notes: 0,
  month_year: new Date().toISOString().slice(0, 7)
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  planId: 'free',
  planName: 'Free',
  features: defaultFeatures,
  limits: defaultLimits,
  usage: defaultUsage,
  isLoading: true,
  canGenerateNotes: false,
  canSaveNotes: false,
  canUseQuizzes: false,
  canUploadPPT: false,
  canUseYouTube: false,
  canUploadVideo: false,
  canExportNotes: false,
  hasPriorityProcessing: false,
  refreshUsage: async () => {},
  showUpgradeModal: () => {}
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, supabase } = useSupabase()
  const [planId, setPlanId] = useState('free')
  const [planName, setPlanName] = useState('Free')
  const [features, setFeatures] = useState<SubscriptionFeatures>(defaultFeatures)
  const [limits, setLimits] = useState<SubscriptionLimits>(defaultLimits)
  const [usage, setUsage] = useState<UserUsage>(defaultUsage)
  const [isLoading, setIsLoading] = useState(true)

  // Static plan data (fallback when database is not available)
  const staticPlans = {
    free: {
      name: 'Free',
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
      }
    },
    student: {
      name: 'Student',
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
      }
    },
    pro: {
      name: 'Pro',
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
      }
    }
  }

  const fetchSubscriptionData = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      // Try to get subscription from database first
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscription_plans')
        .select('*')
        .limit(1)

      let currentPlan = 'free'
      
      if (!subError && subscriptionData) {
        // Database is available, try to get user's subscription
        const { data: userSub, error: userSubError } = await supabase
          .from('user_subscriptions')
          .select(`
            plan_id,
            subscription_plans (
              name,
              features,
              limits
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (!userSubError && userSub) {
          currentPlan = userSub.plan_id
          const planData = userSub.subscription_plans as any
          setPlanName(planData.name)
          setFeatures(planData.features)
          setLimits(planData.limits)
        }
      }
      
      // Fallback to static data if database is not available or user has no subscription
      if (!subscriptionData || currentPlan === 'free') {
        const plan = staticPlans[currentPlan as keyof typeof staticPlans]
        setPlanName(plan.name)
        setFeatures(plan.features)
        setLimits(plan.limits)
      }

      setPlanId(currentPlan)
      await fetchUsageData()
    } catch (error) {
      console.error('[Subscription] Error fetching subscription data:', error)
      // Use free plan as fallback
      const plan = staticPlans.free
      setPlanId('free')
      setPlanName(plan.name)
      setFeatures(plan.features)
      setLimits(plan.limits)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsageData = async () => {
    if (!user) return

    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: usageData, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .single()

      if (!error && usageData) {
        setUsage(usageData)
      } else {
        // Initialize usage if no record exists
        setUsage({
          notes_generated: 0,
          video_notes_count: 0,
          file_notes_count: 0,
          text_notes_count: 0,
          total_saved_notes: 0,
          month_year: currentMonth
        })
      }
    } catch (error) {
      console.error('[Subscription] Error fetching usage data:', error)
    }
  }

  const refreshUsage = async () => {
    if (!user) return

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        console.error('[Subscription] No authentication token available for refresh')
        return
      }

      // Call the refresh API to update saved notes count
      const response = await fetch('/api/refresh-usage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUsage(result.data)
          console.log('[Subscription] Usage refreshed successfully:', result.data)
        } else {
          console.warn('[Subscription] Refresh API succeeded but no data returned')
          // Fallback to local fetch
          await fetchUsageData()
        }
      } else {
        console.error('[Subscription] Refresh API failed, falling back to local fetch')
        // Fallback to local fetch
        await fetchUsageData()
      }
    } catch (error) {
      console.error('[Subscription] Error refreshing usage:', error)
      // Fallback to local fetch
      await fetchUsageData()
    }
  }

  const showUpgradeModal = () => {
    // For now, just redirect to pricing page
    if (typeof window !== 'undefined') {
      window.location.href = '/pricing'
    }
  }

  useEffect(() => {
    if (user) {
      fetchSubscriptionData()
      fetchUsageData()
    }
  }, [user])

  // Add automatic refresh when window gains focus to ensure counter is up to date
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('[Subscription] Window focused, refreshing usage data...')
        fetchUsageData()
      }
    }

    const handleVisibilityChange = () => {
      if (user && document.visibilityState === 'visible') {
        console.log('[Subscription] Page became visible, refreshing usage data...')
        fetchUsageData()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Calculate derived values
  const canGenerateNotes = features.notes_generation && (
    limits.notes_per_month === -1 || usage.notes_generated < limits.notes_per_month
  )
  
  const canSaveNotes = usage.total_saved_notes < limits.max_saved_notes
  const canUseQuizzes = features.quizzes
  const canUploadPPT = features.ppt_support
  const canUseYouTube = features.youtube_support
  const canUploadVideo = features.upload_video
  const canExportNotes = features.export
  const hasPriorityProcessing = features.priority_generation

  const value: SubscriptionContextType = {
    planId,
    planName,
    features,
    limits,
    usage,
    isLoading,
    canGenerateNotes,
    canSaveNotes,
    canUseQuizzes,
    canUploadPPT,
    canUseYouTube,
    canUploadVideo,
    canExportNotes,
    hasPriorityProcessing,
    refreshUsage,
    showUpgradeModal
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
} 