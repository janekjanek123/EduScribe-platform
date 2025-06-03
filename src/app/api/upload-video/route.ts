import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateNotes } from '@/services/ai';
import { transcribeVideoFile, validateVideoFile, createTempDirectory, cleanupTempDirectory, getVideoInfo } from '@/services/videoTranscription';
import { checkUsageLimits, incrementUsage, refreshSavedNotesCount } from '@/services/subscription';
import { queueRequest } from '@/services/queue';
import fs from 'fs-extra';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Get user's subscription plan for queue priority
 */
async function getSubscriptionPlan(userId: string): Promise<{ planId: 'free' | 'student' | 'pro' }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase
      .from('user_subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    const planId = data?.plan_id;
    
    // Ensure we return a valid plan type
    if (planId === 'student' || planId === 'pro') {
      return { planId };
    }
    
    return { planId: 'free' };
  } catch (error) {
    console.warn('[Upload Video API] Could not fetch subscription:', error);
    return { planId: 'free' };
  }
}

/**
 * Video Upload API Endpoint - Independent System
 * 
 * Processes uploaded video files to:
 * 1. Validate and store the video file
 * 2. Extract audio and transcribe using Whisper
 * 3. Generate AI notes from transcript
 * 4. Store in isolated video_upload_notes table
 */
