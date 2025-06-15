'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { user, refreshSession } = useSupabase() // We only need this to know if already logged in
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState('')
  const [redirectPath, setRedirectPath] = useState('')

  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    if (user) {
      console.log('[LoginPage] User already logged in, redirecting...');
      const redirectTo = sessionStorage.getItem('login_redirect') || '/';
      sessionStorage.removeItem('login_redirect');
      router.push(redirectTo);
    }
  }, [user, router]);

  // Check for redirect messages and paths
  useEffect(() => {
    // Get and clear redirect message from localStorage
    const message = localStorage.getItem('auth_redirect_message');
    if (message) {
      setRedirectMessage(message);
      localStorage.removeItem('auth_redirect_message');
    }

    // Get redirect path from sessionStorage
    const redirectTo = sessionStorage.getItem('login_redirect');
    if (redirectTo) {
      console.log('[LoginPage] Found redirect path:', redirectTo);
      setRedirectPath(redirectTo);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    if (!email || !password) {
      setError('Proszę wprowadzić email i hasło')
      setIsLoading(false)
      return
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Successful login
      console.log('[LoginPage] Login successful');
      
      // Manually refresh the session state
      await refreshSession();
      
      // Redirect to the original page or home
      const redirectTo = redirectPath || '/';
      console.log('[LoginPage] Redirecting to:', redirectTo);
      sessionStorage.removeItem('login_redirect');
      router.push(redirectTo);
      
    } catch (err: any) {
      console.error('[LoginPage] Login error:', err)
      setError(err.message || 'Błąd logowania')
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Logowanie</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Zaloguj się, aby kontynuować</p>
          {redirectPath && (
            <p className="mt-2 text-sm" style={{ color: 'var(--color-cta)' }}>
              Po zalogowaniu wrócisz do poprzedniej strony
            </p>
          )}
        </div>
        
        {redirectMessage && (
          <div className="mb-6 p-4 rounded-xl" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 165, 0, 0.05))',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            color: 'var(--color-video)'
          }}>
            <p>{redirectMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}>
            <p>{error}</p>
          </div>
        )}
        
        <div className="rounded-2xl p-6" style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--bg-tertiary)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md transition-all duration-300 focus:ring-2 focus:outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                placeholder="twoj@email.pl"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md transition-all duration-300 focus:ring-2 focus:outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="transition-colors duration-300" style={{ color: 'var(--color-cta)' }}>
                  Zapomniałeś hasła?
                </Link>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  background: isLoading 
                    ? 'var(--bg-tertiary)' 
                    : 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                  color: isLoading ? 'var(--text-muted)' : 'var(--bg-primary)',
                  boxShadow: isLoading ? 'var(--shadow-sm)' : 'var(--glow-cta)'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full animate-spin mr-2" 
                      style={{ border: '2px solid var(--bg-primary)', borderTop: '2px solid var(--color-cta)' }}></div>
                    Logowanie...
                  </div>
                ) : 'Zaloguj się'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nie masz konta?{' '}
              <Link href="/signup" className="transition-colors duration-300" style={{ color: 'var(--color-cta)' }}>
                Zarejestruj się
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 