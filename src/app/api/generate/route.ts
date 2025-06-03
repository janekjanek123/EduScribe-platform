import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy compatibility route for YouTube notes generation
 * 
 * This is a pass-through endpoint that forwards requests to the 
 * /api/youtube-notes endpoint for backwards compatibility.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing URL',
        message: 'Brak URL do filmu YouTube'
      }, { status: 400 });
    }

    // For compatibility, redirect to the youtube-notes endpoint
    console.log(`[API] Forwarding YouTube request to youtube-notes API`);
    
    // Get the host from the request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const apiUrl = `${protocol}://${host}/api/youtube-notes`;
    
    // Create headers for the forwarded request
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward the request to the YouTube notes API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    // Get the response data
    const responseData = await response.json();
    
    // Forward the status code and response body
    return NextResponse.json(responseData, { status: response.status });
  } catch (error: any) {
    console.error('[API] Error forwarding YouTube notes request:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      message: 'Wystąpił błąd podczas generowania notatek', 
      details: error.message
    }, { status: 500 });
  }
}

// Configure dynamic behavior to avoid caching
export const dynamic = 'force-dynamic'; 