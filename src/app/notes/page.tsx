'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function NotesPage() {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)

  const features = [
    {
      id: 'youtube',
      title: t('home.youtubeVideos'),
      description: t('home.youtubeDescription'),
      icon: '🎥',
      color: 'var(--color-youtube)',
      href: '/generate/youtube',
      action: t('home.enterLink')
    },
    {
      id: 'upload',
      title: t('home.uploadFile'),
      description: t('home.uploadFileDescription'),
      icon: '📄',
      color: 'var(--color-file)',
      href: '/generate/upload',
      action: t('home.uploadFileAction')
    },
    {
      id: 'video',
      title: t('home.uploadVideo'),
      description: t('home.uploadVideoDescription'),
      icon: '🎬',
      color: 'var(--color-video)',
      href: '/upload-video',
      action: t('home.uploadVideoAction')
    },
    {
      id: 'text',
      title: t('home.textInput'),
      description: t('home.textInputDescription'),
      icon: '✍️',
      color: 'var(--color-text)',
      href: '/generate/text',
      action: t('home.enterText')
    }
  ]

  const benefits = [
    {
      icon: '🤖',
      title: t('home.aiPowered'),
      description: t('home.aiPoweredDescription'),
      color: 'var(--color-cta)'
    },
    {
      icon: '⚡',
      title: t('home.fastEfficient'),
      description: t('home.fastEfficientDescription'),
      color: 'var(--color-file)'
    },
    {
      icon: '📋',
      title: t('home.multipleFormats'),
      description: t('home.multipleFormatsDescription'),
      color: 'var(--color-video)'
    }
  ]

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, var(--color-cta) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, var(--color-file) 0%, transparent 50%),
                             radial-gradient(circle at 50% 50%, var(--color-video) 0%, transparent 50%)`
          }} />
          {/* Floating Orbs */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${80 + i * 30}px`,
                height: `${80 + i * 30}px`,
                background: `linear-gradient(45deg, var(--color-cta), var(--color-file))`,
                top: `${20 + i * 12}%`,
                left: `${15 + i * 12}%`,
                animationDelay: `${i * 0.5}s`,
                filter: 'blur(2px)',
                opacity: '0.3'
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <div className={`space-y-10 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {/* Main Title */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl" style={{ 
                    background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                    boxShadow: 'var(--glow-cta)'
                  }}>
                    📝
                  </div>
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ 
                    background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)'
                  }}></div>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent leading-tight">
                {t('home.title')}
              </h1>
              <p className="text-lg md:text-xl font-medium" style={{ color: 'var(--text-secondary)' }}>
                Smart Note Generation
              </p>
            </div>

            <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t('home.subtitle')}
            </p>

            {/* Feature Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <Link key={feature.id} href={feature.href}>
                  <button
                    className={`group relative p-5 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
                      isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                    }`}
                    style={{ 
                      animationDelay: `${index * 150}ms`,
                      background: `linear-gradient(135deg, var(--bg-secondary) 0%, ${feature.color}10 100%)`,
                      border: `2px solid ${feature.color}30`,
                      boxShadow: `var(--shadow-md), 0 0 20px ${feature.color}15`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 30px ${feature.color}30, 0 0 50px ${feature.color}15`
                      e.currentTarget.style.borderColor = `${feature.color}50`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `var(--shadow-md), 0 0 20px ${feature.color}15`
                      e.currentTarget.style.borderColor = `${feature.color}30`
                    }}
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <div className="text-sm font-semibold transition-colors duration-300 mb-2" style={{ color: 'var(--text-primary)' }}>
                      {feature.title}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {feature.action}
                    </div>
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-300"
                         style={{ background: `linear-gradient(135deg, ${feature.color}, transparent)` }}></div>
                  </button>
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
              <Link href="/generate/youtube">
                <button className="group relative px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-105 overflow-hidden" style={{ 
                  background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                  color: 'var(--bg-primary)',
                  boxShadow: '0 0 30px var(--color-cta)40, var(--glow-cta)'
                }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Start Creating Notes</span>
                </button>
              </Link>
              <Link href="/ai-tools">
                <button className="group relative px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-105" style={{ 
                  background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--color-file)40',
                  boxShadow: '0 0 20px var(--color-file)15'
                }}>
                  <span className="group-hover:text-blue-300 transition-colors">Explore AI Tools</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative min-h-screen flex items-center py-20" style={{ 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)'
      }}>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div 
            className="absolute w-96 h-96 rounded-full blur-3xl"
            style={{ 
              background: `linear-gradient(45deg, var(--color-cta), transparent)`,
              top: '20%',
              right: '10%'
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Content Side */}
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div 
                      className="relative w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
                      style={{ 
                        background: `linear-gradient(135deg, var(--color-cta)30, var(--color-cta)15)`,
                        border: `3px solid var(--color-cta)50`,
                        boxShadow: `0 0 50px var(--color-cta)30`
                      }}
                    >
                      🎯
                      <div 
                        className="absolute inset-0 rounded-3xl opacity-60 animate-pulse"
                        style={{ boxShadow: `0 0 40px var(--color-cta)60` }}
                      />
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                        {t('home.whyChoose')}
                      </h2>
                      <p className="text-xl font-semibold" style={{ color: 'var(--color-cta)' }}>
                        Advanced AI-Powered Learning
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid gap-6">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-4 p-6 rounded-xl transition-all duration-500 hover:scale-105"
                      style={{ 
                        background: `linear-gradient(135deg, var(--bg-tertiary) 0%, ${benefit.color}08 100%)`,
                        border: `2px solid ${benefit.color}20`,
                        boxShadow: `0 0 15px ${benefit.color}10`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 25px ${benefit.color}25, 0 0 50px ${benefit.color}15`
                        e.currentTarget.style.borderColor = `${benefit.color}40`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 15px ${benefit.color}10`
                        e.currentTarget.style.borderColor = `${benefit.color}20`
                      }}
                    >
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ 
                          background: `linear-gradient(135deg, ${benefit.color}25, ${benefit.color}15)`,
                          border: `2px solid ${benefit.color}40`,
                          boxShadow: `0 0 20px ${benefit.color}20`
                        }}
                      >
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {benefit.title}
                        </h3>
                        <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <Link href="/generate/youtube">
                    <button
                      className="group relative px-8 py-3 rounded-2xl font-semibold text-base transition-all duration-500 transform hover:scale-105 overflow-hidden"
                      style={{ 
                        background: `linear-gradient(135deg, var(--color-cta)25, var(--color-cta)15)`,
                        border: `2px solid var(--color-cta)40`,
                        color: 'white',
                        boxShadow: `0 0 25px var(--color-cta)25, 0 0 50px var(--color-cta)15`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 35px var(--color-cta)35, 0 0 70px var(--color-cta)20`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 25px var(--color-cta)25, 0 0 50px var(--color-cta)15`
                      }}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-300"
                        style={{ background: 'linear-gradient(45deg, white, transparent)' }}
                      />
                      <span className="relative z-10">Get Started Now</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Visual Side */}
              <div className="relative">
                <div 
                  className="relative aspect-square rounded-3xl p-12 overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, var(--color-cta)12, var(--color-cta)05, transparent)`,
                    border: `3px solid var(--color-cta)30`,
                    boxShadow: `0 0 80px var(--color-cta)25, inset 0 0 50px var(--color-cta)05`
                  }}
                >
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, var(--color-cta)25 0%, transparent 50%), 
                                    radial-gradient(circle at 70% 70%, var(--color-file)20 0%, transparent 50%)`
                      }}
                    />
                  </div>

                  {/* Central Display */}
                  <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div 
                        className="text-9xl mb-6 transform transition-all duration-700 hover:scale-110 hover:rotate-12"
                        style={{ 
                          filter: `drop-shadow(0 0 30px var(--color-cta)60)`,
                          color: 'var(--color-cta)'
                        }}
                      >
                        📚
                      </div>
                      <div 
                        className="text-2xl font-bold"
                        style={{ color: 'var(--color-cta)' }}
                      >
                        Smart Notes
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full animate-pulse"
                        style={{
                          width: `${6 + (i % 4) * 3}px`,
                          height: `${6 + (i % 4) * 3}px`,
                          background: `var(--color-cta)70`,
                          top: `${15 + (i * 6)}%`,
                          left: `${10 + (i * 7)}%`,
                          animationDelay: `${i * 0.3}s`,
                          boxShadow: `0 0 20px var(--color-cta)90`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        html {
          scroll-behavior: auto;
        }

        section {
          scroll-margin-top: 0;
        }

        * {
          scroll-behavior: auto !important;
        }

        .bg-clip-text {
          -webkit-background-clip: text;
          background-clip: text;
        }

        /* Enhanced hover effects */
        .group:hover .group-hover\\:scale-125 {
          transform: scale(1.25);
        }

        .group:hover .group-hover\\:text-blue-300 {
          color: #93c5fd;
        }
      `}</style>
    </div>
  )
} 