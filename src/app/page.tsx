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
    <div className="min-h-screen relative" style={{ background: '#1F2235' }}>
      <NeuralNetworkBackground />
      <style jsx>{`
        @keyframes slideUpBounce {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          60% {
            opacity: 1;
            transform: translateY(-5px);
          }
          80% {
            transform: translateY(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes brandBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }

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

        .hero-animate {
          animation: slideUpBounce 1s ease-out forwards;
        }

        .brand-bounce {
          animation: brandBounce 1s ease-in-out 1.2s 2;
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

        html {
          scroll-behavior: smooth;
        }

        .section-snap {
          scroll-snap-type: y mandatory;
        }

        .section-snap > section {
          scroll-snap-align: start;
        }
      `}</style>

      <div className="section-snap relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className={`${isLoaded ? 'hero-animate' : 'opacity-0'}`}>
              <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" style={{ color: 'var(--text-primary)' }}>
                {t('home.heroTitle')}{' '}
                <span className={`${isLoaded ? 'brand-bounce' : ''}`} style={{ color: 'var(--color-cta)', display: 'inline-block' }}>
                  EduScribe AI
                </span>
              </h1>
              <p className="text-2xl mb-12 leading-relaxed max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                {t('home.heroSubtitle')}
              </p>
              <Link href="/notes" className="inline-block">
                <button className="px-12 py-6 rounded-2xl font-bold text-2xl transition-all duration-300 transform hover:scale-105" style={{ 
                  background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--glow-cta)',
                  minHeight: '80px'
                }}>
                  {t('home.getStarted')}
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Feature Preview */}
        <section className="scroll-section container mx-auto px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16" style={{ color: 'var(--text-primary)' }}>
              {t('home.powerfulTools')}
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Feature Selector */}
              <div className="space-y-4">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id)}
                    className={`w-full p-6 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ${
                      activeFeature === feature.id ? 'scale-105' : ''
                    }`}
                    style={{
                      background: activeFeature === feature.id 
                        ? `linear-gradient(135deg, ${feature.color}15, ${feature.color}05)` 
                        : 'var(--bg-secondary)',
                      border: `1px solid ${activeFeature === feature.id ? feature.color : 'var(--bg-tertiary)'}`,
                      boxShadow: activeFeature === feature.id ? 'var(--shadow-xl)' : 'var(--shadow-sm)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{feature.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold mb-2" style={{ 
                          color: activeFeature === feature.id ? feature.color : 'var(--text-primary)' 
                        }}>
                          {feature.title}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Feature Preview */}
              <div className="rounded-3xl p-8" style={{ 
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-xl)'
              }}>
                {renderPreview()}
                <div className="mt-6 text-center">
                  <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    {features.find(f => f.id === activeFeature)?.title}
                  </h3>
                  <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                    {features.find(f => f.id === activeFeature)?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose EduScribe */}
        <section className="scroll-section container mx-auto px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
                  {t('home.whyChoose')}
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ 
                      background: 'var(--color-cta)',
                      color: 'var(--bg-primary)'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {t('home.lightningFast')}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {t('home.lightningFastDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ 
                      background: 'var(--color-file)',
                      color: 'var(--bg-primary)'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                        <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                        <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {t('home.smartAnalysis')}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {t('home.smartAnalysisDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ 
                      background: 'var(--color-youtube)',
                      color: 'var(--bg-primary)'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <circle cx="12" cy="16" r="1"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {t('home.securePrivate')}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {t('home.securePrivateDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {guarantees.map((guarantee, index) => (
                  <div key={index} className="p-6 rounded-2xl text-center transition-all duration-300 transform hover:scale-105" style={{ 
                    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                    border: '1px solid var(--bg-tertiary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div className="text-3xl mb-3">{guarantee.icon}</div>
                    <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
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
        </section>

        {/* How It Works */}
        <section className="scroll-section container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16" style={{ color: 'var(--text-primary)' }}>
              {t('home.howItWorks')}
            </h2>
            
            <div className="flex flex-col lg:flex-row justify-center gap-8">
              {steps.map((step, index) => (
                <div key={step.step} className="flex items-start">
                  <div className="text-center flex-1">
                    <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-6" style={{ 
                      background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                      color: 'var(--bg-primary)',
                      boxShadow: 'var(--glow-cta)'
                    }}>
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                      {step.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex items-center mx-8 mt-10">
                      <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-gray-400">
                        <path d="M30 10L35 5M35 5L30 0M35 5H0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-cta)' }}/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verified Reviews */}
        <section className="scroll-section container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16" style={{ color: 'var(--text-primary)' }}>
              {t('home.verifiedReviews')}
            </h2>
            
            <div className="relative">
              <div className="p-8 rounded-3xl text-center" style={{ 
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-xl)'
              }}>
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-6 h-6 mx-1" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFD700' }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-xl mb-6 italic" style={{ color: 'var(--text-primary)' }}>
                  "{reviews[currentReviewIndex].text}"
                </p>
                <p className="font-bold" style={{ color: 'var(--color-cta)' }}>
                  — {reviews[currentReviewIndex].name}
                </p>
              </div>
              
              <button 
                onClick={prevReview}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ 
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              >
                ←
              </button>
              <button 
                onClick={nextReview}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ 
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  color: 'var(--text-primary)'
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
        </section>

        {/* Pricing CTA */}
        <section className="scroll-section container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
              {t('home.readyToStart')}
            </h2>
            <p className="text-xl mb-12" style={{ color: 'var(--text-secondary)' }}>
              {t('home.pricingCta')}
            </p>
            <Link href="/pricing" className="inline-block">
              <button className="px-12 py-6 rounded-2xl font-bold text-2xl transition-all duration-300 transform hover:scale-105" style={{ 
                background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                color: 'var(--bg-primary)',
                boxShadow: 'var(--glow-cta)'
              }}>
                {t('home.viewPricing')}
              </button>
            </Link>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="scroll-section container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {t('home.joinThousands')}
            </h2>
            <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
              {t('home.startToday')}
            </p>
            <Link href="/notes" className="inline-block">
              <button className="px-10 py-4 rounded-xl font-bold text-xl transition-all duration-300 transform hover:scale-105" style={{ 
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--color-cta)'
              }}>
                {t('home.getStartedFree')}
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
} 