import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  
  // Mock different file types based on extension
  if (path.endsWith('.mp4')) {
    // Return a placeholder video response
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': '0'
      }
    })
  }
  
  if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png')) {
    // Return a placeholder image response
    // Generate a simple colored rectangle as placeholder
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#8B5CF6"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              fill="white" font-family="Arial" font-size="16">
          Placeholder Image
        </text>
      </svg>
    `
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml'
      }
    })
  }
  
  if (path.endsWith('.mp3')) {
    // Return a placeholder audio response
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': '0'
      }
    })
  }
  
  // Default response for other files
  return new NextResponse('Placeholder content', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  })
} 