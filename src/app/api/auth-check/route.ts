import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Validates a token directly with Supabase
async function validateToken(token: string) {
  try {
    // Create a direct Supabase client
    const directSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get user from token
    const { data: userData, error: userError } = await directSupabase.auth.getUser(token);
    
    if (userData?.user && !userError) {
      console.log('[API] Auth-check: Token validation successful:', userData.user.id);
      return {
        user: userData.user,
        authMethod: 'token'
      };
    } else {
      console.error('[API] Auth-check: Token validation failed:', userError?.message);
      return null;
    }
  } catch (error) {
    console.error('[API] Auth-check: Error validating token:', error);
    return null;
  }
}

// This is a simple endpoint that lets the middleware verify auth
// and return the authentication information in response headers
export async function HEAD(request: NextRequest) {
  // The middleware will have already run and attached auth data to the request if available
  console.log('[API] HEAD /api/auth-check - Auth verification endpoint');
  
  // Check if middleware set the headers
  let middlewareUser = request.headers.get('x-middleware-user');
  let authMethod = request.headers.get('x-middleware-auth-method');
  
  // If middleware didn't set headers, try to validate the token directly
  if (!middlewareUser) {
    // First check the Authorization header
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('[API] Auth-check: Middleware headers missing, validating token from Authorization header');
    } else {
      // Check for token in query params
      const url = new URL(request.url);
      token = url.searchParams.get('token');
      if (token) {
        console.log('[API] Auth-check: Validating token from URL query parameters');
      }
    }
    
    if (token) {
      const validation = await validateToken(token);
      if (validation) {
        middlewareUser = JSON.stringify({
          id: validation.user.id,
          email: validation.user.email
        });
        authMethod = validation.authMethod;
      }
    }
  }
  
  // Extract direct user data from middleware headers or parse from json
  let userId = request.headers.get('x-user-id');
  let userEmail = request.headers.get('x-user-email');
  
  // If not present in direct headers but available in middleware user
  if (!userId && middlewareUser) {
    try {
      const user = JSON.parse(middlewareUser);
      userId = user.id;
      userEmail = user.email;
    } catch (e) {
      console.error('[API] Auth-check: Error parsing middleware user for headers:', e);
    }
  }
  
  return new NextResponse(null, { 
    status: 200,
    headers: {
      // Pass through auth info in multiple formats
      'x-middleware-user': middlewareUser || '',
      'x-middleware-auth-method': authMethod || '',
      'x-user-id': userId || '',
      'x-user-email': userEmail || '',
      'x-auth-method': authMethod || '',
      // Add CORS headers to make sure browsers allow access to these headers
      'Access-Control-Expose-Headers': 'x-middleware-user, x-middleware-auth-method, x-user-id, x-user-email, x-auth-method'
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Log cookie details (safely)
    const hasSbAccessToken = cookieStore.has('sb-access-token');
    const hasSbRefreshToken = cookieStore.has('sb-refresh-token');
    const cookieList = cookieStore.getAll().map(c => c.name);
    
    console.log('[API] Auth check - cookies present:', {
      hasSbAccessToken,
      hasSbRefreshToken,
      cookieCount: cookieStore.size,
      cookieNames: cookieList
    });
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email
        },
        cookieStatus: {
          hasSbAccessToken,
          hasSbRefreshToken
        }
      });
    } else {
      return NextResponse.json({
        authenticated: false,
        error: sessionError?.message || "No active session",
        cookieStatus: {
          hasSbAccessToken,
          hasSbRefreshToken,
          cookieCount: cookieStore.size
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message || "Error checking authentication",
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 