import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import OpenAI from 'openai';
import { promisify } from 'util';

// Configure FFmpeg to use system binaries
const ffmpegPath = '/usr/bin/ffmpeg';
const ffprobePath = '/usr/bin/ffprobe';

// Set FFmpeg paths for Render deployment
let ffmpegPathSet = false;
let ffprobePathSet = false;

// Set up FFmpeg path - prioritize system paths for production deployment
try {
  // For production (Render), use system paths
  if (process.env.NODE_ENV === 'production') {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    console.log('[VideoTranscription] Production mode: Using system FFmpeg at:', ffmpegPath);
    console.log('[VideoTranscription] Production mode: Using system FFprobe at:', ffprobePath);
    ffmpegPathSet = true;
    ffprobePathSet = true;
  } else {
    // For development, try to find FFmpeg in common locations
    const commonPaths = [
      // System paths (assuming ffmpeg and ffprobe are in the same dir)
      { ffmpeg: '/usr/local/bin/ffmpeg', ffprobe: '/usr/local/bin/ffprobe' },
      { ffmpeg: '/usr/bin/ffmpeg', ffprobe: '/usr/bin/ffprobe' },
      { ffmpeg: '/opt/homebrew/bin/ffmpeg', ffprobe: '/opt/homebrew/bin/ffprobe' },
      { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' } // Use PATH
    ];

    for (const paths of commonPaths) {
      try {
        if (!ffmpegPathSet && (paths.ffmpeg === 'ffmpeg' || fs.existsSync(paths.ffmpeg))) {
          ffmpeg.setFfmpegPath(paths.ffmpeg);
          console.log('[VideoTranscription] Using FFmpeg at:', paths.ffmpeg);
          ffmpegPathSet = true;
        }
        if (!ffprobePathSet && (paths.ffprobe === 'ffprobe' || fs.existsSync(paths.ffprobe))) {
          ffmpeg.setFfprobePath(paths.ffprobe);
          console.log('[VideoTranscription] Using FFprobe at:', paths.ffprobe);
          ffprobePathSet = true;
        }
        if (ffmpegPathSet && ffprobePathSet) break;
      } catch (error) {
        console.warn('[VideoTranscription] Could not use FFmpeg/FFprobe at:', paths);
      }
    }
  }
} catch (error) {
  console.error('[VideoTranscription] Error setting FFmpeg paths:', error);
}

if (!ffmpegPathSet) {
  console.error('[VideoTranscription] ⚠️  Could not find FFmpeg! Video processing may fail for extraction.');
}
if (!ffprobePathSet) {
  console.error('[VideoTranscription] ⚠️  Could not find FFprobe! Video validation/info may fail.');
}

/**
 * Tests if FFmpeg and FFprobe are available and working
 */
async function testFFmpegAvailability(): Promise<{ffmpeg: boolean, ffprobe: boolean}> {
  const results = { ffmpeg: false, ffprobe: false };
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      if (err) {
        console.error('[VideoTranscription] FFmpeg test failed:', err.message);
      } else {
        console.log('[VideoTranscription] FFmpeg test passed (formats check)');
        results.ffmpeg = true;
      }
      
      // Test ffprobe by trying to get info from a dummy/non-existent file path
      // We expect an error, but not 'ffprobe not found'
      ffmpeg.ffprobe('dummy_test_file.mp4', (probeErr, metadata) => {
        if (probeErr && probeErr.message.toLowerCase().includes('cannot find ffprobe')) {
          console.error('[VideoTranscription] FFprobe test failed: ffprobe not found');
        } else if (probeErr && probeErr.message.toLowerCase().includes('no such file')){
          console.log('[VideoTranscription] FFprobe test passed (expected error on dummy file)');
          results.ffprobe = true;
        } else if (!probeErr) {
            console.log('[VideoTranscription] FFprobe test passed (unexpected success on dummy file, but ok)');
            results.ffprobe = true; 
        } else {
            console.error('[VideoTranscription] FFprobe test returned unexpected error:', probeErr.message);
        }
        resolve(results);
      });
    });
  });
}

