import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    console.warn('[Text Notes API] Could not fetch subscription:', error);
    return { planId: 'free' };
  }
}

/**
 * Text Notes API Endpoint - Isolated System
 * 
 * Processes raw text input to:
 * 1. Validate the input
 * 2. Generate AI notes
 * 3. Store in the isolated text_notes table
 */
export async function POST(request: NextRequest) {
  console.log('[Text Notes API] Request received: POST');

  try {
    // STEP 1: Authenticate the request
    console.log('[Text Notes API] Authenticating request');
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Text Notes API] Authentication missing');
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
      console.error('[Text Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Text Notes API] User authenticated: ${user.id}`);

    // STEP 1.5: Check usage limits BEFORE processing
    console.log('[Text Notes API] Checking usage limits');
    const usageCheck = await checkUsageLimits(user.id, token, 'text');
    
    if (!usageCheck.canGenerate) {
      console.log(`[Text Notes API] Generation limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Generation limit reached',
        message: usageCheck.reason || 'You have reached your monthly note generation limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 }); // 429 = Too Many Requests
    }
    
    if (!usageCheck.canSave) {
      console.log(`[Text Notes API] Storage limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Storage limit reached',
        message: usageCheck.reason || 'You have reached your saved notes limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 });
    }
    
    console.log(`[Text Notes API] Usage check passed - can generate: ${usageCheck.canGenerate}, can save: ${usageCheck.canSave}`);

    // Get user's subscription for priority
    const subscription = await getSubscriptionPlan(user.id);
    
    // Wrap the processing in queue
    const result = await queueRequest(
      user.id,
      subscription.planId,
      'text',
      async () => {
        // STEP 2: Parse and validate the request body
        const body = await request.json();
        console.log('[Text Notes API] Request body received');
        const { text } = body;

        // Validate text parameter
        if (!text) {
          console.error('[Text Notes API] Missing text parameter');
          return {
            success: false,
            error: 'Missing text',
            message: 'Please provide text content to generate notes from'
          };
        }

        if (typeof text !== 'string') {
          console.error('[Text Notes API] Text is not a string:', typeof text);
          return {
            success: false,
            error: 'Invalid text format',
            message: `Text must be a string, received ${typeof text}`
          };
        }

        if (text.trim().length === 0) {
          console.error('[Text Notes API] Empty text provided');
          return {
            success: false,
            error: 'Empty text',
            message: 'Please provide non-empty text content'
          };
        }
        
        // Set a maximum text length (e.g., 50,000 characters)
        const MAX_TEXT_LENGTH = 50000;
        if (text.length > MAX_TEXT_LENGTH) {
          console.error(`[Text Notes API] Text too long: ${text.length} chars`);
          return {
            success: false,
            error: 'Text too long',
            message: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`
          };
        }
        
        console.log(`[Text Notes API] Text validated: ${text.length} characters`);

        // STEP 3: Generate notes using AI
        console.log('[Text Notes API] Generating notes from text');
        let notesResult;
        
        try {
          notesResult = await generateNotes({
            transcript: text,
            videoTitle: 'Text Notes' // Using a generic title for text input
          });
          
          if (!notesResult.content) {
            console.error('[Text Notes API] AI note generation failed:', notesResult.error);
            return {
              success: false,
              error: 'Note generation failed',
              message: notesResult.error || 'Failed to generate notes from the text'
            };
          }
          
          console.log(`[Text Notes API] Successfully generated notes (${notesResult.content.length} chars)`);
        } catch (aiError: any) {
          console.error('[Text Notes API] Error during AI note generation:', aiError);
          return {
            success: false,
            error: 'AI processing failed',
            message: aiError.message || 'An error occurred while generating notes with AI'
          };
        }

        // STEP 4: Create the note record for isolated text_notes table
        const noteId = `text_${Date.now()}`;
        const noteData = {
          id: noteId,
          user_id: user.id,
          title: `Text Notes - ${new Date().toLocaleDateString()}`,
          raw_text: text,
          content: notesResult.content,
          summary: notesResult.summary, // Store the generated summary
          quiz: notesResult.quiz, // Store the generated quiz
          created_at: new Date().toISOString()
        };

        console.log(`[Text Notes API] Created note with ID: ${noteId}`);
        console.log('[Text Notes API] Note data structure:', Object.keys(noteData).join(', '));

        // STEP 5: Store the note in Supabase text_notes table
        console.log('[Text Notes API] Storing note in Supabase text_notes table');
        
        try {
          // Verify database connection before attempting insert
          try {
            const { error: pingError } = await supabase.from('text_notes').select('count').limit(1);
            if (pingError) {
              console.error('[Text Notes API] Database connection check failed:', pingError);
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
            console.error('[Text Notes API] Database ping exception:', pingException);
          }

          const { data, error } = await supabase
            .from('text_notes')
            .insert(noteData)
            .select()
            .single();
            
          if (error) {
            console.error('[Text Notes API] Database storage error:', error);
            
            // Log detailed diagnostic information
            console.error('[Text Notes API] Database error details:', {
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
                message: 'These notes already exist in the database',
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
                message: 'The text_notes table does not exist. Please run the database initialization.',
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
          
          console.log(`[Text Notes API] Successfully stored note in database with ID: ${data?.id || noteId}`);

          // STEP 5.5: Track usage after successful creation
          console.log('[Text Notes API] Incrementing usage counters');
          try {
            await incrementUsage(user.id, token, 'text');
            console.log('[Text Notes API] Usage tracking completed');
          } catch (usageError) {
            console.error('[Text Notes API] Usage tracking failed (note still created):', usageError);
            // Don't fail the request if usage tracking fails
          }

          // STEP 5.6: Refresh saved notes count
          console.log('[Text Notes API] Refreshing saved notes count');
          try {
            await refreshSavedNotesCount(user.id, token);
            console.log('[Text Notes API] Saved notes count refreshed');
          } catch (countError) {
            console.error('[Text Notes API] Saved notes count refresh failed (note still created):', countError);
            // Don't fail the request if count refresh fails
          }

          // STEP 6: Return the successful result
          return {
            success: true,
            data
          };
        } catch (dbError: any) {
          console.error('[Text Notes API] Unexpected database error:', dbError);
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
    console.error('[Text Notes API] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred on the server',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Get all text notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  console.log('[Text Notes API] Request received: GET');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Text Notes API] Authentication missing');
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
      console.error('[Text Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Text Notes API] User authenticated: ${user.id}`);

    // STEP 2: Fetch the user's text notes
    const { data, error } = await supabase
      .from('text_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[Text Notes API] Database fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch text notes from the database',
        details: {
          code: error.code,
          message: error.message
        }
      }, { status: 500 });
    }
    
    console.log(`[Text Notes API] Successfully fetched ${data.length} text notes`);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Text Notes API] Error fetching text notes:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while fetching text notes',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Delete a specific text note for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  console.log('[Text Notes API] Request received: DELETE');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Text Notes API] Authentication missing');
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
      console.error('[Text Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Text Notes API] User authenticated: ${user.id}`);

    // STEP 2: Get the note ID from query parameters
    const noteId = request.nextUrl.searchParams.get('id');
    if (!noteId) {
      console.error('[Text Notes API] Note ID missing');
      return NextResponse.json({
        success: false,
        error: 'Missing note ID',
        message: 'Note ID is required for deletion'
      }, { status: 400 });
    }

    console.log(`[Text Notes API] Deleting note with ID: ${noteId}`);

    // STEP 3: Delete the note (with user ownership check)
    const { data, error } = await supabase
      .from('text_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id) // Ensure user can only delete their own notes
      .select();
      
    if (error) {
      console.error('[Text Notes API] Database delete error:', error);
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
      console.error(`[Text Notes API] Note not found or access denied: ${noteId}`);
      return NextResponse.json({
        success: false,
        error: 'Note not found',
        message: 'The note was not found or you do not have permission to delete it'
      }, { status: 404 });
    }
    
    console.log(`[Text Notes API] Successfully deleted note: ${noteId}`);

    // Refresh saved notes count after deletion
    try {
      await refreshSavedNotesCount(user.id, token);
      console.log('[Text Notes API] Saved notes count refreshed after deletion');
    } catch (countError) {
      console.error('[Text Notes API] Saved notes count refresh failed after deletion:', countError);
      // Don't fail the request if count refresh fails
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
      data: data[0]
    });
  } catch (error: any) {
    console.error('[Text Notes API] Error deleting text note:', error);
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