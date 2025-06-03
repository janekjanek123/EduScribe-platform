'use client'

import { useEffect } from 'react'
import '@/lib/i18n'

interface I18nProviderProps {
  children: React.ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Initialize i18n on the client side
    // The i18n instance is already configured in @/lib/i18n
  }, [])

  return <>{children}</>
} 