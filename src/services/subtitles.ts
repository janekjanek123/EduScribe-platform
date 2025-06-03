import fs from 'fs';
import path from 'path';
import { execaCommand } from 'execa';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import * as subtitle from 'subtitle';
import { isValidYouTubeId } from './youtube';
import ytdl from 'ytdl-core';
import https from 'https';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

// Flag to ensure we only show the warning once per session
let ytDlpWarningShown = false;

/**
 * Checks if yt-dlp is installed on the system
 * @returns true if yt-dlp is available, false otherwise
 */
export async function isYtDlpAvailable(): Promise<boolean> {
  try {
    // First try using 'which' on Unix-like systems
    try {
      await execaCommand('which yt-dlp', { shell: true });
      return true;
    } catch {
      // If 'which' fails, try to execute yt-dlp directly
      await execaCommand('yt-dlp --version', { shell: true });
      return true;
    }
  } catch (error) {
    if (!ytDlpWarningShown && process.env.NODE_ENV === 'development') {
      console.warn('\n⚠️ WARNING: yt-dlp is not available on this system!');
      console.warn('⚠️ YouTube subtitle extraction will fail without yt-dlp.');
      console.warn('For subtitle support, please install yt-dlp:');
      console.warn('  • macOS: brew install yt-dlp');
      console.warn('  • Linux/macOS: pip install yt-dlp');
      console.warn('  • Windows: pip install yt-dlp or choco install yt-dlp\n');
      ytDlpWarningShown = true;
    }
    return false;
  }
}

/**
 * Downloads subtitles from a YouTube video using yt-dlp
 * @param videoId YouTube video ID
 * @param languages Languages to try, in order of preference
 * @returns The path to the downloaded subtitle file or null if not available
 */
export async function downloadSubtitles(
  videoId: string,
  languages: string[] = ['pl', 'en']
): Promise<string | null> {
  if (!isValidYouTubeId(videoId)) {
    console.error('[Subtitles] Invalid video ID:', videoId);
    return null;
  }

  // Check if yt-dlp is available
  const ytDlpAvailable = await isYtDlpAvailable();
  
  if (ytDlpAvailable) {
    // Use yt-dlp if available
    return downloadWithYtDlp(videoId, languages);
  } else {
    // No fallback to ytdl-core - it's not reliable enough
    console.error('[Subtitles] yt-dlp is not installed. Cannot download subtitles reliably.');
    throw new Error(
      'yt-dlp is required for reliable subtitle extraction. Please install yt-dlp on your system:\n' +
      '• macOS: brew install yt-dlp\n' +
      '• Linux/macOS: pip install yt-dlp\n' +
      '• Windows: pip install yt-dlp or choco install yt-dlp'
    );
  }
}

/**
 * Downloads subtitles using yt-dlp
 * @param videoId YouTube video ID
 * @param languages Languages to try, in order of preference
 * @returns The path to the downloaded subtitle file or null if not available
 */
