import { NextRequest, NextResponse } from 'next/server';
import { jobWorker } from '@/services/job-worker';

export async function GET(request: NextRequest) {
  try {
    // Get worker status
    const status = jobWorker.getStatus();

    return NextResponse.json({
      success: true,
      worker: status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Worker API] Error getting worker status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get worker status', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result: any = {};
    let message = '';

    switch (action) {
      case 'start':
        await jobWorker.start();
        message = 'Worker started successfully';
        break;

      case 'stop':
        await jobWorker.stop();
        message = 'Worker stopped successfully';
        break;

      case 'restart':
        await jobWorker.stop();
        await jobWorker.start();
        message = 'Worker restarted successfully';
        break;

      case 'status':
        result = jobWorker.getStatus();
        message = 'Worker status retrieved';
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      worker: jobWorker.getStatus(),
      ...result
    });

  } catch (error: any) {
    console.error('[Worker API] Error managing worker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage worker', details: error.message },
      { status: 500 }
    );
  }
} 