'use client';

import { useState } from 'react';
import { Job } from '@/services/job-queue';
import { useJobQueue } from '@/hooks/useJobQueue';

interface JobStatusCardProps {
  job: Job;
  onJobUpdate?: (job: Job) => void;
}

export function JobStatusCard({ job, onJobUpdate }: JobStatusCardProps) {
  const { cancelJob, retryJob, loading } = useJobQueue();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'text_notes':
        return '📝';
      case 'file_notes':
        return '📄';
      case 'video_notes':
        return '🎥';
      case 'youtube_notes':
        return '📺';
      default:
        return '⚙️';
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case 'text_notes':
        return 'Text Notes';
      case 'file_notes':
        return 'File Notes';
      case 'video_notes':
        return 'Video Notes';
      case 'youtube_notes':
        return 'YouTube Notes';
      default:
        return 'Unknown';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await cancelJob(job.id);
      onJobUpdate?.(job);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async () => {
    setActionLoading('retry');
    try {
      await retryJob(job.id);
      onJobUpdate?.(job);
    } finally {
      setActionLoading(null);
    }
  };

  const canCancel = job.status === 'queued';
  const canRetry = job.status === 'failed';
  const showProgress = job.status === 'processing' || job.status === 'completed';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getJobTypeIcon(job.job_type)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {getJobTypeLabel(job.job_type)}
            </h3>
            <p className="text-sm text-gray-500">ID: {job.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
              job.status
            )}`}
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
          <span className="text-xs text-gray-500">
            {job.priority === 'urgent' && '🔥'}
            {job.priority === 'high' && '⚡'}
            {job.priority === 'normal' && '🔵'}
            {job.priority === 'low' && '⚪'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{job.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                job.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Queue Position */}
      {job.status === 'queued' && (job as any).queuePosition && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Position in queue: <span className="font-semibold">#{(job as any).queuePosition}</span>
          </p>
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.error_message && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">Error:</p>
          <p className="text-sm text-red-700">{job.error_message}</p>
        </div>
      )}

      {/* Content Preview */}
      {job.input_data && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm font-medium text-gray-700 mb-1">Input:</p>
          <p className="text-sm text-gray-600 truncate">
            {job.input_data.content && job.input_data.content.substring(0, 100)}
            {job.input_data.youtubeUrl && job.input_data.youtubeUrl}
            {job.input_data.fileName && job.input_data.fileName}
            {job.input_data.videoUrl && job.input_data.videoUrl}
            ...
          </p>
        </div>
      )}

      {/* Timing Information */}
      <div className="text-xs text-gray-500 mb-4 space-y-1">
        <div>Created: {formatTimestamp(job.created_at)}</div>
        {job.started_at && (
          <div>Started: {formatTimestamp(job.started_at)}</div>
        )}
        {job.completed_at && (
          <div>Completed: {formatTimestamp(job.completed_at)}</div>
        )}
        {job.actual_duration_seconds && (
          <div>Duration: {formatDuration(job.actual_duration_seconds)}</div>
        )}
        {job.retry_count > 0 && (
          <div>Retries: {job.retry_count}/{job.max_retries}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={actionLoading === 'cancel' || loading}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'cancel' ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-3 w-3 border border-red-300 rounded-full border-t-red-600" />
                  Cancelling...
                </>
              ) : (
                'Cancel'
              )}
            </button>
          )}
          
          {canRetry && (
            <button
              onClick={handleRetry}
              disabled={actionLoading === 'retry' || loading}
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'retry' ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-3 w-3 border border-blue-300 rounded-full border-t-blue-600" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </button>
          )}
        </div>

        {job.status === 'completed' && job.output_data && (
          <button
            onClick={() => {
              // Handle view results
              console.log('View results:', job.output_data);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  );
} 