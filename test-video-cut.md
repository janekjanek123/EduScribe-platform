# VideoCut Feature Testing Guide

## Overview
The VideoCut feature allows users to split large video files into smaller chunks (≤100MB each) for easier uploading and sharing.

## How to Test

### 1. Access the Video Splitter
- Visit: http://localhost:3000/video-cut
- Or navigate from: Homepage → "Additional Tools" → "Video Splitter" 
- Or from: Dashboard → "✂️ Video Splitter" button

### 2. Feature Components
The tool includes:
- **File Upload Interface**: Drag & drop or click to select video files
- **File Validation**: Supports MP4, MOV, WEBM, AVI, MKV formats
- **Progress Tracking**: Real-time progress updates during splitting
- **Download Links**: Individual download buttons for each chunk
- **FAQ Section**: Helpful information about the tool

### 3. API Endpoints
- `POST /api/video-cut`: Main splitting endpoint (accepts multipart/form-data)
- `GET /api/video-cut/download?session={id}&file={filename}`: Download individual chunks

### 4. Expected Behavior
1. **File Selection**: Users can select video files up to any size
2. **Validation**: Only video formats are accepted
3. **Processing**: Video is split into ~90MB chunks using FFmpeg
4. **Progress Updates**: Real-time streaming progress via JSON responses
5. **Downloads**: Each chunk gets a download button
6. **Cleanup**: Files are automatically deleted after 1 hour

### 5. Key Features
- ✅ No transcription or note generation (standalone utility)
- ✅ Maintains original video quality (stream copy, no re-encoding)
- ✅ Public access (no authentication required)
- ✅ Automatic cleanup (prevents disk space issues)
- ✅ Responsive UI with helpful FAQ section

### 6. Integration Points
- Added to main homepage in "Additional Tools" section
- Added to dashboard as "✂️ Video Splitter" button
- Added to middleware public paths for access without auth

## Test Cases
1. **Small Video (<100MB)**: Should create 1 chunk
2. **Large Video (>100MB)**: Should create multiple chunks
3. **Invalid File Type**: Should show error message
4. **No File Selected**: Should show validation error
5. **Download Links**: Should trigger file download correctly

## Security Features
- Session-based file access (prevents unauthorized downloads)
- Filename sanitization (prevents directory traversal)
- Automatic cleanup (prevents disk space abuse)
- File type validation (only video formats accepted) 