export async function POST(request: NextRequest) {
  console.log('[Upload Video API] Request received: POST');

  let tempDir: string | null = null;
  let videoFilePath: string | null = null;

  try {
    // STEP 1: Authenticate the request
    console.log('[Upload Video API] Authenticating request');
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Upload Video API] Authentication missing');
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        message: 'Valid Bearer token is required'
      }, { status: 401 });
    }

    // Initialize Supabase client with the token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the user's token and set the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[Upload Video API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Upload Video API] User authenticated: ${user.id}`);

    // STEP 1.5: Check usage limits BEFORE processing
    console.log('[Upload Video API] Checking usage limits');
    const usageCheck = await checkUsageLimits(user.id, token, 'video');
    
    if (!usageCheck.canGenerate) {
      console.log(`[Upload Video API] Generation limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Generation limit reached',
        message: usageCheck.reason || 'You have reached your monthly note generation limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 }); // 429 = Too Many Requests
    }
    
    if (!usageCheck.canSave) {
      console.log(`[Upload Video API] Storage limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Storage limit reached',
        message: usageCheck.reason || 'You have reached your saved notes limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 });
    }
    
    console.log(`[Upload Video API] Usage check passed - can generate: ${usageCheck.canGenerate}, can save: ${usageCheck.canSave}`);

    // Get user's subscription for priority
    const subscription = await getSubscriptionPlan(user.id);
    
    // Wrap the processing in queue
    const result = await queueRequest(
      user.id,
      subscription.planId,
      'video-upload',
      async () => {
        // STEP 2: Parse the multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const customTitle = formData.get('title') as string;

        if (!file) {
          console.error('[Upload Video API] No file provided');
          return {
            success: false,
            error: 'Missing file',
            message: 'Please provide a video file to upload'
          };
        }

        console.log(`[Upload Video API] File received: ${file.name} (${file.size} bytes, ${file.type})`);

        // STEP 3: Validate file type and size
        const allowedTypes = [
          'video/mp4',
          'video/mov',
          'video/quicktime',
          'video/webm',
          'video/avi',
          'video/mkv'
        ];

        if (!allowedTypes.includes(file.type)) {
          console.error(`[Upload Video API] Unsupported file type: ${file.type}`);
          return {
            success: false,
            error: 'Unsupported file type',
            message: 'Please upload a video file (.mp4, .mov, .webm, .avi, .mkv)'
          };
        }

        // Check file size (limit to 200MB)
        const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
        if (file.size > MAX_FILE_SIZE) {
          console.error(`[Upload Video API] File too large: ${file.size} bytes`);
          return {
            success: false,
            error: 'File too large',
            message: 'Video file must be smaller than 200MB'
          };
        }

        console.log(`[Upload Video API] File validated successfully`);

        // STEP 4: Create temporary directory and save file
        tempDir = await createTempDirectory();
        const fileName = `video_${Date.now()}_${file.name}`;
        videoFilePath = path.join(tempDir, fileName);
        
        console.log(`[Upload Video API] Saving file to: ${videoFilePath}`);
        
        // Convert File to Buffer and save
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(videoFilePath, fileBuffer);

        console.log(`[Upload Video API] File saved successfully`);

        // STEP 5: Validate video file format using FFmpeg
        console.log('[Upload Video API] Validating video format...');
        console.log(`[Upload Video API] File details: name=${file.name}, size=${file.size}, type=${file.type}`);
        console.log(`[Upload Video API] Temp file path: ${videoFilePath}`);
        
        try {
          const isValidVideo = await validateVideoFile(videoFilePath, file.name);
          console.log(`[Upload Video API] Video validation result: ${isValidVideo}`);
          
          if (!isValidVideo) {
            console.error('[Upload Video API] Video validation failed');
            console.error(`[Upload Video API] File: ${file.name} (${file.type}) - ${file.size} bytes`);
            
            // Try to get more information about why validation failed
            try {
              const fileExists = await fs.pathExists(videoFilePath);
              console.log(`[Upload Video API] File exists at temp path: ${fileExists}`);
              
              if (fileExists) {
                const stats = await fs.stat(videoFilePath);
                console.log(`[Upload Video API] Temp file size: ${stats.size} bytes`);
              }
            } catch (debugError) {
              console.error('[Upload Video API] Debug error:', debugError);
            }
            
            return {
              success: false,
              error: 'Invalid video',
              message: 'The uploaded file is not a valid video or does not contain audio. Please ensure you upload a valid video file with audio content.'
            };
          }
        } catch (validationError) {
          console.error('[Upload Video API] Video validation threw error:', validationError);
          return {
            success: false,
            error: 'Validation failed',
            message: 'Failed to validate video file. Please try uploading again.'
          };
        }

        // STEP 6: Get video information
        console.log('[Upload Video API] Analyzing video...');
        let videoInfo;
        try {
          videoInfo = await getVideoInfo(videoFilePath);
          console.log(`[Upload Video API] Video info: ${JSON.stringify(videoInfo)}`);
        } catch (error) {
          console.error('[Upload Video API] Failed to analyze video:', error);
          videoInfo = { duration: 0, format: 'unknown', size: file.size };
        }

        // STEP 7: Transcribe video using Whisper
        console.log('[Upload Video API] Starting video transcription...');
        
        const transcriptionResult = await transcribeVideoFile(
          videoFilePath,
          tempDir,
          (progress) => {
            console.log(`[Upload Video API] Transcription progress: ${progress.step} - ${progress.progress}% - ${progress.message}`);
            // In a real application, you might want to emit this progress via WebSocket or Server-Sent Events
          }
        );

        if (transcriptionResult.error || !transcriptionResult.transcript) {
          console.error('[Upload Video API] Transcription failed:', transcriptionResult.error);
          return {
            success: false,
            error: 'Transcription failed',
            message: transcriptionResult.error || 'Failed to transcribe video audio'
          };
        }

        console.log(`[Upload Video API] Transcription completed: ${transcriptionResult.transcript.length} characters`);

        // STEP 8: Generate notes using AI
        console.log('[Upload Video API] Generating notes from transcript');
        let notesResult;
        
        try {
          notesResult = await generateNotes({
            transcript: transcriptionResult.transcript,
            videoTitle: customTitle || file.name
          });
          
          if (!notesResult.content) {
            console.error('[Upload Video API] AI note generation failed:', notesResult.error);
            return {
              success: false,
              error: 'Note generation failed',
              message: notesResult.error || 'Failed to generate notes from the transcript'
            };
          }
          
          console.log(`[Upload Video API] Successfully generated notes (${notesResult.content.length} chars)`);
        } catch (aiError: any) {
          console.error('[Upload Video API] Error during AI note generation:', aiError);
          return {
            success: false,
            error: 'AI processing failed',
            message: aiError.message || 'An error occurred while generating notes with AI'
          };
        }

        // STEP 9: Create the note record for video_upload_notes table
        const noteId = `video_upload_${Date.now()}`;
        const noteData = {
          id: noteId,
          user_id: user.id,
          title: customTitle || `Video Notes - ${file.name}`,
          file_name: file.name,
          file_size: file.size,
          duration: videoInfo.duration || 0,
          transcript: transcriptionResult.transcript,
          content: notesResult.content,
          summary: notesResult.summary,
          quiz: notesResult.quiz,
          language: transcriptionResult.language || 'auto-detected'
        };

        console.log(`[Upload Video API] Created note with ID: ${noteId}`);
        console.log('[Upload Video API] Note data structure:', Object.keys(noteData).join(', '));

        // STEP 10: Store the note in Supabase video_upload_notes table
        console.log('[Upload Video API] Storing note in Supabase');
        
        try {
          // First attempt to insert the data
          let { data, error } = await supabase
            .from('video_upload_notes')
            .insert(noteData)
            .select()
            .single();
            
          if (error) {
            console.error('[Upload Video API] Database storage error:', JSON.stringify(error, null, 2));
            
            // Handle specific database errors
            if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
              // Table doesn't exist - we can't create it with RPC, so let's just return a more helpful error
              console.error('[Upload Video API] Table video_upload_notes does not exist');
              return {
                success: false,
                error: 'Database setup required',
                message: 'The video notes database table needs to be set up. Please contact support.',
                details: {
                  code: error.code,
                  message: error.message,
                  hint: 'Table video_upload_notes does not exist'
                }
              };
            }
            
            // Handle other database errors
            if (error.code === '23505') {
              // Duplicate key - try with a new ID
              const newNoteId = `video_upload_${Date.now()}_retry`;
              const retryNoteData = { ...noteData, id: newNoteId };
              
              console.log('[Upload Video API] Duplicate ID detected, retrying with new ID:', newNoteId);
              
              const { data: retryData, error: retryError } = await supabase
                .from('video_upload_notes')
                .insert(retryNoteData)
                .select()
                .single();
                
              if (retryError) {
                console.error('[Upload Video API] Retry insert failed:', JSON.stringify(retryError, null, 2));
                return {
                  success: false,
                  error: 'Database error',
                  message: 'Failed to store the notes in the database after retry',
                  details: {
                    code: retryError.code,
                    message: retryError.message
                  }
                };
              }
              
              data = retryData;
            } else {
              // Other errors
              console.error('[Upload Video API] Unhandled database error:', JSON.stringify(error, null, 2));
              return {
                success: false,
                error: 'Database error',
                message: 'Failed to store the notes in the database',
                details: {
                  code: error.code,
                  message: error.message,
                  hint: error.hint
                }
              };
            }
          }
          
          if (!data) {
            console.error('[Upload Video API] No data returned from insert operation');
            return {
              success: false,
              error: 'Database error',
              message: 'No data returned from database insert operation'
            };
          }
          
          console.log(`[Upload Video API] Successfully stored note: ${data.id}`);
          
          // STEP 11: Increment usage counters
          try {
            await incrementUsage(user.id, token, 'video');
            console.log('[Upload Video API] Usage incremented successfully');
          } catch (usageError) {
            console.warn('[Upload Video API] Failed to increment usage:', usageError);
            // Don't fail the request for usage tracking errors
          }

          // STEP 11.5: Refresh saved notes count
          console.log('[Upload Video API] Refreshing saved notes count');
          try {
            await refreshSavedNotesCount(user.id, token);
            console.log('[Upload Video API] Saved notes count refreshed');
          } catch (countError) {
            console.error('[Upload Video API] Saved notes count refresh failed (note still created):', countError);
            // Don't fail the request if count refresh fails
          }
          
          // STEP 12: Cleanup temporary files
          if (tempDir) {
            await cleanupTempDirectory(tempDir);
          }
          
          console.log('[Upload Video API] Video processing completed successfully');
          
          return {
            success: true,
            message: 'Video processed and notes generated successfully',
            data: {
              id: data.id,
              title: data.title,
              content: data.content,
              summary: data.summary,
              quiz: data.quiz,
              transcript: data.transcript,
              duration: data.duration,
              language: data.language,
              created_at: data.created_at
            }
          };
          
        } catch (dbError: any) {
          console.error('[Upload Video API] Database operation failed:', JSON.stringify(dbError, null, 2));
          return {
            success: false,
            error: 'Database error',
            message: 'Failed to store the notes in the database',
            details: {
              message: dbError.message,
              code: dbError.code,
              name: dbError.name
            }
          };
        }
      }
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Upload Video API] Unexpected error:', error);
    
    // Cleanup on error
    if (tempDir) {
      await cleanupTempDirectory(tempDir);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error.message || 'An unexpected error occurred while processing the video'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve user's uploaded video notes
 */
export async function GET(request: NextRequest) {
  console.log('[Upload Video API] Request received: GET');
  
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed' 
      }, { status: 401 });
    }

    // Fetch user's video upload notes
    const { data: notes, error } = await supabase
      .from('video_upload_notes')
      .select('id, title, file_name, duration, content, summary, quiz, language, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Upload Video API] Error fetching notes:', error);
      
      if (error.code === '42P01') {
        // Table doesn't exist yet
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No video upload notes found'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch video upload notes'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: notes || [],
      count: notes?.length || 0
    });

  } catch (error: any) {
    console.error('[Upload Video API] GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error.message || 'Failed to fetch video upload notes'
    }, { status: 500 });
  }
}

