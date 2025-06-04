'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('home.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.subtitle')}
            </p>
          </div>

          {/* Function Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* YouTube Card */}
            <Link href="/generate/youtube" className="group">
              <div className="homepage-feature-card blue">
                <div className="card-color-bar bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="card-content">
                  <div>
                    <div className="card-icon">
                      <span className="text-2xl">📺</span>
                    </div>
                    <h3 className="card-title">{t('home.youtubeVideos')}</h3>
                    <p className="card-description">
                      {t('home.youtubeDescription')}
                    </p>
                  </div>
                  <div className="card-button-container">
                    <span className="homepage-action-button blue">
                      {t('home.enterLink')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* File Upload Card */}
            <Link href="/generate/upload" className="group">
              <div className="homepage-feature-card green">
                <div className="card-color-bar bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="card-content">
                  <div>
                    <div className="card-icon">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h3 className="card-title">{t('home.uploadFile')}</h3>
                    <p className="card-description">
                      {t('home.uploadFileDescription')}
                    </p>
                  </div>
                  <div className="card-button-container">
                    <span className="homepage-action-button green">
                      {t('home.uploadFileAction')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Video Upload Card - NEW INDEPENDENT SYSTEM */}
            <Link href="/upload-video" className="group">
              <div className="homepage-feature-card orange">
                <div className="card-color-bar bg-gradient-to-r from-orange-500 to-orange-600"></div>
                <div className="card-content">
                  <div>
                    <div className="card-icon">
                      <span className="text-2xl">🎥</span>
                    </div>
                    <h3 className="card-title">{t('home.uploadVideo')}</h3>
                    <p className="card-description">
                      {t('home.uploadVideoDescription')}
                    </p>
                  </div>
                  <div className="card-button-container">
                    <span className="homepage-action-button orange">
                      {t('home.uploadVideoAction')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Text Input Card */}
            <Link href="/generate/text" className="group">
              <div className="homepage-feature-card purple">
                <div className="card-color-bar bg-gradient-to-r from-purple-500 to-purple-600"></div>
                <div className="card-content">
                  <div>
                    <div className="card-icon">
                      <span className="text-2xl">✏️</span>
                    </div>
                    <h3 className="card-title">{t('home.textInput')}</h3>
                    <p className="card-description">
                      {t('home.textInputDescription')}
                    </p>
                  </div>
                  <div className="card-button-container">
                    <span className="homepage-action-button purple">
                      {t('home.enterText')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('home.whyChoose')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('home.aiPowered')}</h3>
                <p className="text-gray-600 text-sm">{t('home.aiPoweredDescription')}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('home.fastEfficient')}</h3>
                <p className="text-gray-600 text-sm">{t('home.fastEfficientDescription')}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('home.multipleFormats')}</h3>
                <p className="text-gray-600 text-sm">{t('home.multipleFormatsDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 