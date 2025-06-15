'use client'

import { useState, useEffect, Suspense } from 'react'
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
  file_name?: string;
  file_type?: string;
  file_url?: string;
  quiz?: QuizQuestion[];
  created_at: string;
  user_id: string;
  // PowerPoint-specific fields
  slide_count?: number;
  slide_titles?: string[];
}

function FileNotesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const noteId = searchParams?.get('id')
  
  const { user, supabase } = useSupabase()
  const { canUseQuizzes } = useSubscription()
  const [notesData, setNotesData] = useState<NotesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFullNotes, setShowFullNotes] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

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

        console.log(`[FileNotesPage] Fetching note with ID: ${noteId}`)

        // Fetch the note directly from the file-notes API
        const response = await fetch('/api/file-notes', {
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

        console.log('[FileNotesPage] Note found:', note)
        setNotesData(note)

      } catch (err: any) {
        console.error('[FileNotesPage] Error fetching note:', err)
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
      setIsDeleting(true)
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }

      console.log(`[FileNotesPage] Deleting note with ID: ${noteId}`)

      const response = await fetch(`/api/file-notes?id=${noteId}`, {
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

      console.log(`[FileNotesPage] Successfully deleted note: ${noteId}`)
      
      // Redirect to dashboard after successful deletion
      router.push('/dashboard')

    } catch (err: any) {
      console.error('[FileNotesPage] Error deleting note:', err)
      setError(err.message || 'Failed to delete note')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="rounded-2xl p-8 max-w-md mx-auto" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div className="text-6xl mb-6 opacity-80">🔐</div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Access Required</h2>
            <p className="text-lg mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Please log in to view your file notes
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                color: 'var(--bg-primary)',
                boxShadow: 'var(--glow-cta)'
              }}
            >
              Go to Login
            </button>
          </div>
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
              <div className="w-20 h-20 rounded-full animate-spin mx-auto mb-6" 
                style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-file)' }}></div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Loading your file notes...</h2>
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
            <div className="rounded-2xl p-8 text-center" style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div className="text-6xl mb-6 opacity-80">⚠️</div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#ef4444' }}>Something went wrong</h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                    color: 'var(--bg-primary)',
                    boxShadow: 'var(--glow-cta)'
                  }}
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    boxShadow: 'var(--shadow-sm)'
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
            <div className="text-center py-16">
              <div className="rounded-2xl p-8 max-w-md mx-auto" style={{ 
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-xl)'
              }}>
                <div className="text-6xl mb-6 opacity-80">📄</div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Note not found</h2>
                <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  The requested file note could not be found
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                    color: 'var(--bg-primary)',
                    boxShadow: 'var(--glow-cta)'
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄'
    
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('word') || fileType.includes('doc')) return '📘'
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊'
    if (fileType.includes('text') || fileType.includes('txt')) return '📝'
    if (fileType.includes('image')) return '🖼️'
    return '📄'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getFileIcon(notesData.file_type)}</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {notesData.title || 'File Notes'} – {new Date(notesData.created_at).toLocaleDateString()}
                </h1>
                {notesData.file_name && (
                  <p className="text-sm text-gray-600 mb-1">
                    📎 Original file: {notesData.file_name}
                  </p>
                )}
                {notesData.file_type && (
                  <p className="text-sm text-gray-600 mb-1">
                    🏷️ File type: {notesData.file_type}
                  </p>
                )}
                {notesData.slide_count && (
                  <p className="text-sm text-gray-600 mb-1">
                    📊 Slides: {notesData.slide_count}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Created: {new Date(notesData.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col justify-end">
                <ExportToNotatnikButton
                  noteId={notesData.id}
                  noteType="file"
                  noteTitle={notesData.title || 'File Notes'}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>📄 Notes</h2>
              <div className="note-view-toggle">
                <button
                  onClick={() => setShowFullNotes(false)}
                  className={!showFullNotes ? 'active' : ''}
                >
                  Summary
                </button>
                <button
                  onClick={() => setShowFullNotes(true)}
                  className={showFullNotes ? 'active' : ''}
                >
                  Full Notes
                </button>
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

          {/* File Download (if available) */}
          {notesData.file_url ? (
            <div className="rounded-2xl p-6 mb-6" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Original File</h2>
              <a 
                href={notesData.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-file) 0%, var(--color-cta) 100%)',
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--glow-file)'
                }}
              >
                📥 Download Original File
              </a>
            </div>
          ) : (
            <div className="rounded-2xl p-6 mb-6" style={{ 
              background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 165, 0, 0.05))',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              boxShadow: '0 0 20px rgba(255, 165, 0, 0.1)'
            }}>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-video)' }}>File Storage Notice</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                The original file is not available for download. The file content was processed to generate notes, 
                but file storage is not currently configured.
              </p>
            </div>
          )}

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
                  noteType="file"
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
          <div className="rounded-2xl p-6 mb-6" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                📋 View All Notes
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ 
            background: 'rgba(31, 34, 53, 0.9)',
            backdropFilter: 'blur(5px)'
          }}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Delete Note</h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNote}
                disabled={isDeleting}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  background: isDeleting 
                    ? 'var(--bg-tertiary)' 
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: isDeleting ? 'var(--text-muted)' : 'white',
                  boxShadow: isDeleting ? 'var(--shadow-sm)' : '0 0 20px rgba(239, 68, 68, 0.3)'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FileNotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
            style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-file)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading file notes...</p>
        </div>
      </div>
    }>
      <FileNotesPageContent />
    </Suspense>
  )
} 