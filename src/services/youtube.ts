import axios from 'axios';
import { isLikelyUrl } from './youtube/validators';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import { extractSubtitles } from './subtitles';

// Re-export the validators for backward compatibility
export { isLikelyUrl };

// Promisify exec for async/await usage
const execAsync = promisify(exec);

/**
 * YouTube video information object
 */
export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelTitle?: string;
  publishedAt?: string;
  error?: string;
}

/**
 * Transcript extraction result
 */
export interface TranscriptResult {
  transcript: string;
  error?: string;
}

/**
 * Safely attempts to parse a URL string
 * @param urlString The URL string to parse
 * @returns URL object if successful, null if not
 */
export function safeParseUrl(urlString: string): URL | null {
  try {
    // Add protocol if missing
    let normalizedUrl = urlString.trim();
    if (normalizedUrl.startsWith('//')) {
      normalizedUrl = `https:${normalizedUrl}`;
    } else if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    return new URL(normalizedUrl);
  } catch (error) {
    console.warn('[YouTube] Failed to parse URL:', error);
    return null;
  }
}

/**
 * Extracts a YouTube video ID from a URL
 * Supports various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Clean the URL by trimming and handling mobile URLs
  let cleanUrl = url.trim();
  
  // Convert mobile youtube URLs to standard format
  if (cleanUrl.includes('youtu.be/')) {
    cleanUrl = cleanUrl.replace('youtu.be/', 'youtube.com/watch?v=');
  }
  
  try {
    // Try to parse as URL and extract from searchParams (standard youtube.com/watch?v=ID format)
    const urlObj = new URL(cleanUrl);
    
    // Handle youtube.com/watch?v=ID format
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/watch')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;
    }
    
    // Handle youtube.com/embed/ID format
    if (urlObj.hostname.includes('youtube') && urlObj.pathname.includes('/embed/')) {
      const parts = urlObj.pathname.split('/');
      return parts[parts.indexOf('embed') + 1] || null;
    }
    
    // Handle youtu.be/ID format (already converted to standard format above, but just in case)
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.substring(1) || null;
    }
    
    // Handle youtube.com/v/ID format
    if (urlObj.hostname.includes('youtube') && urlObj.pathname.includes('/v/')) {
      const parts = urlObj.pathname.split('/');
      return parts[parts.indexOf('v') + 1] || null;
    }
  } catch (e) {
    // If URL parsing fails, try regex-based extraction
    console.error('URL parsing failed, trying regex fallback:', e);
  }
  
  // Fallback to regex for cases where URL parsing fails
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/  // Direct video ID (11 characters)
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validates if a string is a valid YouTube video ID
 */
export function isValidYouTubeId(id: string): boolean {
  if (!id) return false;
  
  // YouTube IDs are typically 11 characters and contain only certain characters
  const validPattern = /^[a-zA-Z0-9_-]{11}$/;
  return validPattern.test(id);
}

/**
 * Gets information about a YouTube video
 */
export async function getVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
  if (!videoId) {
    return {
      videoId: '',
      title: '',
      thumbnailUrl: '',
      error: 'No video ID provided'
    };
  }
  
  try {
    // Use YouTube API to get video info
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.error('[YouTube Service] No YouTube API key configured');
      return {
        videoId,
        title: `YouTube Video (${videoId})`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        error: 'YouTube API key not configured - using fallback data'
      };
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[YouTube Service] YouTube API error:', errorData);
      
      // Fall back to basic info using video ID
      return {
        videoId,
        title: `YouTube Video (${videoId})`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        error: `YouTube API error: ${errorData.error?.message || response.statusText}`
      };
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.error('[YouTube Service] Video not found:', videoId);
      return {
        videoId,
        title: `Video Not Found (${videoId})`,
        thumbnailUrl: '',
        error: 'Video not found'
      };
    }
    
    const videoDetails = data.items[0].snippet;
    
    return {
      videoId,
      title: videoDetails.title,
      description: videoDetails.description,
      thumbnailUrl: videoDetails.thumbnails?.high?.url || videoDetails.thumbnails?.default?.url || '',
      channelTitle: videoDetails.channelTitle,
      publishedAt: videoDetails.publishedAt
    };
  } catch (error: any) {
    console.error('[YouTube Service] Error fetching video info:', error);
    
    // Fall back to basic info using video ID
    return {
      videoId,
      title: `YouTube Video (${videoId})`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      error: `Error fetching video info: ${error.message}`
    };
  }
}

/**
 * Gets the transcript for a YouTube video
 * Wraps the subtitle extraction service to provide consistent error handling
 */
export async function getVideoTranscript(videoId: string): Promise<TranscriptResult> {
  if (!videoId) {
    return {
      transcript: '',
      error: 'No video ID provided'
    };
  }
  
  try {
    // Use the subtitles service to extract transcript
    const transcript = await extractSubtitles(videoId);
    
    if (!transcript || transcript.trim().length === 0) {
      return {
        transcript: '',
        error: 'No subtitles available for this video'
      };
    }
    
    return {
      transcript
    };
  } catch (error: any) {
    console.error('[YouTube Service] Error extracting transcript:', error);
    
    // Provide specific error messages for common issues
    if (error.message?.includes('yt-dlp is required')) {
      return {
        transcript: '',
        error: 'yt-dlp is required but not installed'
      };
    }
    
    if (error.message?.includes('subtitles are disabled')) {
      return {
        transcript: '',
        error: 'This video has disabled subtitles'
      };
    }
    
    if (error.message?.includes('not available')) {
      return {
        transcript: '',
        error: 'No subtitles available for this video'
      };
    }
    
    return {
      transcript: '',
      error: `Error extracting transcript: ${error.message}`
    };
  }
} 