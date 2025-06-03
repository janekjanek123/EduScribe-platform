/**
 * Priority Queue Service for EduScribe
 * 
 * Provides priority-based request queuing for note generation
 * with subscription tier support
 */

interface QueueItem {
  id: string;
  userId: string;
  priority: number; // 1=high (Pro), 2=medium (Student), 3=low (Free)
  requestType: 'video' | 'file' | 'text' | 'video-upload';
  payload: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: Date;
}

interface QueueStats {
  totalItems: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  estimatedWaitTime: number; // seconds
}

class PriorityQueueService {
  private queue: QueueItem[] = [];
  private processing: Map<string, boolean> = new Map();
  private maxConcurrent: number = 3; // Max concurrent processing
  private averageProcessingTime: number = 90; // seconds

  /**
   * Add request to queue with priority based on subscription
   */
  async addToQueue<T>(
    userId: string,
    requestType: QueueItem['requestType'],
    subscriptionPlan: 'free' | 'student' | 'pro',
    payload: any,
    processingFunction: () => Promise<T>
  ): Promise<T> {
    const priority = this.getPriorityFromPlan(subscriptionPlan);
    const itemId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise<T>((resolve, reject) => {
      const queueItem: QueueItem = {
        id: itemId,
        userId,
        priority,
        requestType,
        payload,
        resolve: async (value) => {
          try {
            const result = await processingFunction();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.processing.delete(itemId);
            this.processNext();
          }
        },
        reject: (error) => {
          this.processing.delete(itemId);
          reject(error);
          this.processNext();
        },
        timestamp: new Date()
      };

      this.insertByPriority(queueItem);
      console.log(`[Queue] Added ${requestType} request for user ${userId} with priority ${priority}`);
      
      this.processNext();
    });
  }

  /**
   * Get current queue statistics for UI display
   */
  getQueueStats(userId?: string): QueueStats {
    const userPosition = userId ? this.getUserPosition(userId) : null;
    
    const priorityBreakdown = this.queue.reduce(
      (acc, item) => {
        if (item.priority === 1) acc.high++;
        else if (item.priority === 2) acc.medium++;
        else acc.low++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    const estimatedWaitTime = userPosition 
      ? userPosition * this.averageProcessingTime
      : this.queue.length * this.averageProcessingTime;

    return {
      totalItems: this.queue.length,
      priorityBreakdown,
      estimatedWaitTime
    };
  }

  /**
   * Get user's position in queue
   */
  getUserPosition(userId: string): number | null {
    const index = this.queue.findIndex(item => item.userId === userId);
    return index === -1 ? null : index + 1;
  }

  /**
   * Process next items in queue
   */
  private processNext(): void {
    const currentlyProcessing = this.processing.size;
    
    if (currentlyProcessing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Take next item (already sorted by priority)
    const nextItem = this.queue.shift();
    if (!nextItem) return;

    this.processing.set(nextItem.id, true);
    
    console.log(`[Queue] Processing ${nextItem.requestType} for user ${nextItem.userId} (priority ${nextItem.priority})`);
    
    // Start processing
    setTimeout(() => {
      nextItem.resolve(null); // The actual processing happens in the resolve function
    }, 100);
  }

  /**
   * Insert item into queue maintaining priority order
   */
  private insertByPriority(item: QueueItem): void {
    // Find insertion point (sorted by priority, then by timestamp)
    let insertIndex = 0;
    
    for (let i = 0; i < this.queue.length; i++) {
      const existingItem = this.queue[i];
      
      // Higher priority (lower number) goes first
      if (item.priority < existingItem.priority) {
        break;
      }
      
      // Same priority, older timestamp goes first
      if (item.priority === existingItem.priority && 
          item.timestamp >= existingItem.timestamp) {
        insertIndex = i + 1;
      } else if (item.priority > existingItem.priority) {
        insertIndex = i + 1;
      }
    }
    
    this.queue.splice(insertIndex, 0, item);
  }

  /**
   * Map subscription plan to priority level
   */
  private getPriorityFromPlan(plan: string): number {
    switch (plan) {
      case 'pro': return 1; // Highest priority
      case 'student': return 2; // Medium priority  
      case 'free':
      default: return 3; // Lowest priority
    }
  }

  /**
   * Remove user from queue (if they cancel)
   */
  removeFromQueue(userId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.userId !== userId);
    return this.queue.length < initialLength;
  }

  /**
   * Update processing time average for better estimates
   */
  updateAverageProcessingTime(duration: number): void {
    // Simple moving average
    this.averageProcessingTime = (this.averageProcessingTime * 0.8) + (duration * 0.2);
  }

  /**
   * Get system load information
   */
  getSystemLoad(): {
    queueLength: number;
    processing: number;
    capacity: number;
    loadPercentage: number;
  } {
    const processing = this.processing.size;
    const capacity = this.maxConcurrent;
    const loadPercentage = (processing / capacity) * 100;

    return {
      queueLength: this.queue.length,
      processing,
      capacity,
      loadPercentage
    };
  }
}

// Singleton instance
export const priorityQueue = new PriorityQueueService();

/**
 * Helper function to wrap existing API calls with queue
 */
export async function queueRequest<T>(
  userId: string,
  subscriptionPlan: 'free' | 'student' | 'pro',
  requestType: QueueItem['requestType'],
  processingFunction: () => Promise<T>
): Promise<T> {
  return priorityQueue.addToQueue(
    userId,
    requestType, 
    subscriptionPlan,
    {},
    processingFunction
  );
}

/**
 * Get queue information for UI
 */
export function getQueueInfo(userId?: string) {
  return {
    stats: priorityQueue.getQueueStats(userId),
    position: userId ? priorityQueue.getUserPosition(userId) : null,
    systemLoad: priorityQueue.getSystemLoad()
  };
} 