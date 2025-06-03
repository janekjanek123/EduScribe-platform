-- EduScribe Isolated Tables Setup
-- Copy and paste this entire script into the Supabase SQL Editor and run it

-- Create video_notes table
CREATE TABLE IF NOT EXISTS public.video_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  video_id TEXT,
  title TEXT,
  thumbnail_url TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create file_notes table
CREATE TABLE IF NOT EXISTS public.file_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT,
  file_url TEXT,
  file_type TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create text_notes table
CREATE TABLE IF NOT EXISTS public.text_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  raw_text TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_notes ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_notes_user_id ON public.video_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_notes_video_id ON public.video_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_file_notes_user_id ON public.file_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_text_notes_user_id ON public.text_notes(user_id);

-- Create storage bucket for file notes (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('file_notes', 'File Notes Storage', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the file_notes storage bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'file_notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'file_notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'file_notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  ); 