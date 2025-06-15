'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function NotesPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {t('home.title')}
            </h1>
            <p className="text-xl max-w-3xl mx-auto font-medium" style={{ color: 'var(--text-secondary)' }}>
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
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-youtube)' }}>
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
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
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-file)' }}>
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
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
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-video)' }}>
                        <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                      </svg>
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
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text)' }}>
                        <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M1,11H3V21H21V13H23V21A2,2 0 0,1 21,23H3A2,2 0 0,1 1,21V11Z"/>
                      </svg>
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
          <div className="rounded-2xl p-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)', 
            boxShadow: 'var(--shadow-lg)' 
          }}>
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-primary)' }}>{t('home.whyChoose')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 hover:scale-110" style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 255, 194, 0.2), rgba(0, 255, 194, 0.1))',
                  border: '1px solid rgba(0, 255, 194, 0.3)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-cta)' }}>
                    <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>{t('home.aiPowered')}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('home.aiPoweredDescription')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 hover:scale-110" style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 255, 194, 0.2), rgba(0, 255, 194, 0.1))',
                  border: '1px solid rgba(0, 255, 194, 0.3)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-cta)' }}>
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>{t('home.fastEfficient')}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('home.fastEfficientDescription')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 hover:scale-110" style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 255, 194, 0.2), rgba(0, 255, 194, 0.1))',
                  border: '1px solid rgba(0, 255, 194, 0.3)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-cta)' }}>
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19M17 17H7V15H17V17M17 13H7V11H17V13M17 9H7V7H17V9Z"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>{t('home.multipleFormats')}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('home.multipleFormatsDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 