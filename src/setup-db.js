/**
 * Database setup script for EduScribe
 * 
 * This script sets up the necessary tables and functions in Supabase
 * Run this script once during deployment or first setup
 * 
 * To use:
 * 1. Copy the SQL below and paste it into the Supabase SQL Editor
 * 2. Run the SQL to create the tables and associated functions
 */

const setupSQL = `
-- Create the text_notes table
CREATE TABLE IF NOT EXISTS text_notes (
  id SERIAL PRIMARY KEY,
  "noteId" TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tldr TEXT,
  "fullNotes" TEXT,
  quiz JSONB,
  source TEXT,
  success BOOLEAN DEFAULT TRUE,
  "hasContent" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "userId" UUID NOT NULL
);

-- Create the file_notes table
CREATE TABLE IF NOT EXISTS file_notes (
  id SERIAL PRIMARY KEY,
  "noteId" TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tldr TEXT,
  "fullNotes" TEXT,
  quiz JSONB,
  "fileName" TEXT,
  "fileType" TEXT,
  "fileUrl" TEXT,
  success BOOLEAN DEFAULT TRUE,
  "hasContent" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "userId" UUID NOT NULL
);

-- Create the youtube_notes table
CREATE TABLE IF NOT EXISTS youtube_notes (
  id SERIAL PRIMARY KEY,
  "noteId" TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tldr TEXT,
  "fullNotes" TEXT,
  quiz JSONB,
  "youtubeUrl" TEXT,
  "youtubeId" TEXT,
  "thumbnailUrl" TEXT,
  "youtubeTitle" TEXT,
  success BOOLEAN DEFAULT TRUE,
  "hasContent" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "userId" UUID NOT NULL
);

-- Create indexes for text_notes
CREATE INDEX IF NOT EXISTS text_notes_noteid_idx ON text_notes("noteId");
CREATE INDEX IF NOT EXISTS text_notes_userid_idx ON text_notes("userId");

-- Create indexes for file_notes
CREATE INDEX IF NOT EXISTS file_notes_noteid_idx ON file_notes("noteId");
CREATE INDEX IF NOT EXISTS file_notes_userid_idx ON file_notes("userId");

-- Create indexes for youtube_notes
CREATE INDEX IF NOT EXISTS youtube_notes_noteid_idx ON youtube_notes("noteId");
CREATE INDEX IF NOT EXISTS youtube_notes_userid_idx ON youtube_notes("userId");

-- Grant access to authenticated users for all tables
GRANT ALL PRIVILEGES ON TABLE text_notes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE text_notes_id_seq TO authenticated;

GRANT ALL PRIVILEGES ON TABLE file_notes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE file_notes_id_seq TO authenticated;

GRANT ALL PRIVILEGES ON TABLE youtube_notes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE youtube_notes_id_seq TO authenticated;

-- Set up Row Level Security for text_notes
ALTER TABLE text_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for text_notes
DROP POLICY IF EXISTS "Users can view their own text notes" ON text_notes;
CREATE POLICY "Users can view their own text notes" 
  ON text_notes 
  FOR SELECT 
  USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own text notes" ON text_notes;
CREATE POLICY "Users can insert their own text notes" 
  ON text_notes 
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can update their own text notes" ON text_notes;
CREATE POLICY "Users can update their own text notes" 
  ON text_notes 
  FOR UPDATE 
  USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own text notes" ON text_notes;
CREATE POLICY "Users can delete their own text notes" 
  ON text_notes 
  FOR DELETE 
  USING ("userId" = auth.uid());

-- Set up Row Level Security for file_notes
ALTER TABLE file_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for file_notes
DROP POLICY IF EXISTS "Users can view their own file notes" ON file_notes;
CREATE POLICY "Users can view their own file notes" 
  ON file_notes 
  FOR SELECT 
  USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own file notes" ON file_notes;
CREATE POLICY "Users can insert their own file notes" 
  ON file_notes 
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can update their own file notes" ON file_notes;
CREATE POLICY "Users can update their own file notes" 
  ON file_notes 
  FOR UPDATE 
  USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own file notes" ON file_notes;
CREATE POLICY "Users can delete their own file notes" 
  ON file_notes 
  FOR DELETE 
  USING ("userId" = auth.uid());

-- Set up Row Level Security for youtube_notes
ALTER TABLE youtube_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for youtube_notes
DROP POLICY IF EXISTS "Users can view their own youtube notes" ON youtube_notes;
CREATE POLICY "Users can view their own youtube notes" 
  ON youtube_notes 
  FOR SELECT 
  USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own youtube notes" ON youtube_notes;
CREATE POLICY "Users can insert their own youtube notes" 
  ON youtube_notes 
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can update their own youtube notes" ON youtube_notes;
CREATE POLICY "Users can update their own youtube notes" 
  ON youtube_notes 
  FOR UPDATE 
  USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own youtube notes" ON youtube_notes;
CREATE POLICY "Users can delete their own youtube notes" 
  ON youtube_notes 
  FOR DELETE 
  USING ("userId" = auth.uid());

-- Function to create text_notes table
CREATE OR REPLACE FUNCTION create_text_notes_table()
RETURNS void AS $$
BEGIN
  -- Create the text_notes table if it doesn't exist
  CREATE TABLE IF NOT EXISTS text_notes (
    id SERIAL PRIMARY KEY,
    "noteId" TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tldr TEXT,
    "fullNotes" TEXT,
    quiz JSONB,
    source TEXT,
    success BOOLEAN DEFAULT TRUE,
    "hasContent" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "userId" UUID NOT NULL
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS text_notes_noteid_idx ON text_notes("noteId");
  CREATE INDEX IF NOT EXISTS text_notes_userid_idx ON text_notes("userId");
  
  -- Grant access to authenticated users
  GRANT ALL PRIVILEGES ON TABLE text_notes TO authenticated;
  GRANT USAGE, SELECT ON SEQUENCE text_notes_id_seq TO authenticated;
  
  -- Set up Row Level Security
  ALTER TABLE text_notes ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own text notes" ON text_notes;
  CREATE POLICY "Users can view their own text notes" 
    ON text_notes 
    FOR SELECT 
    USING ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can insert their own text notes" ON text_notes;
  CREATE POLICY "Users can insert their own text notes" 
    ON text_notes 
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can update their own text notes" ON text_notes;
  CREATE POLICY "Users can update their own text notes" 
    ON text_notes 
    FOR UPDATE 
    USING ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can delete their own text notes" ON text_notes;
  CREATE POLICY "Users can delete their own text notes" 
    ON text_notes 
    FOR DELETE 
    USING ("userId" = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create file_notes table
CREATE OR REPLACE FUNCTION create_file_notes_table()
RETURNS void AS $$
BEGIN
  -- Create the file_notes table if it doesn't exist
  CREATE TABLE IF NOT EXISTS file_notes (
    id SERIAL PRIMARY KEY,
    "noteId" TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tldr TEXT,
    "fullNotes" TEXT,
    quiz JSONB,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileUrl" TEXT,
    success BOOLEAN DEFAULT TRUE,
    "hasContent" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "userId" UUID NOT NULL
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS file_notes_noteid_idx ON file_notes("noteId");
  CREATE INDEX IF NOT EXISTS file_notes_userid_idx ON file_notes("userId");
  
  -- Grant access to authenticated users
  GRANT ALL PRIVILEGES ON TABLE file_notes TO authenticated;
  GRANT USAGE, SELECT ON SEQUENCE file_notes_id_seq TO authenticated;
  
  -- Set up Row Level Security
  ALTER TABLE file_notes ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own file notes" ON file_notes;
  CREATE POLICY "Users can view their own file notes" 
    ON file_notes 
    FOR SELECT 
    USING ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can insert their own file notes" ON file_notes;
  CREATE POLICY "Users can insert their own file notes" 
    ON file_notes 
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can update their own file notes" ON file_notes;
  CREATE POLICY "Users can update their own file notes" 
    ON file_notes 
    FOR UPDATE 
    USING ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can delete their own file notes" ON file_notes;
  CREATE POLICY "Users can delete their own file notes" 
    ON file_notes 
    FOR DELETE 
    USING ("userId" = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create youtube_notes table
CREATE OR REPLACE FUNCTION create_youtube_notes_table()
RETURNS void AS $$
BEGIN
  -- Create the youtube_notes table if it doesn't exist
  CREATE TABLE IF NOT EXISTS youtube_notes (
    id SERIAL PRIMARY KEY,
    "noteId" TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tldr TEXT,
    "fullNotes" TEXT,
    quiz JSONB,
    "youtubeUrl" TEXT,
    "youtubeId" TEXT,
    "thumbnailUrl" TEXT,
    "youtubeTitle" TEXT,
    success BOOLEAN DEFAULT TRUE,
    "hasContent" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "userId" UUID NOT NULL
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS youtube_notes_noteid_idx ON youtube_notes("noteId");
  CREATE INDEX IF NOT EXISTS youtube_notes_userid_idx ON youtube_notes("userId");
  
  -- Grant access to authenticated users
  GRANT ALL PRIVILEGES ON TABLE youtube_notes TO authenticated;
  GRANT USAGE, SELECT ON SEQUENCE youtube_notes_id_seq TO authenticated;
  
  -- Set up Row Level Security
  ALTER TABLE youtube_notes ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own youtube notes" ON youtube_notes;
  CREATE POLICY "Users can view their own youtube notes" 
    ON youtube_notes 
    FOR SELECT 
    USING ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can insert their own youtube notes" ON youtube_notes;
  CREATE POLICY "Users can insert their own youtube notes" 
    ON youtube_notes 
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can update their own youtube notes" ON youtube_notes;
  CREATE POLICY "Users can update their own youtube notes" 
    ON youtube_notes 
    FOR UPDATE 
    USING ("userId" = auth.uid());
  
  DROP POLICY IF EXISTS "Users can delete their own youtube notes" ON youtube_notes;
  CREATE POLICY "Users can delete their own youtube notes" 
    ON youtube_notes 
    FOR DELETE 
    USING ("userId" = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_text_notes_table() TO authenticated;
GRANT EXECUTE ON FUNCTION create_file_notes_table() TO authenticated;
GRANT EXECUTE ON FUNCTION create_youtube_notes_table() TO authenticated;
`;

console.log("Setup SQL for EduScribe Database:");
console.log(setupSQL);
console.log("\nCopy the SQL above and run it in your Supabase SQL Editor");
console.log("This will create the necessary tables and functions for EduScribe"); 