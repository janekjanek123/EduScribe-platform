-- First, let's create a backup of the current table
CREATE TABLE IF NOT EXISTS youtube_notes_backup AS 
SELECT * FROM youtube_notes;

-- Drop the existing table 
DROP TABLE youtube_notes;

-- Create the table with the correct schema
CREATE TABLE IF NOT EXISTS youtube_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes for youtube_notes
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

-- Restore data from backup (optional)
-- INSERT INTO youtube_notes (
--   "noteId", title, tldr, "fullNotes", quiz, "youtubeUrl", "youtubeId", 
--   "thumbnailUrl", "youtubeTitle", success, "hasContent", "createdAt", 
--   "updatedAt", "userId"
-- )
-- SELECT 
--   noteid, title, tldr, fullnotes, quiz, youtubeurl, youtubeid,
--   thumbnailurl, youtubetitle, success, hascontent, 
--   COALESCE(createdat, "createdAt", NOW()), 
--   NOW(), 
--   user_id
-- FROM youtube_notes_backup;

-- Refresh the schema cache
SELECT pg_catalog.pg_reload_conf(); 