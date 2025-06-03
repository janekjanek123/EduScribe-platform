'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { initializeDatabase } from './db-init'

interface SupabaseContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  sessionError: string | null
  refreshSession: () => Promise<Session | null>
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  isLoading: true,
  sessionError: null,
  refreshSession: async () => null,
  supabase: supabase
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(0)

  // Function to refresh session state
  const refreshSession = async () => {
    console.log('[Auth] Manually refreshing session state...');
    try {
      // Actually attempt to refresh the session with Supabase
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Error refreshing session:', error.message);
        setSessionError(error.message);
        // Still update lastRefresh to trigger the useEffect
        setLastRefresh(Date.now());
        return null;
      }
      
      if (data?.session) {
        console.log('[Auth] Session refreshed successfully:', {
          userId: data.session.user.id,
          expires: new Date(data.session.expires_at! * 1000).toLocaleString()
        });
        // Update state directly for immediate effect
        setSession(data.session);
        setUser(data.session.user);
        setSessionError(null);
        // Also trigger the useEffect for complete state refresh
        setLastRefresh(Date.now());
        return data.session;
      } else {
        console.log('[Auth] No session returned after refresh');
        setSession(null);
        setUser(null);
        // Still update lastRefresh to trigger the useEffect
        setLastRefresh(Date.now());
        return null;
      }
    } catch (err) {
      console.error('[Auth] Unexpected error during session refresh:', err);
      setSessionError(err instanceof Error ? err.message : 'Unknown error during session refresh');
      // Still update lastRefresh to trigger the useEffect
      setLastRefresh(Date.now());
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing auth state...');
        setIsLoading(true);
        
        // Get initial session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error.message);
          if (isMounted) {
            setSessionError(error.message);
            setIsLoading(false);
          }
          return;
        }
        
        if (data?.session) {
          console.log('[Auth] Initial session found for user:', {
            id: data.session.user.id,
            email: data.session.user.email,
            expires: new Date(data.session.expires_at! * 1000).toISOString()
          });
          
          if (isMounted) {
            setSession(data.session);
            setUser(data.session.user);
            
            // Initialize database tables once authenticated
            initializeDatabase().then(success => {
              console.log('[App] Database initialization:', success ? 'successful' : 'failed');
            }).catch(err => {
              console.error('[App] Database initialization error:', err);
            });
          }
        } else {
          console.log('[Auth] No active session found');
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Unexpected error during auth initialization:', err);
        if (isMounted) {
          setSessionError(err instanceof Error ? err.message : 'Unknown error during auth initialization');
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log(`[Auth] Auth state change detected: ${event}`);
        
        if (isMounted) {
          if (currentSession) {
            console.log('[Auth] New session established for user:', {
              id: currentSession.user.id,
              email: currentSession.user.email,
              expires: new Date(currentSession.expires_at! * 1000).toISOString()
            });
            setSession(currentSession);
            setUser(currentSession.user);
            setSessionError(null);
          } else {
            console.log('[Auth] Session cleared');
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [lastRefresh]);

  return (
    <SupabaseContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      sessionError,
      refreshSession,
      supabase
    }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 