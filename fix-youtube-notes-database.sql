-- ============================================================================
-- Fix video_notes table schema for YouTube notes API compatibility
-- ============================================================================
-- This script adds missing columns that the API expects but are not in the schema

-- Step 1: Add missing columns to video_notes table
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS quiz JSONB;

-- Step 2: Verify the table structure matches API expectations
-- The API expects these columns:
-- id, user_id, video_url, video_id, title, thumbnail_url, content, summary, quiz, created_at

-- Step 3: Display current table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'video_notes'
ORDER BY ordinal_position;

-- Step 4: Verify that all required policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'video_notes';

-- Step 5: Status message
SELECT 'video_notes table schema updated successfully' as status; 