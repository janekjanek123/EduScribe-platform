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
  const [currentStep, setCurrentStep] = useState<'signup' | 'survey'>('signup');
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
    { 
      value: 'student-primary', 
      label: 'Student – Primary School', 
      icon: '🎓',
      description: 'Elementary and middle school students'
    },
    { 
      value: 'student-high', 
      label: 'Student – High School', 
      icon: '🎓',
      description: 'Secondary school students'
    },
    { 
      value: 'student-university', 
      label: 'Student – University', 
      icon: '🎓',
      description: 'College and university students'
    },
    { 
      value: 'teacher', 
      label: 'Teacher', 
      icon: '👨‍🏫',
      description: 'Educators and instructors'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: '❓',
      description: 'Other profession or role'
    }
  ];

  const interestOptions = [
    { 
      value: 'notes-videos', 
      label: 'Generate notes from videos', 
      icon: '📄',
      description: 'Turn any video content into structured notes'
    },
    { 
      value: 'notes-files', 
      label: 'Upload files for summarization', 
      icon: '📝',
      description: 'Upload PDFs, documents, and get summaries'
    },
    { 
      value: 'notes-youtube', 
      label: 'YouTube video to notes', 
      icon: '🎞️',
      description: 'Convert YouTube videos into study notes'
    },
    { 
      value: 'quiz-generator', 
      label: 'Generate quizzes', 
      icon: '📊',
      description: 'Create interactive quizzes from your content'
    },
    { 
      value: 'study-tools', 
      label: 'Study tools', 
      icon: '🧠',
      description: 'Flashcards, summaries, and study aids'
    }
  ];

  const validateSignupForm = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignupForm()) return;
    
    // Move to survey step
    setCurrentStep('survey');
  };

  const handleCompleteRegistration = async (skipSurvey = false) => {
    setIsLoading(true);
    try {
      // Prepare user metadata for Supabase
      const userMetadata = {
        user_type: skipSurvey ? null : formData.userType,
        interests: skipSurvey ? [] : formData.interests,
        onboarding_completed: !skipSurvey,
        survey_skipped: skipSurvey,
        registration_date: new Date().toISOString()
      };

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: userMetadata
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

  if (currentStep === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link 
              href="/" 
              className="inline-block mb-4 text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              ← Back to homepage
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join thousands of students improving their learning
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <form onSubmit={handleSignupSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Basic Sign-up Fields */}
                <Input
                  label="Email address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                  disabled={isLoading}
                  placeholder="you@example.com"
                />
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  required
                  disabled={isLoading}
                  placeholder="At least 6 characters"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  required
                  disabled={isLoading}
                  placeholder="Confirm your password"
                />

                {/* Privacy Policy and Terms Checkbox */}
                <div>
                  <label className="flex items-start space-x-3">
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
                    <span className="text-sm text-gray-700 leading-5">
                      I accept the{' '}
                      <Link href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500 underline font-medium">
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 underline font-medium">
                        Terms of Service
                      </Link>
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-2 text-sm text-red-600">{errors.acceptTerms}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Continue to Survey
              </Button>

              {/* Email Confirmation Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      ⚠️ Please confirm your email address to activate your account. A confirmation link will be sent after registration.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-center">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Help us personalize your experience
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Tell us about yourself and what you're interested in (optional)
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Section 1: Features Interest */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              📋 What features are you most interested in?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interestOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInterestToggle(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                    formData.interests.includes(option.value)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{option.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                  {formData.interests.includes(option.value) && (
                    <div className="mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Selected
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: User Type */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              👤 Who are you?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: option.value }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                    formData.userType === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{option.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                  {formData.userType === option.value && (
                    <div className="mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Selected
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <Button
              onClick={() => handleCompleteRegistration(true)}
              variant="outline"
              isLoading={isLoading}
              className="flex-1 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Skip this step
            </Button>
            <Button
              onClick={() => handleCompleteRegistration(false)}
              isLoading={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              Complete Registration
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrentStep('signup')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to sign-up form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 