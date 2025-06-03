# System Isolation Architecture

## Overview

The application now uses a fully isolated architecture for three separate note generation systems:

1. **Video Notes System** - Extracts YouTube video content and generates notes
2. **File Notes System** - Processes uploaded files and generates notes
3. **Text Notes System** - Processes raw user-submitted text into notes

Each system has its own dedicated database table, API endpoints, and frontend logic. This isolation ensures that:

- Changes to one system don't affect others
- Database schema changes are contained
- Failures in one system don't cascade to others
- Each system can be maintained independently

## Database Structure

### Video Notes Table

```sql
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
```

### File Notes Table

```sql
CREATE TABLE public.file_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT,
  file_url TEXT,
  file_type TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Text Notes Table

```sql
CREATE TABLE public.text_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  raw_text TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Video Notes API

- **Endpoint**: `/api/video-notes`
- **Methods**: POST (create), GET (list)
- **Parameters**:
  - `url` (POST): YouTube video URL
- **Functionality**: Extracts YouTube video ID, fetches transcript, generates notes, stores in video_notes table

### File Notes API

- **Endpoint**: `/api/file-notes`
- **Methods**: POST (create), GET (list)
- **Parameters**:
  - `file` (POST): File upload (PDF, TXT, DOCX, etc.)
- **Functionality**: Uploads file to storage, extracts text, generates notes, stores in file_notes table

### Text Notes API

- **Endpoint**: `/api/text-notes`
- **Methods**: POST (create), GET (list)
- **Parameters**:
  - `text` (POST): Raw text input
- **Functionality**: Validates text input, generates notes, stores in text_notes table

## Frontend Pages

### Video Notes Page

- **Route**: `/generate/youtube`
- **Functionality**: YouTube URL input, processing, display of generated notes

### File Notes Page

- **Route**: `/generate/upload`
- **Functionality**: File upload interface, processing, display of generated notes

### Text Notes Page

- **Route**: `/generate/text`
- **Functionality**: Text input area, processing, display of generated notes

## Error Handling

Each system implements its own error handling and validation:

1. **Input Validation** - Each API validates its specific input format
2. **Processing Errors** - System-specific error handling for transcript extraction, text parsing, etc.
3. **Database Errors** - Each system handles database connection and storage errors
4. **Graceful Fallbacks** - User-friendly error messages specific to each system

## Authentication & Authorization

- All systems use the same authentication mechanism (JWT tokens via Bearer)
- Database row-level security (RLS) policies ensure users can only access their own notes
- Each system validates authentication independently

## Benefits of Isolation

1. **Reliability** - A failure in one system (e.g., YouTube API changes) won't affect other systems
2. **Maintainability** - Each system can be updated or modified independently
3. **Scalability** - Systems can be scaled or optimized based on their specific usage patterns
4. **Security** - Isolation provides better security boundaries between features

## Transition Process

1. Create isolated database tables for each system
2. Set up separate API routes for each system
3. Update frontend components to use system-specific APIs
4. Remove deprecated/duplicate code
5. Test each system independently

## Future Considerations

- Each system could potentially be moved to separate microservices
- System-specific caching strategies could be implemented
- Performance monitoring could be added per system
- Additional features can be added to each system without affecting others 