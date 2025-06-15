'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import NeuralNetworkBackground from '@/components/NeuralNetworkBackground'
import DemoQuiz, { DemoQuizQuestion } from '@/components/DemoQuiz'

export default function HomePage() {
  const { t } = useTranslation()
  const [activeFeature, setActiveFeature] = useState('notes')
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)

  const features = [
    {
      id: 'notes',
      title: t('home.notesGenerator'),
      description: t('home.notesDescription'),
      icon: '📝',
      color: 'var(--color-file)',
      preview: 'notes'
    },
    {
      id: 'presentation',
      title: t('home.presentationGenerator'),
      description: t('home.presentationDescription'),
      icon: '📊',
      color: 'var(--color-youtube)',
      preview: 'presentation'
    },
    {
      id: 'essay',
      title: t('home.essayWriter'),
      description: t('home.essayDescription'),
      icon: '📄',
      color: 'var(--color-text)',
      preview: 'essay'
    },
    {
      id: 'case-study',
      title: t('home.caseStudyBuilder'),
      description: t('home.caseStudyDescription'),
      icon: '📋',
      color: 'var(--color-video)',
      preview: 'case-study'
    },
    {
      id: 'quiz',
      title: t('home.quizGenerator'),
      description: t('home.quizDescription'),
      icon: '🧠',
      color: 'var(--color-cta)',
      preview: 'quiz'
    }
  ]

  const steps = [
    {
      step: 1,
      title: t('home.step1Title'),
      description: t('home.step1Description'),
      icon: '🎯'
    },
    {
      step: 2,
      title: t('home.step2Title'),
      description: t('home.step2Description'),
      icon: '📤'
    },
    {
      step: 3,
      title: t('home.step3Title'),
      description: t('home.step3Description'),
      icon: '🤖'
    },
    {
      step: 4,
      title: t('home.step4Title'),
      description: t('home.step4Description'),
      icon: '⬇️'
    }
  ]

  const guarantees = [
    { icon: '⚡', title: t('home.lightningFastGuarantee'), description: t('home.lightningFastGuaranteeDesc') },
    { icon: '🎯', title: t('home.accuracyGuarantee'), description: t('home.accuracyGuaranteeDesc') },
    { icon: '🔒', title: t('home.secureGuarantee'), description: t('home.secureGuaranteeDesc') },
    { icon: '🌍', title: t('home.multiLanguageGuarantee'), description: t('home.multiLanguageGuaranteeDesc') },
    { icon: '📱', title: t('home.anyDeviceGuarantee'), description: t('home.anyDeviceGuaranteeDesc') },
    { icon: '💎', title: t('home.premiumQualityGuarantee'), description: t('home.premiumQualityGuaranteeDesc') }
  ]

  const reviews = [
    {
      name: t('home.review1Name'),
      rating: 5,
      text: t('home.review1Text'),
      lang: 'pl'
    },
    {
      name: 'John Smith',
      rating: 5,
      text: t('home.review2Text'),
      lang: 'en'
    },
    {
      name: t('home.review2Name'),
      rating: 5,
      text: t('home.review3Text'),
      lang: 'pl'
    },
    {
      name: 'Sarah Johnson',
      rating: 5,
      text: t('home.review4Text'),
      lang: 'en'
    },
    {
      name: t('home.review5Name'),
      rating: 5,
      text: t('home.review5Text'),
      lang: 'pl'
    }
  ]

  const benefits = [
    {
      icon: '⚡',
      title: t('home.lightningFast'),
      description: t('home.lightningFastDescription'),
      color: 'var(--color-cta)'
    },
    {
      icon: '🎯',
      title: t('home.smartAnalysis'),
      description: t('home.smartAnalysisDescription'),
      color: 'var(--color-file)'
    },
    {
      icon: '🔒',
      title: t('home.securePrivate'),
      description: t('home.securePrivateDescription'),
      color: 'var(--color-youtube)'
    }
  ]

  // Demo quiz questions for the interactive preview
  const demoQuizQuestions: DemoQuizQuestion[] = [
    {
      id: 'demo-1',
      question: t('home.quizQuestion1'),
      options: {
        A: t('home.quizAnswer1A'),
        B: t('home.quizAnswer1B'),
        C: t('home.quizAnswer1C')
      },
      correctAnswer: 'A',
      explanation: t('home.quizExplanation1')
    },
    {
      id: 'demo-2',
      question: t('home.quizQuestion2'),
      options: {
        A: t('home.quizAnswer2A'),
        B: t('home.quizAnswer2B'),
        C: t('home.quizAnswer2C')
      },
      correctAnswer: 'A',
      explanation: t('home.quizExplanation2')
    },
    {
      id: 'demo-3',
      question: t('home.quizQuestion3'),
      options: {
        A: t('home.quizAnswer3A'),
        B: t('home.quizAnswer3B'),
        C: t('home.quizAnswer3C')
      },
      correctAnswer: 'A',
      explanation: t('home.quizExplanation3')
    }
  ]

  useEffect(() => {
    setIsLoaded(true)
    
    // Scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
          }
        })
      },
      { threshold: 0.1 }
    )

    // Observe all scroll sections
    const scrollSections = document.querySelectorAll('.scroll-section')
    scrollSections.forEach((section) => observer.observe(section))

    return () => {
      scrollSections.forEach((section) => observer.unobserve(section))
    }
  }, [])

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)
  }

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  const NotesPreview = () => (
    <div className="p-6 rounded-2xl" style={{ 
      background: 'var(--bg-primary)',
      border: '1px solid var(--bg-tertiary)',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-file)' }}>
          📚 {t('home.demoNotesTitle')}
        </h3>
        <div className="h-px mb-3" style={{ background: 'var(--bg-tertiary)' }}></div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            🔍 {t('home.demoKeyConcepts')}
          </h4>
          <ul className="ml-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>• {t('home.demoSupervised')}</li>
            <li>• {t('home.demoTrainingData')}</li>
            <li>• {t('home.demoAccuracy')}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            ⚙️ {t('home.demoAlgorithms')}
          </h4>
          <ul className="ml-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>• {t('home.demoLinearRegression')}</li>
            <li>• {t('home.demoDecisionTrees')}</li>
            <li>• {t('home.demoNeuralNetworks')}</li>
          </ul>
        </div>
        
        <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
            💡 {t('home.demoRemember')}
          </p>
        </div>
      </div>
    </div>
  )

  const InteractiveQuizPreview = () => {
    return (
      <DemoQuiz 
        questions={demoQuizQuestions}
        onComplete={(score, total) => {
          console.log(`Demo quiz completed: ${score}/${total}`);
        }}
      />
    )
  }

  const DefaultPreview = ({ feature }: { feature: any }) => (
    <div className="p-8 text-center">
      <div className="text-6xl mb-4">{feature.icon}</div>
      <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        {feature.title}
      </h3>
      <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
        {feature.description}
      </p>
    </div>
  )

  const renderPreview = () => {
    const feature = features.find(f => f.id === activeFeature)
    if (!feature) return null

    switch (activeFeature) {
      case 'notes':
        return <NotesPreview />
      case 'quiz':
        return <InteractiveQuizPreview />
      default:
        return <DefaultPreview feature={feature} />
    }
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      <NeuralNetworkBackground />
      
      <div className="relative z-10">
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
            <div className={`space-y-12 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
              {/* Main Title */}
              <div className="text-center space-y-6">
                <h1 className={`text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent leading-tight ${isLoaded ? 'animate-slide-in-up' : 'opacity-0 translate-y-8'} transition-all duration-1000 ease-out`}>
                  {t('home.heroTitle')}{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                    EduScribe AI
                  </span>
                </h1>
                <p className="text-lg md:text-xl font-medium mt-4" style={{ color: 'var(--text-secondary)' }}>
                  Next-Generation Learning Platform
                </p>
              </div>

              <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t('home.heroSubtitle')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                <Link href="/notes">
                  <button className="group relative px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-105 overflow-hidden" style={{ 
                    background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                    color: 'var(--bg-primary)',
                    boxShadow: '0 0 30px var(--color-cta)40, var(--glow-cta)'
                  }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">{t('home.getStarted')}</span>
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

        {/* Interactive Feature Preview */}
        <section className="scroll-section relative min-h-screen flex items-center py-20" style={{ 
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
              <h2 className="text-5xl md:text-6xl font-black text-center mb-16 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t('home.powerfulTools')}
              </h2>
              
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Feature Selector */}
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <button
                      key={feature.id}
                      onClick={() => setActiveFeature(feature.id)}
                      className={`w-full p-6 rounded-3xl text-left transition-all duration-500 transform hover:scale-105 ${
                        activeFeature === feature.id ? 'scale-105' : ''
                      }`}
                      style={{
                        background: activeFeature === feature.id 
                          ? `linear-gradient(135deg, ${feature.color}15, ${feature.color}05)` 
                          : `linear-gradient(135deg, var(--bg-tertiary) 0%, ${feature.color}05 100%)`,
                        border: `2px solid ${activeFeature === feature.id ? `${feature.color}50` : `${feature.color}20`}`,
                        boxShadow: activeFeature === feature.id 
                          ? `0 0 40px ${feature.color}30, 0 0 80px ${feature.color}15` 
                          : `0 0 15px ${feature.color}10`
                      }}
                      onMouseEnter={(e) => {
                        if (activeFeature !== feature.id) {
                          e.currentTarget.style.boxShadow = `0 0 25px ${feature.color}20, 0 0 50px ${feature.color}10`
                          e.currentTarget.style.borderColor = `${feature.color}30`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeFeature !== feature.id) {
                          e.currentTarget.style.boxShadow = `0 0 15px ${feature.color}10`
                          e.currentTarget.style.borderColor = `${feature.color}20`
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${feature.color}25, ${feature.color}15)`,
                            border: `2px solid ${feature.color}40`,
                            boxShadow: `0 0 20px ${feature.color}20`
                          }}
                        >
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            {feature.title}
                          </h3>
                          <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Feature Preview */}
                <div 
                  className="rounded-3xl p-8 overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, var(--bg-tertiary) 0%, ${features.find(f => f.id === activeFeature)?.color}08 100%)`,
                    border: `3px solid ${features.find(f => f.id === activeFeature)?.color}30`,
                    boxShadow: `0 0 80px ${features.find(f => f.id === activeFeature)?.color}25, inset 0 0 50px ${features.find(f => f.id === activeFeature)?.color}05`
                  }}
                >
                  {renderPreview()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose EduScribe */}
        <section className="scroll-section relative min-h-screen flex items-center py-20" style={{ 
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
        }}>
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-5">
            <div 
              className="absolute w-96 h-96 rounded-full blur-3xl"
              style={{ 
                background: `linear-gradient(45deg, var(--color-file), transparent)`,
                top: '20%',
                left: '10%'
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
                        ⭐
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
                </div>

                {/* Guarantees Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {guarantees.map((guarantee, index) => (
                    <div 
                      key={index} 
                      className="p-6 rounded-2xl text-center transition-all duration-500 hover:scale-105" 
                      style={{ 
                        background: `linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-cta)05 100%)`,
                        border: `2px solid var(--color-cta)20`,
                        boxShadow: `0 0 15px var(--color-cta)10`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 25px var(--color-cta)25, 0 0 50px var(--color-cta)15`
                        e.currentTarget.style.borderColor = `var(--color-cta)40`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 15px var(--color-cta)10`
                        e.currentTarget.style.borderColor = `var(--color-cta)20`
                      }}
                    >
                      <div className="text-3xl mb-3">{guarantee.icon}</div>
                      <h3 className="font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {guarantee.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {guarantee.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="scroll-section relative min-h-screen flex items-center py-20" style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)'
        }}>
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-5">
            <div 
              className="absolute w-96 h-96 rounded-full blur-3xl"
              style={{ 
                background: `linear-gradient(45deg, var(--color-video), transparent)`,
                top: '20%',
                right: '10%'
              }}
            />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-black text-center mb-16 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t('home.howItWorks')}
              </h2>
              
              <div className="flex flex-col lg:flex-row justify-center gap-8">
                {steps.map((step, index) => (
                  <div key={step.step} className="flex items-start">
                    <div className="text-center flex-1">
                      <div 
                        className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl" 
                        style={{ 
                          background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                          color: 'var(--bg-primary)',
                          boxShadow: 'var(--glow-cta)'
                        }}
                      >
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {step.title}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {step.description}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:flex items-center mx-8 mt-12">
                        <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                          <path d="M30 10L35 5M35 5L30 0M35 5H0" stroke="var(--color-cta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Verified Reviews */}
        <section className="scroll-section relative min-h-screen flex items-center py-20" style={{ 
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
        }}>
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-5">
            <div 
              className="absolute w-96 h-96 rounded-full blur-3xl"
              style={{ 
                background: `linear-gradient(45deg, var(--color-text), transparent)`,
                top: '20%',
                left: '10%'
              }}
            />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-black text-center mb-16 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t('home.verifiedReviews')}
              </h2>
              
              <div className="relative">
                <div 
                  className="p-8 rounded-3xl text-center" 
                  style={{ 
                    background: `linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-cta)05 100%)`,
                    border: `3px solid var(--color-cta)30`,
                    boxShadow: `0 0 80px var(--color-cta)25, inset 0 0 50px var(--color-cta)05`
                  }}
                >
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-6 h-6 mx-1" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFD700' }}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-xl mb-6 italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    "{reviews[currentReviewIndex].text}"
                  </p>
                  <p className="font-bold" style={{ color: 'var(--color-cta)' }}>
                    — {reviews[currentReviewIndex].name}
                  </p>
                </div>
                
                <button 
                  onClick={prevReview}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110" 
                  style={{ 
                    background: `linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-cta)10 100%)`,
                    border: `2px solid var(--color-cta)30`,
                    color: 'var(--text-primary)',
                    boxShadow: `0 0 20px var(--color-cta)20`
                  }}
                >
                  ←
                </button>
                <button 
                  onClick={nextReview}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110" 
                  style={{ 
                    background: `linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-cta)10 100%)`,
                    border: `2px solid var(--color-cta)30`,
                    color: 'var(--text-primary)',
                    boxShadow: `0 0 20px var(--color-cta)20`
                  }}
                >
                  →
                </button>
              </div>
              
              <div className="flex justify-center mt-6 gap-2">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentReviewIndex(index)}
                    className="w-3 h-3 rounded-full transition-all duration-300"
                    style={{
                      background: index === currentReviewIndex ? 'var(--color-cta)' : 'var(--bg-tertiary)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

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
                {t('home.readyToStart')}
              </h2>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t('home.pricingCta')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
                <Link href="/pricing">
                  <button className="group relative px-16 py-6 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110 overflow-hidden" style={{ 
                    background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                    color: 'var(--bg-primary)',
                    boxShadow: '0 0 50px var(--color-cta)40, var(--glow-cta)'
                  }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">{t('home.viewPricing')}</span>
                  </button>
                </Link>
                <Link href="/notes">
                  <button className="group relative px-16 py-6 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110" style={{ 
                    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                    color: 'var(--text-primary)',
                    border: '3px solid var(--color-file)40',
                    boxShadow: '0 0 40px var(--color-file)20'
                  }}>
                    <span className="group-hover:text-blue-300 transition-colors">{t('home.getStartedFree')}</span>
                  </button>
                </Link>
              </div>

              {/* Global Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                {[
                  { number: '50,000+', label: 'Students Ready' },
                  { number: '5', label: 'AI Tools Available' },
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
      </div>

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

        .scroll-section {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease-out;
        }

        .animate-fade-in-up {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
} 