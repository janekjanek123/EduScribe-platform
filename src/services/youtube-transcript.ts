/**
 * Production-safe YouTube transcript extraction service
 * Uses youtube-transcript-api instead of shell commands for hosted environments
 */

import TranscriptAPI from 'youtube-transcript-api';
import { isValidYouTubeId, extractYouTubeId } from './youtube';

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  transcript: string;
  segments?: TranscriptSegment[];
  error?: string;
  language?: string;
}

/**
 * Extract transcript from YouTube video using youtube-transcript-api
 * This works in production environments without requiring system binaries
 */
export async function extractYouTubeTranscript(
  videoIdOrUrl: string,
  languages: string[] = ['en', 'pl', 'es', 'fr', 'de']
): Promise<TranscriptResult> {
  try {
    // Extract video ID if URL is provided
    let videoId = videoIdOrUrl;
    if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
      const extractedId = extractYouTubeId(videoIdOrUrl);
      if (!extractedId) {
        return {
          transcript: '',
          error: 'Invalid YouTube URL format'
        };
      }
      videoId = extractedId;
    }

    // Validate video ID
    if (!isValidYouTubeId(videoId)) {
      return {
        transcript: '',
        error: 'Invalid YouTube video ID'
      };
    }

    console.log(`[YouTubeTranscript] Extracting transcript for video: ${videoId}`);

    // Try to get transcript for each language in preference order
    let lastError = null;
    
    for (const lang of languages) {
      try {
        console.log(`[YouTubeTranscript] Trying language: ${lang}`);
        
        // Use youtube-transcript-api to get transcript
        const transcriptData = await TranscriptAPI.getTranscript(videoId, {
          lang: lang,
          country: 'US' // Default country
        });

        if (transcriptData && transcriptData.length > 0) {
          // Convert to our format
          const segments: TranscriptSegment[] = transcriptData.map((item: any) => ({
            text: item.text || '',
            start: item.offset || 0,
            duration: item.duration || 0
          }));

          // Combine all text segments
          const fullTranscript = segments
            .map(segment => segment.text.trim())
            .filter(text => text.length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (fullTranscript.length > 0) {
            console.log(`[YouTubeTranscript] Successfully extracted transcript in ${lang} (${fullTranscript.length} characters)`);
            return {
              transcript: fullTranscript,
              segments,
              language: lang
            };
          }
        }
      } catch (langError: any) {
        console.warn(`[YouTubeTranscript] Failed to get transcript in ${lang}:`, langError.message);
        lastError = langError;
        continue;
      }
    }

    // If no transcript found in any language, try without language specification
    try {
      console.log('[YouTubeTranscript] Trying to get transcript without language specification...');
      const transcriptData = await TranscriptAPI.getTranscript(videoId);
      
      if (transcriptData && transcriptData.length > 0) {
        const segments: TranscriptSegment[] = transcriptData.map((item: any) => ({
          text: item.text || '',
          start: item.offset || 0,
          duration: item.duration || 0
        }));

        const fullTranscript = segments
          .map(segment => segment.text.trim())
          .filter(text => text.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (fullTranscript.length > 0) {
          console.log(`[YouTubeTranscript] Successfully extracted transcript without language spec (${fullTranscript.length} characters)`);
          return {
            transcript: fullTranscript,
            segments,
            language: 'auto'
          };
        }
      }
    } catch (autoError: any) {
      console.warn('[YouTubeTranscript] Failed to get transcript without language spec:', autoError.message);
      lastError = autoError;
    }

    // Return appropriate error message
    return {
      transcript: '',
      error: getErrorMessage(lastError)
    };

  } catch (error: any) {
    console.error('[YouTubeTranscript] Unexpected error:', error);
    return {
      transcript: '',
      error: `Transcript extraction failed: ${error.message}`
    };
  }
}

/**
 * Get transcript as plain text only (simplified interface)
 */
export async function getYouTubeTranscriptText(
  videoIdOrUrl: string,
  languages?: string[]
): Promise<string> {
  const result = await extractYouTubeTranscript(videoIdOrUrl, languages);
  return result.transcript;
}

/**
 * Check if transcript is available for a video without downloading it
 */
export async function isTranscriptAvailable(videoIdOrUrl: string): Promise<boolean> {
  try {
    let videoId = videoIdOrUrl;
    if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
      const extractedId = extractYouTubeId(videoIdOrUrl);
      if (!extractedId) return false;
      videoId = extractedId;
    }

    if (!isValidYouTubeId(videoId)) return false;

    // Try to get just a small portion to check availability
    const transcriptData = await TranscriptAPI.getTranscript(videoId);
    return transcriptData && transcriptData.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Convert error to user-friendly message
 */
function getErrorMessage(error: any): string {
  if (!error) return 'No transcript available for this video';
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('transcript not available')) {
    return 'No transcript available for this video';
  }
  
  if (message.includes('video unavailable')) {
    return 'Video is unavailable or private';
  }
  
  if (message.includes('disabled')) {
    return 'Subtitles have been disabled for this video';
  }
  
  if (message.includes('not found')) {
    return 'Video not found';
  }
  
  if (message.includes('private')) {
    return 'Video is private';
  }
  
  if (message.includes('region')) {
    return 'Video not available in this region';
  }
  
  return 'No transcript available for this video';
}

/**
 * Fallback transcript extraction using ytdl-core (if youtube-transcript-api fails)
 */
export async function extractTranscriptFallback(videoId: string): Promise<TranscriptResult> {
  try {
    console.log(`[YouTubeTranscript] Attempting fallback extraction for ${videoId}`);
    
    // Import ytdl-core dynamically to avoid SSR issues
    const ytdl = await import('ytdl-core');
    
    const videoInfo = await ytdl.default.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    
    // Look for captions in video info
    const captionTracks = videoInfo.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      return {
        transcript: '',
        error: 'No captions available'
      };
    }
    
    // Try to fetch caption data from the first available track
    const captionTrack = captionTracks[0];
    if (captionTrack.baseUrl) {
      const response = await fetch(captionTrack.baseUrl);
      const captionXml = await response.text();
      
      // Parse XML captions
      const transcript = parseYouTubeCaptionXml(captionXml);
      
      if (transcript && transcript.length > 0) {
        console.log(`[YouTubeTranscript] Fallback extraction successful (${transcript.length} characters)`);
        return {
          transcript,
          language: String(captionTrack.languageCode || 'unknown')
        };
      }
    }
    
    return {
      transcript: '',
      error: 'Could not extract captions from video'
    };
    
  } catch (error: any) {
    console.error('[YouTubeTranscript] Fallback extraction failed:', error);
    return {
      transcript: '',
      error: `Fallback extraction failed: ${error.message}`
    };
  }
}

/**
 * Parse YouTube caption XML to plain text
 */
function parseYouTubeCaptionXml(xml: string): string {
  try {
    // Simple regex-based XML parsing for captions
    const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/g);
    
    if (!textMatches) return '';
    
    const texts = textMatches.map(match => {
      // Extract text content and decode HTML entities
      const textContent = match.replace(/<text[^>]*>/, '').replace(/<\/text>/, '');
      return textContent
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
    });
    
    return texts
      .filter(text => text.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
      
  } catch (error) {
    console.error('[YouTubeTranscript] Error parsing caption XML:', error);
    return '';
  }
} 