// This file creates Supabase clients for server-side use (both API routes and Server Components)

'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Make sure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a server client for API routes
export function createServerClient(cookieStore: ReturnType<typeof cookies>) {
  // For Server Components
  return createServerComponentClient({ cookies: () => cookieStore });
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

// Simple function to get session from the API route
export function getSessionFromAPI() {
  return supabaseAdmin.auth.getSession();
}

// Function to get a cookie-based client for API routes
export async function getSupabaseServerClient(request: Request) {
  // Extract cookies from the request
  const cookieHeader = request.headers.get('cookie') || '';
  
  // Parse cookie header
  const cookies: Record<string, string> = {};
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=').map(part => part.trim());
      if (parts.length === 2) {
        cookies[parts[0]] = parts[1];
      }
    });
  }

  // Get auth cookie if it exists
  const supabaseAccessToken = cookies['sb-access-token'];
  const supabaseRefreshToken = cookies['sb-refresh-token'];

  // Create client
  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          cookie: cookieHeader,
        },
      },
    }
  );

  // If we have tokens, set the session
  if (supabaseAccessToken && supabaseRefreshToken) {
    await supabase.auth.setSession({
      access_token: supabaseAccessToken,
      refresh_token: supabaseRefreshToken,
    });
  }

  return supabase;
} 