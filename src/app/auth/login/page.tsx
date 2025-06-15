'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check for messages from URL parameters
    const message = searchParams?.get('message');
    const error = searchParams?.get('error');
    
    if (message === 'check-email') {
      toast.success('Registration successful! Please check your email and click the confirmation link to activate your account.', {
        duration: 8000,
        position: 'top-center',
      });
    } else if (error === 'callback_error') {
      toast.error('There was an issue with email confirmation. Please try signing in or register again.', {
        duration: 6000,
        position: 'top-center',
      });
    } else if (error === 'auth_error') {
      toast.error('Authentication error. Please try signing in again.', {
        duration: 4000,
        position: 'top-center',
      });
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Store the tokens in cookies manually to ensure they're available
      if (data.session) {
        // Use cookies from a client-side library or localStorage as fallback
        document.cookie = `sb-access-token=${data.session.access_token}; path=/`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/`;
      }

      toast.success('Successfully logged in', {
        duration: 2000,
        position: 'top-center',
      });

      // Small delay to show the success message before redirect
      setTimeout(() => {
        // Get the redirect URL from query params if it exists
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirect') || '/';
        
        router.push(redirectTo);
        router.refresh();
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
            style={{ 
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to homepage
          </Link>
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Welcome back to{' '}
              <span style={{ color: 'var(--color-cta)' }}>EduScribe</span>
            </h1>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
              Sign in to continue your learning journey
            </p>
          </div>
        </div>
        
        {/* Email Confirmation Notice */}
        {searchParams?.get('message') === 'check-email' && (
          <div className="rounded-xl p-4 mb-6" style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)'
          }}>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#3b82f6' }}>
                  📧 Please check your email
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  We've sent you a confirmation link. Click it to activate your account, then return here to sign in.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="rounded-2xl p-8" style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--bg-tertiary)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-primary)',
                    border: errors.email ? '2px solid #ef4444' : '2px solid var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-cta)'}
                  onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : 'var(--bg-tertiary)'}
                />
                {errors.email && (
                  <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-primary)',
                    border: errors.password ? '2px solid #ef4444' : '2px solid var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-cta)'}
                  onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : 'var(--bg-tertiary)'}
                />
                {errors.password && (
                  <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{errors.password}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ 
                background: isLoading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                color: isLoading ? 'var(--text-muted)' : 'var(--bg-primary)',
                boxShadow: isLoading ? 'var(--shadow-sm)' : 'var(--glow-cta)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full animate-spin" 
                    style={{ border: '2px solid var(--bg-primary)', borderTop: '2px solid var(--color-cta)' }}></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <Link 
                  href="/auth/register" 
                  className="font-semibold transition-colors duration-300 hover:underline"
                  style={{ color: 'var(--color-cta)' }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
            style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-cta)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
} 