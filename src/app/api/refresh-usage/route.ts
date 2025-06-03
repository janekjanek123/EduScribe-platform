import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refreshSavedNotesCount } from '@/services/subscription';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST endpoint to refresh user's saved notes count
 */
export async function POST(request: NextRequest) {
  console.log('[Refresh Usage API] Request received: POST');

  try {
    // STEP 1: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Refresh Usage API] Authentication missing');
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        message: 'Valid Bearer token is required'
      }, { status: 401 });
    }

    // Initialize Supabase client with the token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[Refresh Usage API] Authentication failed:', authError?.message);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid authentication token'
      }, { status: 401 });
    }
    
    console.log(`[Refresh Usage API] User authenticated: ${user.id}`);

    // STEP 2: Refresh the saved notes count
    console.log('[Refresh Usage API] Refreshing saved notes count...');
    const success = await refreshSavedNotesCount(user.id, token);

    if (!success) {
      console.error('[Refresh Usage API] Failed to refresh saved notes count');
      return NextResponse.json({
        success: false,
        error: 'Refresh failed',
        message: 'Failed to refresh saved notes count'
      }, { status: 500 });
    }

    // STEP 3: Get the updated usage data
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year', currentMonth)
      .single();

    if (usageError) {
      console.error('[Refresh Usage API] Error fetching updated usage:', usageError);
      return NextResponse.json({
        success: true,
        message: 'Saved notes count refreshed successfully, but could not fetch updated data'
      });
    }

    console.log(`[Refresh Usage API] Successfully refreshed usage for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Saved notes count refreshed successfully',
      data: usage
    });

  } catch (error: any) {
    console.error('[Refresh Usage API] Error refreshing usage:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while refreshing usage',
      details: error.message
    }, { status: 500 });
  }
}

// Configure dynamic behavior to avoid caching
export const dynamic = 'force-dynamic'; 