'use client'

import { useRouter } from 'next/navigation'

interface BlurredQuizProps {
  questionCount?: number
}

export default function BlurredQuiz({ questionCount = 5 }: BlurredQuizProps) {
  const router = useRouter()

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
      border: '1px solid var(--bg-tertiary)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Blurred quiz content */}
      <div className="filter blur-sm pointer-events-none p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📝 Interactive Quiz ({questionCount} questions)
        </h3>
        
        {/* Mock quiz questions */}
        {Array.from({ length: Math.min(questionCount, 3) }).map((_, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <div className="mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Question {index + 1}</span>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                This is a sample quiz question that would appear here...
              </p>
            </div>
            
            <div className="space-y-2">
              {['A', 'B', 'C'].map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--color-cta)' }}
                    disabled
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {option}. Sample answer option
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        <button
          disabled
          className="w-full py-3 px-4 rounded-xl font-medium opacity-50"
          style={{ 
            background: 'var(--color-cta)',
            color: 'var(--bg-primary)'
          }}
        >
          Submit Quiz
        </button>
      </div>

      {/* Overlay with upgrade message */}
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ 
        background: 'rgba(31, 34, 53, 0.85)',
        backdropFilter: 'blur(4px)'
      }}>
        <div className="text-center p-6 max-w-sm">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ 
              background: 'linear-gradient(135deg, var(--color-text), var(--color-file))',
              boxShadow: 'var(--glow-text)'
            }}>
              <span className="text-2xl">🔒</span>
            </div>
          </div>
          
          <h4 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Unlock Interactive Quizzes
          </h4>
          
          <p className="mb-6 text-base" style={{ color: 'var(--text-secondary)' }}>
            Upgrade to unlock interactive quizzes for your notes and test your knowledge.
          </p>
          
          <button
            onClick={() => router.push('/pricing')}
            className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            style={{ 
              background: 'var(--color-cta)',
              color: 'var(--bg-primary)',
              boxShadow: 'var(--glow-cta)'
            }}
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  )
} 