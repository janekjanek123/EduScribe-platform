# 🚦 EduScribe Priority Queue System

## Overview

The EduScribe Priority Queue System provides intelligent request management for note generation processes, ensuring fair resource allocation based on subscription tiers while maintaining optimal system performance.

## ✅ Integration Status

### ✅ Fully Integrated APIs
All EduScribe note generation APIs are now integrated with the priority queue system:

- **✅ Video Notes API** (`/api/video-notes`) - YouTube video processing
- **✅ File Notes API** (`/api/file-notes`) - Document and file processing  
- **✅ Text Notes API** (`/api/text-notes`) - Raw text processing
- **✅ Upload Video API** (`/api/upload-video`) - Uploaded video file processing

### 🎯 Queue Integration Benefits
- **Fair Resource Allocation**: Pro users get priority processing
- **System Stability**: Prevents server overload with controlled concurrency
- **User Experience**: Real-time queue position and wait time visibility
- **Graceful Degradation**: System slows down rather than crashing under load

## 🏗️ Architecture

### Core Components

1. **Queue Service** (`src/services/queue.ts`)
   - Priority-based request queuing
   - Subscription tier integration
   - Concurrent processing management
   - Real-time statistics

2. **Queue Status API** (`src/app/api/queue-status/route.ts`)
   - REST endpoint for queue information
   - User-specific position tracking
   - System load monitoring

3. **Queue Status UI** (`src/components/QueueStatus.tsx`)
   - Real-time queue visualization
   - User position display
   - System health indicators

## 🎯 Priority Levels

| Subscription | Priority | Description |
|-------------|----------|-------------|
| **Pro** | 1 (Highest) | Immediate processing, skip ahead of lower tiers |
| **Student** | 2 (Medium) | Priority over free users |
| **Free** | 3 (Lowest) | Standard queue position |

## 📊 Features

### ✅ Implemented Features

- **Priority-based queuing** with subscription tier support
- **Concurrent processing limit** (configurable, default: 3)
- **Real-time queue statistics** and position tracking
- **Estimated wait times** based on historical data
- **System load monitoring** with visual indicators
- **Auto-refreshing UI components** (5-second intervals)
- **Compact and full queue status displays**

### 🔧 Technical Details

#### Queue Configuration
```typescript
// Default settings (configurable)
maxConcurrent: 3          // Max simultaneous processes
averageProcessingTime: 90 // Seconds per request (auto-adjusting)
refreshInterval: 5000     // UI refresh rate (milliseconds)
```

#### Priority Mapping
```typescript
subscription => priority
'pro'      => 1  // Highest priority
'student'  => 2  // Medium priority  
'free'     => 3  // Standard priority
```

## 🚀 Usage Examples

### Integration in API Routes

```typescript
import { queueRequest } from '@/services/queue';

// In your API route
const result = await queueRequest(
  user.id,
  subscription.planId, // 'free' | 'student' | 'pro'
  'video', // request type
  async () => {
    // Your processing logic here
    return await processVideoNotes(data);
  }
);
```

### UI Components

```typescript
import QueueStatus from '@/components/QueueStatus';

// Compact view (for dashboards)
<QueueStatus compact />

// Full view (for dedicated pages)
<QueueStatus />

// With custom refresh rate
<QueueStatus refreshInterval={3000} />
```

### Queue Status API

```bash
# Get general queue status
GET /api/queue-status

# Get user-specific position
GET /api/queue-status?userId=user123

# Response format
{
  "success": true,
  "data": {
    "totalInQueue": 5,
    "userPosition": 2,
    "estimatedWaitTime": 180,
    "systemLoad": {
      "processing": 3,
      "capacity": 3,
      "loadPercentage": 100
    },
    "message": "You're #2 in queue. Estimated wait: 3 minutes.",
    "statusColor": "yellow"
  }
}
```

## 📱 User Experience

### Queue Status Messages

