# Asynchronous Job Queue System for EduScribe

## Overview

The Asynchronous Job Queue System enables scalable, background processing of note generation tasks across all content types (text, file, video, YouTube) with priority queues based on user subscription levels.

## Architecture

### Core Components

1. **Database Schema** (`database-schema-jobs.sql`)
   - Job queue table with status tracking
   - Priority levels based on subscription tiers
   - Retry logic and error handling
   - Performance indexes

2. **Job Queue Service** (`src/services/job-queue.ts`)
   - Job creation and management
   - Priority queue operations
   - Real-time status updates
   - Statistics and monitoring

3. **Job Worker** (`src/services/job-worker.ts`)
   - Background job processing
   - Multi-content type support
   - Error handling and retries
   - Progress tracking

4. **API Endpoints**
   - `/api/jobs` - Job CRUD operations
   - `/api/jobs/[jobId]` - Individual job management
   - `/api/jobs/stats` - Queue statistics
   - `/api/worker` - Worker management

5. **Frontend Components**
   - `useJobQueue` hook for state management
   - `JobStatusCard` for job display
   - `JobDashboard` for queue monitoring

## Features

### Priority Queue System

Jobs are prioritized based on user subscription levels:

- **Enterprise** (`urgent` priority): 🔥 Highest priority
- **Premium** (`high` priority): ⚡ High priority  
- **Basic** (`normal` priority): 🔵 Normal priority
- **Free** (`low` priority): ⚪ Lowest priority

### Supported Job Types

1. **Text Notes** (`text_notes`)
   - Direct text input processing
   - Custom prompts support
   - Language selection

2. **File Notes** (`file_notes`)
   - Document text extraction
   - Multiple file format support
   - Content analysis

3. **Video Notes** (`video_notes`)
   - Video transcript extraction
   - Audio processing
   - Subtitle generation

4. **YouTube Notes** (`youtube_notes`)
   - YouTube transcript extraction
   - Multi-language support
   - Fallback mechanisms

### Real-time Updates

- WebSocket-based real-time status updates
- Automatic progress tracking
- Live queue position updates
- Instant completion notifications

## Usage

### Creating Jobs

```typescript
import { useJobQueue } from '@/hooks/useJobQueue';

function MyComponent() {
  const { createJob } = useJobQueue();

  const handleCreateTextNotes = async () => {
    const result = await createJob('text_notes', {
      content: 'Your text content here...',
      options: {
        language: 'en',
        generateQuiz: true
      }
    });
    
    if (result) {
      console.log(`Job created: ${result.jobId}, Position: ${result.position}`);
    }
  };

  const handleCreateYouTubeNotes = async () => {
    const result = await createJob('youtube_notes', {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      options: {
        preferredLanguages: ['en', 'pl', 'es']
      }
    });
  };

  return (
    <div>
      <button onClick={handleCreateTextNotes}>
        Create Text Notes Job
      </button>
      <button onClick={handleCreateYouTubeNotes}>
        Create YouTube Notes Job
      </button>
    </div>
  );
}
```

### Monitoring Jobs

```typescript
import { useJobQueue } from '@/hooks/useJobQueue';

function JobMonitor() {
  const {
    jobs,
    queuedJobs,
    processingJobs,
    completedJobs,
    loading,
    error
  } = useJobQueue({
    autoRefresh: true,
    refreshInterval: 5000,
    enableRealTime: true
  });

  return (
    <div>
      <h2>Job Statistics</h2>
      <p>Queued: {queuedJobs.length}</p>
      <p>Processing: {processingJobs.length}</p>
      <p>Completed: {completedJobs.length}</p>
      
      <h2>Recent Jobs</h2>
      {jobs.map(job => (
        <div key={job.id}>
          <span>{job.job_type}</span>
          <span>{job.status}</span>
          <span>{job.progress}%</span>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### Create Job

```http
POST /api/jobs
Content-Type: application/json

{
  "jobType": "text_notes",
  "inputData": {
    "content": "Your text content...",
    "options": {
      "language": "en",
      "generateQuiz": true
    }
  },
  "estimatedDurationSeconds": 120
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "position": 3,
  "message": "Job queued successfully"
}
```

### Get Job Status

```http
GET /api/jobs/[jobId]
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid-here",
    "status": "processing",
    "progress": 45,
    "priority": "high",
    "queuePosition": 2,
    "created_at": "2024-01-01T00:00:00Z",
    "estimated_duration_seconds": 120
  }
}
```

### Get User Jobs

```http
GET /api/jobs?page=1&limit=10&status=queued
```

### Job Management

```http
PATCH /api/jobs/[jobId]
Content-Type: application/json