/**
 * DELETE endpoint to delete a specific video upload note
 */
export async function DELETE(request: NextRequest) {
  console.log('[Upload Video API] Request received: DELETE');
  
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed' 
      }, { status: 401 });
    }

    // Get the note ID from query parameters
    const noteId = request.nextUrl.searchParams.get('id');
    if (!noteId) {
      return NextResponse.json({
        success: false,
        error: 'Missing note ID',
        message: 'Note ID is required for deletion'
      }, { status: 400 });
    }

    console.log(`[Upload Video API] Deleting note with ID: ${noteId}`);

    // Delete the note (with user ownership check)
    const { data, error } = await supabase
      .from('video_upload_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id) // Ensure user can only delete their own notes
      .select();
      
    if (error) {
      console.error('[Upload Video API] Database delete error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete the note from the database',
        details: {
          code: error.code,
          message: error.message
        }
      }, { status: 500 });
    }
    
    // Check if any rows were affected
    if (!data || data.length === 0) {
      console.error(`[Upload Video API] Note not found or access denied: ${noteId}`);
      return NextResponse.json({
        success: false,
        error: 'Note not found',
        message: 'The note was not found or you do not have permission to delete it'
      }, { status: 404 });
    }
    
    console.log(`[Upload Video API] Successfully deleted note: ${noteId}`);

    // Refresh saved notes count after deletion
    try {
      await refreshSavedNotesCount(user.id, token);
      console.log('[Upload Video API] Saved notes count refreshed after deletion');
    } catch (countError) {
      console.error('[Upload Video API] Saved notes count refresh failed after deletion:', countError);
      // Don't fail the request if count refresh fails
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
      data: data[0]
    });

  } catch (error: any) {
    console.error('[Upload Video API] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error.message || 'Failed to delete video upload note'
    }, { status: 500 });
  }
} 