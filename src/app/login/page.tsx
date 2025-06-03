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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Logowanie</h1>
          <p className="mt-2 text-gray-600">Zaloguj się, aby kontynuować</p>
          {redirectPath && (
            <p className="mt-2 text-sm text-primary-600">
              Po zalogowaniu wrócisz do poprzedniej strony
            </p>
          )}
        </div>
        
        {redirectMessage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
            <p>{redirectMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="twoj@email.pl"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="text-primary-600 hover:text-primary-500">
                  Zapomniałeś hasła?
                </Link>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none ${
                  isLoading ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                      </path>
                    </svg>
                    Logowanie...
                  </div>
                ) : 'Zaloguj się'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Nie masz konta?{' '}
              <Link href="/signup" className="text-primary-600 hover:text-primary-500">
                Zarejestruj się
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 