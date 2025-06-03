import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeId, isValidYouTubeId } from '@/services/youtube';
import { execaCommand } from 'execa';
import * as subtitle from 'subtitle';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

/**
 * Subtitle extraction API endpoint
 * 
 * Extracts subtitles from a YouTube video using yt-dlp,
 * parses them to plain text, and returns the result.
 */
export async function GET(request: NextRequest) {
  try {
    // Get URL from query parameter
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'Missing URL',
        message: 'Please provide a YouTube URL in the "url" query parameter'
      }, { status: 400 });
    }
    
    // Extract video ID
    const videoId = extractYouTubeId(url);
    
    if (!videoId || !isValidYouTubeId(videoId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid YouTube URL',
        message: 'Could not extract a valid YouTube video ID from the provided URL'
      }, { status: 400 });
    }
    
    // Check if yt-dlp is installed
    try {
      await execaCommand('yt-dlp --version', { shell: true });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'yt-dlp_not_installed',
        message: 'yt-dlp is required to extract YouTube subtitles. Please install yt-dlp:\n' +
                 '• macOS: brew install yt-dlp\n' +
                 '• Linux/macOS: pip install yt-dlp\n' +
                 '• Windows: pip install yt-dlp or choco install yt-dlp'
      }, { status: 422 });
    }
    
    // Create a temporary directory for downloads
    const tempDir = path.join(process.cwd(), 'temp');
    if (!await exists(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    
    // Generate a unique output filename
    const uniqueId = randomUUID();
    const outputTemplate = path.join(tempDir, `${uniqueId}-%(id)s.%(ext)s`);
    
    // Try to get preferred language subtitles
    const languages = ['pl', 'en'];
    const langPref = languages.join(',');
    
    try {
      // First try regular subtitles
      await execaCommand(
        `yt-dlp --write-sub --sub-lang ${langPref} --skip-download --output "${outputTemplate}" https://www.youtube.com/watch?v=${videoId}`,
        { shell: true }
      );
      
      // Check if a subtitle file was created
      let subtitleFile = null;
      const possibleExtensions = ['.vtt', '.srt'];
      
      for (const ext of possibleExtensions) {
        const potentialFile = path.join(tempDir, `${uniqueId}-${videoId}${ext}`);
        if (await exists(potentialFile)) {
          subtitleFile = potentialFile;
          break;
        }
      }
      
      // If no regular subtitles, try auto-generated
      if (!subtitleFile) {
        await execaCommand(
          `yt-dlp --write-auto-sub --sub-lang ${langPref} --skip-download --output "${outputTemplate}" https://www.youtube.com/watch?v=${videoId}`,
          { shell: true }
        );
        
        for (const ext of possibleExtensions) {
          const potentialFile = path.join(tempDir, `${uniqueId}-${videoId}${ext}`);
          if (await exists(potentialFile)) {
            subtitleFile = potentialFile;
            break;
          }
        }
      }
      
      // If we still don't have subtitles, return an error
      if (!subtitleFile) {
        return NextResponse.json({
          success: false,
          error: 'No subtitles available',
          message: 'This YouTube video does not have available subtitles or captions.'
        }, { status: 404 });
      }
      
      // Parse the subtitle file to plain text
      const content = await readFile(subtitleFile, 'utf8');
      const extension = path.extname(subtitleFile).toLowerCase();
      
      let text = '';
      
      if (extension === '.vtt' || extension === '.srt') {
        const captions = subtitle.parseSync(content);
        text = captions
          .map((item: any) => item.text || '')
          .filter(Boolean)
          .join(' ');
      } else {
        throw new Error(`Unsupported subtitle format: ${extension}`);
      }
      
      // Clean up the text
      text = text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
        .trim();
      
      // Clean up the file
      try {
        await unlink(subtitleFile);
      } catch (cleanupError) {
        console.warn('Error deleting temporary file:', cleanupError);
      }
      
      // Return the parsed text
      return NextResponse.json({
        success: true,
        data: {
          text,
          videoId,
          language: 'auto', // We don't know which language was actually used
          length: text.length,
        }
      });
      
    } catch (error: any) {
      console.error('Error extracting subtitles:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Subtitle extraction failed',
        message: error.message || 'Failed to extract subtitles from this video'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Unhandled error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Make a POST handler that does the same thing for compatibility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'Missing URL',
        message: 'Please provide a YouTube URL in the request body'
      }, { status: 400 });
    }
    
    // Create a new request with the URL as a query parameter
    const newUrl = new URL(request.url);
    newUrl.searchParams.set('url', url);
    const newRequest = new NextRequest(newUrl, request);
    
    // Call the GET handler
    return GET(newRequest);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request',
      message: error.message || 'Failed to parse request body'
    }, { status: 400 });
  }
}

// Configure dynamic behavior to avoid caching
export const dynamic = 'force-dynamic'; 