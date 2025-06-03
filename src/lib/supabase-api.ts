// Supabase client for API routes
import { createClient } from '@supabase/supabase-js';

// Make sure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Direct client for API routes that don't use cookies directly
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
    }
  }
);

// Enhanced session validation function
export async function validateSession(request: Request) {
  console.log('[API] Starting session validation');
  
  try {
    // Get auth cookies from request
    const cookieHeader = request.headers.get('cookie') || '';
    let hasAuthCookies = false;
    
    // Check if auth cookies exist
    if (cookieHeader) {
      hasAuthCookies = cookieHeader.includes('sb-access-token') || 
                       cookieHeader.includes('sb-refresh-token');
      
      console.log(`[API] Auth cookies present: ${hasAuthCookies}`);
    } else {
      console.log('[API] No cookies in request');
    }

    // Try to get session
    const { data, error } = await getSessionFromAPI();
    
    if (error) {
      console.error('[API] Session error:', error.message);
      return { 
        session: null, 
        user: null, 
        error: error.message,
        hasAuthCookies 
      };
    }
    
    if (!data.session) {
      console.log('[API] No active session found');
      return { 
        session: null, 
        user: null, 
        error: 'No active session',
        hasAuthCookies 
      };
    }
    
    // Session is valid
    const session = data.session;
    const user = session.user;
    
    console.log(`[API] Valid session found for user:`, {
      id: user.id,
      email: user.email,
      expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    });
    
    return { session, user, error: null, hasAuthCookies };
  } 
  catch (err) {
    console.error('[API] Unexpected error during session validation:', err);
    return { 
      session: null, 
      user: null, 
      error: err instanceof Error ? err.message : 'Unknown session validation error',
      hasAuthCookies: false 
    };
  }
}

// Simple function to get session from the API route
export function getSessionFromAPI() {
  return supabaseAdmin.auth.getSession();
} 