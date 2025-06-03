'use client';

import { useState, useEffect } from 'react';

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const apiEndpoints = [
    '/api/youtube-notes',
    '/api/youtube-proxy',
    '/api/generate',
    '/api/process-youtube'
  ];

  useEffect(() => {
    const testEndpoints = async () => {
      const testResults: Record<string, any> = {};
      
      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
          });

          testResults[endpoint] = {
            status: response.status,
            statusText: response.statusText,
          };
          
          if (response.status !== 404) {
            const data = await response.json();
            testResults[endpoint].data = data;
          }
        } catch (error: any) {
          testResults[endpoint] = {
            error: true,
            message: error.message
          };
        }
      }
      
      setResults(testResults);
      setLoading(false);
    };

    testEndpoints();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Endpoint Test</h1>
      
      {loading ? (
        <p>Testing API endpoints...</p>
      ) : (
        <div className="space-y-4">
          {apiEndpoints.map(endpoint => (
            <div key={endpoint} className="border rounded p-4">
              <h2 className="text-xl font-semibold">{endpoint}</h2>
              
              {results[endpoint] ? (
                <div className="mt-2">
                  {results[endpoint].error ? (
                    <p className="text-red-500">Error: {results[endpoint].message}</p>
                  ) : (
                    <>
                      <p>Status: <span className={results[endpoint].status === 404 ? 'text-red-500' : 'text-green-500'}>
                        {results[endpoint].status} ({results[endpoint].statusText})
                      </span></p>
                      
                      {results[endpoint].data && (
                        <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(results[endpoint].data, null, 2)}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p>No data available</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 