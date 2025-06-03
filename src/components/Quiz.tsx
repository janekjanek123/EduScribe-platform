'use client';

import { useState } from 'react';
import { useSupabase } from '@/lib/supabase-provider';

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  correctAnswer: 'A' | 'B' | 'C';
  explanation?: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  noteId: string;
  noteType: 'text' | 'video' | 'file';
  onComplete?: (score: number, totalQuestions: number) => void;
}

interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  userAnswers?: string[];
}

export default function Quiz({ questions, noteId, noteType, onComplete }: QuizProps) {
  const { user, supabase } = useSupabase();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Quiz Not Available</h3>
        <p className="text-yellow-700">No quiz questions are available for this note.</p>
      </div>
    );
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed, submit answers
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: string[]) => {
    if (!user) {
      setError('You must be logged in to submit quiz answers');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('[Quiz] Submitting quiz answers:', {
        noteId,
        noteType,
        answersCount: finalAnswers.length
      });

      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          noteId,
          noteType,
          answers: finalAnswers
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit quiz');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Quiz submission failed');
      }

      console.log('[Quiz] Quiz submitted successfully:', data.data);
      
      const quizResult: QuizResult = {
        score: data.data.score,
        correctAnswers: data.data.correctAnswers,
        totalQuestions: data.data.totalQuestions,
        percentage: data.data.percentage,
        completedAt: data.data.completedAt,
        userAnswers: finalAnswers
      };

      setResult(quizResult);
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(quizResult.score, quizResult.totalQuestions);
      }

    } catch (err: any) {
      console.error('[Quiz] Error submitting quiz:', err);
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent! 🎉';
    if (percentage >= 80) return 'Great job! 👏';
    if (percentage >= 70) return 'Good work! 👍';
    if (percentage >= 60) return 'Not bad! 📚';
    return 'Keep studying! 💪';
  };

  // Show quiz result
  if (result) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h3>
          
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.percentage)}`}>
            {result.percentage}%
          </div>
          
          <p className="text-lg text-gray-600 mb-4">
            {result.correctAnswers} out of {result.totalQuestions} correct
          </p>
          
          <p className="text-xl font-semibold text-gray-800 mb-6">
            {getScoreMessage(result.percentage)}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Score Breakdown:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Correct Answers:</span>
                <span className="font-semibold ml-2 text-green-600">{result.correctAnswers}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold ml-2">{result.totalQuestions}</span>
              </div>
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <span className={`font-semibold ml-2 ${getScoreColor(result.percentage)}`}>
                  {result.percentage}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>
                <span className="font-semibold ml-2">
                  {new Date(result.completedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle Detailed Results Button */}
          <button
            onClick={() => setShowDetailedResults(!showDetailedResults)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors mr-3"
          >
            {showDetailedResults ? 'Hide' : 'Show'} Detailed Results
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Take Quiz Again
          </button>
        </div>

        {/* Detailed Results Section */}
        {showDetailedResults && result.userAnswers && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">📋 Detailed Results</h4>
            <div className="space-y-6">
              {questions.map((question, index) => {
                const userAnswer = result.userAnswers![index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Question {index + 1}: {question.question}
                        </h5>
                        
                        {/* Answer Options */}
                        <div className="space-y-2 mb-3">
                          {Object.entries(question.options).map(([key, value]) => {
                            let optionClass = 'p-2 rounded border ';
                            
                            if (key === question.correctAnswer) {
                              // Correct answer - always green
                              optionClass += 'bg-green-100 border-green-300 text-green-800';
                            } else if (key === userAnswer && !isCorrect) {
                              // User's wrong answer - red
                              optionClass += 'bg-red-100 border-red-300 text-red-800';
                            } else {
                              // Other options - gray
                              optionClass += 'bg-gray-50 border-gray-200 text-gray-700';
                            }
                            
                            return (
                              <div key={key} className={optionClass}>
                                <span className="font-semibold mr-2">{key}.</span>
                                {value}
                                {key === question.correctAnswer && (
                                  <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                                )}
                                {key === userAnswer && !isCorrect && (
                                  <span className="ml-2 text-red-600 font-semibold">✗ Your Answer</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Result Summary */}
                        <div className={`p-3 rounded-lg ${
                          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                          </p>
                          {!isCorrect && (
                            <p className="text-red-700 text-sm mt-1">
                              Your answer: <strong>{userAnswer}</strong> | 
                              Correct answer: <strong>{question.correctAnswer}</strong>
                            </p>
                          )}
                          
                          {/* Explanation */}
                          {question.explanation && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <p className="text-sm text-gray-700">
                                <strong>Explanation:</strong> {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Quiz Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">📝 Quiz Time!</h3>
          <span className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          {question.question}
        </h4>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {Object.entries(question.options).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleAnswerSelect(key)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === key
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-semibold mr-3">{key}.</span>
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {selectedAnswer ? `Selected: ${selectedAnswer}` : 'Select an answer to continue'}
        </div>
        
        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer || isSubmitting}
          className={`px-6 py-2 rounded-md font-semibold transition-colors ${
            selectedAnswer && !isSubmitting
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </span>
          ) : currentQuestion === questions.length - 1 ? (
            'Finish Quiz'
          ) : (
            'Next Question'
          )}
        </button>
      </div>
    </div>
  );
} 