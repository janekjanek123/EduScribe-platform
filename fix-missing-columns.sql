-- Fix missing columns in text_notes table for EduScribe
-- Run this script in your Supabase SQL Editor to add the missing columns

-- Add missing columns to text_notes table
ALTER TABLE public.text_notes 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS quiz JSONB;

-- Verify the table structure after adding columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'text_notes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show success message
SELECT 'Missing columns added to text_notes table successfully!' as status; 