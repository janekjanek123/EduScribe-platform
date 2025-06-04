/**
 * Job Queue Service for Asynchronous Note Generation
 * Handles job creation, processing, and status management with priority queues
 */

import { createClient } from '@supabase/supabase-js';

// Job types that can be processed
export type JobType = 'text_notes' | 'file_notes' | 'video_notes' | 'youtube_notes';

// Job status types
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Priority levels (mapped to subscription tiers)
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

// Job interface
export interface Job {
  id: string;
  user_id: string;
  job_type: JobType;
  status: JobStatus;
  priority: JobPriority;
  input_data: any;
  output_data?: any;
  progress: number;
  error_message?: string;
  error_details?: any;
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  worker_id?: string;
  estimated_duration_seconds?: number;
  actual_duration_seconds?: number;
}

// Job input data interfaces for different types
export interface TextNotesJobInput {
  content: string;
  options?: {
    language?: string;
    generateQuiz?: boolean;
    customPrompt?: string;
  };
}

export interface FileNotesJobInput {
  fileUrl: string;
  fileName: string;
  fileType: string;
  options?: {
    language?: string;
    generateQuiz?: boolean;
  };
}

export interface VideoNotesJobInput {
  videoUrl: string;
  options?: {
    language?: string;
    generateQuiz?: boolean;
    extractAudio?: boolean;
  };
}

export interface YouTubeNotesJobInput {
  youtubeUrl: string;
  videoId: string;
  options?: {
    language?: string;
    generateQuiz?: boolean;
    preferredLanguages?: string[];
  };
}

export type JobInput = TextNotesJobInput | FileNotesJobInput | VideoNotesJobInput | YouTubeNotesJobInput;

// Job statistics interface
export interface JobStats {
  total_jobs: number;
  queued_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  avg_duration_seconds: number;
}

