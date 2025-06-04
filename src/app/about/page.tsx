'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('about.title')}
          </h1>
          <div className="h-1 w-20 bg-primary-500 mx-auto rounded-full"></div>
        </div>

        <div className="prose prose-lg mx-auto text-gray-600 space-y-6">
          <p>
            {t('about.paragraph1')}
          </p>

          <p>
            {t('about.paragraph2')}
          </p>

          <p>
            {t('about.paragraph3')}
          </p>

          <p>
            {t('about.paragraph4')}
          </p>

          <div className="border-l-4 border-primary-500 pl-4 my-8 py-2">
            <p className="text-gray-700 italic">
              {t('about.quote')}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="secondary" className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('about.backToHome')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 