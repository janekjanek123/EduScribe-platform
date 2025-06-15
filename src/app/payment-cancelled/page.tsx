'use client'

import { useRouter } from 'next/navigation'

export default function PaymentCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md mx-auto rounded-2xl p-8 text-center" style={{ 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
        border: '1px solid var(--bg-tertiary)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ 
          background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 165, 0, 0.1))',
          border: '1px solid rgba(255, 165, 0, 0.3)'
        }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-video)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Payment Cancelled
        </h1>
        
        <p className="mb-6 text-lg" style={{ color: 'var(--text-secondary)' }}>
          Your payment was cancelled. No charges were made to your account.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/pricing')}
            className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
              color: 'var(--bg-primary)',
              boxShadow: 'var(--glow-cta)'
            }}
          >
            Back to Pricing
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            style={{ 
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Continue with Free Plan
          </button>
        </div>
      </div>
    </div>
  )
} 