/**
 * Job Worker Service - Processes jobs in the background
 * Handles all content types: text, file, video, YouTube notes
 */

import { jobQueueService, type Job, type JobType } from './job-queue';
import { generateTextNotes } from '@/lib/notes-generator';
import { extractYouTubeTranscript } from './youtube-transcript';
import { extractSubtitles } from './subtitles';
import OpenAI from 'openai';

// Worker configuration
const WORKER_CONFIG = {
  pollInterval: 5000, // 5 seconds
  maxConcurrentJobs: 3,
  retryDelay: 30000, // 30 seconds
  workerId: `worker-${process.env.HOSTNAME || 'local'}-${Date.now()}`
};

class JobWorker {
  private isRunning = false;
  private activeJobs = new Set<string>();
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  /**
   * Start the job worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[JobWorker] Worker is already running');
      return;
    }

    this.isRunning = true;
    console.log(`[JobWorker] Starting worker ${WORKER_CONFIG.workerId}`);
    
    // Start the main processing loop
    this.processJobs();
  }

  /**
   * Stop the job worker
   */
  async stop(): Promise<void> {
    console.log('[JobWorker] Stopping worker...');
    this.isRunning = false;
    
    // Wait for active jobs to complete
    while (this.activeJobs.size > 0) {
      console.log(`[JobWorker] Waiting for ${this.activeJobs.size} active jobs to complete...`);
      await this.sleep(1000);
    }
    
    console.log('[JobWorker] Worker stopped');
  }

  /**
   * Main job processing loop
   */
  private async processJobs(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.activeJobs.size >= WORKER_CONFIG.maxConcurrentJobs) {
          await this.sleep(WORKER_CONFIG.pollInterval);
          continue;
        }

        // Get next job from queue
        const job = await jobQueueService.getNextJob(WORKER_CONFIG.workerId);
        
        if (!job) {
          // No jobs available, wait and try again
          await this.sleep(WORKER_CONFIG.pollInterval);
          continue;
        }

