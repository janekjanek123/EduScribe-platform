import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { user_type, interests, onboarding_completed } = await request.json();

    // Create or update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: session.user.id,
        user_type,
        interests,
        onboarding_completed: onboarding_completed || true,
        email: session.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[User Profile API] Error creating/updating profile:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create user profile',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'User profile created successfully' 
    });

  } catch (error: any) {
    console.error('[User Profile API] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist
        return NextResponse.json({ 
          success: true, 
          data: null,
          message: 'User profile not found' 
        });
      }
      
      console.error('[User Profile API] Error fetching profile:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user profile',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'User profile fetched successfully' 
    });

  } catch (error: any) {
    console.error('[User Profile API] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 