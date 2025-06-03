import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractYouTubeId, getVideoInfo, getVideoTranscript, isValidYouTubeId } from '@/services/youtube';
import { generateNotes } from '@/services/ai';
import { checkUsageLimits, incrementUsage, refreshSavedNotesCount } from '@/services/subscription';
import { queueRequest } from '@/services/queue';

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
    console.warn('[Video Notes API] Could not fetch subscription:', error);
    return { planId: 'free' };
  }
}

/**
 * Video Notes API Endpoint - Isolated System
 * 
 * Processes a YouTube URL to:
 * 1. Extract the video ID
 * 2. Get video information (title, thumbnail)
 * 3. Fetch the transcript
 * 4. Generate AI notes
 * 5. Store in the isolated video_notes table
 */
export async function POST(request: NextRequest) {
  console.log('[Video Notes API] Request received: POST');

  try {
    // STEP 1: Authenticate the request
    console.log('[Video Notes API] Authenticating request');
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Video Notes API] Authentication missing');
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
      console.error('[Video Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Video Notes API] User authenticated: ${user.id}`);

    // STEP 1.5: Check usage limits BEFORE processing
    console.log('[Video Notes API] Checking usage limits');
    const usageCheck = await checkUsageLimits(user.id, token, 'video');
    
    if (!usageCheck.canGenerate) {
      console.log(`[Video Notes API] Generation limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Generation limit reached',
        message: usageCheck.reason || 'You have reached your monthly note generation limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 }); // 429 = Too Many Requests
    }
    
    if (!usageCheck.canSave) {
      console.log(`[Video Notes API] Storage limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Storage limit reached',
        message: usageCheck.reason || 'You have reached your saved notes limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 });
    }
    
    console.log(`[Video Notes API] Usage check passed - can generate: ${usageCheck.canGenerate}, can save: ${usageCheck.canSave}`);

    // Get user's subscription for priority
    const subscription = await getSubscriptionPlan(user.id);
    
    // Wrap the processing in queue
    const result = await queueRequest(
      user.id,
      subscription.planId,
      'video',
      async () => {
        // Original processing logic goes here
        const body = await request.json();
        const { url, title: customTitle } = body;

        if (!url) {
          console.error('[Video Notes API] Missing URL parameter');
          return {
            success: false,
            error: 'Missing URL',
            message: 'Please provide a YouTube URL'
          };
        }

        console.log(`[Video Notes API] Processing URL: ${url}`);

        // STEP 3: Extract and validate YouTube video ID
        const videoId = extractYouTubeId(url);
        if (!videoId || !isValidYouTubeId(videoId)) {
          console.error('[Video Notes API] Invalid YouTube URL:', url);
          return {
            success: false,
            error: 'Invalid YouTube URL',
            message: 'The provided URL is not a valid YouTube video URL'
          };
        }

        console.log(`[Video Notes API] Valid YouTube ID: ${videoId}`);

        // STEP 4: Check if we already have notes for this video
        try {
          const { data: existingNote, error: existingError } = await supabase
            .from('video_notes')
            .select('id, video_id')
            .eq('video_id', videoId)
            .eq('user_id', user.id)
            .single();

          if (existingNote && !existingError) {
            console.log(`[Video Notes API] Notes already exist for video: ${videoId}`);
            return {
              success: false,
              error: 'Duplicate note',
              message: 'Notes for this video already exist',
              noteId: existingNote.id
            };
          }
        } catch (checkError) {
          console.error('[Video Notes API] Error checking for existing notes:', checkError);
          // Continue processing - this is not a critical error
        }

        // STEP 5: Get video information (title, thumbnail, etc.)
        console.log('[Video Notes API] Fetching video information');
        const videoInfo = await getVideoInfo(videoId);
        
        if (!videoInfo || videoInfo.error) {
          console.error('[Video Notes API] Failed to get video info:', videoInfo?.error || 'Unknown error');
          return {
            success: false,
            error: 'Video info error',
            message: videoInfo?.error || 'Failed to retrieve video information'
          };
        }
        
        console.log(`[Video Notes API] Video info retrieved: "${videoInfo.title}"`);

        // STEP 6: Fetch video transcript
        console.log('[Video Notes API] Fetching video transcript');
        const transcriptResult = await getVideoTranscript(videoId);
        
        if (!transcriptResult || transcriptResult.error) {
          console.error('[Video Notes API] Transcript error:', transcriptResult?.error || 'Unknown error');
          return {
            success: false,
            error: 'Transcript error',
            message: transcriptResult?.error || 'Failed to extract transcript from the video'
          };
        }
        
        if (!transcriptResult.transcript || transcriptResult.transcript.trim().length === 0) {
          console.error('[Video Notes API] Empty transcript');
          return {
            success: false,
            error: 'Empty transcript',
            message: 'The video does not have any extractable content for notes'
          };
        }
        
        console.log(`[Video Notes API] Transcript retrieved (${transcriptResult.transcript.length} chars)`);

        // STEP 7: Generate notes using AI
        console.log('[Video Notes API] Generating notes from transcript');
        const notesResult = await generateNotes({
          transcript: transcriptResult.transcript,
          videoTitle: videoInfo.title
        });
        
        if (!notesResult.content) {
          console.error('[Video Notes API] AI note generation failed:', notesResult.error);
          return {
            success: false,
            error: 'Note generation failed',
            message: notesResult.error || 'Failed to generate notes from the transcript'
          };
        }
        
        console.log(`[Video Notes API] Successfully generated notes (${notesResult.content.length} chars)`);

        // STEP 8: Create the note record for isolated video_notes table
        const noteId = `video_${Date.now()}`;
        const noteData = {
          id: noteId,
          user_id: user.id,
          video_url: url,
          video_id: videoId,
          title: customTitle || videoInfo.title,
          thumbnail_url: videoInfo.thumbnailUrl,
          content: notesResult.content,
          summary: notesResult.summary,
          quiz: notesResult.quiz,
          created_at: new Date().toISOString()
        };

        console.log(`[Video Notes API] Created note with ID: ${noteId}`);
        console.log('[Video Notes API] Note data structure:', Object.keys(noteData).join(', '));

        // STEP 9: Store the note in Supabase video_notes table
        console.log('[Video Notes API] Storing note in Supabase video_notes table');
        
        try {
          // Verify database connection before attempting insert
          try {
            const { error: pingError } = await supabase.from('video_notes').select('count').limit(1);
            if (pingError) {
              console.error('[Video Notes API] Database connection check failed:', pingError);
              return {
                success: false,
                error: 'Database connection error',
                message: 'Could not connect to the database. Please try again later.',
                details: {
                  code: pingError.code,
                  message: pingError.message
                }
              };
            }
          } catch (pingException) {
            console.error('[Video Notes API] Database ping exception:', pingException);
          }

          const { data, error } = await supabase
            .from('video_notes')
            .insert(noteData)
            .select()
            .single();
          
          if (error) {
            console.error('[Video Notes API] Database storage error:', error);
            
            // Log detailed diagnostic information
            console.error('[Video Notes API] Database error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            
            // Handle specific database errors with appropriate status codes
            if (error.code === '23505') { // Unique violation
              return {
                success: false,
                error: 'Duplicate record',
                message: 'Notes for this video already exist in the database',
                details: {
                  code: error.code,
                  message: error.message
                }
              };
            } else if (error.code?.startsWith('22') || error.code?.startsWith('23')) {
              // Data exception (22) or integrity constraint violation (23)
              return {
                success: false,
                error: 'Invalid data format',
                message: 'The note data could not be stored due to validation errors',
                details: {
                  code: error.code,
                  message: error.message
                }
              };
            } else if (error.code === '42P01') {
              // Undefined table
              return {
                success: false,
                error: 'Schema error',
                message: 'The video_notes table does not exist. Please run the database initialization.',
                details: {
                  code: error.code,
                  message: error.message
                }
              };
            }
            
            return {
              success: false,
              error: 'Database error',
              message: 'Failed to store the notes in the database',
              details: {
                code: error.code,
                message: error.message
              }
            };
          }
          
          console.log(`[Video Notes API] Successfully stored note in database with ID: ${data?.id || noteId}`);

          // STEP 10.5: Track usage after successful creation
          console.log('[Video Notes API] Incrementing usage counters');
          try {
            await incrementUsage(user.id, token, 'video');
            console.log('[Video Notes API] Usage tracking completed');
          } catch (usageError) {
            console.error('[Video Notes API] Usage tracking failed (note still created):', usageError);
            // Don't fail the request if usage tracking fails
          }

          // STEP 10.6: Refresh saved notes count
          console.log('[Video Notes API] Refreshing saved notes count');
          try {
            await refreshSavedNotesCount(user.id, token);
            console.log('[Video Notes API] Saved notes count refreshed');
          } catch (countError) {
            console.error('[Video Notes API] Saved notes count refresh failed (note still created):', countError);
            // Don't fail the request if count refresh fails
          }

          return {
            success: true,
            data
          };
        } catch (dbError: any) {
          console.error('[Video Notes API] Unexpected database error:', dbError);
          return {
            success: false,
            error: 'Database exception',
            message: dbError?.message || 'An unexpected error occurred while storing notes',
            details: dbError
          };
        }
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Video Notes API] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred on the server',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Get all video notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  console.log('[Video Notes API] Request received: GET');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Video Notes API] Authentication missing');
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
      console.error('[Video Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Video Notes API] User authenticated: ${user.id}`);

    // STEP 2: Fetch the user's video notes
    const { data, error } = await supabase
      .from('video_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[Video Notes API] Database fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch video notes from the database',
        details: {
          code: error.code,
          message: error.message
        }
      }, { status: 500 });
    }
    
    console.log(`[Video Notes API] Successfully fetched ${data.length} video notes`);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Video Notes API] Error fetching video notes:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while fetching video notes',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Delete a specific video note for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  console.log('[Video Notes API] Request received: DELETE');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Video Notes API] Authentication missing');
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
      console.error('[Video Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Video Notes API] User authenticated: ${user.id}`);

    // STEP 2: Get the note ID from query parameters
    const noteId = request.nextUrl.searchParams.get('id');
    if (!noteId) {
      console.error('[Video Notes API] Note ID missing');
      return NextResponse.json({
        success: false,
        error: 'Missing note ID',
        message: 'Note ID is required for deletion'
      }, { status: 400 });
    }

    console.log(`[Video Notes API] Deleting note with ID: ${noteId}`);

    // STEP 3: Delete the note (with user ownership check)
    const { data, error } = await supabase
      .from('video_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id) // Ensure user can only delete their own notes
      .select();
      
    if (error) {
      console.error('[Video Notes API] Database delete error:', error);
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
      console.error(`[Video Notes API] Note not found or access denied: ${noteId}`);
      return NextResponse.json({
        success: false,
        error: 'Note not found',
        message: 'The note was not found or you do not have permission to delete it'
      }, { status: 404 });
    }
    
    console.log(`[Video Notes API] Successfully deleted note: ${noteId}`);

    // Refresh saved notes count after deletion
    try {
      await refreshSavedNotesCount(user.id, token);
      console.log('[Video Notes API] Saved notes count refreshed after deletion');
    } catch (countError) {
      console.error('[Video Notes API] Saved notes count refresh failed after deletion:', countError);
      // Don't fail the request if count refresh fails
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
      data: data[0]
    });
  } catch (error: any) {
    console.error('[Video Notes API] Error deleting video note:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while deleting the note',
      details: error.message
    }, { status: 500 });
  }
}

// Configure dynamic behavior to avoid caching
export const dynamic = 'force-dynamic'; 