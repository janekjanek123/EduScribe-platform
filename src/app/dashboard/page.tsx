'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase-provider';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UsageCounter from '@/components/UsageCounter';
import QueueStatus from '@/components/QueueStatus';

interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  created_at: string;
  // Video notes specific
  video_url?: string;
  video_id?: string;
  thumbnail_url?: string;
  // File notes specific
  file_name?: string;
  file_type?: string;
  file_url?: string;
  slide_count?: number; // PowerPoint-specific
  slide_titles?: string[]; // PowerPoint-specific
  // Text notes specific
  raw_text?: string;
  // Quiz information
  quiz?: Array<{
    id: string;
    question: string;
    options: { A: string; B: string; C: string; };
    correctAnswer: 'A' | 'B' | 'C';
    explanation?: string;
  }>;
  // Common fields
  type: 'video' | 'file' | 'text' | 'video-upload';
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, supabase } = useSupabase();
  const { refreshUsage } = useSubscription();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'video' | 'file' | 'text' | 'video-upload'>('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    noteId: string;
    noteTitle: string;
    noteType: 'video' | 'file' | 'text' | 'video-upload';
  }>({
    isOpen: false,
    noteId: '',
    noteTitle: '',
    noteType: 'text'
  });

  useEffect(() => {
    if (user) {
      fetchAllNotes();
    }
  }, [user]);

  const fetchAllNotes = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError('');

      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('[Dashboard] Fetching all notes...');

      // Automatically refresh the saved notes count when dashboard loads
      console.log('[Dashboard] Refreshing saved notes count...');
      try {
        await refreshUsage();
        console.log('[Dashboard] Saved notes count refreshed successfully');
      } catch (refreshError) {
        console.warn('[Dashboard] Failed to refresh saved notes count:', refreshError);
        // Don't fail the whole operation if refresh fails
      }

      // Fetch from all APIs in parallel
      const [videoResponse, fileResponse, textResponse, uploadVideoResponse] = await Promise.all([
        fetch('/api/video-notes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/file-notes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/text-notes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/upload-video', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Process responses
      const allNotes: Note[] = [];

      // Video notes (YouTube)
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        if (videoData.success && videoData.data) {
          const videoNotes = videoData.data.map((note: any) => ({
            ...note,
            type: 'video' as const
          }));
          allNotes.push(...videoNotes);
          console.log(`[Dashboard] Fetched ${videoNotes.length} video notes`);
        }
      } else {
        console.warn('[Dashboard] Failed to fetch video notes:', videoResponse.status);
      }

      // Video upload notes (uploaded files)
      if (uploadVideoResponse.ok) {
        const uploadVideoData = await uploadVideoResponse.json();
        if (uploadVideoData.success && uploadVideoData.data) {
          const uploadVideoNotes = uploadVideoData.data.map((note: any) => ({
            ...note,
            type: 'video-upload' as const,
            // Add display properties for consistency
            video_url: null, // uploaded videos don't have URLs
            video_id: null
          }));
          allNotes.push(...uploadVideoNotes);
          console.log(`[Dashboard] Fetched ${uploadVideoNotes.length} video upload notes`);
        }
      } else {
        console.warn('[Dashboard] Failed to fetch video upload notes:', uploadVideoResponse.status);
      }

      // File notes
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        if (fileData.success && fileData.data) {
          const fileNotes = fileData.data.map((note: any) => ({
            ...note,
            type: 'file' as const
          }));
          allNotes.push(...fileNotes);
          console.log(`[Dashboard] Fetched ${fileNotes.length} file notes`);
        }
      } else {
        console.warn('[Dashboard] Failed to fetch file notes:', fileResponse.status);
      }

      // Text notes
      if (textResponse.ok) {
        const textData = await textResponse.json();
        if (textData.success && textData.data) {
          const textNotes = textData.data.map((note: any) => ({
            ...note,
            type: 'text' as const
          }));
          allNotes.push(...textNotes);
          console.log(`[Dashboard] Fetched ${textNotes.length} text notes`);
        }
      } else {
        console.warn('[Dashboard] Failed to fetch text notes:', textResponse.status);
      }

      // Sort by creation date (newest first)
      allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotes(allNotes);
      console.log(`[Dashboard] Total notes fetched: ${allNotes.length}`);

    } catch (error: any) {
      console.error('[Dashboard] Error fetching notes:', error);
      setError(error.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowLogoutConfirm(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setShowLogoutConfirm(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getFilteredNotes = () => {
    if (filter === 'all') return notes;
    if (filter === 'video') {
      // Include both YouTube video notes and uploaded video notes
      return notes.filter(note => note.type === 'video' || note.type === 'video-upload');
    }
    return notes.filter(note => note.type === filter);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'video-upload':
        return '📹'; // Different icon for uploaded videos
      case 'file':
        return '📄';
      case 'text':
        return '📝';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-800';
      case 'video-upload':
        return 'bg-orange-100 text-orange-800'; // Different color for uploaded videos
      case 'file':
        return 'bg-green-100 text-green-800';
      case 'text':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleNoteClick = (note: Note) => {
    // Navigate to the appropriate note page based on type
    switch (note.type) {
      case 'video':
        router.push(`/video-notes?id=${note.id}`);
        break;
      case 'video-upload':
        // For now, use the same video-notes page for uploaded videos
        // We may want to create a separate page later
        router.push(`/video-notes?id=${note.id}`);
        break;
      case 'file':
        router.push(`/file-notes?id=${note.id}`);
        break;
      case 'text':
        router.push(`/text-notes?id=${note.id}`);
        break;
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteConfirm.noteId || !user) return

    try {
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }

      // Determine the API endpoint based on note type
      let apiEndpoint = ''
      switch (deleteConfirm.noteType) {
        case 'video':
          apiEndpoint = '/api/video-notes'
          break
        case 'video-upload':
          apiEndpoint = '/api/upload-video'
          break
        case 'file':
          apiEndpoint = '/api/file-notes'
          break
        case 'text':
          apiEndpoint = '/api/text-notes'
          break
        default:
          throw new Error('Unknown note type')
      }

      console.log(`[Dashboard] Deleting ${deleteConfirm.noteType} note: ${deleteConfirm.noteId}`)

      const response = await fetch(`${apiEndpoint}?id=${deleteConfirm.noteId}`, {
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

      // Remove the note from the local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== deleteConfirm.noteId))
      
      // Close the confirmation dialog
      setDeleteConfirm({
        isOpen: false,
        noteId: '',
        noteTitle: '',
        noteType: 'text'
      })

      console.log(`[Dashboard] Successfully deleted note: ${deleteConfirm.noteId}`)

      // Automatically refresh the saved notes count after deletion
      console.log('[Dashboard] Refreshing saved notes count after deletion...');
      try {
        await refreshUsage();
        console.log('[Dashboard] Saved notes count refreshed after deletion');
      } catch (refreshError) {
        console.warn('[Dashboard] Failed to refresh saved notes count after deletion:', refreshError);
        // Don't fail the operation if refresh fails
      }

    } catch (err: any) {
      console.error('[Dashboard] Error deleting note:', err)
      setError(err.message || 'Failed to delete note')
    }
  }

  const openDeleteConfirm = (note: Note) => {
    setDeleteConfirm({
      isOpen: true,
      noteId: note.id,
      noteTitle: note.title || 'Untitled Note',
      noteType: note.type
    })
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirm({
      isOpen: false,
      noteId: '',
      noteTitle: '',
      noteType: 'text'
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Please log in to view your dashboard</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const filteredNotes = getFilteredNotes();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Notes Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage all your generated notes in one place</p>
            
            {/* Usage Counter */}
            <div className="mt-3">
              <UsageCounter />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/generate/youtube')}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              + Video Notes
            </button>
            <button
              onClick={() => router.push('/generate/upload')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              + File Notes
            </button>
            <button
              onClick={() => router.push('/generate/text')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Text Notes
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'all', label: 'All Notes', count: notes.length },
                { key: 'video', label: 'Video Notes', count: notes.filter(n => n.type === 'video' || n.type === 'video-upload').length },
                { key: 'file', label: 'File Notes', count: notes.filter(n => n.type === 'file').length },
                { key: 'text', label: 'Text Notes', count: notes.filter(n => n.type === 'text').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-6">
              {filter !== 'all' 
                ? 'No notes match your search criteria.' 
                : 'Start by creating your first note using one of the tools above.'}
            </p>
            {!filter && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => router.push('/generate/youtube')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  + Video Notes
                </button>
                <button
                  onClick={() => router.push('/generate/upload')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  + File Notes
                </button>
                <button
                  onClick={() => router.push('/generate/text')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  + Text Notes
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Queue Status */}
            <div className="mb-6">
              <QueueStatus compact />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      note.type === 'video' || note.type === 'video-upload' ? 'bg-red-100' : 
                      note.type === 'file' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <span className="text-xl">
                        {note.type === 'video' ? '🎥' : 
                         note.type === 'video-upload' ? '📹' : 
                         note.type === 'file' ? '📁' : '📝'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {note.title || 'Untitled Note'}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                            {note.content?.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="capitalize">
                              {note.type === 'video-upload' ? 'Video Upload' : 
                               note.type === 'video' ? 'Video' :
                               note.type === 'file' ? 'File' : 'Text'} Notes
                            </span>
                            <span>•</span>
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            {note.slide_count && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-green-600">
                                  📊 {note.slide_count} slides
                                </span>
                              </>
                            )}
                            {note.quiz && note.quiz.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-blue-600">
                                  📝 {note.quiz.length} quiz questions
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => openDeleteConfirm(note)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete note"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => handleNoteClick(note)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Full Notes →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
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
              Are you sure you want to delete "<strong>{deleteConfirm.noteTitle}</strong>"? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirm}
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out? You'll need to sign in again to access your notes and quizzes.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 