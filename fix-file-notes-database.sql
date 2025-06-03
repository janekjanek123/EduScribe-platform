-- ============================================================================
-- Fix file_notes table schema to match API expectations
-- ============================================================================
-- This script adds missing columns that the file-notes API expects

-- Step 1: Add missing columns to file_notes table
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS quiz JSONB;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS slide_count INTEGER;
ALTER TABLE public.file_notes ADD COLUMN IF NOT EXISTS slide_titles TEXT[];

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_notes_title ON public.file_notes(title);
CREATE INDEX IF NOT EXISTS idx_file_notes_slide_count ON public.file_notes(slide_count);

-- Step 3: Verify the table structure matches API expectations
-- The API expects these columns:
-- id, user_id, title, file_name, file_url, file_type, content, summary, quiz, slide_count, slide_titles, created_at

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'file_notes'
ORDER BY ordinal_position;

-- Step 4: Update existing records to have titles (if any exist)
UPDATE public.file_notes 
SET title = COALESCE(file_name, 'File Notes - ' || TO_CHAR(created_at, 'YYYY-MM-DD'))
WHERE title IS NULL;

-- Step 5: Status message
SELECT 'file_notes table schema updated successfully - added title, summary, quiz, slide_count, slide_titles columns' as status; 