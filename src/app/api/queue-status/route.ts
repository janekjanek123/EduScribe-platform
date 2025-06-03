import { NextRequest, NextResponse } from 'next/server';
import { getQueueInfo } from '@/services/queue';

/**
 * Queue Status API Endpoint
 * 
 * Provides real-time queue information for UI display
 */
export async function GET(request: NextRequest) {
  try {
    // Extract user ID from query params for personalized info
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Get queue information
    const queueInfo = getQueueInfo(userId || undefined);

    return NextResponse.json({
      success: true,
      data: {
        // General queue stats
        totalInQueue: queueInfo.stats.totalItems,
        priorityBreakdown: queueInfo.stats.priorityBreakdown,
        estimatedWaitTime: queueInfo.stats.estimatedWaitTime,
        
        // User-specific info (if userId provided)
        userPosition: queueInfo.position,
        
        // System load info
        systemLoad: queueInfo.systemLoad,
        
        // User-friendly messages
        message: generateQueueMessage(queueInfo),
        statusColor: getStatusColor(queueInfo.systemLoad.loadPercentage),
        
        // Timestamp for cache invalidation
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Queue Status API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get queue status',
      message: 'Unable to retrieve queue information'
    }, { status: 500 });
  }
}

/**
 * Generate user-friendly queue status message
 */
function generateQueueMessage(queueInfo: any): string {
  const { stats, position, systemLoad } = queueInfo;
  
  // If user has a position in queue
  if (position !== null) {
    if (position === 1) {
      return "You're next! Your request will be processed shortly.";
    } else if (position <= 3) {
      return `You're #${position} in queue. Almost ready!`;
    } else {
      const estimatedMinutes = Math.ceil(stats.estimatedWaitTime / 60);
      return `You're #${position} in queue. Estimated wait: ${estimatedMinutes} minutes.`;
    }
  }
  
  // General system status
  if (systemLoad.loadPercentage === 0 && stats.totalItems === 0) {
    return "System ready - no queue!";
  } else if (systemLoad.loadPercentage < 50) {
    return "System running smoothly - minimal wait times.";
  } else if (systemLoad.loadPercentage < 80) {
    return `Moderate load - ${stats.totalItems} requests in queue.`;
  } else {
    return `High load - ${stats.totalItems} requests waiting. Pro users get priority.`;
  }
}

/**
 * Get status color for UI
 */
function getStatusColor(loadPercentage: number): 'green' | 'yellow' | 'red' {
  if (loadPercentage < 50) return 'green';
  if (loadPercentage < 80) return 'yellow';
  return 'red';
} 