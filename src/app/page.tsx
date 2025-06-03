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
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">📺</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{t('home.youtubeVideos')}</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    {t('home.youtubeDescription')}
                  </p>
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium group-hover:bg-blue-100 transition-colors">
                      {t('home.enterLink')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* File Upload Card */}
            <Link href="/generate/upload" className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-green-300">
                <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{t('home.uploadFile')}</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    {t('home.uploadFileDescription')}
                  </p>
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium group-hover:bg-green-100 transition-colors">
                      {t('home.uploadFileAction')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Video Upload Card - NEW INDEPENDENT SYSTEM */}
            <Link href="/upload-video" className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-orange-300">
                <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                    <span className="text-2xl">🎥</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{t('home.uploadVideo')}</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    {t('home.uploadVideoDescription')}
                  </p>
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium group-hover:bg-orange-100 transition-colors">
                      {t('home.uploadVideoAction')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Text Input Card */}
            <Link href="/generate/text" className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-purple-300">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <span className="text-2xl">✏️</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{t('home.textInput')}</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    {t('home.textInputDescription')}
                  </p>
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium group-hover:bg-purple-100 transition-colors">
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