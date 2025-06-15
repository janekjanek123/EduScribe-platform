'use client';

import { useState } from 'react';

export interface DemoQuizQuestion {
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

interface DemoQuizProps {
  questions: DemoQuizQuestion[];
  onComplete?: (score: number, totalQuestions: number) => void;
}

interface DemoQuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  userAnswers?: string[];
}

export default function DemoQuiz({ questions, onComplete }: DemoQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DemoQuizResult | null>(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-xl p-6" style={{ 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
        border: '2px solid var(--color-video)',
        boxShadow: '0 0 20px rgba(255, 165, 0, 0.3)'
      }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-video)' }}>Quiz Not Available</h3>
        <p style={{ color: 'var(--text-secondary)' }}>No quiz questions are available for this note.</p>
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
      // Quiz completed, calculate results
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: string[]) => {
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Calculate results locally
      let correct = 0;
      finalAnswers.forEach((answer, index) => {
        if (answer === questions[index].correctAnswer) {
          correct++;
        }
      });

      const percentage = Math.round((correct / questions.length) * 100);
      
      const quizResult: DemoQuizResult = {
        score: correct,
        correctAnswers: correct,
        totalQuestions: questions.length,
        percentage: percentage,
        completedAt: new Date().toISOString(),
        userAnswers: finalAnswers
      };

      setResult(quizResult);
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(quizResult.score, quizResult.totalQuestions);
      }

    } catch (err: any) {
      console.error('[DemoQuiz] Error calculating results:', err);
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="rounded-2xl p-6" style={{ 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
        border: '1px solid var(--bg-tertiary)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ 
            background: 'linear-gradient(135deg, var(--color-cta), var(--color-file))',
            boxShadow: 'var(--glow-cta)'
          }}>
            <span className="text-2xl">🎯</span>
          </div>
          
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Quiz Completed!</h3>
          
          <div className="text-4xl font-bold mb-2" style={{ 
            color: result.percentage >= 80 ? 'var(--color-cta)' :
                   result.percentage >= 60 ? 'var(--color-video)' :
                   '#ef4444'
          }}>
            {result.percentage}%
          </div>
          
          <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
            {result.correctAnswers} out of {result.totalQuestions} correct
          </p>
          
          <p className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            {getScoreMessage(result.percentage)}
          </p>
          
          <div className="rounded-xl p-4 mb-6" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Score Breakdown:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Correct Answers:</span>
                <span className="font-semibold ml-2" style={{ color: 'var(--color-file)' }}>{result.correctAnswers}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Total Questions:</span>
                <span className="font-semibold ml-2" style={{ color: 'var(--text-primary)' }}>{result.totalQuestions}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Accuracy:</span>
                <span className="font-semibold ml-2" style={{ 
                  color: result.percentage >= 80 ? 'var(--color-cta)' :
                         result.percentage >= 60 ? 'var(--color-video)' :
                         '#ef4444'
                }}>
                  {result.percentage}%
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
                <span className="font-semibold ml-2" style={{ color: 'var(--text-primary)' }}>
                  {new Date(result.completedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle Detailed Results Button */}
          <button
            onClick={() => setShowDetailedResults(!showDetailedResults)}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 mr-4"
            style={{ 
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {showDetailedResults ? 'Hide' : 'Show'} Detailed Results
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
              color: 'var(--bg-primary)',
              boxShadow: 'var(--glow-cta)'
            }}
          >
            Take Quiz Again
          </button>
        </div>

        {/* Detailed Results Section */}
        {showDetailedResults && result.userAnswers && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Detailed Results
            </h4>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = result.userAnswers![index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={question.id} className="p-4 rounded-xl" style={{ 
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-tertiary)'
                  }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                          Question {index + 1}: {question.question}
                        </h5>
                        
                        {/* Answer Options */}
                        <div className="space-y-2 mb-3">
                          {Object.entries(question.options).map(([key, value]) => {
                            let optionStyles: React.CSSProperties = { 
                              border: '1px solid var(--bg-tertiary)',
                              borderRadius: '8px',
                              padding: '8px 12px'
                            };
                            
                            if (key === question.correctAnswer) {
                              // Correct answer - always green
                              optionStyles = {
                                ...optionStyles,
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.1))',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                color: '#22c55e'
                              };
                            } else if (key === userAnswer && !isCorrect) {
                              // User's wrong answer - red
                              optionStyles = {
                                ...optionStyles,
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#ef4444'
                              };
                            } else {
                              // Other options - dark theme
                              optionStyles = {
                                ...optionStyles,
                                background: 'var(--bg-primary)',
                                color: 'var(--text-secondary)'
                              };
                            }
                            
                            return (
                              <div key={key} style={optionStyles}>
                                <span className="font-semibold mr-2">{key}.</span>
                                {value}
                                {key === question.correctAnswer && (
                                  <span className="ml-2 font-semibold" style={{ color: '#22c55e' }}>✓ Correct</span>
                                )}
                                {key === userAnswer && !isCorrect && (
                                  <span className="ml-2 font-semibold" style={{ color: '#ef4444' }}>✗ Your Answer</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Result Summary */}
                        <div className="p-3 rounded-lg" style={{
                          background: isCorrect 
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                          border: isCorrect 
                            ? '1px solid rgba(34, 197, 94, 0.3)'
                            : '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          <p className="font-semibold" style={{ 
                            color: isCorrect ? '#22c55e' : '#ef4444'
                          }}>
                            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                              Your answer: <strong>{userAnswer}</strong> | 
                              Correct answer: <strong>{question.correctAnswer}</strong>
                            </p>
                          )}
                          
                          {/* Explanation */}
                          {question.explanation && (
                            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--bg-tertiary)' }}>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
    <div className="rounded-2xl p-6" style={{ 
      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
      border: '1px solid var(--bg-tertiary)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Quiz Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>📝 Quiz Time!</h3>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full rounded-full h-3" style={{ background: 'var(--bg-primary)' }}>
          <div 
            className="h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
              boxShadow: 'var(--glow-cta)'
            }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {question.question}
        </h4>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {Object.entries(question.options).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleAnswerSelect(key)}
              className="w-full text-left p-4 rounded-xl transition-all duration-300 transform hover:scale-102"
              style={{
                background: selectedAnswer === key 
                  ? 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)'
                  : 'var(--bg-primary)',
                border: selectedAnswer === key 
                  ? '2px solid var(--color-cta)' 
                  : '2px solid var(--bg-tertiary)',
                color: selectedAnswer === key ? 'var(--bg-primary)' : 'var(--text-primary)',
                boxShadow: selectedAnswer === key ? 'var(--glow-cta)' : 'var(--shadow-sm)'
              }}
            >
              <span className="font-semibold mr-3">{key}.</span>
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {selectedAnswer ? `Selected: ${selectedAnswer}` : 'Select an answer to continue'}
        </div>
        
        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer || isSubmitting}
          className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{ 
            background: (selectedAnswer && !isSubmitting)
              ? 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)'
              : 'var(--bg-tertiary)',
            color: (selectedAnswer && !isSubmitting) ? 'var(--bg-primary)' : 'var(--text-muted)',
            boxShadow: (selectedAnswer && !isSubmitting) ? 'var(--glow-cta)' : 'var(--shadow-sm)'
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full animate-spin" 
                style={{ border: '2px solid var(--bg-primary)', borderTop: '2px solid var(--color-cta)' }}></div>
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