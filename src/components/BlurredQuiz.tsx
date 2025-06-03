'use client'

import { useRouter } from 'next/navigation'

interface BlurredQuizProps {
  questionCount?: number
}

export default function BlurredQuiz({ questionCount = 5 }: BlurredQuizProps) {
  const router = useRouter()

  return (
    <div className="relative">
      {/* Blurred quiz content */}
      <div className="filter blur-sm pointer-events-none">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📝 Interactive Quiz ({questionCount} questions)
          </h3>
          
          {/* Mock quiz questions */}
          {Array.from({ length: Math.min(questionCount, 3) }).map((_, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                <p className="text-gray-900 font-medium">
                  This is a sample quiz question that would appear here...
                </p>
              </div>
              
              <div className="space-y-2">
                {['A', 'B', 'C'].map((option) => (
                  <label key={option} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      className="h-4 w-4 text-blue-600"
                      disabled
                    />
                    <span className="text-gray-700">
                      {option}. Sample answer option
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <button
            disabled
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium opacity-50"
          >
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Overlay with upgrade message */}
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="mb-4">
            <svg className="w-12 h-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Unlock Interactive Quizzes
          </h4>
          
          <p className="text-gray-600 mb-4 text-sm">
            Upgrade to unlock interactive quizzes for your notes and test your knowledge.
          </p>
          
          <button
            onClick={() => router.push('/pricing')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  )
} 