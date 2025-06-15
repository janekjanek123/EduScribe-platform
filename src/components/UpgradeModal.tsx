'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  feature?: string
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  feature 
}: UpgradeModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleUpgrade = () => {
    onClose()
    router.push('/pricing')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom rounded-2xl px-8 pt-8 pb-6 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8" style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--bg-tertiary)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div>
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl" style={{ 
              background: 'linear-gradient(135deg, rgba(0, 255, 194, 0.2), rgba(0, 255, 194, 0.1))',
              border: '1px solid rgba(0, 255, 194, 0.3)'
            }}>
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-cta)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="mt-6 text-center sm:mt-8">
              <h3 className="text-2xl leading-6 font-semibold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <div className="mt-4">
                <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-4 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-xl px-6 py-4 text-base font-semibold transition-all duration-300 transform hover:scale-105 sm:col-start-2 sm:text-sm"
              style={{ 
                background: 'var(--color-cta)',
                color: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-md)'
              }}
              onClick={handleUpgrade}
            >
              View Pricing Plans
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-xl px-6 py-4 text-base font-semibold transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px] sm:mt-0 sm:col-start-1 sm:text-sm"
              style={{ 
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-tertiary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onClick={onClose}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 