{
  "action": "cancel" // or "retry"
}
```

### Queue Statistics

```http
GET /api/jobs/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_jobs": 150,
    "queued_jobs": 12,
    "processing_jobs": 3,
    "completed_jobs": 130,
    "failed_jobs": 5,
    "avg_duration_seconds": 95
  },
  "queue": {
    "queuedCount": 12,
    "processingCount": 3,
    "estimatedWaitTimeSeconds": 420,
    "recentJobs": [...recent job objects]
  }
}
```

## Database Schema

### Jobs Table

```sql
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  job_type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  priority job_priority NOT NULL DEFAULT 'normal',
  input_data JSONB NOT NULL,
  output_data JSONB,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  worker_id TEXT,
  estimated_duration_seconds INTEGER,
  actual_duration_seconds INTEGER
);
```

### Key Functions

- `enqueue_job()` - Add job to queue with priority
- `get_next_job()` - Retrieve highest priority job
- `update_job_progress()` - Update job progress
- `complete_job()` - Mark job as completed
- `retry_job()` - Retry failed job
- `get_job_stats()` - Get queue statistics

## Worker System

### Configuration

```typescript
const WORKER_CONFIG = {
  pollInterval: 5000,      // 5 seconds
  maxConcurrentJobs: 3,    // Process up to 3 jobs simultaneously
  retryDelay: 30000,       // 30 seconds between retries
  workerId: 'worker-1'     // Unique worker identifier
};
```

### Job Processing Flow

1. **Poll Queue** - Worker polls for next available job
2. **Lock Job** - Atomically locks job for processing
3. **Update Status** - Sets status to 'processing'
4. **Process Content** - Executes appropriate processor
5. **Update Progress** - Reports progress updates
6. **Complete Job** - Saves results and updates status
7. **Handle Errors** - Retry logic for failed jobs

### Error Handling

- Automatic retry with exponential backoff
- Maximum retry limits per job
- Detailed error logging and reporting
- Graceful degradation for partial failures

## Deployment

### Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for note generation)
OPENAI_API_KEY=your_openai_key

# Worker Configuration
WORKER_POLL_INTERVAL=5000
WORKER_MAX_CONCURRENT_JOBS=3
WORKER_RETRY_DELAY=30000
```

### Production Considerations

1. **Scaling Workers**
   - Deploy multiple worker instances
   - Use load balancing for API endpoints
   - Monitor queue depth and processing times

2. **Database Optimization**
   - Regular maintenance of completed jobs
   - Index optimization for queue queries
   - Connection pooling for high throughput

3. **Monitoring**
   - Queue depth alerts
   - Processing time monitoring
   - Error rate tracking
   - Worker health checks

4. **Backup & Recovery**
   - Regular database backups
   - Job state recovery procedures
   - Failed job analysis and reprocessing

### Render Deployment

1. **Database Setup**
   ```bash
   # Run in Supabase SQL Editor
   -- Execute database-schema-jobs.sql
   ```

2. **Environment Configuration**
   - Add all required environment variables
   - Enable real-time features in Supabase

3. **Worker Deployment**
   - Workers auto-start in production
   - Use multiple dynos for scaling
   - Monitor worker health via `/api/worker`

## Monitoring & Maintenance

### Health Checks

```bash
# Check worker status
curl -X GET https://your-app.onrender.com/api/worker

# Get queue statistics
curl -X GET https://your-app.onrender.com/api/jobs/stats
```

### Maintenance Tasks

1. **Cleanup Old Jobs**
   ```sql
   SELECT cleanup_old_jobs(30); -- Remove jobs older than 30 days
   ```

2. **Monitor Queue Health**
   ```sql
   SELECT * FROM get_job_stats(); -- Global statistics
   ```

3. **Worker Management**
   ```bash
   # Restart worker
   curl -X POST https://your-app.onrender.com/api/worker \
     -H "Content-Type: application/json" \
     -d '{"action": "restart"}'
   ```

## Performance Metrics

### Expected Throughput

- **Text Notes**: 30-60 seconds per job
- **File Notes**: 1-3 minutes per job
- **Video Notes**: 2-5 minutes per job
- **YouTube Notes**: 1-2 minutes per job

### Scaling Guidelines

- **< 100 jobs/hour**: Single worker instance
- **100-500 jobs/hour**: 2-3 worker instances
- **500+ jobs/hour**: Multiple workers + load balancing

### Optimization Tips

1. **Database Performance**
   - Use appropriate indexes
   - Regular VACUUM operations
   - Monitor connection pool usage

2. **Worker Efficiency**
   - Optimize concurrent job limits
   - Implement job batching where possible
   - Cache frequently used resources

3. **API Performance**
   - Implement response caching
   - Use compression for large payloads
   - Monitor response times

## Troubleshooting

### Common Issues

1. **Jobs Stuck in Queue**
   - Check worker status
   - Verify database connectivity
   - Review error logs

2. **High Error Rates**
   - Check API dependencies
   - Verify input validation
   - Review retry configuration

3. **Slow Processing**
   - Monitor resource usage
   - Check for blocking operations
   - Optimize job processors

### Debug Commands

```typescript
// Get worker status
const status = await fetch('/api/worker').then(r => r.json());

// Get specific job details
const job = await fetch(`/api/jobs/${jobId}`).then(r => r.json());

// Check queue statistics
const stats = await fetch('/api/jobs/stats').then(r => r.json());
```

## Future Enhancements

- [ ] Job scheduling and cron-like functionality
- [ ] Multi-region worker deployment
- [ ] Advanced priority algorithms
- [ ] Job dependency management
- [ ] Webhook notifications for job completion
- [ ] Batch job processing
- [ ] Resource usage optimization
- [ ] Advanced monitoring dashboard 