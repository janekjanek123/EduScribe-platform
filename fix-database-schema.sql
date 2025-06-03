-- Fix database schema by adding missing title columns and quiz support
-- Run this in your Supabase SQL Editor

-- Add title column to text_notes table
ALTER TABLE public.text_notes 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add title column to file_notes table  
ALTER TABLE public.file_notes 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add quiz columns to all note tables
ALTER TABLE public.text_notes 
ADD COLUMN IF NOT EXISTS quiz JSONB;

ALTER TABLE public.video_notes 
ADD COLUMN IF NOT EXISTS quiz JSONB;

ALTER TABLE public.file_notes 
ADD COLUMN IF NOT EXISTS quiz JSONB;

-- Update existing records to have titles (if any exist)
UPDATE public.text_notes 
SET title = 'Text Notes - ' || TO_CHAR(created_at, 'YYYY-MM-DD')
WHERE title IS NULL;

UPDATE public.file_notes 
SET title = COALESCE(file_name, 'File Notes - ' || TO_CHAR(created_at, 'YYYY-MM-DD'))
WHERE title IS NULL;

-- Create a table to store quiz attempts and scores
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('text', 'video', 'file')),
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz_attempts table
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for quiz_attempts (users can only see their own attempts)
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_note_id ON public.quiz_attempts(note_id);

-- Verify the changes
SELECT 'text_notes' as table_name, COUNT(*) as record_count FROM public.text_notes
UNION ALL
SELECT 'video_notes' as table_name, COUNT(*) as record_count FROM public.video_notes  
UNION ALL
SELECT 'file_notes' as table_name, COUNT(*) as record_count FROM public.file_notes
UNION ALL
SELECT 'quiz_attempts' as table_name, COUNT(*) as record_count FROM public.quiz_attempts; 