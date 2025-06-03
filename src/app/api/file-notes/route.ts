import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateNotes } from '@/services/ai';
import { extractTextFromFile } from '@/services/fileExtraction';
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
    console.warn('[File Notes API] Could not fetch subscription:', error);
    return { planId: 'free' };
  }
}

/**
 * File Notes API Endpoint - Isolated System
 * 
 * Processes an uploaded file to:
 * 1. Store the file in Supabase storage
 * 2. Extract text content from the file
 * 3. Generate AI notes
 * 4. Store in the isolated file_notes table
 */
export async function POST(request: NextRequest) {
  console.log('[File Notes API] Request received: POST');

  try {
    // STEP 1: Authenticate the request
    console.log('[File Notes API] Authenticating request');
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[File Notes API] Authentication missing');
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
      console.error('[File Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[File Notes API] User authenticated: ${user.id}`);

    // STEP 1.5: Check usage limits BEFORE processing
    console.log('[File Notes API] Checking usage limits');
    const usageCheck = await checkUsageLimits(user.id, token, 'file');
    
    if (!usageCheck.canGenerate) {
      console.log(`[File Notes API] Generation limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Generation limit reached',
        message: usageCheck.reason || 'You have reached your monthly note generation limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 }); // 429 = Too Many Requests
    }
    
    if (!usageCheck.canSave) {
      console.log(`[File Notes API] Storage limit reached: ${usageCheck.reason}`);
      return NextResponse.json({
        success: false,
        error: 'Storage limit reached',
        message: usageCheck.reason || 'You have reached your saved notes limit',
        usage: usageCheck.usage,
        limits: usageCheck.limits
      }, { status: 429 });
    }
    
    console.log(`[File Notes API] Usage check passed - can generate: ${usageCheck.canGenerate}, can save: ${usageCheck.canSave}`);

    // Get user's subscription for priority
    const subscription = await getSubscriptionPlan(user.id);
    
    // Wrap the processing in queue
    const result = await queueRequest(
      user.id,
      subscription.planId,
      'file',
      async () => {
        // STEP 2: Parse the form data with file
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const customTitle = formData.get('title') as string | null;
        
        if (!file) {
          console.error('[File Notes API] No file provided');
          return {
            success: false,
            error: 'Missing file',
            message: 'Please provide a file to generate notes from'
          };
        }

        // STEP 3: Validate the file
        const fileType = file.type;
        const fileSize = file.size;
        const fileName = file.name;
        
        // Check file size (max 20MB)
        const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
        if (fileSize > MAX_FILE_SIZE) {
          console.error(`[File Notes API] File too large: ${fileSize} bytes`);
          return {
            success: false,
            error: 'File too large',
            message: 'The uploaded file exceeds the maximum size of 20MB'
          };
        }
        
        // Check supported file types - NOW INCLUDING POWERPOINT
        const supportedTypes = [
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
          'application/msword', // doc
          'text/markdown',
          'text/csv',
          // PowerPoint support
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
          'application/vnd.ms-powerpoint' // ppt
        ];
        
        if (!supportedTypes.includes(fileType)) {
          console.error(`[File Notes API] Unsupported file type: ${fileType}`);
          return {
            success: false,
            error: 'Unsupported file type',
            message: 'Please upload a supported file type (PDF, TXT, DOC, DOCX, MD, CSV, PPT, PPTX)'
          };
        }
        
        console.log(`[File Notes API] File validated: ${fileName} (${fileType}, ${fileSize} bytes)`);

        // STEP 4: Upload the file to Supabase Storage (with fallback)
        const filePath = `${user.id}/${Date.now()}_${fileName}`;
        const fileBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(fileBuffer);
        
        console.log(`[File Notes API] Attempting to upload file to storage: ${filePath}`);
        
        let publicUrl = null;
        let storageSuccess = false;
        
        try {
        const { data: storageData, error: storageError } = await supabase
          .storage
            .from('files')
          .upload(filePath, fileData, {
            contentType: fileType,
            upsert: false
          });
        
        if (storageError) {
            console.warn('[File Notes API] Storage upload failed:', storageError.message);
            
            // Check if it's a bucket not found error
            if (storageError.message.includes('Bucket not found') || storageError.message.includes('bucket')) {
              console.log('[File Notes API] Storage bucket not found, proceeding without file storage');
            } else {
              console.log('[File Notes API] Storage error, proceeding without file storage');
            }
            
            // Continue without storage - we'll store just the metadata
            storageSuccess = false;
          } else {
        // Get the public URL for the file
            const { data: { publicUrl: url } } = supabase
          .storage
              .from('files')
          .getPublicUrl(filePath);
        
            publicUrl = url;
            storageSuccess = true;
        console.log(`[File Notes API] File uploaded successfully. Public URL: ${publicUrl}`);
          }
          
        } catch (uploadError: any) {
          console.warn('[File Notes API] Storage upload exception:', uploadError.message);
          console.log('[File Notes API] Proceeding without file storage');
          storageSuccess = false;
        }
        
        // Log storage status
        if (storageSuccess) {
          console.log('[File Notes API] ✅ File stored in Supabase Storage');
        } else {
          console.log('[File Notes API] ⚠️  File not stored in storage (metadata only)');
        }

        // STEP 5: Extract text from the file using the new extraction service
        console.log('[File Notes API] Extracting text from file');
        let extractedContent;
        
        try {
          extractedContent = await extractTextFromFile(fileBuffer, fileType, fileName);
          
          if (!extractedContent.text || extractedContent.text.trim().length === 0) {
            console.error('[File Notes API] No text content extracted from file');
            return {
              success: false,
              error: 'No content',
              message: 'Could not extract any text content from the uploaded file'
            };
          }
          
          console.log(`[File Notes API] Successfully extracted text (${extractedContent.text.length} chars)`);
          if (extractedContent.slideCount) {
            console.log(`[File Notes API] PowerPoint presentation with ${extractedContent.slideCount} slides`);
          }
        } catch (extractError: any) {
          console.error('[File Notes API] Error extracting text from file:', extractError);
          return {
            success: false,
            error: 'Text extraction failed',
            message: extractError.message || 'Failed to extract text from the uploaded file'
          };
        }

        // STEP 6: Generate notes using AI
        console.log('[File Notes API] Generating notes from extracted text');
        let notesResult;
        
        try {
          // Create a more descriptive title for PowerPoint presentations
          let contentTitle = fileName;
          if (extractedContent.slideCount) {
            contentTitle = `${fileName} (${extractedContent.slideCount} slides)`;
          }
          
          notesResult = await generateNotes({
            transcript: extractedContent.text, // Reusing the transcript field for our text content
            videoTitle: contentTitle // Using filename as the title
          });
          
          if (!notesResult.content) {
            console.error('[File Notes API] AI note generation failed:', notesResult.error);
            return {
              success: false,
              error: 'Note generation failed',
              message: notesResult.error || 'Failed to generate notes from the file content'
            };
          }
          
          console.log(`[File Notes API] Successfully generated notes (${notesResult.content.length} chars)`);
        } catch (aiError: any) {
          console.error('[File Notes API] Error during AI note generation:', aiError);
          return {
            success: false,
            error: 'AI processing failed',
            message: aiError.message || 'An error occurred while generating notes with AI'
          };
        }

        // STEP 7: Create the note record for isolated file_notes table
        const noteId = `file_${Date.now()}`;
        const noteData = {
          id: noteId,
          user_id: user.id,
          title: customTitle || fileName,
          file_name: fileName,
          file_url: publicUrl, // Will be null if storage failed
          file_type: fileType,
          content: notesResult.content,
          summary: notesResult.summary, // Store the generated summary
          quiz: notesResult.quiz, // Store the generated quiz
          // Add PowerPoint-specific metadata
          slide_count: extractedContent.slideCount || null,
          slide_titles: extractedContent.slideTitles || null,
          created_at: new Date().toISOString()
        };

        console.log(`[File Notes API] Created note with ID: ${noteId}`);
        console.log('[File Notes API] Note data structure:', Object.keys(noteData).join(', '));
        
        if (publicUrl) {
          console.log('[File Notes API] ✅ Note includes file URL for download');
        } else {
          console.log('[File Notes API] ⚠️  Note created without file URL (storage unavailable)');
        }

        // STEP 8: Store the note in Supabase file_notes table
        console.log('[File Notes API] Storing note in Supabase file_notes table');
        
        try {
          // Verify database connection before attempting insert
          try {
            const { error: pingError } = await supabase.from('file_notes').select('count').limit(1);
            if (pingError) {
              console.error('[File Notes API] Database connection check failed:', pingError);
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
            console.error('[File Notes API] Database ping exception:', pingException);
          }

          const { data, error } = await supabase
            .from('file_notes')
            .insert(noteData)
            .select()
            .single();
            
          if (error) {
            console.error('[File Notes API] Database storage error:', error);
            
            // Log detailed diagnostic information
            console.error('[File Notes API] Database error details:', {
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
                message: 'The file_notes table does not exist. Please run the database initialization.',
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
          
          console.log(`[File Notes API] Successfully stored note in database with ID: ${data?.id || noteId}`);

          // STEP 8.5: Track usage after successful creation
          console.log('[File Notes API] Incrementing usage counters');
          try {
            await incrementUsage(user.id, token, 'file');
            console.log('[File Notes API] Usage tracking completed');
          } catch (usageError) {
            console.error('[File Notes API] Usage tracking failed (note still created):', usageError);
            // Don't fail the request if usage tracking fails
          }

          // STEP 8.6: Refresh saved notes count
          console.log('[File Notes API] Refreshing saved notes count');
          try {
            await refreshSavedNotesCount(user.id, token);
            console.log('[File Notes API] Saved notes count refreshed');
          } catch (countError) {
            console.error('[File Notes API] Saved notes count refresh failed (note still created):', countError);
            // Don't fail the request if count refresh fails
          }

          // STEP 9: Return the successful result
          return {
            success: true,
            data
          };
        } catch (dbError: any) {
          console.error('[File Notes API] Unexpected database error:', dbError);
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
    console.error('[File Notes API] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred on the server',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Get all file notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  console.log('[File Notes API] Request received: GET');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[File Notes API] Authentication missing');
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
      console.error('[File Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[File Notes API] User authenticated: ${user.id}`);

    // STEP 2: Fetch the user's file notes
    const { data, error } = await supabase
      .from('file_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[File Notes API] Database fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch file notes from the database',
        details: {
          code: error.code,
          message: error.message
        }
      }, { status: 500 });
    }
    
    console.log(`[File Notes API] Successfully fetched ${data.length} file notes`);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[File Notes API] Error fetching file notes:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while fetching file notes',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Delete a specific file note for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  console.log('[File Notes API] Request received: DELETE');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[File Notes API] Authentication missing');
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
      console.error('[File Notes API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[File Notes API] User authenticated: ${user.id}`);

    // STEP 2: Get the note ID from query parameters
    const noteId = request.nextUrl.searchParams.get('id');
    if (!noteId) {
      console.error('[File Notes API] Note ID missing');
      return NextResponse.json({
        success: false,
        error: 'Missing note ID',
        message: 'Note ID is required for deletion'
      }, { status: 400 });
    }

    console.log(`[File Notes API] Deleting note with ID: ${noteId}`);

    // STEP 3: Delete the note (with user ownership check)
    const { data, error } = await supabase
      .from('file_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id) // Ensure user can only delete their own notes
      .select();
      
    if (error) {
      console.error('[File Notes API] Database delete error:', error);
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
      console.error(`[File Notes API] Note not found or access denied: ${noteId}`);
      return NextResponse.json({
        success: false,
        error: 'Note not found',
        message: 'The note was not found or you do not have permission to delete it'
      }, { status: 404 });
    }
    
    console.log(`[File Notes API] Successfully deleted note: ${noteId}`);

    // Refresh saved notes count after deletion
    try {
      await refreshSavedNotesCount(user.id, token);
      console.log('[File Notes API] Saved notes count refreshed after deletion');
    } catch (countError) {
      console.error('[File Notes API] Saved notes count refresh failed after deletion:', countError);
      // Don't fail the request if count refresh fails
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
      data: data[0]
    });
  } catch (error: any) {
    console.error('[File Notes API] Error deleting file note:', error);
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