// Initialize OpenAI client for Whisper API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface VideoTranscriptionResult {
  transcript: string;
  duration?: number;
  language?: string;
  error?: string;
}

export interface VideoProcessingProgress {
  step: 'extracting' | 'transcribing' | 'complete';
  progress: number;
  message: string;
}

/**
 * Extracts audio from video file and transcribes it using OpenAI Whisper API
 */
export async function transcribeVideoFile(
  videoFilePath: string,
  outputDir?: string,
  progressCallback?: (progress: VideoProcessingProgress) => void
): Promise<VideoTranscriptionResult> {
  const tempDir = outputDir || path.join(process.cwd(), 'temp', 'video-processing');
  const audioFileName = `audio_${Date.now()}.mp3`;
  const audioFilePath = path.join(tempDir, audioFileName);
  
  try {
    // Test FFmpeg availability first
    console.log('[VideoTranscription] Testing FFmpeg/FFprobe availability...');
    const {ffmpeg: ffmpegAvailable, ffprobe: ffprobeAvailable} = await testFFmpegAvailability();
    
    if (!ffmpegAvailable) {
      return {
        transcript: '',
        error: 'FFmpeg (for audio extraction) is not available. Please ensure FFmpeg is properly installed and accessible.'
      };
    }
    // FFprobe is used for validation and info, can proceed with extraction if only ffprobe is missing but warn.
    if (!ffprobeAvailable) {
        console.warn('[VideoTranscription] FFprobe not available. Video validation and info might be incomplete, but attempting audio extraction.')
    }
    
    // Ensure temp directory exists
    await fs.ensureDir(tempDir);
    
    // Step 1: Extract audio from video
    console.log('[VideoTranscription] Extracting audio from video...');
    progressCallback?.({
      step: 'extracting',
      progress: 0,
      message: 'Extracting audio from video...'
    });

    await extractAudioFromVideo(videoFilePath, audioFilePath, (progress) => {
      progressCallback?.({
        step: 'extracting',
        progress,
        message: `Extracting audio: ${progress}%`
      });
    });

    progressCallback?.({
      step: 'extracting',
      progress: 100,
      message: 'Audio extraction complete'
    });

    // Step 2: Check if audio needs to be chunked and transcribe
    console.log('[VideoTranscription] Checking audio file size and preparing for transcription...');
    
    // Check audio file size first
    const audioStats = await fs.stat(audioFilePath);
    console.log(`[VideoTranscription] Audio file size: ${(audioStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    let transcriptionResult: VideoTranscriptionResult;
    
    if (audioStats.size > 15 * 1024 * 1024) { // 15MB threshold for better safety margin
      console.log('[VideoTranscription] Audio file is large, using chunking approach...');
      
      progressCallback?.({
        step: 'transcribing',
        progress: 0,
        message: 'Preparing large audio file for transcription...'
      });
      
      // Split audio into chunks
      const chunkPaths = await splitAudioIntoChunks(audioFilePath);
      
      progressCallback?.({
        step: 'transcribing',
        progress: 25,
        message: `Transcribing audio in ${chunkPaths.length} chunks...`
      });
      
      // Transcribe all chunks
      transcriptionResult = await transcribeAudioChunks(chunkPaths);
      
    } else {
      console.log('[VideoTranscription] Audio file is small enough, using direct transcription...');
      
      progressCallback?.({
        step: 'transcribing',
        progress: 0,
        message: 'Transcribing audio with AI...'
      });
      
      // Use direct transcription for smaller files
      transcriptionResult = await transcribeAudioWithWhisper(audioFilePath);
    }

    progressCallback?.({
      step: 'transcribing',
      progress: 100,
      message: 'Transcription complete'
    });

    // Cleanup: Remove temporary audio file
    try {
      await fs.remove(audioFilePath);
    } catch (cleanupError) {
      console.warn('[VideoTranscription] Failed to cleanup audio file:', cleanupError);
    }

    progressCallback?.({
      step: 'complete',
      progress: 100,
      message: 'Video processing complete'
    });

    return transcriptionResult;

  } catch (error) {
    console.error('[VideoTranscription] Error:', error);
    
    // Cleanup on error
    try {
      await fs.remove(audioFilePath);
    } catch (cleanupError) {
      console.warn('[VideoTranscription] Failed to cleanup after error:', cleanupError);
    }

    return {
      transcript: '',
      error: error instanceof Error ? error.message : 'Unknown transcription error'
    };
  }
}

/**
 * Extracts audio from video file using FFmpeg
 */
async function extractAudioFromVideo(
  videoPath: string,
  outputPath: string,
  progressCallback?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let duration: number | null = null;

    ffmpeg(videoPath)
      .audioCodec('libmp3lame') // Use MP3 compression instead of uncompressed WAV
      .audioBitrate('48k') // Even lower bitrate for speech (was 64k)
      .audioChannels(1) // Mono audio for efficiency
      .audioFrequency(16000) // 16kHz sample rate (optimal for speech)
      .format('mp3') // Use MP3 format to save space
      .on('codecData', (data) => {
        // Get duration for progress calculation
        const durationMatch = data.duration.match(/(\d+):(\d+):(\d+\.\d+)/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseFloat(durationMatch[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
        }
      })
      .on('progress', (progress) => {
        if (duration && progressCallback && progress.timemark) {
          // Parse timemark which is in format "HH:MM:SS.ms"
          const timeMatch = progress.timemark.toString().match(/(\d+):(\d+):(\d+\.\d+)/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            const percent = Math.min(100, Math.round((currentTime / duration) * 100));
            progressCallback(percent);
          }
        }
      })
      .on('end', () => {
        console.log('[VideoTranscription] Audio extraction completed');
        resolve();
      })
      .on('error', (error) => {
        console.error('[VideoTranscription] FFmpeg error:', error);
        
        // Provide more specific error messages based on the type of error
        let errorMessage = `Audio extraction failed: ${error.message}`;
        
        if (error.message.includes('Cannot find ffmpeg')) {
          errorMessage = 'Cannot find ffmpeg. Please ensure FFmpeg is properly installed.';
          console.error('[VideoTranscription] FFmpeg not found. Installed paths checked:');
          console.error('[VideoTranscription] - @ffmpeg-installer path:', ffmpegPathSet ? 'Found' : 'Not found');
          console.error('[VideoTranscription] - System paths checked: /usr/local/bin/ffmpeg, /usr/bin/ffmpeg, /opt/homebrew/bin/ffmpeg');
        } else if (error.message.includes('No such file')) {
          errorMessage = `Input video file not found: ${videoPath}`;
        } else if (error.message.includes('Invalid data')) {
          errorMessage = 'Invalid video file format or corrupted file';
        } else if (error.message.includes('Permission denied')) {
          errorMessage = 'Permission denied accessing video file or output directory';
        }
        
        reject(new Error(errorMessage));
      })
      .save(outputPath);
  });
}

/**
 * Splits audio file into chunks if it's too large for Whisper API
 */
async function splitAudioIntoChunks(
  audioFilePath: string,
  maxSizeBytes: number = 15 * 1024 * 1024 // 15MB to be safe (Whisper limit is 25MB)
): Promise<string[]> {
  const audioStats = await fs.stat(audioFilePath);
  
  if (audioStats.size <= maxSizeBytes) {
    // File is small enough, return as single chunk
    return [audioFilePath];
  }

  console.log(`[VideoTranscription] Audio file too large (${(audioStats.size / 1024 / 1024).toFixed(2)}MB), splitting into chunks...`);
  
  // Calculate chunk duration based on file size
  // Estimate: assume roughly 1MB per minute of audio at current settings
  const estimatedDurationMinutes = audioStats.size / (1024 * 1024);
  const maxChunkDurationMinutes = (maxSizeBytes / (1024 * 1024)); // Rough estimate
  const numberOfChunks = Math.ceil(estimatedDurationMinutes / maxChunkDurationMinutes);
  
  console.log(`[VideoTranscription] Estimated duration: ${estimatedDurationMinutes.toFixed(1)} minutes, creating ${numberOfChunks} chunks`);

  const chunkPaths: string[] = [];
  const baseDir = path.dirname(audioFilePath);
  const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
  
  // Split audio into chunks
  for (let i = 0; i < numberOfChunks; i++) {
    const chunkPath = path.join(baseDir, `${baseName}_chunk_${i}.mp3`);
    const startTime = i * maxChunkDurationMinutes * 60; // Convert to seconds
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioFilePath)
        .seekInput(startTime)
        .duration(maxChunkDurationMinutes * 60) // Duration in seconds
        .audioCodec('libmp3lame')
        .audioBitrate('48k') // Match the main extraction bitrate
        .audioChannels(1)
        .audioFrequency(16000)
        .format('mp3')
        .on('end', () => {
          console.log(`[VideoTranscription] Created chunk ${i + 1}/${numberOfChunks}: ${chunkPath}`);
          resolve();
        })
        .on('error', (error) => {
          console.error(`[VideoTranscription] Error creating chunk ${i + 1}:`, error);
          reject(new Error(`Failed to create audio chunk ${i + 1}: ${error.message}`));
        })
        .save(chunkPath);
    });
    
    // Verify chunk was created and has reasonable size
    try {
      const chunkStats = await fs.stat(chunkPath);
      if (chunkStats.size > 0) {
        chunkPaths.push(chunkPath);
      } else {
        console.warn(`[VideoTranscription] Chunk ${i + 1} is empty, skipping`);
      }
    } catch (error) {
      console.warn(`[VideoTranscription] Chunk ${i + 1} was not created properly, skipping`);
    }
  }
  
  console.log(`[VideoTranscription] Successfully created ${chunkPaths.length} audio chunks`);
  return chunkPaths;
}

/**
 * Transcribes multiple audio chunks and combines the results
 */
async function transcribeAudioChunks(chunkPaths: string[]): Promise<VideoTranscriptionResult> {
  if (chunkPaths.length === 1) {
    // Single chunk, use existing function
    return await transcribeAudioWithWhisper(chunkPaths[0]);
  }

  console.log(`[VideoTranscription] Transcribing ${chunkPaths.length} audio chunks...`);
  
  const transcripts: string[] = [];
  let totalDuration = 0;
  
  for (let i = 0; i < chunkPaths.length; i++) {
    const chunkPath = chunkPaths[i];
    console.log(`[VideoTranscription] Transcribing chunk ${i + 1}/${chunkPaths.length}: ${path.basename(chunkPath)}`);
    
    try {
      const chunkResult = await transcribeAudioWithWhisper(chunkPath);
      
      if (chunkResult.error) {
        console.error(`[VideoTranscription] Error transcribing chunk ${i + 1}:`, chunkResult.error);
        return {
          transcript: '',
          error: `Failed to transcribe audio chunk ${i + 1}: ${chunkResult.error}`
        };
      }
      
      if (chunkResult.transcript && chunkResult.transcript.trim()) {
        transcripts.push(chunkResult.transcript.trim());
      }
      
      // Clean up chunk file after processing
      try {
        await fs.remove(chunkPath);
      } catch (cleanupError) {
        console.warn(`[VideoTranscription] Failed to cleanup chunk ${i + 1}:`, cleanupError);
      }
      
    } catch (error) {
      console.error(`[VideoTranscription] Exception transcribing chunk ${i + 1}:`, error);
      return {
        transcript: '',
        error: `Exception during chunk ${i + 1} transcription: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  // Combine all transcripts
  const combinedTranscript = transcripts.join(' ');
  
  console.log(`[VideoTranscription] Successfully transcribed ${transcripts.length} chunks, total length: ${combinedTranscript.length} characters`);
  
  return {
    transcript: combinedTranscript,
    language: 'auto-detected'
  };
}

/**
 * Transcribes audio file using OpenAI Whisper API (handles chunking for large files)
 */
async function transcribeAudioWithWhisper(audioFilePath: string): Promise<VideoTranscriptionResult> {
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized - check API key configuration');
    }

    // Check if audio file exists and get its size
    const audioStats = await fs.stat(audioFilePath);
    console.log(`[VideoTranscription] Audio file size: ${(audioStats.size / 1024 / 1024).toFixed(2)} MB`);

    // OpenAI Whisper API has a 25MB file size limit - throw error immediately for large files
    if (audioStats.size > 25 * 1024 * 1024) {
      throw new Error(`Audio file too large for Whisper API (max 25MB). Consider splitting the video into smaller segments.`);
    }

    // Create a file stream for the audio
    const audioStream = fs.createReadStream(audioFilePath);

    console.log('[VideoTranscription] Sending audio to OpenAI Whisper API...');
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: undefined, // Auto-detect language
      response_format: 'text',
      temperature: 0.1 // Lower temperature for more consistent transcription
    });

    if (!transcription || typeof transcription !== 'string') {
      throw new Error('Invalid response from Whisper API');
    }

    console.log(`[VideoTranscription] Transcription completed: ${transcription.length} characters`);

    return {
      transcript: transcription.trim(),
      language: 'auto-detected' // Whisper auto-detects language
    };

  } catch (error) {
    console.error('[VideoTranscription] Whisper API error:', error);
    
    if (error instanceof Error) {
      // Check for the custom file size error message we might return directly or other known patterns
      if (error.message.includes('Audio file too large') || error.message.includes('max 25MB') || 
          error.message.includes('maximum content length exceeded') || 
          error.message.includes('file size')) {
        return {
          transcript: '',
          error: 'Audio file is too large for the transcription service (max 25MB). This should be handled by chunking.'
        };
      } else if (error.message.includes('API key')) {
        return {
          transcript: '',
          error: 'Transcription service configuration error. Please contact support.'
        };
      } else if (error.message.includes('rate limit')) {
        return {
          transcript: '',
          error: 'Transcription service is temporarily overloaded. Please try again in a few minutes.'
        };
      }
    }

    return {
      transcript: '',
      error: 'Failed to transcribe audio. Please ensure the video contains clear speech or check service status.'
    };
  }
}

