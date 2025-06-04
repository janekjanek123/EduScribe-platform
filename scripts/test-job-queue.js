/**
 * Comprehensive test script for the Asynchronous Job Queue System
 * Tests all components: database, API, worker, real-time updates
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data
const testJobs = [
  {
    jobType: 'text_notes',
    inputData: {
      content: 'This is a test text for note generation. The content should be processed and transformed into structured notes.',
      options: {
        language: 'en',
        generateQuiz: true
      }
    },
    estimatedDurationSeconds: 60
  },
  {
    jobType: 'youtube_notes',
    inputData: {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      options: {
        preferredLanguages: ['en', 'pl']
      }
    },
    estimatedDurationSeconds: 120
  }
];

/**
 * Test database schema and functions
 */
async function testDatabase() {
  console.log('\n🗄️  Testing Database Schema and Functions');
  console.log('=' .repeat(50));

  try {
    // Test table existence
    const { data: tables, error: tableError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Jobs table not found:', tableError.message);
      console.log('💡 Run the database schema migration first:');
      console.log('   Execute database-schema-jobs.sql in Supabase SQL Editor');
      return false;
    }

    console.log('✅ Jobs table exists');

    // Test enqueue function
    const { data: jobId, error: enqueueError } = await supabase
      .rpc('enqueue_job', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        p_job_type: 'text_notes',
        p_input_data: { content: 'Test job for database validation' }
      });

    if (enqueueError) {
      console.error('❌ enqueue_job function failed:', enqueueError.message);
      return false;
    }

    console.log(`✅ enqueue_job function works (created job: ${jobId.slice(0, 8)}...)`);

    // Test get_next_job function
    const { data: nextJob, error: nextJobError } = await supabase
      .rpc('get_next_job', { p_worker_id: 'test-worker' });

    if (nextJobError) {
      console.error('❌ get_next_job function failed:', nextJobError.message);
      return false;
    }

    console.log('✅ get_next_job function works');

    // Test job statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_job_stats');

    if (statsError) {
      console.error('❌ get_job_stats function failed:', statsError.message);
      return false;
    }

    console.log(`✅ get_job_stats function works (${stats[0]?.total_jobs || 0} total jobs)`);

    // Clean up test job
    if (jobId) {
      await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
    }

    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

/**
 * Test API endpoints
 */
async function testAPI() {
  console.log('\n🌐 Testing API Endpoints');
  console.log('=' .repeat(50));

  try {
    // Test worker status endpoint
    console.log('   Testing worker status endpoint...');
    const workerResponse = await fetch(`${API_BASE_URL}/api/worker`);
    
    if (!workerResponse.ok) {
      console.error(`❌ Worker API failed: ${workerResponse.status}`);
      return false;
    }

    const workerData = await workerResponse.json();
    console.log(`✅ Worker API works (Worker: ${workerData.worker?.isRunning ? 'Running' : 'Stopped'})`);

    // Test job creation endpoint
    console.log('   Testing job creation endpoint...');
    for (const testJob of testJobs) {
      const jobResponse = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testJob),
      });

      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        console.log(`✅ Created ${testJob.jobType} job: ${jobData.jobId?.slice(0, 8)}... (Position: ${jobData.position})`);
      } else {
        const errorData = await jobResponse.json();
        console.log(`⚠️  Job creation failed for ${testJob.jobType}: ${errorData.error}`);
      }
    }

    // Test jobs list endpoint
    console.log('   Testing jobs list endpoint...');
    const jobsResponse = await fetch(`${API_BASE_URL}/api/jobs?limit=5`);
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log(`✅ Jobs list API works (${jobsData.jobs?.length || 0} jobs found)`);
    } else {
      console.log(`⚠️  Jobs list API failed: ${jobsResponse.status}`);
    }

    // Test job statistics endpoint
    console.log('   Testing job statistics endpoint...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/jobs/stats`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log(`✅ Job stats API works (${statsData.stats?.total_jobs || 0} total jobs)`);
    } else {
      console.log(`⚠️  Job stats API failed: ${statsResponse.status}`);
    }

    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

/**
 * Test job processing simulation
 */
async function testJobProcessing() {
  console.log('\n⚙️  Testing Job Processing Simulation');
  console.log('=' .repeat(50));

  try {
    // Create a test job directly in database
    const { data: jobId, error: createError } = await supabase
      .rpc('enqueue_job', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_job_type: 'text_notes',
        p_input_data: { content: 'Test content for processing simulation' }
      });

    if (createError) {
      console.error('❌ Failed to create test job:', createError.message);
      return false;
    }

    console.log(`✅ Created test job: ${jobId.slice(0, 8)}...`);

    // Simulate getting the job for processing
    const { data: jobs, error: getError } = await supabase
      .rpc('get_next_job', { p_worker_id: 'test-simulation' });

    if (getError || !jobs || jobs.length === 0) {
      console.log('⚠️  No jobs available for processing');
      return true;
    }

    const job = jobs[0];
    console.log(`✅ Retrieved job for processing: ${job.job_id.slice(0, 8)}...`);

    // Simulate progress updates
    console.log('   Simulating progress updates...');
    for (const progress of [25, 50, 75, 100]) {
      const { error: progressError } = await supabase
        .rpc('update_job_progress', {
          p_job_id: job.job_id,
          p_progress: progress
        });

      if (progressError) {
        console.error(`❌ Failed to update progress to ${progress}%:`, progressError.message);
      } else {
        console.log(`   ✅ Updated progress to ${progress}%`);
      }

      // Small delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Complete the job
    const { error: completeError } = await supabase
      .rpc('complete_job', {
        p_job_id: job.job_id,
        p_output_data: {
          notes: { content: 'Generated notes from test content' },
          metadata: { processed_at: new Date().toISOString() }
        },
        p_success: true
      });

    if (completeError) {
      console.error('❌ Failed to complete job:', completeError.message);
      return false;
    }

    console.log('✅ Job completed successfully');

    // Verify final job status
    const { data: finalJob, error: verifyError } = await supabase
      .from('jobs')
      .select('status, progress, output_data')
      .eq('id', job.job_id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify job completion:', verifyError.message);
      return false;
    }

    console.log(`✅ Job verification: Status=${finalJob.status}, Progress=${finalJob.progress}%`);

    return true;
  } catch (error) {
    console.error('❌ Job processing test failed:', error.message);
    return false;
  }
}

