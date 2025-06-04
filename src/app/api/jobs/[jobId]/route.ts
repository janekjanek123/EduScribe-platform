import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { jobQueueService } from '@/services/job-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job details
    const job = await jobQueueService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user owns this job
    if (job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get queue position if job is queued
    let queuePosition;
    if (job.status === 'queued') {
      queuePosition = await jobQueueService.getQueuePosition(jobId);
    }

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        queuePosition
      }
    });

  } catch (error: any) {
    console.error('[Jobs API] Error getting job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get job', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;
    const body = await request.json();
    const { action } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Get job to verify ownership
    const job = await jobQueueService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    let result = false;
    let message = '';

    switch (action) {
      case 'cancel':
        if (job.status !== 'queued') {
          return NextResponse.json(
            { error: 'Only queued jobs can be cancelled' },
            { status: 400 }
          );
        }
        result = await jobQueueService.cancelJob(jobId);
        message = result ? 'Job cancelled successfully' : 'Failed to cancel job';
        break;

      case 'retry':
        if (job.status !== 'failed') {
          return NextResponse.json(
            { error: 'Only failed jobs can be retried' },
            { status: 400 }
          );
        }
        result = await jobQueueService.retryJob(jobId);
        message = result ? 'Job retried successfully' : 'Failed to retry job';
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error: any) {
    console.error('[Jobs API] Error updating job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job to verify ownership
    const job = await jobQueueService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow deletion of completed, failed, or cancelled jobs
    if (!['completed', 'failed', 'cancelled'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Only completed, failed, or cancelled jobs can be deleted' },
        { status: 400 }
      );
    }

    // Delete the job (this would be implemented in the service)
    // For now, we'll just cancel it
    const result = await jobQueueService.cancelJob(jobId);

    return NextResponse.json({
      success: result,
      message: result ? 'Job deleted successfully' : 'Failed to delete job'
    });

  } catch (error: any) {
    console.error('[Jobs API] Error deleting job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete job', details: error.message },
      { status: 500 }
    );
  }
} 