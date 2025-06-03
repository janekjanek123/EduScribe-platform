-- ============================================================================
-- Complete Database Schema Fix for Queue System Integration
-- ============================================================================
-- This script fixes all note tables to match the new queue-integrated API expectations

-- ========== FIX FILE_NOTES TABLE ==========
-- Add missing columns to file_notes table
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS quiz JSONB;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS slide_count INTEGER;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS slide_titles TEXT[];

-- ========== FIX TEXT_NOTES TABLE ==========
-- Add missing columns to text_notes table
ALTER TABLE public.text_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.text_notes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.text_notes ADD COLUMN IF NOT EXISTS quiz JSONB;

-- ========== FIX VIDEO_NOTES TABLE ==========
-- Add missing columns to video_notes table (in case they're missing)
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS quiz JSONB;

-- ========== CREATE INDEXES ==========
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_notes_title ON public.file_notes(title);
CREATE INDEX IF NOT EXISTS idx_file_notes_slide_count ON public.file_notes(slide_count);
CREATE INDEX IF NOT EXISTS idx_text_notes_title ON public.text_notes(title);
CREATE INDEX IF NOT EXISTS idx_video_notes_title ON public.video_notes(title);

-- ========== UPDATE EXISTING RECORDS ==========
-- Update existing records to have titles (if any exist)
UPDATE public.file_notes 
SET title = COALESCE(file_name, 'File Notes - ' || TO_CHAR(created_at, 'YYYY-MM-DD'))
WHERE title IS NULL;

UPDATE public.text_notes 
SET title = 'Text Notes - ' || TO_CHAR(created_at, 'YYYY-MM-DD')
WHERE title IS NULL;

UPDATE public.video_notes 
SET title = COALESCE(title, 'Video Notes - ' || TO_CHAR(created_at, 'YYYY-MM-DD'))
WHERE title IS NULL;

-- ========== VERIFICATION ==========
-- Display table structures for verification

SELECT 'FILE_NOTES TABLE STRUCTURE:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'file_notes'
ORDER BY ordinal_position;

SELECT 'TEXT_NOTES TABLE STRUCTURE:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'text_notes'
ORDER BY ordinal_position;

SELECT 'VIDEO_NOTES TABLE STRUCTURE:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'video_notes'
ORDER BY ordinal_position;

-- ========== STATUS MESSAGE ==========
SELECT 'All note tables updated successfully for queue system integration!' as status; 