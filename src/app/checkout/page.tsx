'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'

interface FormData {
  firstName: string
  lastName: string
  email: string
  agreeToTerms: boolean
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useSupabase()
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'checkout' | 'payment' | 'success'>('checkout')
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    agreeToTerms: false
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [assignedSubscription, setAssignedSubscription] = useState<any>(null)

  useEffect(() => {
    // Get plan and billing from URL params
    const plan = searchParams?.get('plan')
    const billing = searchParams?.get('billing') as 'monthly' | 'yearly'
    
    if (plan) {
      setSelectedPlan(plan)
    }
    if (billing) {
      setBillingCycle(billing)
    }

    // Prefill email if user is logged in
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }))
    }
  }, [searchParams, user])

  // Plan details
  const planDetails = {
    student: {
      name: 'Student',
      description: 'Perfect for students with enhanced features',
      price_monthly: 19.99,
      price_yearly: 179.99,
      features: [
        'Up to 10 notes per month',
        'Max 12 saved notes',
        'Interactive quizzes enabled',
        'YouTube video support',
        'PowerPoint presentation support',
        'Extended text length (up to 15,000 characters)',
        'Copy-paste note content'
      ]
    },
    pro: {
      name: 'Pro',
      description: 'Ultimate plan for power users and professionals',
      price_monthly: 49.99,
      price_yearly: 449.99,
      features: [
        'Unlimited note generation (150 notes/month)',
        'Max 50 saved notes',
        'Full access to quizzes',
        'YouTube and PowerPoint support',
        'Full text length support (50,000+ characters)',
        'Export to PDF and other formats',
        'Priority generation (faster processing)',
        'Copy-paste note content'
      ]
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleProceedToPayment = () => {
    if (validateForm()) {
      setCurrentStep('payment')
    }
  }

  const handlePayment = async () => {
    if (!selectedPlan || !user) return

    setIsLoading(true)
    
    try {
      // TODO: Implement PayU payment processing
      console.log('Processing payment with PayU:', {
        plan: selectedPlan,
        billing: billingCycle,
        user: user.id,
        customer: formData
      })
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // After successful payment, assign subscription to user
      console.log('Payment successful, assigning subscription...')
      
      const response = await fetch('/api/assign-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle: billingCycle,
          paymentData: {
            // Future: Include actual payment gateway data
            paymentMethod: 'payu',
            transactionId: `test_${Date.now()}`,
            amount: price,
            currency: 'PLN'
          }
        })
      })

      const assignmentResult = await response.json()

      if (!response.ok || !assignmentResult.success) {
        throw new Error(assignmentResult.error || 'Failed to assign subscription')
      }

      console.log('Subscription assigned successfully:', assignmentResult.subscription)
      
      // Move to success page
      setCurrentStep('success')
      setAssignedSubscription(assignmentResult.subscription)
    } catch (error) {
      console.error('Payment or subscription assignment error:', error)
      alert('Payment failed or subscription assignment error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to upgrade your plan.</p>
          <button
            onClick={() => router.push('/?signup=true')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    )
  }

  if (!selectedPlan || !planDetails[selectedPlan as keyof typeof planDetails]) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Plan</h2>
          <p className="text-gray-600 mb-6">The selected plan is not valid.</p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            View Pricing Plans
          </button>
        </div>
      </div>
    )
  }

  const plan = planDetails[selectedPlan as keyof typeof planDetails]
  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
  const monthlyEquivalent = billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly
  const savings = billingCycle === 'yearly' ? (plan.price_monthly * 12) - plan.price_yearly : 0

  // Success page
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-lg text-gray-600 mb-4">
              Welcome to EduScribe {plan.name}! Your subscription is now active.
            </p>
          </div>

          {/* Subscription Details */}
          {assignedSubscription && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-800">Plan</div>
                  <div className="text-blue-700">{assignedSubscription.plan_display_name}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Billing</div>
                  <div className="text-blue-700 capitalize">{assignedSubscription.billing_cycle}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Status</div>
                  <div className="text-blue-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Next Billing Date</div>
                  <div className="text-blue-700">
                    {new Date(assignedSubscription.current_period_end).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">You now have access to:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Limits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Your New Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {selectedPlan === 'student' ? '10' : selectedPlan === 'pro' ? '150' : '?'}
                </div>
                <div className="text-sm text-green-700">Notes per month</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {selectedPlan === 'student' ? '12' : selectedPlan === 'pro' ? '50' : '?'}
                </div>
                <div className="text-sm text-green-700">Saved notes</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {selectedPlan === 'student' ? '15K' : selectedPlan === 'pro' ? '50K+' : '?'}
                </div>
                <div className="text-sm text-green-700">Characters per note</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Creating Notes →
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/generate/text')}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Generate Text Notes
              </button>
              <button
                onClick={() => router.push('/generate/youtube')}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                YouTube Video Notes
              </button>
            </div>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Need help getting started? Contact our support team or check out the user guide.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'checkout' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'checkout' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {currentStep === 'checkout' ? '1' : '✓'}
              </div>
              <span className="ml-2 font-medium">Checkout Details</span>
            </div>
            <div className={`w-16 h-1 ${currentStep === 'payment' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 'checkout' ? 'Complete Your Order' : 'Payment Details'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 'checkout' 
              ? `You're subscribing to the ${plan.name} plan`
              : 'Complete your payment to activate your subscription'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {currentStep === 'checkout' ? (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your first name"
                        />
                        {formErrors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your last name"
                        />
                        {formErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email address"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Billing Cycle */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Option</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          billingCycle === 'monthly'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Monthly Billing</div>
                        <div className="text-sm">{plan.price_monthly.toFixed(2)} PLN/month</div>
                      </button>
                      <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`p-4 rounded-lg border text-left transition-colors relative ${
                          billingCycle === 'yearly'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Yearly Billing</div>
                        <div className="text-sm">{plan.price_yearly.toFixed(2)} PLN/year</div>
                        <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Save 25%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                      </span>
                    </label>
                    {formErrors.agreeToTerms && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.agreeToTerms}</p>
                    )}
                  </div>

                  {/* Proceed Button */}
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Proceed to Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Payment Methods */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <div className="p-4 border border-blue-500 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <input type="radio" checked readOnly className="w-4 h-4 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">PayU Payment Gateway</div>
                            <div className="text-sm text-gray-600">
                              Credit card, debit card, bank transfer, and more
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm space-y-1">
                        <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                        <div><strong>Email:</strong> {formData.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handlePayment}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing Payment...</span>
                        </div>
                      ) : (
                        `Complete Payment - ${price.toFixed(2)} PLN`
                      )}
                    </button>
                    <button
                      onClick={() => setCurrentStep('checkout')}
                      className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← Back to Checkout
                    </button>
                  </div>

                  {/* Security Notice */}
                  <div className="text-center text-sm text-gray-500">
                    <p>🔒 Payments are securely processed by PayU</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Plan Details */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{plan.name} Plan</div>
                    <div className="text-sm text-gray-600">{plan.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {price.toFixed(2)} PLN
                  </div>
                  <div className="text-sm text-gray-600">
                    {billingCycle === 'yearly' ? '/year' : '/month'}
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-green-600 font-medium">
                      {monthlyEquivalent.toFixed(2)} PLN/month
                    </div>
                  )}
                </div>
              </div>

              {savings > 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>You save {savings.toFixed(2)} PLN</strong> with yearly billing!
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">What's included:</h4>
                <ul className="space-y-1">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-sm text-gray-500 ml-6">
                      +{plan.features.length - 4} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{price.toFixed(2)} PLN</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Pricing */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/pricing')}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to Pricing
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  )
} 