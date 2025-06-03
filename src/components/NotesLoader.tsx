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
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Centered Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-4 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🧠</span>
        </div>
      </div>
      
      {/* Loading Messages */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        <p className="text-sm text-gray-600 max-w-md">{subMessage}</p>
      </div>
    </div>
  )
} 