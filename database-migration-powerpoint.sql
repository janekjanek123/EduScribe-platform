-- PowerPoint Support Migration for EduScribe
-- Run this script in the Supabase SQL Editor to add PowerPoint support to the file_notes table

-- Add missing columns to the file_notes table
ALTER TABLE public.file_notes 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS quiz JSONB,
ADD COLUMN IF NOT EXISTS slide_count INTEGER,
ADD COLUMN IF NOT EXISTS slide_titles TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_notes_slide_count ON public.file_notes(slide_count);
CREATE INDEX IF NOT EXISTS idx_file_notes_title ON public.file_notes(title);

-- Update the create_file_notes_table function to include the new columns
CREATE OR REPLACE FUNCTION create_file_notes_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'file_notes') THEN
    CREATE TABLE public.file_notes (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      file_name TEXT,
      file_url TEXT,
      file_type TEXT,
      title TEXT,
      content TEXT,
      quiz JSONB,
      slide_count INTEGER,
      slide_titles TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    ALTER TABLE public.file_notes ENABLE ROW LEVEL SECURITY;
    
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
      
    CREATE INDEX idx_file_notes_user_id ON public.file_notes(user_id);
    CREATE INDEX idx_file_notes_slide_count ON public.file_notes(slide_count);
    CREATE INDEX idx_file_notes_title ON public.file_notes(title);
  ELSE
    -- If table exists, add missing columns
    ALTER TABLE public.file_notes 
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS quiz JSONB,
    ADD COLUMN IF NOT EXISTS slide_count INTEGER,
    ADD COLUMN IF NOT EXISTS slide_titles TEXT[];
    
    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_file_notes_slide_count ON public.file_notes(slide_count);
    CREATE INDEX IF NOT EXISTS idx_file_notes_title ON public.file_notes(title);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to ensure the table has all required columns
SELECT create_file_notes_table();

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'file_notes' 
ORDER BY ordinal_position; 