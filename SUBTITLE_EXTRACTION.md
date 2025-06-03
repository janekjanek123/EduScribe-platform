# YouTube Subtitle Extraction for EduScribe

This document explains how to set up and use the subtitle extraction system for the EduScribe application.

## Prerequisites

To use the subtitle extraction system, you need to have `yt-dlp` installed on your system:

- **macOS**: `brew install yt-dlp`
- **Linux/macOS** (alternative): `pip install yt-dlp`
- **Windows**: `pip install yt-dlp` or `choco install yt-dlp`

## Features

The subtitle extraction system:

1. Uses `yt-dlp` to download subtitle files (VTT, SRT) from YouTube videos
2. Parses the subtitle files to extract clean text
3. Supports both manually created subtitles and auto-generated captions
4. Handles multiple languages (prioritizing Polish and English)
5. Cleans up temporary files automatically
6. Provides fallback mechanisms when one method fails

## API Endpoints

### `/api/subtitles`

A dedicated endpoint for extracting subtitles from YouTube videos.

**GET Request:**
```
/api/subtitles?url=https://www.youtube.com/watch?v=VIDEOID
```

**POST Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEOID"
}
```

**Successful Response:**
```json
{
  "success": true,
  "data": {
    "text": "The extracted subtitle text...",
    "videoId": "VIDEOID",
    "language": "auto",
    "length": 12345
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message"
}
```

## Testing

You can test the subtitle extraction with the included test script:

```bash
node scripts/test-subtitles.js https://www.youtube.com/watch?v=VIDEOID
```

This script will:
1. Try to download subtitles using `yt-dlp`
2. Show the output of the extraction process
3. Parse the subtitle file
4. Display the first 500 characters of the extracted text
5. Clean up temporary files

## Troubleshooting

### Common Issues

1. **"yt-dlp is not installed"**: Make sure `yt-dlp` is installed and in your PATH.

2. **"No subtitles available"**: The video might not have subtitles or captions.

3. **"Invalid URL"**: Check that the YouTube URL is correct and publicly accessible.

4. **"Subtitle extraction failed"**: This could be due to various reasons:
   - Network issues
   - YouTube API changes
   - Permission problems with temporary directory

### Debug Steps

1. Use the test script to see detailed output
2. Check if `yt-dlp` works correctly by running it directly:
   ```
   yt-dlp --list-subs https://www.youtube.com/watch?v=VIDEOID
   ```
3. Try downloading subtitles manually:
   ```
   yt-dlp --write-sub --skip-download https://www.youtube.com/watch?v=VIDEOID
   ```

## Integration with Note Generation

The subtitle extraction system is integrated with the note generation feature. When a user requests notes for a YouTube video:

1. The system first tries to get the transcript using the YouTube API
2. If that fails, it falls back to using the subtitle extraction system
3. The extracted text is sent to the OpenAI API to generate structured notes
4. The notes are stored in the database and returned to the user

## Implementation Details

The subtitle extraction functionality is implemented in the following files:

- `src/services/subtitles.ts`: Core subtitle extraction functionality
- `src/services/youtube.ts`: YouTube service that uses subtitle extraction
- `src/app/api/subtitles/route.ts`: API endpoint for subtitle extraction
- `scripts/test-subtitles.js`: Test script for subtitle extraction 