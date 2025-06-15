'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
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
                Join{' '}
                <span style={{ color: 'var(--color-cta)' }}>EduScribe</span>
              </h1>
              <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
                Join thousands of students improving their learning
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <form onSubmit={handleSignupSubmit} className="space-y-6">
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
                    placeholder="At least 6 characters"
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

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2"
                    style={{
                      background: 'var(--bg-primary)',
                      border: errors.confirmPassword ? '2px solid #ef4444' : '2px solid var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-cta)'}
                    onBlur={(e) => e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : 'var(--bg-tertiary)'}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Privacy Policy and Terms Checkbox */}
                <div>
                  <label className="flex items-start space-x-3 cursor-pointer">
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
                      className="h-5 w-5 rounded mt-1 transition-colors duration-300"
                      style={{ 
                        accentColor: 'var(--color-cta)',
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--bg-tertiary)'
                      }}
                      disabled={isLoading}
                      required
                    />
                    <span className="text-sm leading-5" style={{ color: 'var(--text-secondary)' }}>
                      I accept the{' '}
                      <Link href="/privacy" target="_blank" className="font-semibold transition-colors duration-300 hover:underline" style={{ color: 'var(--color-cta)' }}>
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link href="/terms" target="_blank" className="font-semibold transition-colors duration-300 hover:underline" style={{ color: 'var(--color-cta)' }}>
                        Terms of Service
                      </Link>
                      <span className="ml-1" style={{ color: '#ef4444' }}>*</span>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{errors.acceptTerms}</p>
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
                Continue to Survey
              </button>

              {/* Email Confirmation Notice */}
              <div className="rounded-xl p-4" style={{ 
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
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ⚠️ Please confirm your email address to activate your account. A confirmation link will be sent after registration.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <Link 
                    href="/auth/login" 
                    className="font-semibold transition-colors duration-300 hover:underline"
                    style={{ color: 'var(--color-cta)' }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Help us personalize your{' '}
            <span style={{ color: 'var(--color-cta)' }}>EduScribe</span> experience
          </h2>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Tell us about yourself and what you're interested in (optional)
          </p>
        </div>

        <div className="rounded-2xl p-8 space-y-8" style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--bg-tertiary)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          {/* Section 1: Features Interest */}
          <div>
            <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              📋 What features are you most interested in?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interestOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInterestToggle(option.value)}
                  className="p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105"
                  style={{
                    background: formData.interests.includes(option.value)
                      ? 'linear-gradient(135deg, var(--color-cta)15, var(--color-cta)05)'
                      : 'var(--bg-primary)',
                    border: formData.interests.includes(option.value)
                      ? '2px solid var(--color-cta)'
                      : '2px solid var(--bg-tertiary)',
                    boxShadow: formData.interests.includes(option.value) ? 'var(--glow-cta)' : 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ 
                        color: formData.interests.includes(option.value) ? 'var(--color-cta)' : 'var(--text-primary)' 
                      }}>
                        {option.label}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {formData.interests.includes(option.value) && (
                    <div className="mt-3">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ 
                        background: 'var(--color-cta)',
                        color: 'var(--bg-primary)'
                      }}>
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
            <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              👤 Who are you?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: option.value }))}
                  className="p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105"
                  style={{
                    background: formData.userType === option.value
                      ? 'linear-gradient(135deg, var(--color-file)15, var(--color-file)05)'
                      : 'var(--bg-primary)',
                    border: formData.userType === option.value
                      ? '2px solid var(--color-file)'
                      : '2px solid var(--bg-tertiary)',
                    boxShadow: formData.userType === option.value ? 'var(--shadow-xl)' : 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ 
                        color: formData.userType === option.value ? 'var(--color-file)' : 'var(--text-primary)' 
                      }}>
                        {option.label}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {formData.userType === option.value && (
                    <div className="mt-3">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ 
                        background: 'var(--color-file)',
                        color: 'var(--bg-primary)'
                      }}>
                        ✓ Selected
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6" style={{ borderTop: '1px solid var(--bg-tertiary)' }}>
            <button
              onClick={() => handleCompleteRegistration(true)}
              disabled={isLoading}
              className="flex-1 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ 
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '2px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full animate-spin" 
                    style={{ border: '2px solid var(--text-secondary)', borderTop: '2px solid var(--color-cta)' }}></div>
                  Processing...
                </span>
              ) : (
                'Skip this step'
              )}
            </button>
            <button
              onClick={() => handleCompleteRegistration(false)}
              disabled={isLoading}
              className="flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  Creating Account...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrentStep('signup')}
              className="px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
              style={{ 
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to sign-up form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 