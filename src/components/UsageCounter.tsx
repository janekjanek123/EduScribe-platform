'use client'

import { useSubscription } from '@/contexts/SubscriptionContext'
import { useState } from 'react'

interface UsageCounterProps {
  className?: string
  showLabel?: boolean
}

export default function UsageCounter({ className = '', showLabel = true }: UsageCounterProps) {
  const { usage, limits, isLoading, refreshUsage } = useSubscription()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshUsage()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to refresh usage:', error)
      alert('Failed to refresh note count. Please try again or refresh the page.')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 rounded-xl" style={{ background: 'var(--bg-tertiary)', width: '200px' }}></div>
      </div>
    )
  }

  const percentage = limits.max_saved_notes > 0 ? (usage.total_saved_notes / limits.max_saved_notes) * 100 : 0
  
  // Determine color based on usage percentage
  const getColors = () => {
    if (percentage >= 90) {
      return {
        primary: '#ef4444',
        secondary: '#fca5a5',
        glow: '0 0 20px rgba(239, 68, 68, 0.3)'
      }
    } else if (percentage >= 70) {
      return {
        primary: 'var(--color-video)',
        secondary: '#fbbf24',
        glow: '0 0 20px rgba(255, 165, 0, 0.3)'
      }
    } else {
      return {
        primary: 'var(--color-cta)',
        secondary: 'var(--color-file)',
        glow: 'var(--glow-cta)'
      }
    }
  }

  const colors = getColors()

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {showLabel && (
        <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Saved Notes:
        </span>
      )}
      
      <div className="flex items-center space-x-3">
        {/* Usage Badge */}
        <div 
          className="px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300"
          style={{ 
            background: `linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)`,
            border: `1px solid ${colors.primary}`,
            color: colors.primary,
            boxShadow: colors.glow
          }}
        >
          {usage.total_saved_notes} / {limits.max_saved_notes} notes
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center space-x-2">
          <div 
            className="w-20 h-3 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(percentage, 100)}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: colors.glow
              }}
            ></div>
          </div>
          
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 ${
            isRefreshing ? 'cursor-not-allowed' : ''
          }`}
          style={{
            background: isRefreshing 
              ? 'var(--bg-tertiary)'
              : 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: `1px solid ${isRefreshing ? 'var(--bg-tertiary)' : 'var(--color-cta)'}`,
            color: isRefreshing ? 'var(--text-muted)' : 'var(--color-cta)',
            boxShadow: isRefreshing ? 'none' : 'var(--shadow-sm)'
          }}
          title={`Refresh note count${lastRefresh ? ` (last updated: ${lastRefresh.toLocaleTimeString()})` : ''}`}
        >
          <svg 
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>
      
      {/* Last Update Timestamp */}
      {lastRefresh && (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Updated {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
} 