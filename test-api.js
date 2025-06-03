// Simple script to test API endpoints
const apiEndpoints = [
  '/api/youtube-notes',
  '/api/youtube-proxy',
  '/api/generate',
  '/api/process-youtube'
];

const testEndpoints = async () => {
  for (const endpoint of apiEndpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
      });

      const status = response.status;
      console.log(`Status: ${status} (${response.statusText})`);
      
      if (status !== 404) {
        const data = await response.json();
        console.log('Response:', data);
      } else {
        console.log('404 - Endpoint not found');
      }
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error.message);
    }
    console.log('-------------------');
  }
};

// Run the tests
testEndpoints(); 