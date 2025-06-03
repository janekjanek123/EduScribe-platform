import { NextResponse } from 'next/server';
import { isValidYouTubeId } from '@/services/youtube';

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

/**
 * Transcript API endpoint to fetch YouTube video transcripts
 * 
 * @param request Request object containing videoId and optional language
 * @returns Transcript text or error message
 */
export async function POST(request: Request) {
  try {
    // Parse request body with error handling
    let data;
    try {
      data = await request.json();
    } catch (e) {
      console.error('[Transcript API] JSON parse error:', e);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request format',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }
    
    // Extract and validate parameters
    const { videoId, language = 'pl' } = data;

    if (!videoId) {
      console.warn('[Transcript API] Missing videoId in request');
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing parameter',
          message: 'Video ID is required'
        },
        { status: 400 }
      );
    }

    if (typeof videoId !== 'string') {
      console.warn('[Transcript API] Invalid videoId type:', typeof videoId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid parameter type',
          message: 'Video ID must be a string'
        },
        { status: 400 }
      );
    }

    // Validate the video ID format
    if (!isValidYouTubeId(videoId)) {
      console.warn('[Transcript API] Invalid YouTube ID format:', videoId);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube ID',
          message: 'The provided ID is not a valid YouTube video ID'
        },
        { status: 400 }
      );
    }

    console.log(`[Transcript API] Fetching transcript for video ${videoId} in language ${language}`);
    
    try {
      // Import the subtitles service dynamically to avoid SSR issues
      const { getVideoSubtitles } = await import('@/services/subtitles');
      
      // Fetch the transcript using the getVideoSubtitles function
      const transcript = await getVideoSubtitles(videoId, [language]);
      
      if (!transcript) {
        console.warn(`[Transcript API] No transcript found for video ${videoId}`);
        return NextResponse.json(
          { 
            success: false,
            error: 'No transcript available',
            message: 'This YouTube video does not have an available transcript or captions.'
          },
          { status: 404 }
        );
      }

      console.log(`[Transcript API] Successfully retrieved transcript (${transcript.length} characters) in ${language} language`);
      return NextResponse.json({ 
        success: true,
        transcript,
        language,
        itemCount: transcript.length
      });
      
    } catch (transcriptError: any) {
      console.error(`[Transcript API] Error fetching transcript for ${videoId}:`, transcriptError);
      
      // Categorize errors for better client-side handling
      if (transcriptError.message?.includes('ERR_INVALID_URL') || 
          transcriptError.message?.includes('Invalid video id')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid video ID',
            message: 'The provided YouTube video ID is invalid or malformed.',
            details: transcriptError.message
          },
          { status: 400 }
        );
      } else if (transcriptError.message?.includes('No transcript available') || 
                transcriptError.message?.includes('Could not find any captions')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No transcript available',
            message: 'This YouTube video does not have an available transcript or captions.',
            details: transcriptError.message
          },
          { status: 404 }
        );
      } else if (transcriptError.message?.includes('Status code: 403')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Access forbidden',
            message: 'Access to this video or its captions is restricted.',
            details: transcriptError.message
          },
          { status: 403 }
        );
      } else if (transcriptError.message?.includes('yt-dlp is required')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'yt-dlp_required',
            message: 'This system requires yt-dlp to extract YouTube subtitles. Please install yt-dlp:\n' +
                     '• macOS: brew install yt-dlp\n' +
                     '• Linux/macOS: pip install yt-dlp\n' +
                     '• Windows: pip install yt-dlp or choco install yt-dlp'
          },
          { status: 422 }
        );
      }
      
      // Generic error case
      return NextResponse.json(
        { 
          success: false,
          error: 'Transcript retrieval failed',
          message: 'Failed to fetch transcript from YouTube.',
          details: transcriptError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Transcript API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Server error',
        message: 'An unexpected error occurred while processing the transcript request.',
        details: error.message
      },
      { status: 500 }
    );
  }
} 