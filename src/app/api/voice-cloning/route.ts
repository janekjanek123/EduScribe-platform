import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.VOICE_CLONING_SERVICE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Voice cloning service not configured'
      }, { status: 503 })
    }

    // Check service health
    const response = await fetch(`${process.env.VOICE_CLONING_SERVICE_URL}/health`)
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Voice cloning service not available'
      }, { status: 503 })
    }
    
    const healthData = await response.json()
    
    return NextResponse.json({
      success: true,
      service_status: healthData,
      service_url: process.env.VOICE_CLONING_SERVICE_URL
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Voice cloning service error: ${error.message}`
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (!process.env.VOICE_CLONING_SERVICE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Voice cloning service not configured'
      }, { status: 503 })
    }
    
    if (action === 'preload-voices') {
      // Preload voices from the voice samples directory
      const response = await fetch(`${process.env.VOICE_CLONING_SERVICE_URL}/preload-voices`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: 'Failed to preload voices'
        }, { status: 500 })
      }
      
      const preloadData = await response.json()
      
      return NextResponse.json({
        success: true,
        message: 'Voices preloaded successfully',
        data: preloadData
      })
    }
    
    if (action === 'list-voices') {
      // List available voices
      const response = await fetch(`${process.env.VOICE_CLONING_SERVICE_URL}/list-voices`)
      
      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: 'Failed to list voices'
        }, { status: 500 })
      }
      
      const voicesData = await response.json()
      
      return NextResponse.json({
        success: true,
        voices: voicesData
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "preload-voices" or "list-voices"'
    }, { status: 400 })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Voice cloning API error: ${error.message}`
    }, { status: 500 })
  }
} 