- **Position #1**: "You're next! Your request will be processed shortly."
- **Position #2-3**: "You're #{position} in queue. Almost ready!"
- **Position #4+**: "You're #{position} in queue. Estimated wait: X minutes."

### System Status Indicators

- 🟢 **Green** (< 50% load): "System running smoothly"
- 🟡 **Yellow** (50-80% load): "Moderate load"
- 🔴 **Red** (> 80% load): "High load - Pro users get priority"

## 🔧 Configuration

### Environment Variables
```env
# Optional queue configuration
QUEUE_MAX_CONCURRENT=3
QUEUE_REFRESH_INTERVAL=5000
QUEUE_AVERAGE_PROCESSING_TIME=90
```

### Queue Service Settings
```typescript
// In src/services/queue.ts
private maxConcurrent: number = 3;
private averageProcessingTime: number = 90; // seconds
```

## 📈 Monitoring & Analytics

### Available Metrics

1. **Queue Length**: Current number of pending requests
2. **Processing Count**: Active concurrent processes
3. **Load Percentage**: System utilization (processing/capacity * 100)
4. **Priority Breakdown**: Count by subscription tier
5. **Average Processing Time**: Self-adjusting based on actual performance
6. **User Position**: Individual queue position tracking

### Dashboard Integration

```typescript
// Dashboard shows compact queue status
{filteredNotes.length > 0 && (
  <div className="mb-6">
    <QueueStatus compact />
  </div>
)}
```

## 🛠️ Advanced Features

### Auto-adjusting Processing Times
```typescript
// System learns from actual processing durations
updateAverageProcessingTime(actualDuration);
```

### Queue Management
```typescript
// Remove user from queue (e.g., if they cancel)
priorityQueue.removeFromQueue(userId);

// Get detailed system load
const load = priorityQueue.getSystemLoad();
```

### Error Handling
- Graceful degradation when queue service is unavailable
- Fallback to direct processing if queue fails
- User-friendly error messages

## 🎨 UI Components

### QueueStatus Component Props

```typescript
interface QueueStatusProps {
  userId?: string;        // Optional user ID for personalized info
  refreshInterval?: number; // Refresh rate in milliseconds (default: 5000)
  compact?: boolean;      // Use compact display (default: false)
}
```

### Status Colors
- **Green**: System healthy, minimal wait
- **Yellow**: Moderate load, some delays expected
- **Red**: High load, significant waits possible

## 🚀 Future Enhancements

### Planned Features
- [ ] Redis-based queue for multi-server deployments
- [ ] WebSocket real-time updates
- [ ] Queue analytics dashboard
- [ ] Dynamic priority adjustment
- [ ] Batch processing optimization
- [ ] Queue pause/resume functionality

### Scalability Improvements
- [ ] Horizontal scaling support
- [ ] Load balancer integration
- [ ] Database-backed queue persistence
- [ ] Cross-server queue synchronization

## 🔍 Troubleshooting

### Common Issues

1. **Queue not working**: Check if `queueRequest` is properly imported
2. **Status not updating**: Verify API endpoint is accessible
3. **Wrong priority**: Ensure subscription plan is correctly retrieved
4. **UI not showing**: Check if `QueueStatus` component is imported

### Debug Information
```typescript
// Enable queue logging
console.log('[Queue] Current state:', priorityQueue.getSystemLoad());
```

## 📝 API Reference

### Queue Service Methods
- `queueRequest<T>(userId, plan, type, processor)` - Add request to queue
- `getQueueInfo(userId?)` - Get current queue statistics
- `priorityQueue.removeFromQueue(userId)` - Remove user from queue
- `priorityQueue.getSystemLoad()` - Get detailed system metrics

### Status API Endpoints
- `GET /api/queue-status` - General queue information
- `GET /api/queue-status?userId={id}` - User-specific queue status

This system provides a robust foundation for managing concurrent requests while ensuring fair resource allocation based on subscription tiers! 