async function downloadWithYtDlp(
  videoId: string,
  languages: string[] = ['pl', 'en']
): Promise<string | null> {
  // Create a temporary directory for downloads
  const tempDir = path.join(process.cwd(), 'temp');
  
  try {
    // Ensure temp directory exists with proper permissions
    if (!fs.existsSync(tempDir)) {
      try {
        fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
        console.log(`[Subtitles] Created temporary directory: ${tempDir}`);
      } catch (mkdirError: any) {
        console.error(`[Subtitles] Failed to create temporary directory: ${tempDir}`, mkdirError);
        throw new Error(`Permission denied: Could not create temporary directory: ${mkdirError.message}`);
      }
    } else {
      // Verify we can write to the temp directory
      try {
        const testFile = path.join(tempDir, `test-${Date.now()}.txt`);
        fs.writeFileSync(testFile, 'test', { mode: 0o644 });
        fs.unlinkSync(testFile);
        console.log(`[Subtitles] Verified write access to temp directory: ${tempDir}`);
      } catch (accessError: any) {
        console.error(`[Subtitles] No write access to temp directory: ${tempDir}`, accessError);
        throw new Error(`Permission denied: Cannot write to temporary directory: ${accessError.message}`);
      }
    }

    // Generate a unique output filename
    const uniqueId = randomUUID();
    const outputTemplate = path.join(tempDir, `${uniqueId}-%(id)s.%(ext)s`);

    // Build language preference string
    const langPref = languages.join(',');
    console.log(`[Subtitles] Downloading subtitles for video ${videoId} in languages: ${langPref}`);

    // First get info about available subtitle tracks
    try {
      console.log('[Subtitles] Checking available subtitle tracks...');
      const { stdout: listOutput } = await execaCommand(
        `yt-dlp --list-subs https://www.youtube.com/watch?v=${videoId}`,
        { shell: true, timeout: 20000 }
      );
      
      console.log('[Subtitles] Available subtitle info:');
      console.log(listOutput);
      
      // Check if the output indicates any subtitles are available
      const hasManualSubs = listOutput.includes('has no subtitles') ? false : true;
      const hasAutoSubs = listOutput.includes('has no automatic captions') ? false : true;
      
      console.log(`[Subtitles] Manual subtitles available: ${hasManualSubs}`);
      console.log(`[Subtitles] Auto-generated subtitles available: ${hasAutoSubs}`);
    } catch (infoError) {
      console.warn('[Subtitles] Error checking subtitle availability:', infoError);
      // Continue anyway, as this is just informational
    }

    try {
      // First try to get regular subtitles (manually created)
      let subtitleFile = null;
      const possibleExtensions = ['.vtt', '.srt'];
      
      try {
        console.log('[Subtitles] Trying to download regular subtitles first...');
        
        // Add verbosity for debugging
        const ytDlpCommand = `yt-dlp --verbose --write-sub --sub-lang ${langPref} --skip-download --output "${outputTemplate}" https://www.youtube.com/watch?v=${videoId}`;
        console.log(`[Subtitles] Running command: ${ytDlpCommand}`);
        
        const { stdout, stderr } = await execaCommand(
          ytDlpCommand,
          { shell: true, timeout: 30000 } // Add a timeout of 30 seconds
        );
        
        console.log('[Subtitles] yt-dlp stdout:', stdout);
        if (stderr) console.warn('[Subtitles] yt-dlp stderr:', stderr);
        
        // Check if a subtitle file was created
        for (const ext of possibleExtensions) {
          const potentialFile = path.join(tempDir, `${uniqueId}-${videoId}${ext}`);
          if (await exists(potentialFile)) {
            subtitleFile = potentialFile;
            console.log('[Subtitles] Successfully downloaded regular subtitles:', path.basename(potentialFile));
            break;
          }
        }
        
        // Also check for language-specific filename patterns
        if (!subtitleFile) {
          for (const lang of languages) {
            for (const ext of possibleExtensions) {
              // Check patterns like: uniqueId-videoId.lang.ext or uniqueId-videoId.lang_type.ext
              const langFilePatterns = [
                path.join(tempDir, `${uniqueId}-${videoId}.${lang}${ext}`),
                path.join(tempDir, `${uniqueId}-${videoId}.${lang}_*${ext}`)
              ];
              
              for (const pattern of langFilePatterns) {
                // Need to use glob pattern matching here
                const { stdout: globResult } = await execaCommand(`ls ${pattern} 2>/dev/null || echo ''`, { shell: true });
                
                if (globResult && globResult.trim() !== '') {
                  const files = globResult.trim().split('\n');
                  if (files.length > 0 && files[0] !== '') {
                    subtitleFile = files[0];
                    console.log('[Subtitles] Found language-specific subtitle file:', path.basename(subtitleFile));
                    break;
                  }
                }
              }
              
              if (subtitleFile) break;
            }
            if (subtitleFile) break;
          }
        }
        
        if (subtitleFile) {
          // Verify file is not empty
          const stats = await fs.promises.stat(subtitleFile);
          if (stats.size === 0) {
            console.warn('[Subtitles] Downloaded subtitle file is empty, will try auto-generated subtitles');
            subtitleFile = null;
          } else {
            return subtitleFile;
          }
        }
        
        console.log('[Subtitles] No regular subtitles found, trying auto-generated...');
      } catch (error) {
        console.warn('[Subtitles] Error downloading regular subtitles, trying auto-generated:', error);
      }
      
      // If we reach here, no regular subtitles were found, try auto-generated
      try {
        // Add verbosity for debugging
        const autoSubCommand = `yt-dlp --verbose --write-auto-sub --sub-lang ${langPref} --skip-download --output "${outputTemplate}" https://www.youtube.com/watch?v=${videoId}`;
        console.log(`[Subtitles] Running command: ${autoSubCommand}`);
        
        const { stdout, stderr } = await execaCommand(
          autoSubCommand,
          { shell: true, timeout: 30000 } // Add a timeout of 30 seconds
        );

        console.log('[Subtitles] yt-dlp auto-sub stdout:', stdout);
        if (stderr) console.warn('[Subtitles] yt-dlp auto-sub stderr:', stderr);

        // Find the generated subtitle file (vtt or srt)
        for (const ext of possibleExtensions) {
          const potentialFile = path.join(tempDir, `${uniqueId}-${videoId}${ext}`);
          if (await exists(potentialFile)) {
            // Verify file is not empty
            const stats = await fs.promises.stat(potentialFile);
            if (stats.size === 0) {
              console.warn(`[Subtitles] Auto-generated subtitle file ${path.basename(potentialFile)} is empty`);
              continue;
            }
            
            subtitleFile = potentialFile;
            console.log('[Subtitles] Found auto-generated subtitles file:', path.basename(subtitleFile));
            break;
          }
        }
        
        // Also check for language-specific auto-generated subtitles
        if (!subtitleFile) {
          for (const lang of languages) {
            for (const ext of possibleExtensions) {
              // Check patterns like: uniqueId-videoId.lang.ext or uniqueId-videoId.lang_type.ext
              const langFilePatterns = [
                path.join(tempDir, `${uniqueId}-${videoId}.${lang}${ext}`),
                path.join(tempDir, `${uniqueId}-${videoId}.${lang}_*${ext}`)
              ];
              
              for (const pattern of langFilePatterns) {
                // Need to use glob pattern matching here
                const { stdout: globResult } = await execaCommand(`ls ${pattern} 2>/dev/null || echo ''`, { shell: true });
                
                if (globResult && globResult.trim() !== '') {
                  const files = globResult.trim().split('\n');
                  if (files.length > 0 && files[0] !== '') {
                    // Verify file is not empty
                    const stats = await fs.promises.stat(files[0]);
                    if (stats.size === 0) {
                      console.warn(`[Subtitles] Auto-generated subtitle file ${path.basename(files[0])} is empty`);
                      continue;
                    }
                    
                    subtitleFile = files[0];
                    console.log('[Subtitles] Found language-specific auto-generated subtitle file:', path.basename(subtitleFile));
                    break;
                  }
                }
              }
              
              if (subtitleFile) break;
            }
            if (subtitleFile) break;
          }
        }
      } catch (error) {
        console.error('[Subtitles] Error downloading auto-generated subtitles:', error);
      }

      if (!subtitleFile) {
        // Try one more time with different format selections
        try {
          console.log('[Subtitles] Trying format-specific subtitle download as last resort...');
          
          // Try different format options
          const formatOptions = [
            '--write-subs', 
            '--write-auto-subs', 
            '--sub-format vtt', 
            '--sub-format srt'
          ];
          
          for (const format of formatOptions) {
            for (const lang of languages) {
              const lastResortCommand = `yt-dlp --verbose --sub-langs ${lang} ${format} --skip-download --output "${outputTemplate}" https://www.youtube.com/watch?v=${videoId}`;
              console.log(`[Subtitles] Running last resort command: ${lastResortCommand}`);
              
              try {
                const { stdout, stderr } = await execaCommand(
                  lastResortCommand,
                  { shell: true, timeout: 30000 }
                );
                
                console.log(`[Subtitles] Last resort attempt for ${format} ${lang} stdout:`, stdout);
                if (stderr) console.warn(`[Subtitles] Last resort attempt stderr:`, stderr);
                
                // Check for files again
                for (const ext of possibleExtensions) {
                  const potentialFile = path.join(tempDir, `${uniqueId}-${videoId}${ext}`);
                  if (await exists(potentialFile)) {
                    // Verify file is not empty
                    const stats = await fs.promises.stat(potentialFile);
                    if (stats.size === 0) {
                      console.warn(`[Subtitles] Last resort subtitle file ${path.basename(potentialFile)} is empty`);
                      continue;
                    }
                    
                    subtitleFile = potentialFile;
                    console.log('[Subtitles] Found subtitles with last resort method:', path.basename(subtitleFile));
                    break;
                  }
                  
                  // Check language variant
                  const langFile = path.join(tempDir, `${uniqueId}-${videoId}.${lang}${ext}`);
                  if (await exists(langFile)) {
                    // Verify file is not empty
                    const stats = await fs.promises.stat(langFile);
                    if (stats.size === 0) {
                      console.warn(`[Subtitles] Last resort subtitle file ${path.basename(langFile)} is empty`);
                      continue;
                    }
                    
                    subtitleFile = langFile;
                    console.log('[Subtitles] Found language-specific subtitles with last resort method:', path.basename(subtitleFile));
                    break;
                  }
                }
                
                if (subtitleFile) break;
              } catch (formatError) {
                console.warn(`[Subtitles] Format option ${format} failed:`, formatError);
                // Continue to next format
              }
            }
            
            if (subtitleFile) break;
          }
        } catch (error) {
          console.error('[Subtitles] Last resort subtitle extraction failed:', error);
        }
      }

      if (!subtitleFile) {
        console.error('[Subtitles] No subtitle file was created by yt-dlp (neither regular nor auto-generated)');
        return null;
      }

      return subtitleFile;
    } catch (error) {
      console.error('[Subtitles] Error downloading subtitles with yt-dlp:', error);
      return null;
    }
  } catch (error) {
    console.error('[Subtitles] Error downloading subtitles with yt-dlp:', error);
    return null;
  }
}

