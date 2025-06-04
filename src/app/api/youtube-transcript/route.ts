import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeTranscript, extractTranscriptFallback } from '@/services/youtube-transcript';
import { extractYouTubeId, isValidYouTubeId } from '@/services/youtube';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, videoId, languages } = body;

    // Extract video ID from URL if provided
    let finalVideoId = videoId;
    if (url && !finalVideoId) {
      finalVideoId = extractYouTubeId(url);
    }

    if (!finalVideoId) {
      return NextResponse.json(
        { error: 'No valid YouTube video ID or URL provided' },
        { status: 400 }
      );
    }

    if (!isValidYouTubeId(finalVideoId)) {
      return NextResponse.json(
        { error: 'Invalid YouTube video ID format' },
        { status: 400 }
      );
    }

    console.log(`[YouTube Transcript API] Processing video: ${finalVideoId}`);

    // Try the main transcript extraction method
    const result = await extractYouTubeTranscript(finalVideoId, languages);

    // If main method failed, try fallback
    if (result.error && result.transcript.length === 0) {
      console.log(`[YouTube Transcript API] Primary method failed, trying fallback for ${finalVideoId}`);
      const fallbackResult = await extractTranscriptFallback(finalVideoId);
      
      if (fallbackResult.transcript && fallbackResult.transcript.length > 0) {
        return NextResponse.json({
          success: true,
          transcript: fallbackResult.transcript,
          language: fallbackResult.language,
          method: 'fallback',
          videoId: finalVideoId
        });
      }
    }

    // Return primary result (success or failure)
    if (result.transcript && result.transcript.length > 0) {
      return NextResponse.json({
        success: true,
        transcript: result.transcript,
        segments: result.segments,
        language: result.language,
        method: 'primary',
        videoId: finalVideoId
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'No transcript available for this video',
          videoId: finalVideoId
        },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('[YouTube Transcript API] Server error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error while extracting transcript',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const videoId = searchParams.get('videoId');
  const languages = searchParams.get('languages')?.split(',');

  // Extract video ID from URL if provided
  let finalVideoId = videoId;
  if (url && !finalVideoId) {
    finalVideoId = extractYouTubeId(url);
  }

  if (!finalVideoId) {
    return NextResponse.json(
      { error: 'No valid YouTube video ID or URL provided' },
      { status: 400 }
    );
  }

  if (!isValidYouTubeId(finalVideoId)) {
    return NextResponse.json(
      { error: 'Invalid YouTube video ID format' },
      { status: 400 }
    );
  }

  try {
    console.log(`[YouTube Transcript API] Processing video (GET): ${finalVideoId}`);

    const result = await extractYouTubeTranscript(finalVideoId, languages);

    if (result.transcript && result.transcript.length > 0) {
      return NextResponse.json({
        success: true,
        transcript: result.transcript,
        segments: result.segments,
        language: result.language,
        videoId: finalVideoId
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'No transcript available for this video',
          videoId: finalVideoId
        },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('[YouTube Transcript API] Server error (GET):', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error while extracting transcript',
        details: error.message
      },
      { status: 500 }
    );
  }
} 