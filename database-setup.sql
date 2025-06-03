-- EduScribe System Isolation: Database Setup
-- Run this script in the Supabase SQL Editor to create the isolated tables and configure RLS

-- ========== VIDEO NOTES TABLE ==========
-- Create the video_notes table for the isolated video notes system
CREATE TABLE IF NOT EXISTS public.video_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  video_url TEXT NOT NULL,
  video_id TEXT,
  title TEXT,
  thumbnail_url TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Set up RLS for the video_notes table
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for video_notes
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_video_notes_user_id ON public.video_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_notes_video_id ON public.video_notes(video_id);

-- ========== FILE NOTES TABLE ==========
-- Create the file_notes table for the isolated file notes system
CREATE TABLE IF NOT EXISTS public.file_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT,
  file_url TEXT,
  file_type TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Set up RLS for the file_notes table
ALTER TABLE public.file_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_notes
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_file_notes_user_id ON public.file_notes(user_id);

-- ========== TEXT NOTES TABLE ==========
-- Create the text_notes table for the isolated text notes system
CREATE TABLE IF NOT EXISTS public.text_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  raw_text TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Set up RLS for the text_notes table
ALTER TABLE public.text_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for text_notes
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_text_notes_user_id ON public.text_notes(user_id);

-- ========== STORAGE SETUP ==========
-- Create storage bucket for file notes if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('file_notes', 'File Notes Storage', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the file_notes storage bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'file_notes'
    AND auth.uid() = owner
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'file_notes'
    AND auth.uid() = owner
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'file_notes'
    AND auth.uid() = owner
  );

-- ========== STORED PROCEDURES ==========
-- Function to create video_notes table if it doesn't exist
CREATE OR REPLACE FUNCTION create_video_notes_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'video_notes') THEN
    CREATE TABLE public.video_notes (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      video_url TEXT NOT NULL,
      video_id TEXT,
      title TEXT,
      thumbnail_url TEXT,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own video notes" 
      ON public.video_notes 
      FOR SELECT 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can create their own video notes" 
      ON public.video_notes 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
    CREATE INDEX idx_video_notes_user_id ON public.video_notes(user_id);
    CREATE INDEX idx_video_notes_video_id ON public.video_notes(video_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create file_notes table if it doesn't exist
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
      content TEXT,
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
      
    CREATE INDEX idx_file_notes_user_id ON public.file_notes(user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create text_notes table if it doesn't exist
CREATE OR REPLACE FUNCTION create_text_notes_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'text_notes') THEN
    CREATE TABLE public.text_notes (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      raw_text TEXT,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    ALTER TABLE public.text_notes ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own text notes" 
      ON public.text_notes 
      FOR SELECT 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can create their own text notes" 
      ON public.text_notes 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
    CREATE INDEX idx_text_notes_user_id ON public.text_notes(user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Call the functions to create tables if they don't exist
SELECT create_video_notes_table();
SELECT create_file_notes_table();
SELECT create_text_notes_table();

-- ========== NOTATNIK TABLE ==========
-- Create the notatnik table for personal editable notes
CREATE TABLE IF NOT EXISTS public.notatnik (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_locked_header BOOLEAN DEFAULT false,
  locked_header_text TEXT,
  source_note_id TEXT, -- Reference to the original generated note ID
  source_note_type TEXT, -- Type of the source note (video, file, text, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Set up RLS for the notatnik table
ALTER TABLE public.notatnik ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notatnik
CREATE POLICY "Users can view their own notatnik notes" 
  ON public.notatnik 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notatnik notes" 
  ON public.notatnik 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notatnik notes" 
  ON public.notatnik 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notatnik notes" 
  ON public.notatnik 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_notatnik_user_id ON public.notatnik(user_id);
CREATE INDEX IF NOT EXISTS idx_notatnik_source ON public.notatnik(source_note_id, source_note_type); 