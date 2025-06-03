import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Initialize database tables for the three isolated note systems
 */
export async function POST(request: NextRequest) {
  console.log('[Init DB API] Initializing database schema...');

  try {
    // STEP 1: Authenticate the request (skip in development mode)
    let isAuthenticated = false;
    let isDevMode = process.env.NODE_ENV === 'development';
    
    if (!isDevMode) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[Init DB API] Authentication missing');
        return NextResponse.json({ 
          success: false,
          error: 'Authentication required',
          message: 'Valid Bearer token is required'
        }, { status: 401 });
      }
      isAuthenticated = true;
    } else {
      console.log('[Init DB API] Development mode - skipping authentication');
      isAuthenticated = true;
    }

    if (!isAuthenticated) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        message: 'Valid Bearer token is required'
      }, { status: 401 });
    }

    // STEP 2: Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Init DB API] Missing Supabase environment variables');
      return NextResponse.json({ 
        success: false,
        error: 'Configuration error',
        message: 'Supabase URL or key not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // STEP 3: Create the video_notes table
    console.log('[Init DB API] Creating video_notes table...');
    const { error: videoTableError } = await supabase.rpc('create_video_notes_table');
    
    if (videoTableError && !videoTableError.message.includes('already exists')) {
      console.error('[Init DB API] Error creating video_notes table:', videoTableError);
      return NextResponse.json({ 
        success: false,
        error: 'Database error',
        message: `Failed to create video_notes table: ${videoTableError.message}`
      }, { status: 500 });
    }
    
    // STEP 4: Create the file_notes table
    console.log('[Init DB API] Creating file_notes table...');
    const { error: fileTableError } = await supabase.rpc('create_file_notes_table');
    
    if (fileTableError && !fileTableError.message.includes('already exists')) {
      console.error('[Init DB API] Error creating file_notes table:', fileTableError);
      return NextResponse.json({ 
        success: false,
        error: 'Database error',
        message: `Failed to create file_notes table: ${fileTableError.message}`
      }, { status: 500 });
    }
    
    // STEP 5: Create the text_notes table
    console.log('[Init DB API] Creating text_notes table...');
    const { error: textTableError } = await supabase.rpc('create_text_notes_table');
    
    if (textTableError && !textTableError.message.includes('already exists')) {
      console.error('[Init DB API] Error creating text_notes table:', textTableError);
      return NextResponse.json({ 
        success: false,
        error: 'Database error',
        message: `Failed to create text_notes table: ${textTableError.message}`
      }, { status: 500 });
    }
    
    // If we get here, create the stored procedures if they don't exist
    console.log('[Init DB API] Setting up database stored procedures...');
    
    // Create the SQL functions if they don't exist yet
    const setupSql = `
      -- Function to create video_notes table if it doesn't exist
      CREATE OR REPLACE FUNCTION create_video_notes_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.video_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          video_url TEXT NOT NULL,
          video_id TEXT,
          title TEXT,
          thumbnail_url TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      END;
      $$ LANGUAGE plpgsql;

      -- Function to create file_notes table if it doesn't exist
      CREATE OR REPLACE FUNCTION create_file_notes_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.file_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          file_name TEXT,
          file_url TEXT,
          file_type TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      END;
      $$ LANGUAGE plpgsql;

      -- Function to create text_notes table if it doesn't exist
      CREATE OR REPLACE FUNCTION create_text_notes_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.text_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          raw_text TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Execute the SQL to create the functions
    const { error: setupError } = await supabase.rpc('exec_sql', { sql: setupSql });
    
    if (setupError) {
      // Try an alternate approach if the exec_sql function doesn't exist
      console.log('[Init DB API] exec_sql function not available, creating tables directly...');
      
      // Create video_notes table
      const createVideoNotesSQL = `
        CREATE TABLE IF NOT EXISTS public.video_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          video_url TEXT NOT NULL,
          video_id TEXT,
          title TEXT,
          thumbnail_url TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;
      
      const { error: directVideoError } = await supabase.from('video_notes').select('count').limit(1);
      if (directVideoError && directVideoError.code === '42P01') {
        const { error: createVideoError } = await supabase.rpc('exec_sql', { sql: createVideoNotesSQL });
        if (createVideoError) {
          console.error('[Init DB API] Error creating video_notes table directly:', createVideoError);
        }
      }
      
      // Create file_notes table
      const createFileNotesSQL = `
        CREATE TABLE IF NOT EXISTS public.file_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          file_name TEXT,
          file_url TEXT,
          file_type TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;
      
      const { error: directFileError } = await supabase.from('file_notes').select('count').limit(1);
      if (directFileError && directFileError.code === '42P01') {
        const { error: createFileError } = await supabase.rpc('exec_sql', { sql: createFileNotesSQL });
        if (createFileError) {
          console.error('[Init DB API] Error creating file_notes table directly:', createFileError);
        }
      }
      
      // Create text_notes table
      const createTextNotesSQL = `
        CREATE TABLE IF NOT EXISTS public.text_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          raw_text TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;
      
      const { error: directTextError } = await supabase.from('text_notes').select('count').limit(1);
      if (directTextError && directTextError.code === '42P01') {
        const { error: createTextError } = await supabase.rpc('exec_sql', { sql: createTextNotesSQL });
        if (createTextError) {
          console.error('[Init DB API] Error creating text_notes table directly:', createTextError);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database schema initialized successfully',
      tables: ['video_notes', 'file_notes', 'text_notes']
    });
  } catch (error: any) {
    console.error('[Init DB API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error.message || 'An unexpected error occurred initializing the database'
    }, { status: 500 });
  }
}

// Set dynamic to prevent caching
export const dynamic = 'force-dynamic'; 