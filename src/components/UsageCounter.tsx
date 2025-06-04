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
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    )
  }

  const percentage = limits.max_saved_notes > 0 ? (usage.total_saved_notes / limits.max_saved_notes) * 100 : 0
  
  // Determine color based on usage percentage
  const getColorClasses = () => {
    if (percentage >= 90) {
      return {
        text: 'text-red-600',
        bg: 'bg-red-100',
        border: 'border-red-200'
      }
    } else if (percentage >= 70) {
      return {
        text: 'text-yellow-600',
        bg: 'bg-yellow-100',
        border: 'border-yellow-200'
      }
    } else {
      return {
        text: 'text-green-600',
        bg: 'bg-green-100',
        border: 'border-green-200'
      }
    }
  }

  const colors = getColorClasses()

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600">Saved Notes:</span>
      )}
      <div className={`px-3 py-1 rounded-full border ${colors.bg} ${colors.border}`}>
        <span className={`text-sm font-medium ${colors.text}`}>
          {usage.total_saved_notes} / {limits.max_saved_notes} notes
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-16 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            percentage >= 90 ? 'bg-red-500' : 
            percentage >= 70 ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`p-1 rounded-full transition-colors ${
          isRefreshing 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title={`Refresh note count${lastRefresh ? ` (last updated: ${lastRefresh.toLocaleTimeString()})` : ''}`}
      >
        <svg 
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
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
      
      {/* Help tooltip for inaccurate counts */}
      {lastRefresh && (
        <span className="text-xs text-gray-400">
          Updated {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
} 