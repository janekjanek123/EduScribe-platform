'use client'

import { useRouter } from 'next/navigation'

export default function PaymentCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Pricing
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
        
        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            Need help with your subscription?
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <a href="/pricing" className="text-blue-600 hover:text-blue-800 hover:underline">
              View Plans
            </a>
            <span className="text-gray-300">|</span>
            <a href="mailto:support@eduscribe.com" className="text-blue-600 hover:text-blue-800 hover:underline">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 