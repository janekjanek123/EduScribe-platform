'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            {t('about.title')}
          </h1>
          <div className="h-1 w-24 mx-auto rounded-full" style={{ background: 'var(--color-cta)' }}></div>
        </div>

        <div className="prose prose-lg mx-auto space-y-8">
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('about.paragraph1')}
          </p>

          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('about.paragraph2')}
          </p>

          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('about.paragraph3')}
          </p>

          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('about.paragraph4')}
          </p>

          <div className="pl-6 my-12 py-4 rounded-r-2xl" style={{ 
            borderLeft: `4px solid var(--color-cta)`,
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <p className="text-lg italic font-medium" style={{ color: 'var(--text-primary)' }}>
              {t('about.quote')}
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href="/" className="inline-flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105" style={{ 
            background: 'var(--color-cta)',
            color: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('about.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
} 