        // Process the job asynchronously
        this.processJobAsync(job);
        
      } catch (error) {
        console.error('[JobWorker] Error in main processing loop:', error);
        await this.sleep(WORKER_CONFIG.pollInterval);
      }
    }
  }

  /**
   * Process a single job asynchronously
   */
  private async processJobAsync(job: Job): Promise<void> {
    this.activeJobs.add(job.id);
    
    try {
      console.log(`[JobWorker] Processing job ${job.id} (${job.job_type})`);
      
      // Update job status to processing
      await jobQueueService.updateJobProgress(job.id, 0, 'processing');
      
      // Process based on job type
      let result: any;
      switch (job.job_type) {
        case 'text_notes':
          result = await this.processTextNotesJob(job);
          break;
        case 'file_notes':
          result = await this.processFileNotesJob(job);
          break;
        case 'video_notes':
          result = await this.processVideoNotesJob(job);
          break;
        case 'youtube_notes':
          result = await this.processYouTubeNotesJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }
      
      // Complete the job successfully
      await jobQueueService.completeJob(job.id, result, true);
      console.log(`[JobWorker] Job ${job.id} completed successfully`);
      
    } catch (error: any) {
      console.error(`[JobWorker] Job ${job.id} failed:`, error);
      
      // Complete the job with error
      await jobQueueService.completeJob(
        job.id,
        null,
        false,
        error.message,
        { error: error.toString(), stack: error.stack }
      );
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Process text notes job
   */
  private async processTextNotesJob(job: Job): Promise<any> {
    const { content, options = {} } = job.input_data;
    
    await jobQueueService.updateJobProgress(job.id, 10);
    
    try {
      // Generate notes using existing text notes generator
      const notes = await generateTextNotes(content, {
        language: options.language || 'en',
        generateQuiz: options.generateQuiz || false,
        customPrompt: options.customPrompt
      });
      
      await jobQueueService.updateJobProgress(job.id, 90);
      
      return {
        notes,
        noteId: notes.id || `text-${Date.now()}`,
        content: notes.content,
        quiz: notes.quiz,
        metadata: {
          originalContent: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
          language: options.language || 'en',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('[JobWorker] Text notes generation failed:', error);
      throw new Error(`Text notes generation failed: ${error.message}`);
    }
  }

  /**
   * Process file notes job
   */
  private async processFileNotesJob(job: Job): Promise<any> {
    const { fileUrl, fileName, fileType, options = {} } = job.input_data;
    
    await jobQueueService.updateJobProgress(job.id, 10);
    
    try {
      // Download and extract text from file
      const extractedText = await this.extractTextFromFile(fileUrl, fileType);
      
      await jobQueueService.updateJobProgress(job.id, 40);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }
      
      // Generate notes from extracted text
      const notes = await generateTextNotes(extractedText, {
        language: options.language || 'en',
        generateQuiz: options.generateQuiz || false
      });
      
      await jobQueueService.updateJobProgress(job.id, 90);
      
      return {
        notes,
        noteId: notes.id || `file-${Date.now()}`,
        content: notes.content,
        quiz: notes.quiz,
        metadata: {
          fileName,
          fileType,
          fileUrl,
          extractedTextLength: extractedText.length,
          language: options.language || 'en',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('[JobWorker] File notes generation failed:', error);
      throw new Error(`File notes generation failed: ${error.message}`);
    }
  }

  /**
   * Process video notes job
   */
  private async processVideoNotesJob(job: Job): Promise<any> {
    const { videoUrl, options = {} } = job.input_data;
    
    await jobQueueService.updateJobProgress(job.id, 10);
    
    try {
      // Extract transcript from video
      const transcript = await this.extractVideoTranscript(videoUrl);
      
      await jobQueueService.updateJobProgress(job.id, 50);
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No transcript could be extracted from the video');
      }
      
      // Generate notes from transcript
      const notes = await generateTextNotes(transcript, {
        language: options.language || 'en',
        generateQuiz: options.generateQuiz || false
      });
      
      await jobQueueService.updateJobProgress(job.id, 90);
      
      return {
        notes,
        noteId: notes.id || `video-${Date.now()}`,
        content: notes.content,
        quiz: notes.quiz,
        metadata: {
          videoUrl,
          transcriptLength: transcript.length,
          language: options.language || 'en',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('[JobWorker] Video notes generation failed:', error);
      throw new Error(`Video notes generation failed: ${error.message}`);
    }
  }

  /**
   * Process YouTube notes job
   */
  private async processYouTubeNotesJob(job: Job): Promise<any> {
    const { youtubeUrl, videoId, options = {} } = job.input_data;
    
    await jobQueueService.updateJobProgress(job.id, 10);
    
    try {
      // Extract transcript from YouTube video
      const transcriptResult = await extractYouTubeTranscript(
        videoId,
        options.preferredLanguages || ['en', 'pl', 'es', 'fr', 'de']
      );
      
      await jobQueueService.updateJobProgress(job.id, 40);
      
      if (transcriptResult.error || !transcriptResult.transcript) {
        throw new Error(`Failed to extract YouTube transcript: ${transcriptResult.error}`);
      }
      
      // Generate notes from transcript
      const notes = await generateTextNotes(transcriptResult.transcript, {
        language: options.language || transcriptResult.language || 'en',
        generateQuiz: options.generateQuiz || false
      });
      
      await jobQueueService.updateJobProgress(job.id, 90);
      
      return {
        notes,
        noteId: notes.id || `youtube-${videoId}`,
        content: notes.content,
        quiz: notes.quiz,
        metadata: {
          youtubeUrl,
          videoId,
          transcriptLanguage: transcriptResult.language,
          transcriptLength: transcriptResult.transcript.length,
          segmentsCount: transcriptResult.segments?.length || 0,
          language: options.language || transcriptResult.language || 'en',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('[JobWorker] YouTube notes generation failed:', error);
      throw new Error(`YouTube notes generation failed: ${error.message}`);
    }
  }

  /**
   * Extract text from uploaded file
   */
  private async extractTextFromFile(fileUrl: string, fileType: string): Promise<string> {
    // This would integrate with your existing file processing logic
    // For now, return a placeholder
    throw new Error('File text extraction not implemented yet');
  }

  /**
   * Extract transcript from video file
   */
  private async extractVideoTranscript(videoUrl: string): Promise<string> {
    // This would integrate with your existing video transcription logic
    // Using the existing subtitles service or transcription API
    throw new Error('Video transcript extraction not implemented yet');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: WORKER_CONFIG.maxConcurrentJobs,
      workerId: WORKER_CONFIG.workerId
    };
  }
}

// Create and export singleton instance
export const jobWorker = new JobWorker();

// Auto-start worker in production
if (process.env.NODE_ENV === 'production') {
  jobWorker.start().catch(console.error);
}

export default jobWorker; 