-- Complete Fix for EduScribe Isolated Systems
-- Run this script in your Supabase SQL Editor to fix all table issues

-- First, let's clean up any problematic sequences or constraints
DROP SEQUENCE IF EXISTS youtube_notes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS video_notes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS file_notes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS text_notes_id_seq CASCADE;

-- Remove any foreign key constraints that might be causing issues
ALTER TABLE IF EXISTS public.video_notes DROP CONSTRAINT IF EXISTS video_notes_user_id_fkey;
ALTER TABLE IF EXISTS public.file_notes DROP CONSTRAINT IF EXISTS file_notes_user_id_fkey;
ALTER TABLE IF EXISTS public.text_notes DROP CONSTRAINT IF EXISTS text_notes_user_id_fkey;

-- Now add missing columns to video_notes table
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS video_id TEXT;
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add missing columns to file_notes table
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add missing columns to text_notes table
ALTER TABLE public.text_notes ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- Re-add the foreign key constraints properly
ALTER TABLE public.video_notes ADD CONSTRAINT video_notes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.file_notes ADD CONSTRAINT file_notes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.text_notes ADD CONSTRAINT text_notes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_notes ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for video_notes
DROP POLICY IF EXISTS "Users can view their own video notes" ON public.video_notes;
DROP POLICY IF EXISTS "Users can create their own video notes" ON public.video_notes;
DROP POLICY IF EXISTS "Users can update their own video notes" ON public.video_notes;
DROP POLICY IF EXISTS "Users can delete their own video notes" ON public.video_notes;

CREATE POLICY "Users can view their own video notes" 
  ON public.video_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video notes" 
  ON public.video_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video notes" 
  ON public.video_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video notes" 
  ON public.video_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create or replace RLS policies for file_notes
DROP POLICY IF EXISTS "Users can view their own file notes" ON public.file_notes;
DROP POLICY IF EXISTS "Users can create their own file notes" ON public.file_notes;
DROP POLICY IF EXISTS "Users can update their own file notes" ON public.file_notes;
DROP POLICY IF EXISTS "Users can delete their own file notes" ON public.file_notes;

CREATE POLICY "Users can view their own file notes" 
  ON public.file_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own file notes" 
  ON public.file_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file notes" 
  ON public.file_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file notes" 
  ON public.file_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create or replace RLS policies for text_notes
DROP POLICY IF EXISTS "Users can view their own text notes" ON public.text_notes;
DROP POLICY IF EXISTS "Users can create their own text notes" ON public.text_notes;
DROP POLICY IF EXISTS "Users can update their own text notes" ON public.text_notes;
DROP POLICY IF EXISTS "Users can delete their own text notes" ON public.text_notes;

CREATE POLICY "Users can view their own text notes" 
  ON public.text_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own text notes" 
  ON public.text_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own text notes" 
  ON public.text_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own text notes" 
  ON public.text_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_notes_user_id ON public.video_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_notes_video_id ON public.video_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_file_notes_user_id ON public.file_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_text_notes_user_id ON public.text_notes(user_id);

-- Verify the table structures
SELECT 'video_notes columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'video_notes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'file_notes columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'file_notes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'text_notes columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'text_notes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show success message
SELECT 'All tables fixed successfully!' as status; 