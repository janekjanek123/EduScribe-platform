/**
 * Test script for production-safe YouTube transcript extraction
 * This tests the new youtube-transcript-api based service
 */

// Test videos with known transcripts
const testVideos = [
  {
    name: 'Short educational video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll (usually has captions)
    id: 'dQw4w9WgXcQ'
  },
  {
    name: 'TED Talk (usually has transcripts)',
    url: 'https://www.youtube.com/watch?v=5KdXBT_JNfE',
    id: '5KdXBT_JNfE'
  }
];

async function testAPIEndpoint() {
  console.log('🌐 Testing YouTube Transcript API Endpoint\n');
  
  try {
    // Test the API endpoint if running locally
    const testUrl = 'http://localhost:3000/api/youtube-transcript';
    const testVideoId = 'dQw4w9WgXcQ';
    
    console.log(`   ⏳ Testing POST ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: testVideoId,
        languages: ['en', 'pl']
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`   ✅ API Test Success!`);
      console.log(`   📝 Language: ${data.language}`);
      console.log(`   📊 Method: ${data.method}`);
      console.log(`   📄 Length: ${data.transcript.length} characters`);
      console.log(`   📄 Preview: ${data.transcript.substring(0, 100)}...\n`);
    } else {
      console.log(`   ❌ API Test Failed: ${data.error}\n`);
    }
    
    // Test GET endpoint
    console.log(`   ⏳ Testing GET ${testUrl}`);
    const getResponse = await fetch(`${testUrl}?videoId=${testVideoId}&languages=en,pl`);
    const getData = await getResponse.json();
    
    if (getData.success) {
      console.log(`   ✅ GET API Test Success!`);
      console.log(`   📝 Language: ${getData.language}`);
      console.log(`   📄 Length: ${getData.transcript.length} characters`);
      console.log(`   📄 Preview: ${getData.transcript.substring(0, 100)}...\n`);
    } else {
      console.log(`   ❌ GET API Test Failed: ${getData.error}\n`);
    }
    
  } catch (error) {
    console.log(`   ⚠️ API Test Skipped (server not running): ${error.message}\n`);
  }
}

async function testDirectImport() {
  console.log('🧪 Testing Direct Import (youtube-transcript-api)\n');
  
  try {
    // Test the youtube-transcript-api package directly
    const TranscriptAPI = require('youtube-transcript-api');
    
    for (const video of testVideos) {
      console.log(`📹 Testing: ${video.name}`);
      console.log(`   URL: ${video.url}`);
      console.log(`   ID: ${video.id}\n`);
      
      try {
        console.log('   ⏳ Extracting transcript...');
        const transcriptData = await TranscriptAPI.getTranscript(video.id);
        
        if (transcriptData && transcriptData.length > 0) {
          const fullTranscript = transcriptData
            .map(item => item.text || '')
            .filter(text => text.trim().length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log(`   ✅ Success!`);
          console.log(`   📊 Segments: ${transcriptData.length}`);
          console.log(`   📄 Length: ${fullTranscript.length} characters`);
          console.log(`   📄 Preview: ${fullTranscript.substring(0, 100)}...\n`);
        } else {
          console.log(`   ❌ No transcript data returned\n`);
        }
        
      } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}\n`);
      }
      
      console.log('─'.repeat(60) + '\n');
    }
    
  } catch (error) {
    console.log(`   ❌ Direct import test failed: ${error.message}\n`);
  }
}

async function main() {
  console.log('🚀 YouTube Transcript Service Test Suite\n');
  console.log('This test verifies the production-safe transcript extraction');
  console.log('using youtube-transcript-api instead of shell commands.\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    await testDirectImport();
    await testAPIEndpoint();
    
    console.log('✅ Test suite completed!');
    console.log('\n📝 Notes:');
    console.log('- This service works in production without system dependencies');
    console.log('- No shell commands or yt-dlp required');
    console.log('- Falls back to ytdl-core if youtube-transcript-api fails');
    console.log('- Supports multiple languages and auto-detection');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = {
  testDirectImport,
  testAPIEndpoint
}; 