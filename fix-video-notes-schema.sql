-- Fix video_notes table schema to match API expectations
-- Add missing columns: summary, quiz

-- Add the missing columns to the video_notes table
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS quiz JSONB;

-- Check the current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'video_notes'
ORDER BY ordinal_position;

-- Display table info
SELECT 'video_notes table fixed - added summary and quiz columns' as status; 