/**
 * Gets video file information (duration, format, etc.)
 */
export async function getVideoInfo(videoFilePath: string): Promise<{
  duration: number;
  format: string;
  size: number;
}> {
  const stats = await fs.stat(videoFilePath);
  
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoFilePath, (error, metadata) => {
      if (error) {
        reject(new Error(`Failed to analyze video: ${error.message}`));
        return;
      }

      const duration = metadata.format.duration || 0;
      const format = metadata.format.format_name || 'unknown';

      resolve({
        duration,
        format,
        size: stats.size
      });
    });
  });
}

/**
 * Validates if the uploaded file is a supported video format
 */
export function validateVideoFile(filePath: string, originalName: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`[VideoTranscription] Validating file: ${originalName}`);
    console.log(`[VideoTranscription] File path: ${filePath}`);
    
    // First check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('[VideoTranscription] File does not exist at path:', filePath);
      resolve(false);
      return;
    }

    // Check file size
    try {
      const stats = fs.statSync(filePath);
      console.log(`[VideoTranscription] File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (stats.size === 0) {
        console.error('[VideoTranscription] File is empty');
        resolve(false);
        return;
      }
    } catch (error) {
      console.error('[VideoTranscription] Error reading file stats:', error);
      resolve(false);
      return;
    }

    // Set a timeout for FFprobe to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('[VideoTranscription] FFprobe timeout, using fallback validation');
      const supportedExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
      const fileExtension = path.extname(originalName).toLowerCase();
      const isValidExtension = supportedExtensions.includes(fileExtension);
      console.log(`[VideoTranscription] Timeout fallback - Extension: ${fileExtension}, Valid: ${isValidExtension}`);
      resolve(isValidExtension);
    }, 10000); // 10 second timeout

    ffmpeg.ffprobe(filePath, (error, metadata) => {
      clearTimeout(timeout); // Clear the timeout since we got a response
      
      if (error) {
        console.error('[VideoTranscription] FFprobe error:', error);
        console.error('[VideoTranscription] FFprobe error message:', error.message);
        
        // If FFprobe fails, use fallback validation based on file extension and MIME type
        const supportedExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
        const fileExtension = path.extname(originalName).toLowerCase();
        const isValidExtension = supportedExtensions.includes(fileExtension);
        
        console.log(`[VideoTranscription] FFprobe failed, using fallback validation`);
        console.log(`[VideoTranscription] File extension: ${fileExtension}`);
        console.log(`[VideoTranscription] Valid extension: ${isValidExtension}`);
        
        // Be more permissive - if it has a valid extension, allow it through
        // The transcription process will catch any real issues
        resolve(isValidExtension);
        return;
      }

      console.log('[VideoTranscription] FFprobe metadata obtained successfully');
      console.log('[VideoTranscription] Format:', metadata.format?.format_name);
      console.log('[VideoTranscription] Duration:', metadata.format?.duration);
      console.log('[VideoTranscription] Streams count:', metadata.streams?.length);

      if (!metadata.streams || metadata.streams.length === 0) {
        console.error('[VideoTranscription] No streams found in file');
        
        // Even if no streams found, try fallback validation
        const supportedExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
        const fileExtension = path.extname(originalName).toLowerCase();
        const isValidExtension = supportedExtensions.includes(fileExtension);
        console.log(`[VideoTranscription] No streams fallback - Extension: ${fileExtension}, Valid: ${isValidExtension}`);
        resolve(isValidExtension);
        return;
      }

      // Check if file has video streams
      const hasVideoStream = metadata.streams.some(stream => {
        console.log(`[VideoTranscription] Stream type: ${stream.codec_type}, codec: ${stream.codec_name}`);
        return stream.codec_type === 'video';
      });
      
      const hasAudioStream = metadata.streams.some(stream => {
        return stream.codec_type === 'audio';
      });

      console.log(`[VideoTranscription] Has video stream: ${hasVideoStream}`);
      console.log(`[VideoTranscription] Has audio stream: ${hasAudioStream}`);

      // For note generation, we primarily need audio, but video presence is also good
      const isValid = hasAudioStream || hasVideoStream;
      console.log(`[VideoTranscription] File validation result: ${isValid}`);
      
      // If FFprobe says invalid but file has proper extension, be more lenient
      if (!isValid) {
        console.warn('[VideoTranscription] FFprobe validation failed, checking fallback...');
        const supportedExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
        const fileExtension = path.extname(originalName).toLowerCase();
        const isValidExtension = supportedExtensions.includes(fileExtension);
        
        if (isValidExtension) {
          console.warn('[VideoTranscription] Using fallback validation - file has valid extension');
          resolve(true); // Be permissive for files with correct extensions
          return;
        }
      }
      
      resolve(isValid);
    });
  });
}

/**
 * Creates a safe temporary directory for video processing
 */
export async function createTempDirectory(): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp', 'video-processing', `session_${Date.now()}`);
  await fs.ensureDir(tempDir);
  return tempDir;
}

/**
 * Cleans up temporary files and directories
 */
export async function cleanupTempDirectory(tempDir: string): Promise<void> {
  try {
    await fs.remove(tempDir);
    console.log(`[VideoTranscription] Cleaned up temp directory: ${tempDir}`);
  } catch (error) {
    console.warn(`[VideoTranscription] Failed to cleanup temp directory: ${tempDir}`, error);
  }
} 