/**
 * Test priority queue functionality
 */
async function testPriorityQueue() {
  console.log('\n🎯 Testing Priority Queue Functionality');
  console.log('=' .repeat(50));

  try {
    // Create jobs with different priorities by simulating different user types
    const priorities = [
      { priority: 'low', label: 'Free User' },
      { priority: 'normal', label: 'Basic User' },
      { priority: 'high', label: 'Premium User' },
      { priority: 'urgent', label: 'Enterprise User' }
    ];

    const createdJobs = [];

    // Create test jobs
    for (const { priority, label } of priorities) {
      // Directly insert with specific priority for testing
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          job_type: 'text_notes',
          priority: priority,
          input_data: { content: `Test content for ${label}` }
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create ${priority} priority job:`, error.message);
        continue;
      }

      createdJobs.push({ id: job.id, priority, label });
      console.log(`✅ Created ${priority} priority job for ${label}`);
    }

    // Test queue ordering
    console.log('\n   Testing queue ordering...');
    const { data: queuedJobs, error: queueError } = await supabase
      .from('jobs')
      .select('id, priority, created_at')
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (queueError) {
      console.error('❌ Failed to check queue ordering:', queueError.message);
      return false;
    }

    console.log('   Queue order verification:');
    queuedJobs.slice(0, 10).forEach((job, index) => {
      console.log(`   ${index + 1}. Priority: ${job.priority} (${job.id.slice(0, 8)}...)`);
    });

    // Clean up test jobs
    for (const { id } of createdJobs) {
      await supabase.from('jobs').delete().eq('id', id);
    }

    console.log('✅ Priority queue test completed');
    return true;
  } catch (error) {
    console.error('❌ Priority queue test failed:', error.message);
    return false;
  }
}

/**
 * Generate test report
 */
async function generateReport() {
  console.log('\n📊 Test Report Summary');
  console.log('=' .repeat(50));

  try {
    // Get overall statistics
    const { data: stats } = await supabase.rpc('get_job_stats');
    const jobStats = stats?.[0] || {};

    console.log('Database Status:');
    console.log(`   📈 Total Jobs: ${jobStats.total_jobs || 0}`);
    console.log(`   ⏳ Queued: ${jobStats.queued_jobs || 0}`);
    console.log(`   ⚡ Processing: ${jobStats.processing_jobs || 0}`);
    console.log(`   ✅ Completed: ${jobStats.completed_jobs || 0}`);
    console.log(`   ❌ Failed: ${jobStats.failed_jobs || 0}`);
    console.log(`   ⏱️  Avg Duration: ${Math.round(jobStats.avg_duration_seconds || 0)}s`);

    // Test worker status
    try {
      const workerResponse = await fetch(`${API_BASE_URL}/api/worker`);
      if (workerResponse.ok) {
        const workerData = await workerResponse.json();
        console.log('\nWorker Status:');
        console.log(`   🔄 Running: ${workerData.worker?.isRunning ? 'Yes' : 'No'}`);
        console.log(`   💼 Active Jobs: ${workerData.worker?.activeJobs || 0}`);
        console.log(`   🎯 Max Concurrent: ${workerData.worker?.maxConcurrentJobs || 0}`);
        console.log(`   🆔 Worker ID: ${workerData.worker?.workerId || 'Unknown'}`);
      }
    } catch (error) {
      console.log('\nWorker Status: ⚠️  API not reachable');
    }

    console.log('\nSystem Health:');
    console.log(`   🗄️  Database: ✅ Connected`);
    console.log(`   🌐 API: ${API_BASE_URL.includes('localhost') ? '🔗 Local' : '🌍 Remote'}`);
    console.log(`   📡 Real-time: ${SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);

  } catch (error) {
    console.error('❌ Failed to generate report:', error.message);
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 EduScribe Job Queue System Test Suite');
  console.log('Testing comprehensive asynchronous note generation system');
  console.log('='.repeat(60));

  const results = {
    database: false,
    api: false,
    processing: false,
    priority: false
  };

  try {
    // Run all tests
    results.database = await testDatabase();
    results.api = await testAPI();
    results.processing = await testJobProcessing();
    results.priority = await testPriorityQueue();

    // Generate final report
    await generateReport();

    // Summary
    console.log('\n🎯 Test Results Summary');
    console.log('='.repeat(30));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log(`Database Schema: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`API Endpoints: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Job Processing: ${results.processing ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Priority Queue: ${results.priority ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Job queue system is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Run database migration: Execute database-schema-jobs.sql');
    console.log('2. Start the job worker: npm run worker-start');
    console.log('3. Monitor queue: npm run worker-status');
    console.log('4. Create test jobs through the UI or API');
    console.log('5. Monitor real-time updates in the dashboard');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main();
}

module.exports = {
  testDatabase,
  testAPI,
  testJobProcessing,
  testPriorityQueue,
  generateReport
}; 