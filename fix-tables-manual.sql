-- Fix Table Structures for EduScribe Isolated Systems
-- Run this script in your Supabase SQL Editor to fix missing columns

-- Add missing columns to video_notes table
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