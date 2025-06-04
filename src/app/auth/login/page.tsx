'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-block mb-4 text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to homepage
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {/* Email Confirmation Notice */}
        {searchParams?.get('message') === 'check-email' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Please check your email
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    We've sent you a confirmation link. Click it to activate your account, then return here to sign in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              required
              disabled={isLoading}
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-sm text-center">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
} 