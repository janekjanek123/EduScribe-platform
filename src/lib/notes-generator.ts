/**
 * Notes Generator - Wrapper around AI service for job queue system
 * Provides a simplified interface for generating notes from various content types
 */

import { generateNotes as aiGenerateNotes, type NotesGenerationResponse } from '@/services/ai';

// Types for the notes generator
export interface GenerateTextNotesOptions {
  language?: string;
  generateQuiz?: boolean;
  customPrompt?: string;
}

export interface GeneratedNotes {
  id: string;
  content: string;
  summary?: string;
  quiz?: any[];
  metadata?: {
    language: string;
    generatedAt: string;
    wordCount: number;
    processingTime?: number;
    fileName?: string;
    sourceType?: string;
    videoTitle?: string;
    videoId?: string;
    [key: string]: any; // Allow additional metadata properties
  };
}

/**
 * Generate notes from text content
 */
export async function generateTextNotes(
  content: string,
  options: GenerateTextNotesOptions = {}
): Promise<GeneratedNotes> {
  const startTime = Date.now();
  
  try {
    console.log(`[NotesGenerator] Generating notes from text (${content.length} chars)`);
    
    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Content is required and must be a non-empty string');
    }

    // Apply custom prompt if provided
    let processedContent = content;
    if (options.customPrompt) {
      processedContent = `${options.customPrompt}\n\n${content}`;
    }

    // Use the existing AI service to generate notes
    const result: NotesGenerationResponse = await aiGenerateNotes({
      transcript: processedContent,
      videoTitle: 'Text Notes' // Generic title for text input
    });

    // Check if generation was successful
    if (result.error && !result.content) {
      throw new Error(result.error);
    }

    const processingTime = Date.now() - startTime;
    
    // Format the response to match the expected interface
    const generatedNotes: GeneratedNotes = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: result.content,
      summary: result.summary,
      quiz: options.generateQuiz ? result.quiz : undefined,
      metadata: {
        language: options.language || 'en',
        generatedAt: new Date().toISOString(),
        wordCount: content.split(/\s+/).length,
        processingTime
      }
    };

    console.log(`[NotesGenerator] Successfully generated notes in ${processingTime}ms`);
    
    // Log partial success warnings if applicable
    if (result.partialSuccess) {
      console.warn('[NotesGenerator] Partial success - some content chunks failed:', result.failedChunks);
    }

    return generatedNotes;
    
  } catch (error: any) {
    console.error('[NotesGenerator] Error generating notes:', error);
    
    // Re-throw with more specific error message
    const errorMessage = error.message || 'Failed to generate notes from text content';
    throw new Error(`Note generation failed: ${errorMessage}`);
  }
}

/**
 * Generate notes from file content (wrapper for consistency)
 */
export async function generateFileNotes(
  extractedText: string,
  fileName: string,
  options: GenerateTextNotesOptions = {}
): Promise<GeneratedNotes> {
  console.log(`[NotesGenerator] Generating notes from file: ${fileName}`);
  
  try {
    const result = await generateTextNotes(extractedText, options);
    
    // Update metadata to reflect file source
    result.id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (result.metadata) {
      result.metadata = {
        ...result.metadata,
        fileName,
        sourceType: 'file'
      };
    }
    
    return result;
  } catch (error: any) {
    console.error(`[NotesGenerator] Error generating notes from file ${fileName}:`, error);
    throw new Error(`File note generation failed: ${error.message}`);
  }
}

/**
 * Generate notes from video transcript
 */
export async function generateVideoNotes(
  transcript: string,
  videoTitle: string,
  options: GenerateTextNotesOptions = {}
): Promise<GeneratedNotes> {
  console.log(`[NotesGenerator] Generating notes from video: ${videoTitle}`);
  
  try {
    const result: NotesGenerationResponse = await aiGenerateNotes({
      transcript,
      videoTitle
    });

    if (result.error && !result.content) {
      throw new Error(result.error);
    }

    const generatedNotes: GeneratedNotes = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: result.content,
      summary: result.summary,
      quiz: options.generateQuiz ? result.quiz : undefined,
      metadata: {
        language: options.language || 'en',
        generatedAt: new Date().toISOString(),
        wordCount: transcript.split(/\s+/).length,
        videoTitle,
        sourceType: 'video'
      }
    };

    console.log(`[NotesGenerator] Successfully generated video notes for: ${videoTitle}`);
    return generatedNotes;
    
  } catch (error: any) {
    console.error(`[NotesGenerator] Error generating notes from video ${videoTitle}:`, error);
    throw new Error(`Video note generation failed: ${error.message}`);
  }
}

/**
 * Generate notes from YouTube transcript
 */
export async function generateYouTubeNotes(
  transcript: string,
  videoTitle: string,
  videoId: string,
  options: GenerateTextNotesOptions = {}
): Promise<GeneratedNotes> {
  console.log(`[NotesGenerator] Generating notes from YouTube video: ${videoId}`);
  
  try {
    const result: NotesGenerationResponse = await aiGenerateNotes({
      transcript,
      videoTitle,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`
    });

    if (result.error && !result.content) {
      throw new Error(result.error);
    }

    const generatedNotes: GeneratedNotes = {
      id: `youtube_${videoId}_${Date.now()}`,
      content: result.content,
      summary: result.summary,
      quiz: options.generateQuiz ? result.quiz : undefined,
      metadata: {
        language: options.language || 'en',
        generatedAt: new Date().toISOString(),
        wordCount: transcript.split(/\s+/).length,
        videoTitle,
        videoId,
        sourceType: 'youtube'
      }
    };

    console.log(`[NotesGenerator] Successfully generated YouTube notes for: ${videoId}`);
    return generatedNotes;
    
  } catch (error: any) {
    console.error(`[NotesGenerator] Error generating notes from YouTube video ${videoId}:`, error);
    throw new Error(`YouTube note generation failed: ${error.message}`);
  }
}

/**
 * Validate note generation options
 */
export function validateNotesOptions(options: GenerateTextNotesOptions): void {
  if (options.language && typeof options.language !== 'string') {
    throw new Error('Language option must be a string');
  }
  
  if (options.generateQuiz !== undefined && typeof options.generateQuiz !== 'boolean') {
    throw new Error('GenerateQuiz option must be a boolean');
  }
  
  if (options.customPrompt && typeof options.customPrompt !== 'string') {
    throw new Error('CustomPrompt option must be a string');
  }
}

/**
 * Get estimated processing time based on content length
 */
export function estimateProcessingTime(contentLength: number): number {
  // Rough estimate: ~1 second per 100 characters
  const baseTime = Math.max(10, Math.ceil(contentLength / 100));
  
  // Add some overhead for AI processing
  const overhead = Math.ceil(baseTime * 0.3);
  
  return baseTime + overhead;
} 