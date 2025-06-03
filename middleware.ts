import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  // Get path and URL
  const path = req.nextUrl.pathname;
  const url = req.nextUrl.clone();
  
  // Don't check auth for these paths
  const publicPaths = [
    '/',                        // Homepage
    '/auth/login', 
    '/auth/register', 
    '/auth/callback', 
    '/api/auth-check',
    '/pricing',                 // Pricing page
    '/about',                   // About page
    '/privacy',                 // Privacy policy
    '/terms',                   // Terms of service
    '/checkout',                // Checkout page (needs auth but handled differently)
    '/dashboard',               // Dashboard (needs auth but handled differently)
    '/generate',                // Generate pages (needs auth but handled differently)
    '/upload-video',            // Video upload for transcription
    '/api/text-notes',          // API endpoints that need auth
    '/api/video-notes',         // API endpoints that need auth
    '/api/file-notes',          // API endpoints that need auth
    '/api/upload-video',        // Video upload API
    '/api/assign-subscription', // Subscription assignment API
    '/api/stripe',              // Stripe API endpoints
    '/payment-success',         // Payment success page
    '/payment-cancelled',       // Payment cancelled page
  ];
  if (publicPaths.some(p => path.startsWith(p) || path === p)) {
    console.log('[Middleware] Allowing access to public path:', path);
    return NextResponse.next();
  }
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Log cookie presence for debugging
  const hasSbAccessToken = req.cookies.has('sb-access-token');
  const hasSbRefreshToken = req.cookies.has('sb-refresh-token');
  
  console.log('[Middleware] Processing:', req.method, path);
  
  // 1. Check for Bearer token in API requests
  if (path.startsWith('/api/')) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // Validate the token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          console.log('[Middleware] API request authenticated via Bearer token:', user.id);
          // Allow the request to proceed with user context
          const res = NextResponse.next();
          res.headers.set('x-user-id', user.id);
          if (user.email) {
            res.headers.set('x-user-email', user.email);
          }
          return res;
        } else {
          console.warn('[Middleware] Invalid Bearer token:', error?.message);
        }
      } catch (err: any) {
        console.warn('[Middleware] Error validating Bearer token:', err?.message || 'Unknown error');
      }
    }
    
    // If we reach here for an API route, no valid auth was found
    if (!path.startsWith('/api/auth-check')) {
      console.warn('[Middleware] No valid authentication found for API request');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  const tokenFromUrl = url.searchParams.get('token');

  // 2. Token in URL – validate and set as cookie
  if (tokenFromUrl) {
    const { data: { user } } = await supabase.auth.getUser(tokenFromUrl);

    if (user) {
      console.log('[Middleware] Authenticated via URL token:', user.id);

      const res = NextResponse.redirect(new URL(url.pathname + url.search, req.url));
      res.cookies.set('sb-access-token', tokenFromUrl, { path: '/' });

      // Remove token param from URL
      url.searchParams.delete('token');
      res.headers.set('Location', url.toString());

      return res;
    }
  }

  // 3. Check for cookies
  const accessToken = req.cookies.get('sb-access-token')?.value;
  const refreshToken = req.cookies.get('sb-refresh-token')?.value;

  // Also check for any Supabase session cookies (format might be different)
  const allCookies = req.cookies.getAll();
  const supabaseSessionCookie = allCookies.find(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.includes('auth')
  );

  if (accessToken && refreshToken) {
    try {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('[Middleware] Authenticated via cookies:', user.id);
        const res = NextResponse.next();
        res.headers.set('x-user-id', user.id);
        if (user.email) {
          res.headers.set('x-user-email', user.email);
        }
        return res;
      }
    } catch (err: any) {
      console.warn('[Middleware] Cookie session invalid:', err?.message || 'Unknown error');
    }
  } else if (supabaseSessionCookie) {
    // Try to authenticate with alternate cookie format
    try {
      console.log('[Middleware] Found alternate Supabase session cookie');
      return NextResponse.next();
    } catch (err: any) {
      console.warn('[Middleware] Alternate cookie session invalid:', err?.message || 'Unknown error');
    }
  }

  // For non-API routes, redirect to login
  if (!path.startsWith('/api/')) {
    // Redirect to login with the current URL as the redirect parameter
    console.warn('[Middleware] No valid auth found, redirecting to login');
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  } else {
    // For API routes that weren't handled above (should be caught earlier but just in case)
    console.warn('[Middleware] No valid authentication found for API request');
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};