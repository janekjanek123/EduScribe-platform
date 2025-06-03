# Independent Video Upload & Note Generation System

## Overview

This document describes the completely separate video upload and note generation system implemented for EduScribe. This system operates independently from existing YouTube and text note generation features.

## 🎯 Key Requirements Met

✅ **Complete Independence**: No interference with existing note generation logic  
✅ **Server-Side Processing**: All transcription happens on the server using Whisper API  
✅ **Separate Database Storage**: Uses dedicated `video_upload_notes` table  
✅ **Production Ready**: Compatible with VPS and external server deployment  
✅ **Modern UI**: Beautiful, responsive interface with progress tracking  

## 🏗️ Architecture

### Frontend Components
- **Route**: `/upload-video`
- **Page**: `src/app/upload-video/page.tsx`
- **Features**: 
  - Drag & drop video upload
  - Real-time progress tracking (Upload → Transcribe → Generate)
  - Tab-based results view (Full Notes / Summary)
  - Complete form reset and error handling

### Backend Services

#### 1. Video Transcription Service (`src/services/videoTranscription.ts`)
- **Audio Extraction**: Uses FFmpeg to extract audio from video files
- **Format Optimization**: Converts to 16kHz mono WAV for best Whisper compatibility
- **AI Transcription**: OpenAI Whisper API for high-accuracy speech-to-text
- **Progress Tracking**: Real-time progress callbacks for UI updates

#### 2. API Endpoint (`src/app/api/upload-video/route.ts`)
- **File Upload**: Handles multipart form data up to 100MB
- **Validation**: Supports MP4, MOV, WEBM, AVI, MKV formats
- **Authentication**: Full JWT token verification
- **Usage Limits**: Integration with subscription system
- **Error Handling**: Comprehensive error responses with cleanup

### Database Schema

#### `video_upload_notes` Table
```sql
CREATE TABLE public.video_upload_notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  duration REAL,
  transcript TEXT,
  content TEXT,
  summary TEXT,
  quiz JSONB,
  language TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Security Policies
- Row Level Security (RLS) enabled
- Users can only view/create their own notes
- Proper indexing on `user_id`

## 🔧 Technical Implementation

### Dependencies Added
```json
{
  "@ffmpeg-installer/ffmpeg": "^1.1.0",
  "fluent-ffmpeg": "^2.1.3", 
  "node-whisper": "^1.0.0",
  "fs-extra": "^11.2.0",
  "@types/fluent-ffmpeg": "^2.1.25",
  "@types/fs-extra": "^11.0.4"
}
```

### Supported Video Formats
- **MP4** - Most common format
- **MOV** - Apple QuickTime format  
- **WEBM** - Web-optimized format
- **AVI** - Audio Video Interleave
- **MKV** - Matroska video format

### File Size Limits
- **Upload**: 100MB maximum file size
- **Audio Processing**: 25MB limit for Whisper API (automatically handled)
- **Duration**: No explicit limit, but longer videos take more processing time

## 🚀 User Workflow

1. **Upload**: User drags/drops or selects video file
2. **Validation**: File type and size validation on client and server
3. **Processing Steps**:
   - File uploaded to server temp directory
   - FFmpeg extracts audio (WAV format, optimized for Whisper)
   - OpenAI Whisper API transcribes audio to text
   - AI service generates comprehensive notes and summary
   - Results stored in dedicated database table
   - Temporary files cleaned up

4. **Results**: User can view full notes or summary, then upload another video or navigate to dashboard

## 🔒 Security Features

- **Authentication**: JWT token validation on all endpoints
- **File Validation**: Server-side file type and content verification
- **Temp File Management**: Automatic cleanup of temporary processing files
- **Usage Limits**: Integration with subscription system
- **Database Security**: RLS policies prevent unauthorized access

## 📊 Progress Tracking

The system provides real-time feedback through three distinct phases:

1. **Uploading** (0-100%): File upload progress via XMLHttpRequest
2. **Transcribing** (0-100%): Audio extraction and Whisper processing
3. **Generating** (0-100%): AI note generation from transcript

## 🎨 UI/UX Features

- **Modern Design**: Purple-themed design consistent with app branding
- **Responsive Layout**: Works on desktop and mobile devices
- **Progress Visualization**: Clear visual indicators for each processing step
- **Error Handling**: User-friendly error messages with specific guidance
- **Results Display**: Toggle between full notes and summary views
- **Navigation**: Easy access to upload another video or view all notes

## 🔧 Configuration

### Environment Variables Required
```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server Requirements
- **Node.js**: 18+ with support for modern ES modules
- **FFmpeg**: Required for audio extraction (handled by @ffmpeg-installer/ffmpeg)
- **Memory**: Sufficient RAM for processing video files (recommended 2GB+)
- **Storage**: Temporary space for video processing (cleaned up automatically)

## 🚀 Deployment Notes

### Production Considerations
- **Temp Directory**: System automatically creates and manages temp directories
- **File Cleanup**: Robust cleanup processes prevent storage bloat
- **Error Recovery**: Graceful failure handling with user feedback
- **Scaling**: Each request is independent, suitable for horizontal scaling

### Monitoring
- Comprehensive logging for all processing steps
- Error tracking with detailed stack traces
- Usage metrics integration for subscription management

## 🔄 Integration Points

### With Existing Systems
- **Authentication**: Uses existing Supabase auth system
- **Subscription**: Integrates with usage limits and plan restrictions  
- **AI Service**: Reuses existing `generateNotes` function from `src/services/ai.ts`
- **Dashboard**: Notes appear in user's dashboard alongside other note types

### Complete Isolation
- **Database**: Separate table prevents conflicts with existing notes
- **API Routes**: Independent endpoints with own error handling
- **Frontend**: Separate page component with no shared state
- **Processing**: Self-contained transcription and cleanup logic

## 📋 Testing Checklist

- [ ] File upload with various video formats
- [ ] Large file handling (approaching 100MB limit)
- [ ] Progress tracking accuracy
- [ ] Error handling for invalid files
- [ ] Authentication flow
- [ ] Database storage and retrieval
- [ ] Temporary file cleanup
- [ ] Mobile responsiveness
- [ ] Integration with subscription limits

## 🔮 Future Enhancements

- **WebSocket Progress**: Real-time progress updates via WebSocket
- **Batch Processing**: Multiple file upload support
- **Video Preview**: Thumbnail generation and basic video info
- **Advanced Audio**: Support for audio-only files (MP3, WAV)
- **Language Detection**: Enhanced language-specific processing
- **Custom Whisper**: Option for local Whisper deployment for larger files

## 📞 Support

For issues with the video upload system:
1. Check server logs for processing errors
2. Verify FFmpeg availability in production
3. Confirm OpenAI API key and quota
4. Check temp directory permissions
5. Monitor database connection and table existence

This system is designed to be completely independent and should not affect any existing functionality in the EduScribe application. 