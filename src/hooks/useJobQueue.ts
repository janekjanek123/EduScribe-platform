/**
 * React hook for managing job queue functionality
 * Provides job creation, status monitoring, and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Job, JobType, JobStatus, JobInput } from '@/services/job-queue';

interface UseJobQueueOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
}

interface JobQueueState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  stats: any;
  queueInfo: any;
}

interface CreateJobOptions {
  estimatedDurationSeconds?: number;
}

export function useJobQueue(options: UseJobQueueOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    enableRealTime = true
  } = options;

  const [state, setState] = useState<JobQueueState>({
    jobs: [],
    loading: false,
    error: null,
    stats: null,
    queueInfo: null
  });

  const supabase = createClientComponentClient();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const realtimeChannelRef = useRef<any>();

  /**
   * Create a new job
   */
  const createJob = useCallback(async (
    jobType: JobType,
    inputData: JobInput,
    options: CreateJobOptions = {}
  ): Promise<{ jobId: string; position?: number } | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobType,
          inputData,
          estimatedDurationSeconds: options.estimatedDurationSeconds
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      if (data.success) {
        // Refresh jobs list
        await fetchJobs();
        return { jobId: data.jobId, position: data.position };
      }

      return null;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Get job status
   */
  const getJobStatus = useCallback(async (jobId: string): Promise<Job | null> => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get job status');
      }

      return data.success ? data.job : null;
    } catch (error: any) {
      console.error('Error getting job status:', error);
      return null;
    }
  }, []);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel job');
      }

      if (data.success) {
        await fetchJobs();
        return true;
      }

      return false;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Retry a failed job
   */
  const retryJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'retry' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry job');
      }

      if (data.success) {
        await fetchJobs();
        return true;
      }

      return false;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Fetch user's jobs
   */
  const fetchJobs = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/jobs?page=${page}&limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      if (data.success) {
        setState(prev => ({
          ...prev,
          jobs: data.jobs,
          loading: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  }, []);

  /**
   * Fetch job statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/jobs/stats');
      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({
          ...prev,
          stats: data.stats,
          queueInfo: data.queue
        }));
      }
    } catch (error: any) {
      console.error('Error fetching job stats:', error);
    }
  }, []);

  /**
   * Set up real-time updates
   */
  const setupRealTimeUpdates = useCallback(async () => {
    if (!enableRealTime) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to job updates
      const channel = supabase
        .channel('job_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Job update received:', payload);
            // Refresh jobs when changes occur
            fetchJobs();
            fetchStats();
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
    }
  }, [enableRealTime, supabase, fetchJobs, fetchStats]);

  /**
   * Auto-refresh functionality
   */
  const setupAutoRefresh = useCallback(() => {
    if (!autoRefresh) return;

    const refresh = () => {
      fetchJobs();
      fetchStats();
      
      refreshTimeoutRef.current = setTimeout(refresh, refreshInterval);
    };

    refresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchJobs, fetchStats]);

  /**
   * Initialize hook
   */
  useEffect(() => {
    fetchJobs();
    fetchStats();
    setupRealTimeUpdates();
    
    const cleanup = setupAutoRefresh();

    return () => {
      cleanup?.();
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [setupRealTimeUpdates, setupAutoRefresh, supabase]);

  /**
   * Helper functions
   */
  const getJobsByStatus = useCallback((status: JobStatus) => {
    return state.jobs.filter(job => job.status === status);
  }, [state.jobs]);

  const isJobProcessing = useCallback((jobId: string) => {
    const job = state.jobs.find(j => j.id === jobId);
    return job?.status === 'processing';
  }, [state.jobs]);

  const isJobCompleted = useCallback((jobId: string) => {
    const job = state.jobs.find(j => j.id === jobId);
    return job?.status === 'completed';
  }, [state.jobs]);

  const isJobFailed = useCallback((jobId: string) => {
    const job = state.jobs.find(j => j.id === jobId);
    return job?.status === 'failed';
  }, [state.jobs]);

  return {
    // State
    jobs: state.jobs,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    queueInfo: state.queueInfo,
    
    // Actions
    createJob,
    getJobStatus,
    cancelJob,
    retryJob,
    fetchJobs,
    fetchStats,
    
    // Helpers
    getJobsByStatus,
    isJobProcessing,
    isJobCompleted,
    isJobFailed,
    
    // Computed values
    queuedJobs: getJobsByStatus('queued'),
    processingJobs: getJobsByStatus('processing'),
    completedJobs: getJobsByStatus('completed'),
    failedJobs: getJobsByStatus('failed')
  };
} 