/**
 * Downloads subtitles using ytdl-core
 * @param videoId YouTube video ID
 * @param languages Languages to try, in order of preference
 * @returns The path to the downloaded subtitle file or null if not available
 */
async function downloadWithYtdlCore(
  videoId: string,
  languages: string[] = ['pl', 'en']
): Promise<string | null> {
  console.log(`[Subtitles] Using ytdl-core to get subtitles for video ${videoId}`);
  
  try {
    // Get video info
    const videoInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    
    // Find caption tracks
    const captionTracks = videoInfo.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      console.error('[Subtitles] No caption tracks found for video:', videoId);
      return null;
    }
    
    // Try to find caption in preferred languages
    let selectedCaptionTrack = null;
    
    for (const lang of languages) {
      selectedCaptionTrack = captionTracks.find(
        (track: any) => track.languageCode.toLowerCase() === lang.toLowerCase()
      );
      
      if (selectedCaptionTrack) {
        console.log(`[Subtitles] Found caption track in language: ${lang}`);
        break;
      }
    }
    
    // If no preferred language found, take the first available
    if (!selectedCaptionTrack) {
      console.log('[Subtitles] No captions in preferred languages, using first available track');
      selectedCaptionTrack = captionTracks[0];
    }
    
    // Check if we have a baseUrl to download from
    if (!selectedCaptionTrack.baseUrl) {
      console.error('[Subtitles] No baseUrl found for caption track');
      return null;
    }
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate unique file name
    const uniqueId = randomUUID();
    const subtitleFile = path.join(tempDir, `${uniqueId}-${videoId}.xml`);
    
    // Download the caption file
    await new Promise<void>((resolve, reject) => {
      https.get(selectedCaptionTrack.baseUrl, async (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP Error: ${response.statusCode}`));
          return;
        }
        
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', async () => {
          try {
            await writeFile(subtitleFile, data, 'utf8');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        
        response.on('error', (err) => {
          reject(err);
        });
      });
    });
    
    return subtitleFile;
  } catch (error: any) {
    // Check for specific error messages from ytdl-core that indicate signature issues
    const errorMessage = error?.message || '';
    
    if (
      errorMessage.includes('Could not extract signature deciphering functions') ||
      errorMessage.includes('Could not find player') ||
      errorMessage.includes('cipher') ||
      errorMessage.includes('decipher')
    ) {
      console.error('[Subtitles] YouTube signature extraction failed. This video requires yt-dlp.');
      throw new Error('This video requires yt-dlp to extract subtitles. Please install yt-dlp to support this video.');
    }
    
    console.error('[Subtitles] Error downloading subtitles with ytdl-core:', error);
    return null;
  }
}

/**
 * Parses subtitle file content into plain text
 * @param filePath Path to the subtitle file
 * @returns Plain text from subtitles or null if parsing failed
 */
export async function parseSubtitlesFile(filePath: string): Promise<string | null> {
  try {
    if (!filePath || !(await exists(filePath))) {
      console.error('[Subtitles] Invalid subtitle file path:', filePath);
      return null;
    }

    // Read the file content
    const content = await readFile(filePath, 'utf8');
    const extension = path.extname(filePath).toLowerCase();
    
    console.log(`[Subtitles] Parsing subtitle file: ${path.basename(filePath)} (${content.length} bytes)`);
    // Log the first 1000 characters of raw subtitle content
    console.log(`[Subtitles] Raw content (first 1000 chars):\n${content.substring(0, 1000)}`);
    
    let text = '';
    let parseSuccess = false;

    // Primary parsing approach
    try {
      if (extension === '.vtt' || extension === '.srt') {
        // Use subtitle package for initial parsing attempt
        const captions = subtitle.parseSync(content);
        text = captions
          .map((item: any) => item.text || '')
          .filter(Boolean)
          .join(' ');
        
        parseSuccess = text.length > 0;
        
        if (parseSuccess) {
          console.log(`[Subtitles] Successfully parsed ${captions.length} captions with primary parser`);
        } else {
          console.warn('[Subtitles] Primary parser returned empty text, will try fallback methods');
        }
      } else if (extension === '.xml') {
        // Parse YouTube XML format
        text = parseYouTubeXmlCaptions(content);
        parseSuccess = text.length > 0;
      } else {
        console.error('[Subtitles] Unsupported subtitle format:', extension);
        return null;
      }
    } catch (parseError) {
      console.warn('[Subtitles] Primary parsing failed:', parseError);
      // Log the first 500 chars of content for debugging
      console.warn('[Subtitles] Content sample:', content.substring(0, 500));
    }

    // Fallback parsing approach if primary method failed
    if (!parseSuccess) {
      console.log('[Subtitles] Attempting fallback parsing methods');
      
      try {
        // Fallback 1: Manual line-by-line parsing for VTT/SRT
        if (extension === '.vtt' || extension === '.srt') {
          console.log('[Subtitles] Trying manual line-by-line parsing');
          
          // Simple manual parser that extracts text between timestamps
          const lines = content.split('\n');
          const textLines: string[] = [];
          
          // Look for lines that don't have timestamps and aren't numeric-only indices
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip empty lines, numeric-only lines (indices), and timestamp lines
            if (
              line && 
              !/^\d+$/.test(line) && // Skip indices
              !line.includes('-->') && // Skip timestamps
              !line.startsWith('WEBVTT') && // Skip headers
              !line.startsWith('NOTE') && // Skip notes
              !line.startsWith('STYLE') // Skip style info
            ) {
              textLines.push(line);
            }
          }
          
          text = textLines.join(' ');
          parseSuccess = text.length > 0;
          
          if (parseSuccess) {
            console.log(`[Subtitles] Successfully extracted ${textLines.length} lines with manual parsing`);
          }
        }
        
        // If all parsing methods failed, log an error
        if (!parseSuccess) {
          console.error('[Subtitles] All parsing methods failed for:', filePath);
          throw new Error('Failed to parse subtitle content with all available methods');
        }
      } catch (fallbackError) {
        console.error('[Subtitles] Fallback parsing also failed:', fallbackError);
        return null;
      }
    }

    // Clean up the text
    // Remove HTML tags, extra whitespace, etc.
    text = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
      .replace(/\{.*?\}/g, '') // Remove curly brace formatting (common in SRT)
      .trim();

    // Log the first 1000 characters of cleaned text
    console.log(`[Subtitles] Cleaned text (first 1000 chars):\n${text.substring(0, 1000)}`);
    
    console.log(`[Subtitles] Final extracted text: ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('[Subtitles] Error parsing subtitle file:', error);
    return null;
  } finally {
    // Clean up the file regardless of success/failure
    try {
      await unlink(filePath);
      console.log('[Subtitles] Deleted temporary file:', filePath);
    } catch (cleanupError) {
      console.warn('[Subtitles] Error deleting temporary file:', cleanupError);
    }
  }
}

/**
 * Parses YouTube XML captions format
 * @param content XML content as string
 * @returns Plain text from captions
 */
function parseYouTubeXmlCaptions(content: string): string {
  // Simple XML parsing to extract text from <text> elements
  const textMatches = content.match(/<text[^>]*>(.*?)<\/text>/g) || [];
  const cleanedText = textMatches
    .map(match => {
      // Extract content between tags
      const text = match.replace(/<text[^>]*>(.*?)<\/text>/g, '$1');
      
      // Decode HTML entities
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    })
    .join(' ');
  
  return cleanedText;
}

/**
 * Downloads and parses subtitles from a YouTube video
 * @param videoId YouTube video ID
 * @param languages Languages to try, in order of preference
 * @returns Plain text from subtitles or null if unavailable
 */
export async function getVideoSubtitles(
  videoId: string,
  languages: string[] = ['pl', 'en']
): Promise<string | null> {
  try {
    // Input validation
    if (!videoId || typeof videoId !== 'string') {
      console.error('[Subtitles] Invalid videoId:', videoId);
      throw new Error('Invalid YouTube video ID');
    }

    // First check if yt-dlp is available to provide clearer error messages
    const ytDlpAvailable = await isYtDlpAvailable().catch(error => {
      console.error('[Subtitles] Error checking yt-dlp availability:', error);
      return false;
    });

    if (!ytDlpAvailable) {
      const errorMsg = 'yt-dlp is required for reliable subtitle extraction. Please install yt-dlp on your system:\n' +
        '• macOS: brew install yt-dlp\n' +
        '• Linux/macOS: pip install yt-dlp\n' +
        '• Windows: pip install yt-dlp or choco install yt-dlp';
      
      console.error('[Subtitles] ' + errorMsg);
      throw new Error(errorMsg);
    }
    
    // Download subtitles
    console.log(`[Subtitles] Starting subtitle extraction for video: ${videoId}`);
    const startTime = Date.now();
    
    // Add timeout for subprocess calls
    const downloadPromise = downloadSubtitles(videoId, languages);
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Subtitle download timeout after 30 seconds')), 30000);
    });
    
    const subtitlePath = await Promise.race([downloadPromise, timeoutPromise]);
    
    if (!subtitlePath) {
      const errorMsg = `No subtitles available for video ${videoId}. Either the video doesn't have subtitles, or they couldn't be downloaded.`;
      console.error('[Subtitles] ' + errorMsg);
      return null;
    }

    // Verify file exists before attempting to parse
    if (!fs.existsSync(subtitlePath)) {
      console.error(`[Subtitles] Subtitle file does not exist: ${subtitlePath}`);
      throw new Error(`Subtitle file does not exist at ${subtitlePath}`);
    }

    // Parse the subtitle file with timeout
    const parsePromise = parseSubtitlesFile(subtitlePath);
    const parseTimeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Subtitle parsing timeout after 10 seconds')), 10000);
    });
    
    const text = await Promise.race([parsePromise, parseTimeoutPromise]);
    
    if (!text) {
      const errorMsg = `Failed to parse subtitle file for video ${videoId}. The subtitle format may be unsupported or corrupted.`;
      console.error('[Subtitles] ' + errorMsg);
      return null;
    }

    const duration = Date.now() - startTime;
    console.log(`[Subtitles] Successfully extracted subtitles (${text.length} chars) for video: ${videoId} in ${duration}ms`);
    
    // Return a summary/sample for debugging
    if (text.length > 500) {
      console.log('[Subtitles] Text sample:', text.substring(0, 500) + '...');
    }
    
    return text;
  } catch (error: any) {
    // Propagate the yt-dlp requirement error
    if (error?.message?.includes('yt-dlp is required')) {
      console.error('[Subtitles] yt-dlp requirement error:', error.message);
      throw error;
    }
    
    // Handle timeout errors specifically
    if (error?.message?.includes('timeout')) {
      console.error('[Subtitles] Operation timed out:', error.message);
      throw new Error(`Subtitle extraction timed out: ${error.message}`);
    }
    
    // Handle permission errors specifically
    if (error?.message?.includes('permission denied') || 
        error?.message?.includes('EACCES') || 
        error?.message?.includes('Permission denied')) {
      console.error('[Subtitles] Permission error:', error.message);
      throw new Error(`Permission error during subtitle extraction: ${error.message}`);
    }
    
    // Create more informative error for the caller
    let errorMsg = `Error extracting subtitles for video ${videoId}: ${error?.message || 'Unknown error'}`;
    
    // Add troubleshooting hints
    if (error?.message?.includes('unavailable video')) {
      errorMsg += '\nThe video might be private, age-restricted, or requires login.';
    } else if (error?.message?.includes('permission')) {
      errorMsg += '\nCheck file system permissions in the temporary directory.';
    } else if (error?.message?.includes('network')) {
      errorMsg += '\nCheck your internet connection and try again.';
    }
    
    console.error('[Subtitles] ' + errorMsg);
    return null;
  }
}

/**
 * Extracts subtitles from a YouTube video and returns the transcript text
 * Wrapper around getVideoSubtitles for the isolated video notes system
 * 
 * @param videoId YouTube video ID
 * @returns The transcript text
 */
export async function extractSubtitles(videoId: string): Promise<string> {
  try {
    // Use existing getVideoSubtitles function with default language preferences
    const transcript = await getVideoSubtitles(videoId);
    
    if (!transcript) {
      throw new Error('No subtitles available for this video');
    }
    
    return transcript;
  } catch (error: any) {
    // Log and re-throw to ensure error handling is consistent
    console.error(`[Subtitles] Error extracting subtitles for video ${videoId}:`, error);
    throw error;
  }
} 