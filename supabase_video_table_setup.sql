-- Create the video_upload_notes table for storing video transcription results
CREATE TABLE IF NOT EXISTS public.video_upload_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  duration REAL,
  transcript TEXT,
  content TEXT,
  summary TEXT,
  quiz JSONB,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.video_upload_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own video upload notes" 
  ON public.video_upload_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video upload notes" 
  ON public.video_upload_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video upload notes" 
  ON public.video_upload_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video upload notes" 
  ON public.video_upload_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_upload_notes_user_id 
  ON public.video_upload_notes(user_id);

CREATE INDEX IF NOT EXISTS idx_video_upload_notes_created_at 
  ON public.video_upload_notes(created_at DESC);

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_upload_notes_updated_at 
  BEFORE UPDATE ON public.video_upload_notes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 