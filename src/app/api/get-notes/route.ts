import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// NOTE: We're using database storage now, no need for in-memory fallbacks
const notesStorage: Record<string, any> = {};

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/get-notes - Starting request processing');

  try {
    // Log all headers for debugging (except Authorization which may contain sensitive data)
    const headerKeys = Array.from(request.headers.keys());
    console.log('[API] Request headers:', headerKeys.filter(k => k.toLowerCase() !== 'authorization'));
    
    // Create Supabase client with cookies specifically for route handlers
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Log cookie details (safely)
    const hasSbAccessToken = cookieStore.has('sb-access-token');
    const hasSbRefreshToken = cookieStore.has('sb-refresh-token');
    console.log('[API] Supabase auth cookies present:', {
      hasSbAccessToken,
      hasSbRefreshToken,
      cookieCount: cookieStore.size
    });
    
    // First try getting session from cookies
    const { data: { session: cookieSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('[API] Error getting session from cookies:', sessionError.message);
    }
    
    // Set initial user and session variables
    let user = cookieSession?.user;
    let activeSession = cookieSession;
    let authMethod = 'cookies';
    let directSupabase = null;
    
    // If no session from cookies, try Authorization header as fallback
    if (!cookieSession || sessionError) {
      console.log('[API] No session from cookies, checking Authorization header');
      
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        console.log('[API] Found Bearer token, attempting to validate');
        
        // Create a direct Supabase client
        directSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Get user from token
        const { data: userData, error: userError } = await directSupabase.auth.getUser(token);
        
        if (userData?.user && !userError) {
          console.log('[API] Successfully authenticated via token:', userData.user.id);
          user = userData.user;
          
          // Get session using the token
          const { data: sessionData } = await directSupabase.auth.getSession();
          activeSession = sessionData.session;
          authMethod = 'token';
        } else {
          console.error('[API] Token validation failed:', userError?.message);
        }
      } else {
        console.warn('[API] No Authorization header or invalid format');
      }
    } else {
      console.log('[API] Successfully authenticated via cookies:', cookieSession.user.id);
    }
    
    // Final authentication check
    if (!user) {
      console.error('[API] Authentication failed - no valid user found');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('[API] Authentication successful:', {
      userId: user.id,
      email: user.email,
      authMethod,
      sessionExpiry: activeSession?.expires_at 
        ? new Date(activeSession.expires_at * 1000).toLocaleString() 
        : 'unknown'
    });

    // Use Supabase client based on authentication method
    const dbClient = directSupabase || supabase;

    // Get the note ID from the query string
    const noteId = request.nextUrl.searchParams.get('id');
    
    if (!noteId) {
      console.error('[API] Missing note ID in request');
      return NextResponse.json(
        { error: 'Missing note ID' },
        { status: 400 }
      );
    }

    console.log(`[API] GET /api/get-notes - Fetching note with ID: ${noteId} for user: ${user.id}`);
    
    // Determine which table to query based on the note ID prefix
    let tableName = 'text_notes'; // Default to text_notes
    if (noteId.startsWith('file_')) {
      tableName = 'file_notes';
    } else if (noteId.startsWith('video_')) {
      tableName = 'video_notes';
    } else if (noteId.startsWith('text_')) {
      tableName = 'text_notes';
    }
    
    console.log(`[API] Querying Supabase ${tableName} table for note: ${noteId}`);
    
    // Try to get the note from the appropriate Supabase table
    const { data: note, error: noteError } = await dbClient
      .from(tableName)
      .select('*')
      .eq('id', noteId) // Use 'id' instead of 'noteId'
      .single();
    
    if (noteError) {
      console.error(`[API] Supabase error fetching note from ${tableName}:`, noteError);
      
      // If not found in database
      console.error(`[API] Note ${noteId} not found in database`);
      return NextResponse.json(
        { 
          error: 'Note not found', 
          message: 'The requested note could not be found',
          debug: {
            noteId,
            userId: user.id,
            tableName,
            errorMessage: noteError.message
          }
        },
        { status: 404 }
      );
    }
    
    // Log found note (without content for brevity)
    console.log(`[API] Found note ${noteId} in ${tableName} database:`, {
      title: note.title,
      userId: note.user_id,
      createdAt: note.created_at,
      contentLength: note.content?.length || 0
    });
    
    // Verify note ownership
    if (note.user_id && note.user_id !== user.id) {
      console.warn(`[API] User ${user.id} attempted to access note ${noteId} belonging to user ${note.user_id}`);
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to access this note' },
        { status: 403 }
      );
    }
    
    console.log(`[API] Note found in ${tableName} database for user: ${user.id}, returning note data`);
    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[API] Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Server error', message: error?.message || 'An error occurred while fetching notes' },
      { status: 500 }
    );
  }
}

// List all notes for the user from all three tables
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/get-notes - Starting notes listing request');
  
  try {
    // Create Supabase client with cookies specifically for route handlers
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // First try getting session from cookies
    const { data: { session: cookieSession }, error: sessionError } = await supabase.auth.getSession();
    
    // Set initial user and session variables
    let user = cookieSession?.user;
    let directSupabase = null;
    
    // If no session from cookies, try Authorization header as fallback
    if (!cookieSession || sessionError) {
      console.log('[API] No session from cookies, checking Authorization header');
      
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        
        // Create a direct Supabase client
        directSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Get user from token
        const { data: userData, error: userError } = await directSupabase.auth.getUser(token);
        
        if (userData?.user && !userError) {
          user = userData.user;
        }
      }
    }
    
    // Final authentication check
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use Supabase client based on authentication method
    const dbClient = directSupabase || supabase;
    
    // Get all notes from all three tables
    const [textResult, fileResult, videoResult] = await Promise.all([
      dbClient.from('text_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      
      dbClient.from('file_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      
      dbClient.from('video_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);
    
    // Combine the results
    const allNotes = [
      ...(textResult.data || []),
      ...(fileResult.data || []),
      ...(videoResult.data || [])
    ];
    
    // Sort all notes by created_at (most recent first)
    allNotes.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({
      notes: allNotes,
      counts: {
        textNotes: textResult.data?.length || 0,
        fileNotes: fileResult.data?.length || 0,
        videoNotes: videoResult.data?.length || 0,
        total: allNotes.length
      }
    });
  } catch (error: any) {
    console.error('[API] Error listing notes:', error);
    return NextResponse.json(
      { error: 'Server error', message: error?.message || 'An error occurred while listing notes' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 