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
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Please log in to view notes</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="w-16 h-16 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900">Loading your file notes...</h2>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
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
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Note not found</h2>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Generated Notes</h2>
              <div className="flex items-center gap-3">
                {notesData.summary && (
                  <div className="note-view-toggle">
                    <button
                      onClick={() => setShowFullNotes(true)}
                      className={showFullNotes ? 'active' : ''}
                    >
                      📖 View Full Notes
                    </button>
                    <button
                      onClick={() => setShowFullNotes(false)}
                      className={!showFullNotes ? 'active' : ''}
                    >
                      📝 View Summary
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose max-w-none">
              {showFullNotes ? (
                <ReactMarkdown>{notesData.content}</ReactMarkdown>
              ) : (
                <div className="summary-section">
                  <h3>📝 Summary Version</h3>
                  <ReactMarkdown>{notesData.summary || 'Summary not available.'}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* File Download (if available) */}
          {notesData.file_url ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Original File</h2>
              <a 
                href={notesData.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                📥 Download Original File
              </a>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">File Storage Notice</h2>
              <p className="text-yellow-700">
                The original file is not available for download. The file content was processed to generate notes, 
                but file storage is not currently configured.
              </p>
            </div>
          )}

          {/* Quiz */}
          {notesData.quiz && notesData.quiz.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Test Your Knowledge</h2>
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
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              ← Back to Dashboard
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Note
              </button>
              <button
                onClick={() => router.push('/generate/upload')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Generate More Notes →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Note</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{notesData?.title}</strong>"? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNote}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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

export default function FileNotesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileNotesPageContent />
    </Suspense>
  )
} 