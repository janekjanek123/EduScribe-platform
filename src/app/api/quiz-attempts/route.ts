import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Quiz Attempts API Endpoint
 * 
 * Handles quiz attempt submissions and scoring
 */
export async function POST(request: NextRequest) {
  console.log('[Quiz Attempts API] Request received: POST');

  try {
    // STEP 1: Authenticate the request
    console.log('[Quiz Attempts API] Authenticating request');
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Quiz Attempts API] Authentication missing');
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
      console.error('[Quiz Attempts API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Quiz Attempts API] User authenticated: ${user.id}`);

    // STEP 2: Parse and validate the request body
    const body = await request.json();
    console.log('[Quiz Attempts API] Request body received');
    const { noteId, noteType, answers } = body;

    // Validate required fields
    if (!noteId || !noteType || !answers) {
      console.error('[Quiz Attempts API] Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'noteId, noteType, and answers are required'
      }, { status: 400 });
    }

    if (!['text', 'video', 'file'].includes(noteType)) {
      console.error('[Quiz Attempts API] Invalid note type:', noteType);
      return NextResponse.json({
        success: false,
        error: 'Invalid note type',
        message: 'noteType must be one of: text, video, file'
      }, { status: 400 });
    }

    if (!Array.isArray(answers)) {
      console.error('[Quiz Attempts API] Answers must be an array');
      return NextResponse.json({
        success: false,
        error: 'Invalid answers format',
        message: 'answers must be an array'
      }, { status: 400 });
    }

    console.log(`[Quiz Attempts API] Processing quiz attempt for ${noteType} note: ${noteId}`);

    // STEP 3: Get the quiz questions from the note
    const tableName = `${noteType}_notes`;
    const { data: noteData, error: noteError } = await supabase
      .from(tableName)
      .select('quiz')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (noteError || !noteData) {
      console.error('[Quiz Attempts API] Note not found:', noteError?.message);
      return NextResponse.json({
        success: false,
        error: 'Note not found',
        message: 'The specified note was not found or you do not have access to it'
      }, { status: 404 });
    }

    const quiz = noteData.quiz;
    if (!quiz || !Array.isArray(quiz)) {
      console.error('[Quiz Attempts API] No quiz found for note');
      return NextResponse.json({
        success: false,
        error: 'No quiz available',
        message: 'This note does not have an associated quiz'
      }, { status: 404 });
    }

    // STEP 4: Calculate the score
    let correctAnswers = 0;
    const totalQuestions = quiz.length;

    // Validate answers and calculate score
    for (let i = 0; i < Math.min(answers.length, quiz.length); i++) {
      const userAnswer = answers[i];
      const correctAnswer = quiz[i].correctAnswer;
      
      if (userAnswer === correctAnswer) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    console.log(`[Quiz Attempts API] Quiz scored: ${correctAnswers}/${totalQuestions} (${score}%)`);

    // STEP 5: Store the quiz attempt
    const attemptId = `attempt_${Date.now()}`;
    const attemptData = {
      id: attemptId,
      user_id: user.id,
      note_id: noteId,
      note_type: noteType,
      answers: answers,
      score: score,
      total_questions: totalQuestions,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data: attemptResult, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert(attemptData)
      .select()
      .single();

    if (attemptError) {
      console.error('[Quiz Attempts API] Error storing attempt:', attemptError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to store quiz attempt',
        details: {
          code: attemptError.code,
          message: attemptError.message
        }
      }, { status: 500 });
    }

    console.log(`[Quiz Attempts API] Quiz attempt stored successfully: ${attemptId}`);

    // STEP 6: Return the results
    return NextResponse.json({
      success: true,
      data: {
        attemptId: attemptId,
        score: score,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        percentage: score,
        answers: answers,
        completedAt: attemptData.completed_at
      }
    });

  } catch (error: any) {
    console.error('[Quiz Attempts API] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred on the server',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Get quiz attempts for a specific note or user
 */
export async function GET(request: NextRequest) {
  console.log('[Quiz Attempts API] Request received: GET');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Quiz Attempts API] Authentication missing');
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
      console.error('[Quiz Attempts API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Quiz Attempts API] User authenticated: ${user.id}`);

    // STEP 2: Get query parameters
    const noteId = request.nextUrl.searchParams.get('noteId');
    
    let query = supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    // Filter by note ID if provided
    if (noteId) {
      query = query.eq('note_id', noteId);
    }

    const { data, error } = await query;
      
    if (error) {
      console.error('[Quiz Attempts API] Database fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch quiz attempts from the database',
        details: {
          code: error.code,
          message: error.message
        }
      }, { status: 500 });
    }
    
    console.log(`[Quiz Attempts API] Successfully fetched ${data.length} quiz attempts`);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Quiz Attempts API] Error fetching quiz attempts:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while fetching quiz attempts',
      details: error.message
    }, { status: 500 });
  }
}

// Configure dynamic behavior to avoid caching
export const dynamic = 'force-dynamic'; 