class JobQueueService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    // Handle missing service role key gracefully during build time
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
    }
    
    // During build time, use anon key as fallback if service role key is not available
    const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!key) {
      throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    }
    
    this.supabase = createClient(supabaseUrl, key);
    
    // Log warning if using anon key instead of service role key
    if (!serviceRoleKey && process.env.NODE_ENV !== 'production') {
      console.warn('[JobQueue] Using anon key instead of service role key. Some operations may be restricted.');
    }
  }

  /**
   * Enqueue a new job
   */
  async enqueueJob(
    userId: string,
    jobType: JobType,
    inputData: JobInput,
    estimatedDurationSeconds?: number
  ): Promise<{ jobId: string; position?: number }> {
    try {
      console.log(`[JobQueue] Enqueueing ${jobType} job for user ${userId}`);

      const { data, error } = await this.supabase.rpc('enqueue_job', {
        p_user_id: userId,
        p_job_type: jobType,
        p_input_data: inputData,
        p_estimated_duration_seconds: estimatedDurationSeconds
      });

      if (error) {
        console.error('[JobQueue] Error enqueueing job:', error);
        throw new Error(`Failed to enqueue job: ${error.message}`);
      }

      const jobId = data as string;
      
      // Get queue position
      const position = await this.getQueuePosition(jobId);

      console.log(`[JobQueue] Job ${jobId} enqueued at position ${position}`);
      return { jobId, position };
    } catch (error: any) {
      console.error('[JobQueue] Error in enqueueJob:', error);
      throw error;
    }
  }

  /**
   * Get the next job from the queue for processing
   */
  async getNextJob(workerId?: string): Promise<Job | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_next_job', {
        p_worker_id: workerId
      });

      if (error) {
        console.error('[JobQueue] Error getting next job:', error);
        return null;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
      }

      const jobData = data[0] as any;
      console.log(`[JobQueue] Retrieved job ${jobData.job_id} for processing`);
      
      return {
        id: jobData.job_id,
        user_id: jobData.user_id,
        job_type: jobData.job_type,
        priority: jobData.priority,
        input_data: jobData.input_data,
        created_at: jobData.created_at,
        // Set defaults for other fields
        status: 'processing' as JobStatus,
        progress: 0,
        retry_count: 0,
        max_retries: 3,
        updated_at: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[JobQueue] Error in getNextJob:', error);
      return null;
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string,
    progress: number,
    status?: JobStatus
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('update_job_progress', {
        p_job_id: jobId,
        p_progress: progress,
        p_status: status
      });

      if (error) {
        console.error('[JobQueue] Error updating job progress:', error);
        return false;
      }

      console.log(`[JobQueue] Updated job ${jobId} progress to ${progress}%`);
      return Boolean(data);
    } catch (error: any) {
      console.error('[JobQueue] Error in updateJobProgress:', error);
      return false;
    }
  }

  /**
   * Complete a job (success or failure)
   */
  async completeJob(
    jobId: string,
    outputData: any,
    success: boolean = true,
    errorMessage?: string,
    errorDetails?: any
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('complete_job', {
        p_job_id: jobId,
        p_output_data: outputData,
        p_success: success,
        p_error_message: errorMessage,
        p_error_details: errorDetails
      });

      if (error) {
        console.error('[JobQueue] Error completing job:', error);
        return false;
      }

      console.log(`[JobQueue] Job ${jobId} completed with status: ${success ? 'success' : 'failure'}`);
      return Boolean(data);
    } catch (error: any) {
      console.error('[JobQueue] Error in completeJob:', error);
      return false;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('retry_job', {
        p_job_id: jobId
      });

      if (error) {
        console.error('[JobQueue] Error retrying job:', error);
        return false;
      }

      console.log(`[JobQueue] Job ${jobId} retried`);
      return Boolean(data);
    } catch (error: any) {
      console.error('[JobQueue] Error in retryJob:', error);
      return false;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('[JobQueue] Error getting job:', error);
        return null;
      }

      return data as unknown as Job;
    } catch (error: any) {
      console.error('[JobQueue] Error in getJob:', error);
      return null;
    }
  }

  /**
   * Get user's jobs with pagination
   */
  async getUserJobs(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: JobStatus
  ): Promise<{ jobs: Job[]; total: number; hasMore: boolean }> {
    try {
      let query = this.supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('[JobQueue] Error getting user jobs:', error);
        return { jobs: [], total: 0, hasMore: false };
      }

      const total = count || 0;
      const hasMore = page * limit < total;

      return {
        jobs: (data as unknown as Job[]) || [],
        total,
        hasMore
      };
    } catch (error: any) {
      console.error('[JobQueue] Error in getUserJobs:', error);
      return { jobs: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get queue position for a job
   */
  async getQueuePosition(jobId: string): Promise<number> {
    try {
      const { data: job } = await this.supabase
        .from('jobs')
        .select('priority, created_at')
        .eq('id', jobId)
        .single();

      if (!job) return -1;

      // Count jobs ahead in queue
      const { count } = await this.supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'queued')
        .or(`priority.gt.${job.priority},and(priority.eq.${job.priority},created_at.lt.${job.created_at})`);

      return (count || 0) + 1;
    } catch (error: any) {
      console.error('[JobQueue] Error getting queue position:', error);
      return -1;
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(userId?: string): Promise<JobStats | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_job_stats', {
        p_user_id: userId
      });

      if (error) {
        console.error('[JobQueue] Error getting job stats:', error);
        return null;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
      }

      return data[0] as unknown as JobStats;
    } catch (error: any) {
      console.error('[JobQueue] Error in getJobStats:', error);
      return null;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('jobs')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .in('status', ['queued']); // Only allow cancelling queued jobs

      if (error) {
        console.error('[JobQueue] Error cancelling job:', error);
        return false;
      }

      console.log(`[JobQueue] Job ${jobId} cancelled`);
      return true;
    } catch (error: any) {
      console.error('[JobQueue] Error in cancelJob:', error);
      return false;
    }
  }

  /**
   * Subscribe to job updates for real-time notifications
   */
  subscribeToJobUpdates(
    userId: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel('job_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Cleanup old completed jobs (for maintenance)
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('jobs')
        .delete()
        .in('status', ['completed', 'failed', 'cancelled'])
        .lt('completed_at', cutoffDate.toISOString());

      if (error) {
        console.error('[JobQueue] Error cleaning up old jobs:', error);
        return 0;
      }

      const deletedCount = (data as any)?.length || 0;
      console.log(`[JobQueue] Cleaned up ${deletedCount} old jobs`);
      return deletedCount;
    } catch (error: any) {
      console.error('[JobQueue] Error in cleanupOldJobs:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const jobQueueService = new JobQueueService();
export default jobQueueService; 