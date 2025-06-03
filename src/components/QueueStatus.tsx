'use client'

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase-provider';

interface QueueStatusData {
  totalInQueue: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  estimatedWaitTime: number;
  userPosition: number | null;
  systemLoad: {
    queueLength: number;
    processing: number;
    capacity: number;
    loadPercentage: number;
  };
  message: string;
  statusColor: 'green' | 'yellow' | 'red';
  timestamp: string;
}

interface QueueStatusProps {
  userId?: string;
  refreshInterval?: number; // milliseconds
  compact?: boolean;
}

export default function QueueStatus({ 
  userId, 
  refreshInterval = 5000, 
  compact = false 
}: QueueStatusProps) {
  const { user } = useSupabase();
  const [queueData, setQueueData] = useState<QueueStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actualUserId = userId || user?.id;

  const fetchQueueStatus = async () => {
    try {
      const url = actualUserId 
        ? `/api/queue-status?userId=${actualUserId}`
        : '/api/queue-status';
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setQueueData(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to load queue status');
      }
    } catch (err) {
      setError('Unable to connect to queue service');
      console.error('[QueueStatus] Error fetching status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    
    // Set up periodic refresh
    const interval = setInterval(fetchQueueStatus, refreshInterval);
    
    return () => clearInterval(interval);
  }, [actualUserId, refreshInterval]);

  if (isLoading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-gray-50 rounded-lg border`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Checking queue status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-red-50 border border-red-200 rounded-lg`}>
        <div className="flex items-center gap-2">
          <span className="text-red-600">⚠️</span>
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!queueData) return null;

  // Don't show if no queue and system is idle
  if (queueData.totalInQueue === 0 && queueData.systemLoad.processing === 0 && compact) {
    return null;
  }

  const getStatusIcon = () => {
    switch (queueData.statusColor) {
      case 'green': return '🟢';
      case 'yellow': return '🟡';
      case 'red': return '🔴';
      default: return '⚪';
    }
  };

  const getProgressPercentage = () => {
    return Math.min(queueData.systemLoad.loadPercentage, 100);
  };

  if (compact) {
    return (
      <div className="p-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{getStatusIcon()}</span>
            <span className="text-sm font-medium">
              {queueData.userPosition ? `Position #${queueData.userPosition}` : 'Queue Status'}
            </span>
          </div>
          
          {queueData.totalInQueue > 0 && (
            <span className="text-xs text-gray-500">
              {queueData.totalInQueue} in queue
            </span>
          )}
        </div>
        
        {queueData.userPosition && (
          <div className="mt-2 text-xs text-gray-600">
            Est. wait: {Math.ceil(queueData.estimatedWaitTime / 60)} min
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Queue Status</h3>
        <div className="flex items-center gap-2">
          <span>{getStatusIcon()}</span>
          <span className="text-sm text-gray-600">
            {queueData.systemLoad.processing}/{queueData.systemLoad.capacity} processing
          </span>
        </div>
      </div>

      {/* Main Message */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">{queueData.message}</p>
      </div>

      {/* User Position (if in queue) */}
      {queueData.userPosition && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">Your Position: #{queueData.userPosition}</p>
              <p className="text-sm text-blue-700">
                Estimated wait: {Math.ceil(queueData.estimatedWaitTime / 60)} minutes
              </p>
            </div>
            <div className="text-2xl">⏳</div>
          </div>
        </div>
      )}

      {/* System Load Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">System Load</span>
          <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              queueData.statusColor === 'green' ? 'bg-green-500' :
              queueData.statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Priority Breakdown */}
      {queueData.totalInQueue > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-purple-50 rounded">
            <div className="text-lg font-bold text-purple-600">
              {queueData.priorityBreakdown.high}
            </div>
            <div className="text-xs text-purple-700">Pro Users</div>
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">
              {queueData.priorityBreakdown.medium}
            </div>
            <div className="text-xs text-blue-700">Students</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-600">
              {queueData.priorityBreakdown.low}
            </div>
            <div className="text-xs text-gray-700">Free Users</div>
          </div>
        </div>
      )}

      {/* Refresh timestamp */}
      <div className="mt-3 text-xs text-gray-400 text-center">
        Last updated: {new Date(queueData.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
} 