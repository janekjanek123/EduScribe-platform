'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    userType: '',
    interests: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userTypeOptions = [
    { value: 'student-primary', label: 'Student (Primary School)' },
    { value: 'student-high', label: 'Student (High School)' },
    { value: 'student-university', label: 'Student (University)' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'other', label: 'Other' }
  ];

  const interestOptions = [
    { value: 'notes-videos', label: 'Notes from Videos' },
    { value: 'notes-youtube', label: 'Notes from YouTube' },
    { value: 'notes-text', label: 'Notes from Text' },
    { value: 'notes-files', label: 'Notes from Files' },
    { value: 'quiz-generator', label: 'Quiz Generator' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Privacy Policy and Terms of Service';
    }

    if (!formData.userType) {
      newErrors.userType = 'Please select who you are';
    }

    if (formData.interests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInterestChange = (interest: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        interests: prev.interests.filter(i => i !== interest)
      }));
    }
    
    // Clear error when user makes a selection
    if (errors.interests) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.interests;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Prepare user metadata for Supabase
      const userMetadata = {
        user_type: formData.userType,
        interests: formData.interests,
        onboarding_completed: true,
        registration_date: new Date().toISOString()
      };

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: userMetadata // This stores the questionnaire data in user_metadata
        }
      });

      if (error) throw error;

      toast.success('Account created! Please check your email to confirm your account.', {
        duration: 6000,
        position: 'top-center',
      });
      
      // Redirect to login page after 4 seconds
      setTimeout(() => {
        router.push('/auth/login?message=check-email');
      }, 4000);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
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
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email and Password Fields */}
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
            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              required
              disabled={isLoading}
            />

            {/* User Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who are you? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.userType}
                onChange={(e) => {
                  setFormData({ ...formData, userType: e.target.value });
                  if (errors.userType) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.userType;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.userType ? 'border-red-300' : 'border-gray-300'
                } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                disabled={isLoading}
                required
              >
                <option value="">Select your role...</option>
                {userTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.userType && (
                <p className="mt-1 text-sm text-red-600">{errors.userType}</p>
              )}
            </div>

            {/* Interests Checkboxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What features are you most interested in? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {interestOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(option.value)}
                      onChange={(e) => handleInterestChange(option.value, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.interests && (
                <p className="mt-1 text-sm text-red-600">{errors.interests}</p>
              )}
            </div>

            {/* Privacy Policy and Terms Checkbox */}
            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, acceptTerms: e.target.checked });
                    if (errors.acceptTerms) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.acceptTerms;
                        return newErrors;
                      });
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  disabled={isLoading}
                  required
                />
                <span className="ml-2 text-sm text-gray-700">
                  I accept the{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
                    Terms of Service
                  </Link>{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </Button>

          {/* Email Confirmation Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ Please confirm your email address to activate your account. A confirmation link will be sent after registration.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 