import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define service status types
interface ServiceStatus {
  status: string;
  message?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  version: string;
  services: {
    database: ServiceStatus;
    video_notes: ServiceStatus;
    file_notes: ServiceStatus;
    text_notes: ServiceStatus;
    openai: ServiceStatus;
    youtube: ServiceStatus;
    ytdlp: ServiceStatus;
    [key: string]: ServiceStatus;
  };
  warnings: string[];
}

/**
 * Health check endpoint to verify all three isolated systems are functioning properly
 */
export async function GET() {
  // Initialize results object
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    services: {
      database: { status: 'unknown' },
      video_notes: { status: 'unknown' },
      file_notes: { status: 'unknown' },
      text_notes: { status: 'unknown' },
      openai: { status: 'unknown' },
      youtube: { status: 'unknown' },
      ytdlp: { status: 'unknown' }
    },
    warnings: []
  };

  // Check Supabase configuration
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Anon Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      healthStatus.services.database.status = 'error';
      healthStatus.services.database.message = 'Missing Supabase configuration';
      healthStatus.warnings.push('Supabase URL or key not configured');
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check main database connection
      const { error: dbError } = await supabase.from('_health').select('count').limit(1).maybeSingle();
      
      if (dbError && dbError.code !== '42P01') { // 42P01 is "table does not exist" which is expected
        healthStatus.services.database.status = 'error';
        healthStatus.services.database.message = `Database connection error: ${dbError.message}`;
        healthStatus.warnings.push('Database connection failed');
      } else {
        healthStatus.services.database.status = 'ok';
      }
      
      // Check video_notes table
      const { error: videoNotesError } = await supabase.from('video_notes').select('count').limit(1);
      if (videoNotesError) {
        if (videoNotesError.code === '42P01') { // Table doesn't exist
          healthStatus.services.video_notes.status = 'error';
          healthStatus.services.video_notes.message = 'Table does not exist';
          healthStatus.warnings.push('video_notes table not initialized');
        } else {
          healthStatus.services.video_notes.status = 'error';
          healthStatus.services.video_notes.message = videoNotesError.message;
          healthStatus.warnings.push('video_notes table error: ' + videoNotesError.message);
        }
      } else {
        healthStatus.services.video_notes.status = 'ok';
      }
      
      // Check file_notes table
      const { error: fileNotesError } = await supabase.from('file_notes').select('count').limit(1);
      if (fileNotesError) {
        if (fileNotesError.code === '42P01') { // Table doesn't exist
          healthStatus.services.file_notes.status = 'error';
          healthStatus.services.file_notes.message = 'Table does not exist';
          healthStatus.warnings.push('file_notes table not initialized');
        } else {
          healthStatus.services.file_notes.status = 'error';
          healthStatus.services.file_notes.message = fileNotesError.message;
          healthStatus.warnings.push('file_notes table error: ' + fileNotesError.message);
        }
      } else {
        healthStatus.services.file_notes.status = 'ok';
      }
      
      // Check text_notes table
      const { error: textNotesError } = await supabase.from('text_notes').select('count').limit(1);
      if (textNotesError) {
        if (textNotesError.code === '42P01') { // Table doesn't exist
          healthStatus.services.text_notes.status = 'error';
          healthStatus.services.text_notes.message = 'Table does not exist';
          healthStatus.warnings.push('text_notes table not initialized');
        } else {
          healthStatus.services.text_notes.status = 'error';
          healthStatus.services.text_notes.message = textNotesError.message;
          healthStatus.warnings.push('text_notes table error: ' + textNotesError.message);
        }
      } else {
        healthStatus.services.text_notes.status = 'ok';
      }
      
      // Check file storage bucket for file notes
      try {
        const { error: storageError } = await supabase.storage.getBucket('file_notes');
        if (storageError) {
          healthStatus.services.file_notes.status = 'warning';
          healthStatus.services.file_notes.message = 'Storage bucket not available: ' + storageError.message;
          healthStatus.warnings.push('file_notes storage bucket not configured');
        }
      } catch (storageError: any) {
        healthStatus.services.file_notes.status = 'warning';
        healthStatus.services.file_notes.message = 'Storage check error: ' + storageError.message;
        healthStatus.warnings.push('File storage check failed');
      }
    }
  } catch (error: any) {
    healthStatus.services.database.status = 'error';
    healthStatus.services.database.message = error.message;
    healthStatus.warnings.push('Database check exception');
  }

  // Check OpenAI API key (used by all three systems)
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      healthStatus.services.openai.status = 'error';
      healthStatus.services.openai.message = 'Missing OpenAI API key';
      healthStatus.warnings.push('OpenAI API key not configured');
    } else {
      healthStatus.services.openai.status = 'ok';
    }
  } catch (error: any) {
    healthStatus.services.openai.status = 'error';
    healthStatus.services.openai.message = error.message;
    healthStatus.warnings.push('OpenAI check exception');
  }

  // Check YouTube API key (used by video notes system)
  try {
    const youtubeKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!youtubeKey) {
      healthStatus.services.youtube.status = 'error';
      healthStatus.services.youtube.message = 'Missing YouTube API key';
      healthStatus.warnings.push('YouTube API key not configured');
    } else {
      healthStatus.services.youtube.status = 'ok';
    }
  } catch (error: any) {
    healthStatus.services.youtube.status = 'error';
    healthStatus.services.youtube.message = error.message;
    healthStatus.warnings.push('YouTube check exception');
  }

  // Check yt-dlp availability (needed by video notes system)
  try {
    if (process.env.NODE_ENV === 'development') {
      // Dynamic import with explicit function existence check
      const subtitlesModule = await import('@/services/subtitles');
      if (typeof subtitlesModule.isYtDlpAvailable === 'function') {
        const available = await subtitlesModule.isYtDlpAvailable();
        
        if (!available) {
          healthStatus.services.ytdlp.status = 'warning';
          healthStatus.services.ytdlp.message = 'yt-dlp not available - subtitle extraction may fail';
          healthStatus.warnings.push('yt-dlp not installed');
          
          // Also mark video_notes with a warning since it depends on yt-dlp
          if (healthStatus.services.video_notes.status === 'ok') {
            healthStatus.services.video_notes.status = 'warning';
            healthStatus.services.video_notes.message = 'Dependent service yt-dlp not available';
          }
        } else {
          healthStatus.services.ytdlp.status = 'ok';
        }
      } else {
        healthStatus.services.ytdlp.status = 'error';
        healthStatus.services.ytdlp.message = 'isYtDlpAvailable function not found in subtitles module';
        healthStatus.warnings.push('Subtitle module API changed');
      }
    } else {
      // Skip check in production
      healthStatus.services.ytdlp.status = 'skipped';
      healthStatus.services.ytdlp.message = 'yt-dlp check skipped in production';
    }
  } catch (error: any) {
    healthStatus.services.ytdlp.status = 'error';
    healthStatus.services.ytdlp.message = error.message;
    healthStatus.warnings.push('yt-dlp check exception');
  }

  // Update overall status based on the isolated systems
  if (healthStatus.warnings.length > 0) {
    healthStatus.status = 'degraded';
  }

  // Check each critical service
  const criticalServices = ['database', 'video_notes', 'file_notes', 'text_notes', 'openai'];
  for (const service of criticalServices) {
    if (healthStatus.services[service].status === 'error') {
      healthStatus.status = 'error';
      break;
    }
  }

  return NextResponse.json(healthStatus);
}

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'; 