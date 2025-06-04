import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { jobQueueService } from '@/services/job-queue';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const global = searchParams.get('global') === 'true';

    // Get job statistics
    const stats = await jobQueueService.getJobStats(global ? undefined : user.id);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to get job statistics' },
        { status: 500 }
      );
    }

    // Get additional queue information
    const queueInfo = await getQueueInfo(user.id);

    return NextResponse.json({
      success: true,
      stats,
      queue: queueInfo
    });

  } catch (error: any) {
    console.error('[Jobs Stats API] Error getting stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get job stats', details: error.message },
      { status: 500 }
    );
  }
}

async function getQueueInfo(userId: string) {
  try {
    // Get user's active jobs
    const userJobs = await jobQueueService.getUserJobs(userId, 1, 100);
    
    const queuedJobs = userJobs.jobs.filter(job => job.status === 'queued');
    const processingJobs = userJobs.jobs.filter(job => job.status === 'processing');
    
    // Calculate estimated wait times
    let estimatedWaitTime = 0;
    for (const job of queuedJobs) {
      const position = await jobQueueService.getQueuePosition(job.id);
      estimatedWaitTime += (position * 60); // Rough estimate: 1 minute per position
    }

    return {
      queuedCount: queuedJobs.length,
      processingCount: processingJobs.length,
      estimatedWaitTimeSeconds: estimatedWaitTime,
      recentJobs: userJobs.jobs.slice(0, 5) // Last 5 jobs
    };
  } catch (error) {
    console.error('[Jobs Stats API] Error getting queue info:', error);
    return {
      queuedCount: 0,
      processingCount: 0,
      estimatedWaitTimeSeconds: 0,
      recentJobs: []
    };
  }
} 