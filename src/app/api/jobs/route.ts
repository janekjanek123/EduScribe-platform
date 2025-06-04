import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { jobQueueService, type JobType, type JobInput } from '@/services/job-queue';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as any;

    // Get user's jobs
    const result = await jobQueueService.getUserJobs(user.id, page, limit, status);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('[Jobs API] Error getting jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get jobs', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobType, inputData, estimatedDurationSeconds } = body;

    // Validate input
    if (!jobType || !inputData) {
      return NextResponse.json(
        { error: 'Missing required fields: jobType, inputData' },
        { status: 400 }
      );
    }

    // Validate job type
    const validJobTypes: JobType[] = ['text_notes', 'file_notes', 'video_notes', 'youtube_notes'];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${validJobTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate input data based on job type
    const validationError = validateJobInput(jobType, inputData);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Enqueue the job
    const result = await jobQueueService.enqueueJob(
      user.id,
      jobType,
      inputData,
      estimatedDurationSeconds
    );

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      position: result.position,
      message: 'Job queued successfully'
    });

  } catch (error: any) {
    console.error('[Jobs API] Error creating job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create job', details: error.message },
      { status: 500 }
    );
  }
}

function validateJobInput(jobType: JobType, inputData: any): string | null {
  switch (jobType) {
    case 'text_notes':
      if (!inputData.content || typeof inputData.content !== 'string') {
        return 'text_notes job requires content field (string)';
      }
      if (inputData.content.trim().length < 10) {
        return 'Content must be at least 10 characters long';
      }
      break;

    case 'file_notes':
      if (!inputData.fileUrl || typeof inputData.fileUrl !== 'string') {
        return 'file_notes job requires fileUrl field (string)';
      }
      if (!inputData.fileName || typeof inputData.fileName !== 'string') {
        return 'file_notes job requires fileName field (string)';
      }
      if (!inputData.fileType || typeof inputData.fileType !== 'string') {
        return 'file_notes job requires fileType field (string)';
      }
      break;

    case 'video_notes':
      if (!inputData.videoUrl || typeof inputData.videoUrl !== 'string') {
        return 'video_notes job requires videoUrl field (string)';
      }
      break;

    case 'youtube_notes':
      if (!inputData.youtubeUrl || typeof inputData.youtubeUrl !== 'string') {
        return 'youtube_notes job requires youtubeUrl field (string)';
      }
      if (!inputData.videoId || typeof inputData.videoId !== 'string') {
        return 'youtube_notes job requires videoId field (string)';
      }
      break;

    default:
      return `Unknown job type: ${jobType}`;
  }

  return null;
} 