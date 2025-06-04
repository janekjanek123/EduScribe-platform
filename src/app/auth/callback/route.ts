import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[Auth Callback] Error exchanging code:', error);
        return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
      }

      // If we have a user and session, check if we need to create a profile
      if (data.user && data.session) {
        console.log('[Auth Callback] User authenticated successfully:', data.user.id);
        
        // Get user metadata from registration
        const userMetadata = data.user.user_metadata;
        console.log('[Auth Callback] User metadata:', userMetadata);
        
        if (userMetadata && userMetadata.user_type && userMetadata.interests) {
          try {
            // Check if profile already exists
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('user_id', data.user.id)
              .single();

            if (!existingProfile) {
              // Create user profile from registration metadata
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: data.user.id,
                  email: data.user.email,
                  user_type: userMetadata.user_type,
                  interests: userMetadata.interests,
                  onboarding_completed: userMetadata.onboarding_completed || true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (profileError) {
                console.error('[Auth Callback] Error creating user profile:', profileError);
                // Don't fail the entire auth flow, just log the error
              } else {
                console.log('[Auth Callback] User profile created successfully for user:', data.user.id);
              }
            } else {
              console.log('[Auth Callback] User profile already exists for user:', data.user.id);
            }
          } catch (profileCreateError) {
            console.error('[Auth Callback] Exception creating user profile:', profileCreateError);
            // Don't fail the auth flow for profile creation errors
          }
        }
      }
    } catch (authError) {
      console.error('[Auth Callback] Authentication error:', authError);
      return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url));
} 