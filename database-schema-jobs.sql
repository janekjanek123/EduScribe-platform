-- Job Queue System for Asynchronous Note Generation
-- Run this script in the Supabase SQL Editor

-- Create enum for job types
CREATE TYPE job_type AS ENUM ('text_notes', 'file_notes', 'video_notes', 'youtube_notes');

-- Create enum for job status
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- Create enum for priority levels (based on subscription tiers)
CREATE TYPE job_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Create the jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  priority job_priority NOT NULL DEFAULT 'normal',
  
  -- Input data for the job
  input_data JSONB NOT NULL,
  
  -- Output data when job completes
  output_data JSONB,
  
  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Error information
  error_message TEXT,
  error_details JSONB,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Processing metadata
  worker_id TEXT,
  estimated_duration_seconds INTEGER,
  actual_duration_seconds INTEGER
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON public.jobs(priority);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_queue_order ON public.jobs(status, priority DESC, created_at ASC) WHERE status = 'queued';

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user priority based on subscription
CREATE OR REPLACE FUNCTION get_user_priority(user_uuid UUID)
RETURNS job_priority AS $$
DECLARE
  user_plan TEXT;
BEGIN
  -- Get user's subscription plan
  SELECT plan INTO user_plan 
  FROM public.user_subscriptions 
  WHERE user_id = user_uuid 
  AND status = 'active' 
  AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Return priority based on plan
  CASE user_plan
    WHEN 'enterprise' THEN RETURN 'urgent'::job_priority;
    WHEN 'premium' THEN RETURN 'high'::job_priority;
    WHEN 'basic' THEN RETURN 'normal'::job_priority;
    ELSE RETURN 'low'::job_priority; -- free tier
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enqueue a job
CREATE OR REPLACE FUNCTION enqueue_job(
  p_user_id UUID,
  p_job_type job_type,
  p_input_data JSONB,
  p_estimated_duration_seconds INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
  user_priority job_priority;
BEGIN
  -- Get user's priority level
  SELECT get_user_priority(p_user_id) INTO user_priority;
  
  -- Insert the job
  INSERT INTO public.jobs (
    user_id,
    job_type,
    priority,
    input_data,
    estimated_duration_seconds
  ) VALUES (
    p_user_id,
    p_job_type,
    user_priority,
    p_input_data,
    p_estimated_duration_seconds
  ) RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next job from queue
CREATE OR REPLACE FUNCTION get_next_job(p_worker_id TEXT DEFAULT NULL)
RETURNS TABLE(
  job_id UUID,
  user_id UUID,
  job_type job_type,
  priority job_priority,
  input_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  selected_job_id UUID;
BEGIN
  -- Select and lock the highest priority job
  SELECT id INTO selected_job_id
  FROM public.jobs
  WHERE status = 'queued'
  ORDER BY 
    CASE priority
      WHEN 'urgent' THEN 4
      WHEN 'high' THEN 3
      WHEN 'normal' THEN 2
      WHEN 'low' THEN 1
    END DESC,
    created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- If no job found, return empty
  IF selected_job_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Update job status to processing
  UPDATE public.jobs 
  SET 
    status = 'processing',
    started_at = NOW(),
    worker_id = p_worker_id
  WHERE id = selected_job_id;
  
  -- Return job details
  RETURN QUERY
  SELECT 
    j.id,
    j.user_id,
    j.job_type,
    j.priority,
    j.input_data,
    j.created_at
  FROM public.jobs j
  WHERE j.id = selected_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update job progress
CREATE OR REPLACE FUNCTION update_job_progress(
  p_job_id UUID,
  p_progress INTEGER,
  p_status job_status DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.jobs
  SET 
    progress = p_progress,
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete job
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_output_data JSONB,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  job_started_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get job start time
  SELECT started_at INTO job_started_at
  FROM public.jobs
  WHERE id = p_job_id;
  
  -- Update job completion
  UPDATE public.jobs
  SET 
    status = CASE WHEN p_success THEN 'completed'::job_status ELSE 'failed'::job_status END,
    progress = CASE WHEN p_success THEN 100 ELSE progress END,
    output_data = p_output_data,
    error_message = p_error_message,
    error_details = p_error_details,
    completed_at = NOW(),
    actual_duration_seconds = CASE 
      WHEN job_started_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (NOW() - job_started_at))::INTEGER
      ELSE NULL 
    END,
    updated_at = NOW()
  WHERE id = p_job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry failed job
CREATE OR REPLACE FUNCTION retry_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_retry_count INTEGER;
  max_retry_count INTEGER;
BEGIN
  -- Get current retry info
  SELECT retry_count, max_retries 
  INTO current_retry_count, max_retry_count
  FROM public.jobs
  WHERE id = p_job_id;
  
  -- Check if we can retry
  IF current_retry_count >= max_retry_count THEN
    RETURN FALSE;
  END IF;
  
  -- Reset job for retry
  UPDATE public.jobs
  SET 
    status = 'queued',
    progress = 0,
    retry_count = retry_count + 1,
    started_at = NULL,
    completed_at = NULL,
    worker_id = NULL,
    error_message = NULL,
    error_details = NULL,
    updated_at = NOW()
  WHERE id = p_job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job statistics
CREATE OR REPLACE FUNCTION get_job_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_jobs BIGINT,
  queued_jobs BIGINT,
  processing_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  avg_duration_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'queued') as queued_jobs,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
    AVG(actual_duration_seconds) as avg_duration_seconds
  FROM public.jobs
  WHERE p_user_id IS NULL OR user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.jobs TO authenticated;
GRANT EXECUTE ON FUNCTION enqueue_job TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_job TO authenticated;
GRANT EXECUTE ON FUNCTION update_job_progress TO authenticated;
GRANT EXECUTE ON FUNCTION complete_job TO authenticated;
GRANT EXECUTE ON FUNCTION retry_job TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_priority TO authenticated; 