'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { useSupabase } from '@/lib/supabase-provider'
import { useSubscription } from '@/contexts/SubscriptionContext'
import Quiz, { QuizQuestion } from '@/components/Quiz'
import BlurredQuiz from '@/components/BlurredQuiz'
import ExportToNotatnikButton from '@/components/ExportToNotatnikButton'

// Types
interface NotesData {
  id: string;
  title: string;
  content: string;
  summary?: string;
  raw_text?: string;
  quiz?: QuizQuestion[];
  created_at: string;
  user_id: string;
}

function TextNotesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const noteId = searchParams?.get('id')
  
  const { user, supabase } = useSupabase()
  const [notesData, setNotesData] = useState<NotesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { canUseQuizzes } = useSubscription()
  const [showFullNotes, setShowFullNotes] = useState(true)

  useEffect(() => {
    if (!noteId) {
      setError('No note ID provided')
      setIsLoading(false)
      return
    }

    if (!user) {
      setError('Please log in to view notes')
      setIsLoading(false)
      return
    }

    const fetchNote = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Get the access token for API calls
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('No authentication token available')
        }

        console.log(`[TextNotesPage] Fetching note with ID: ${noteId}`)

        // Fetch the note directly from the text-notes API
        const response = await fetch('/api/text-notes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch notes')
        }

        const data = await response.json()
        
        if (!data.success || !data.data) {
          throw new Error('No notes data received')
        }

        // Find the specific note by ID
        const note = data.data.find((n: any) => n.id === noteId)
        
        if (!note) {
          throw new Error('Note not found')
        }

        console.log('[TextNotesPage] Note found:', note)
        setNotesData(note)

      } catch (err: any) {
        console.error('[TextNotesPage] Error fetching note:', err)
        setError(err.message || 'Failed to load note')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNote()
  }, [noteId, user, supabase])

  const handleDeleteNote = async () => {
    if (!noteId || !user) return

    try {
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }

      console.log(`[TextNotesPage] Deleting note with ID: ${noteId}`)

      const response = await fetch(`/api/text-notes?id=${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete note')
      }

      console.log(`[TextNotesPage] Successfully deleted note: ${noteId}`)
      
      // Redirect to dashboard after successful deletion
      router.push('/dashboard')

    } catch (err: any) {
      console.error('[TextNotesPage] Error deleting note:', err)
      setError(err.message || 'Failed to delete note')
      setShowDeleteConfirm(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center p-8 rounded-2xl" style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--bg-tertiary)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Please log in to view notes</h2>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            style={{ 
              background: 'var(--color-cta)',
              color: 'var(--bg-primary)',
              boxShadow: 'var(--glow-cta)'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full animate-spin mx-auto mb-6" 
                style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-text)' }}></div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Loading your text notes...</h2>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 text-center rounded-2xl" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '2px solid #ef4444',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
            }}>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#ef4444' }}>Error</h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'var(--color-cta)',
                    color: 'var(--bg-primary)',
                    boxShadow: 'var(--glow-cta)'
                  }}
                >
                  Back to Dashboard
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--bg-tertiary)'
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!notesData) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Note not found</h2>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'var(--color-cta)',
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--glow-cta)'
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="rounded-2xl p-6 mb-6" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ 
                background: 'linear-gradient(135deg, var(--color-text) 0%, var(--color-file) 100%)',
                boxShadow: 'var(--glow-text)'
              }}>
                <span className="text-2xl">📝</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {notesData.title || 'Text Notes'} – {new Date(notesData.created_at).toLocaleDateString()}
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Created: {new Date(notesData.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col justify-end">
                <ExportToNotatnikButton
                  noteId={notesData.id}
                  noteType="text"
                  noteTitle={notesData.title || 'Text Notes'}
                  noteContent={showFullNotes ? notesData.content : (notesData.summary || notesData.content)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notes Content */}
          <div className="rounded-2xl p-6 mb-6" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Generated Notes</h2>
              <div className="flex items-center gap-3">
                {notesData.summary && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFullNotes(true)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${showFullNotes ? 'transform scale-105' : ''}`}
                      style={{
                        background: showFullNotes ? 'var(--color-cta)' : 'var(--bg-tertiary)',
                        color: showFullNotes ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        boxShadow: showFullNotes ? 'var(--glow-cta)' : 'none'
                      }}
                    >
                      📖 View Full Notes
                    </button>
                    <button
                      onClick={() => setShowFullNotes(false)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${!showFullNotes ? 'transform scale-105' : ''}`}
                      style={{
                        background: !showFullNotes ? 'var(--color-cta)' : 'var(--bg-tertiary)',
                        color: !showFullNotes ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        boxShadow: !showFullNotes ? 'var(--glow-cta)' : 'none'
                      }}
                    >
                      📝 View Summary
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose max-w-none prose-invert" style={{ color: 'var(--text-secondary)' }}>
              {showFullNotes ? (
                <ReactMarkdown>{notesData.content}</ReactMarkdown>
              ) : (
                <div className="summary-section">
                  <h3 style={{ color: 'var(--text-primary)' }}>📝 Summary Version</h3>
                  <ReactMarkdown>{notesData.summary || 'Summary not available.'}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* Quiz */}
          {notesData.quiz && notesData.quiz.length > 0 && (
            <div className="rounded-2xl p-6 mb-6" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>📝 Test Your Knowledge</h2>
              {canUseQuizzes ? (
                <Quiz 
                  questions={notesData.quiz} 
                  noteId={notesData.id}
                  noteType="text"
                  onComplete={(score, total) => {
                    console.log(`Quiz completed: ${score}% (${score * total / 100}/${total})`);
                  }}
                />
              ) : (
                <BlurredQuiz questionCount={notesData.quiz.length} />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              style={{ 
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              ← Back to Dashboard
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Note
              </button>
              <button
                onClick={() => router.push('/generate/text')}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'var(--color-cta)',
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--glow-cta)'
                }}
              >
                Generate More Notes →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
              }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Delete Note</h3>
            </div>
            
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete "<strong style={{ color: 'var(--text-primary)' }}>{notesData?.title}</strong>"? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--bg-tertiary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNote}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                }}
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TextNotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
            style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-text)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading text notes...</p>
        </div>
      </div>
    }>
      <TextNotesPageContent />
    </Suspense>
  )
} 