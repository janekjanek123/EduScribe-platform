'use client'

import React from 'react'

interface NotesLoaderProps {
  className?: string
  message?: string
  subMessage?: string
}

export default function NotesLoader({ 
  className = '',
  message = 'Generating Notes...',
  subMessage = 'This could take a moment – please wait.'
}: NotesLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
      {/* Centered Spinner */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full animate-spin" 
          style={{ 
            border: '4px solid var(--bg-tertiary)', 
            borderTop: '4px solid var(--color-cta)',
            boxShadow: 'var(--glow-cta)'
          }}>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🧠</span>
        </div>
      </div>
      
      {/* Loading Messages */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{message}</h3>
        <p className="text-base max-w-md" style={{ color: 'var(--text-secondary)' }}>{subMessage}</p>
      </div>
    </div>
  )
} 