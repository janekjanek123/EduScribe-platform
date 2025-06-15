'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function AIToolsPage() {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  const aiTools = [
    {
      id: 'presentation',
      title: 'Presentation Generator',
      subtitle: 'AI-Powered Slide Creation',
      description: 'Transform your ideas into stunning presentations with intelligent slide generation, professional templates, and dynamic content optimization.',
      icon: '🎯',
      gradient: 'from-orange-500 to-red-500',
      color: '#FF6B35',
      features: [
        'Smart slide structure and flow optimization',
        'Professional template library with 100+ designs',
        'Auto-generated charts and visual elements',
        'Real-time collaboration and cloud sync'
      ],
      stats: { accuracy: '95%', time_saved: '80%', templates: '100+' }
    },
    {
      id: 'essay',
      title: 'Essay & Referat Writer',
      subtitle: 'Academic Excellence Made Simple',
      description: 'Generate well-researched, properly formatted academic content with intelligent citation management and plagiarism-free guarantee.',
      icon: '📚',
      gradient: 'from-blue-500 to-purple-500',
      color: '#4F46E5',
      features: [
        'Academic structure with proper formatting',
        'Intelligent citation in multiple styles',
        'Research integration from credible sources',
        'Grammar and style optimization'
      ],
      stats: { accuracy: '98%', citations: '50K+', formats: '10+' }
    },
    {
      id: 'case-study',
      title: 'Case Study Builder',
      subtitle: 'Data-Driven Business Analysis',
      description: 'Create comprehensive case studies with advanced analytics, strategic insights, and professional presentation formats.',
      icon: '📊',
      gradient: 'from-green-500 to-teal-500',
      color: '#10B981',
      features: [
        'Advanced data analysis and visualization',
        'Strategic framework development',
        'Industry benchmarking and comparisons',
        'Executive summary generation'
      ],
      stats: { insights: '1000+', accuracy: '92%', frameworks: '25+' }
    },
    {
      id: 'quiz',
      title: 'Quiz Generator',
      subtitle: 'Interactive Learning Assessment',
      description: 'Design engaging quizzes with adaptive difficulty, instant feedback, and comprehensive analytics for optimal learning outcomes.',
      icon: '🧠',
      gradient: 'from-purple-500 to-pink-500',
      color: '#8B5CF6',
      features: [
        'Adaptive difficulty and personalization',
        'Multiple question types and formats',
        'Real-time analytics and progress tracking',
        'Gamification and engagement features'
      ],
      stats: { questions: '10K+', accuracy: '94%', engagement: '85%' }
    },
    {
      id: 'bibliography',
      title: 'Bibliography Builder',
      subtitle: 'Perfect Citations Every Time',
      description: 'Automatically generate flawless bibliographies with intelligent source validation and multi-format export capabilities.',
      icon: '📖',
      gradient: 'from-yellow-500 to-orange-500',
      color: '#F59E0B',
      features: [
        'Multi-format citation styles (APA, MLA, Chicago)',
        'Intelligent source validation and verification',
        'Bulk import and export capabilities',
        'Duplicate detection and management'
      ],
      stats: { styles: '15+', sources: '1M+', accuracy: '99%' }
    },
    {
      id: 'plagiarism',
      title: 'Plagiarism Shield',
      subtitle: 'Content Integrity Guardian',
      description: 'Advanced plagiarism detection with comprehensive database scanning and detailed similarity analysis for academic integrity.',
      icon: '🛡️',
      gradient: 'from-emerald-500 to-green-500',
      color: '#059669',
      features: [
        'Real-time plagiarism detection and scanning',
        'Comprehensive database with billions of sources',
        'Detailed similarity reports and suggestions',
        'Multi-language support and analysis'
      ],
      stats: { database: '50B+', accuracy: '99.9%', languages: '100+' }
    }
  ]

  useEffect(() => {
    setIsLoaded(true)
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.3 }
    )

    const sections = document.querySelectorAll('[data-section]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
    t /= d / 2
    if (t < 1) return c / 2 * t * t + b
    t--
    return -c / 2 * (t * (t - 2) - 1) + b
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const targetPosition = element.offsetTop
      const startPosition = window.pageYOffset
      const distance = targetPosition - startPosition
      const duration = 1000
      let start: number | null = null

      const animation = (currentTime: number) => {
        if (start === null) start = currentTime
        const timeElapsed = currentTime - start
        const run = easeInOutQuad(timeElapsed, startPosition, distance, duration)
        window.scrollTo(0, run)
        if (timeElapsed < duration) requestAnimationFrame(animation)
      }

      requestAnimationFrame(animation)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section 
        id="hero" 
        data-section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}
      >
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

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <div className={`space-y-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {/* Main Title */}
            <div className="inline-flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-2xl" style={{ 
                  background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                  boxShadow: 'var(--glow-cta)'
                }}>
                  🚀
                </div>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ 
                  background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)'
                }}></div>
              </div>
              <div className="text-left">
                <h1 className="text-7xl md:text-9xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                  AI Tools
                </h1>
                <p className="text-2xl md:text-4xl font-light mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Next-Generation Academic Intelligence
                </p>
              </div>
            </div>

            <p className="text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Revolutionize your academic workflow with our suite of AI-powered tools. 
              From presentations to plagiarism detection, experience the future of intelligent content creation.
            </p>

            {/* Tool Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-12 mb-12">
              {aiTools.map((tool, index) => (
                <button
                  key={tool.id}
                  onClick={() => scrollToSection(tool.id)}
                  className={`group relative p-6 rounded-3xl transition-all duration-700 transform hover:scale-110 hover:-translate-y-3 ${
                    isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    background: `linear-gradient(135deg, var(--bg-secondary) 0%, ${tool.color}10 100%)`,
                    border: `2px solid ${tool.color}30`,
                    boxShadow: `var(--shadow-lg), 0 0 30px ${tool.color}20`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `var(--shadow-xl), 0 0 50px ${tool.color}40, 0 0 80px ${tool.color}20`
                    e.currentTarget.style.borderColor = `${tool.color}60`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 30px ${tool.color}20`
                    e.currentTarget.style.borderColor = `${tool.color}30`
                  }}
                >
                  <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">
                    {tool.icon}
                  </div>
                  <div className="text-sm font-bold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
                    {tool.title.split(' ')[0]}
                  </div>
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                       style={{ background: `linear-gradient(135deg, ${tool.color}, transparent)` }}></div>
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="group relative px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110 overflow-hidden" style={{ 
                background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                color: 'var(--bg-primary)',
                boxShadow: '0 0 40px var(--color-cta)50, var(--glow-cta)'
              }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Get Early Access</span>
              </button>
              <button className="group relative px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110" style={{ 
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                color: 'var(--text-primary)',
                border: '2px solid var(--color-file)40',
                boxShadow: '0 0 30px var(--color-file)20'
              }}>
                <span className="group-hover:text-blue-300 transition-colors">Watch Demo</span>
              </button>
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

      {/* Tool Sections */}
      {aiTools.map((tool, index) => (
        <section
          key={tool.id}
          id={tool.id}
          data-section
          className="relative min-h-screen flex items-center py-20"
          style={{ 
            background: index % 2 === 0 
              ? 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' 
              : 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)'
          }}
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-5">
            <div 
              className="absolute w-96 h-96 rounded-full blur-3xl"
              style={{ 
                background: `linear-gradient(45deg, ${tool.color}, transparent)`,
                top: '20%',
                right: index % 2 === 0 ? '10%' : 'auto',
                left: index % 2 === 0 ? 'auto' : '10%'
              }}
            />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className={`grid lg:grid-cols-2 gap-16 items-center ${
                index % 2 === 0 ? '' : 'lg:grid-flow-col-dense'
              }`}>
                
                {/* Content Side */}
                <div className={`${index % 2 === 0 ? '' : 'lg:col-start-2'} space-y-8`}>
                  {/* Header */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div 
                        className="relative w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
                        style={{ 
                          background: `linear-gradient(135deg, ${tool.color}30, ${tool.color}15)`,
                          border: `3px solid ${tool.color}50`,
                          boxShadow: `0 0 50px ${tool.color}30`
                        }}
                      >
                        {tool.icon}
                        <div 
                          className="absolute inset-0 rounded-3xl opacity-60 animate-pulse"
                          style={{ boxShadow: `0 0 40px ${tool.color}60` }}
                        />
                      </div>
                      <div>
                        <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                          {tool.title}
                        </h2>
                        <p className="text-xl font-semibold" style={{ color: tool.color }}>
                          {tool.subtitle}
                        </p>
                      </div>
                    </div>
                    
                    <div 
                      className="p-6 rounded-2xl"
                      style={{ 
                        background: `linear-gradient(135deg, ${tool.color}08, transparent)`,
                        border: `2px solid ${tool.color}25`,
                        boxShadow: `0 0 30px ${tool.color}15`
                      }}
                    >
                      <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(tool.stats).map(([key, value]) => (
                      <div 
                        key={key}
                        className="text-center p-4 rounded-xl"
                        style={{ 
                          background: `linear-gradient(135deg, ${tool.color}12, transparent)`,
                          border: `2px solid ${tool.color}20`,
                          boxShadow: `0 0 20px ${tool.color}10`
                        }}
                      >
                        <div className="text-2xl font-black mb-1" style={{ color: tool.color }}>{value}</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {key.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Key Features
                    </h3>
                    <div className="space-y-3">
                      {tool.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex} 
                          className="flex items-start gap-4 p-4 rounded-xl transition-all duration-500 hover:scale-105"
                          style={{ 
                            background: `linear-gradient(135deg, var(--bg-tertiary) 0%, ${tool.color}08 100%)`,
                            border: `2px solid ${tool.color}20`,
                            boxShadow: `0 0 15px ${tool.color}10`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = `0 0 25px ${tool.color}25, 0 0 50px ${tool.color}15`
                            e.currentTarget.style.borderColor = `${tool.color}40`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = `0 0 15px ${tool.color}10`
                            e.currentTarget.style.borderColor = `${tool.color}20`
                          }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full mt-2 flex-shrink-0 animate-pulse"
                            style={{ 
                              background: tool.color,
                              boxShadow: `0 0 15px ${tool.color}80`
                            }}
                          />
                          <span className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    className="group relative px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-110 overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${tool.color}25, ${tool.color}15)`,
                      border: `3px solid ${tool.color}50`,
                      color: 'white',
                      boxShadow: `0 0 40px ${tool.color}30, 0 0 80px ${tool.color}20`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 60px ${tool.color}50, 0 0 120px ${tool.color}30`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 40px ${tool.color}30, 0 0 80px ${tool.color}20`
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(45deg, white, transparent)' }}
                    />
                    <span className="relative z-10">Coming Soon - Get Notified</span>
                  </button>
                </div>

                {/* Visual Side */}
                <div className={`${index % 2 === 0 ? '' : 'lg:col-start-1'} relative`}>
                  <div 
                    className="relative aspect-square rounded-3xl p-12 overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${tool.color}12, ${tool.color}05, transparent)`,
                      border: `3px solid ${tool.color}30`,
                      boxShadow: `0 0 80px ${tool.color}25, inset 0 0 50px ${tool.color}05`
                    }}
                  >
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${tool.color}25 0%, transparent 50%), 
                                      radial-gradient(circle at 70% 70%, ${tool.color}20 0%, transparent 50%)`
                        }}
                      />
                    </div>

                    {/* Central Icon Display */}
                    <div className="relative z-10 h-full flex items-center justify-center">
                      <div className="text-center">
                        <div 
                          className="text-9xl mb-6 transform transition-all duration-700 hover:scale-110 hover:rotate-12"
                          style={{ 
                            filter: `drop-shadow(0 0 30px ${tool.color}60)`,
                            color: tool.color
                          }}
                        >
                          {tool.icon}
                        </div>
                        <div 
                          className="text-2xl font-bold"
                          style={{ color: tool.color }}
                        >
                          {tool.title}
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
                            background: `${tool.color}70`,
                            top: `${15 + (i * 6)}%`,
                            left: `${10 + (i * 7)}%`,
                            animationDelay: `${i * 0.3}s`,
                            boxShadow: `0 0 20px ${tool.color}90`
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
      ))}

      {/* Final CTA Section */}
      <section className="relative min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, var(--color-cta) 0%, transparent 50%), 
                             radial-gradient(circle at 80% 20%, var(--color-file) 0%, transparent 50%),
                             radial-gradient(circle at 40% 40%, var(--color-video) 0%, transparent 50%)`
          }} />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of students and professionals who are already experiencing 
              the power of AI-driven productivity. Be among the first to access these revolutionary tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
              <button className="group relative px-16 py-6 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110 overflow-hidden" style={{ 
                background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                color: 'var(--bg-primary)',
                boxShadow: '0 0 50px var(--color-cta)40, var(--glow-cta)'
              }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Get Early Access</span>
              </button>
              <button className="group relative px-16 py-6 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110" style={{ 
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                color: 'var(--text-primary)',
                border: '3px solid var(--color-file)40',
                boxShadow: '0 0 40px var(--color-file)20'
              }}>
                <span className="group-hover:text-blue-300 transition-colors">Learn More</span>
              </button>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {[
                { number: '50,000+', label: 'Students Ready' },
                { number: '6', label: 'AI Tools Coming' },
                { number: '99%', label: 'Accuracy Rate' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-black mb-2" style={{ color: 'var(--color-cta)' }}>
                    {stat.number}
                  </div>
                  <div className="text-lg" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
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