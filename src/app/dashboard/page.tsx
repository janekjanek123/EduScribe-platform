'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSupabase } from '@/lib/supabase-provider';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UsageCounter from '@/components/UsageCounter';

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
  const { t } = useTranslation();
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
        return '📺'; // YouTube videos
      case 'video-upload':
        return '🎬'; // Uploaded videos
      case 'file':
        return '📄'; // Files (PDFs, PowerPoint, etc.)
      case 'text':
        return '📝'; // Text input
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-800'; // YouTube red
      case 'video-upload':
        return 'bg-purple-100 text-purple-800'; // Purple for uploaded videos
      case 'file':
        return 'bg-blue-100 text-blue-800'; // Blue for files
      case 'text':
        return 'bg-green-100 text-green-800'; // Green for text
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="rounded-2xl p-8" style={{ 
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--bg-tertiary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.loginRequired')}
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                color: 'var(--bg-primary)',
                boxShadow: 'var(--glow-cta)'
              }}
            >
              {t('dashboard.goToHomepage')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
            style={{ border: '4px solid var(--bg-tertiary)', borderTop: '4px solid var(--color-cta)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>{t('dashboard.loadingNotes')}</p>
        </div>
      </div>
    );
  }

  const filteredNotes = getFilteredNotes();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.title')}
              </h1>
              <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: 'var(--color-cta)',
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                {t('dashboard.generateNotes')}
              </button>
            </div>
          </div>
        </div>

        {/* Usage Counter */}
        <div className="mb-8">
          <UsageCounter />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchAllNotes}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              {t('dashboard.tryAgain')}
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'all' ? 'scale-105' : ''
              }`}
              style={{
                background: filter === 'all' ? 'var(--color-cta)' : 'var(--bg-secondary)',
                color: filter === 'all' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: filter === 'all' ? 'var(--glow-cta)' : 'var(--shadow-sm)'
              }}
            >
              {t('dashboard.filters.allNotes')} ({notes.length})
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'video' ? 'scale-105' : ''
              }`}
              style={{
                background: filter === 'video' ? 'var(--color-youtube)' : 'var(--bg-secondary)',
                color: filter === 'video' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: filter === 'video' ? 'var(--glow-youtube)' : 'var(--shadow-sm)'
              }}
            >
              {t('dashboard.filters.videoNotes')} ({notes.filter(n => n.type === 'video').length})
            </button>
            <button
              onClick={() => setFilter('video-upload')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'video-upload' ? 'scale-105' : ''
              }`}
              style={{
                background: filter === 'video-upload' ? 'var(--color-video)' : 'var(--bg-secondary)',
                color: filter === 'video-upload' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: filter === 'video-upload' ? 'var(--glow-video)' : 'var(--shadow-sm)'
              }}
            >
              {t('dashboard.filters.uploadedVideoNotes')} ({notes.filter(n => n.type === 'video-upload').length})
            </button>
            <button
              onClick={() => setFilter('file')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'file' ? 'scale-105' : ''
              }`}
              style={{
                background: filter === 'file' ? 'var(--color-file)' : 'var(--bg-secondary)',
                color: filter === 'file' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: filter === 'file' ? 'var(--glow-file)' : 'var(--shadow-sm)'
              }}
            >
              {t('dashboard.filters.fileNotes')} ({notes.filter(n => n.type === 'file').length})
            </button>
            <button
              onClick={() => setFilter('text')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'text' ? 'scale-105' : ''
              }`}
              style={{
                background: filter === 'text' ? 'var(--color-text)' : 'var(--bg-secondary)',
                color: filter === 'text' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--bg-tertiary)',
                boxShadow: filter === 'text' ? 'var(--glow-text)' : 'var(--shadow-sm)'
              }}
            >
              {t('dashboard.filters.textNotes')} ({notes.filter(n => n.type === 'text').length})
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="rounded-3xl p-12 max-w-md mx-auto" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <div className="text-8xl mb-6 opacity-80">📝</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {filter === 'all' ? t('dashboard.noNotes') : t('dashboard.noNotesInCategory')}
              </h3>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {filter === 'all' ? t('dashboard.createFirstNote') : t('dashboard.tryDifferentFilter')}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => router.push('/')}
                  className="px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-file) 100%)',
                    color: 'var(--bg-primary)',
                    boxShadow: 'var(--glow-cta)',
                    minHeight: '56px'
                  }}
                >
                  {t('dashboard.generateFirstNote')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={`${note.type}-${note.id}`}
                className="rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:translate-y-[-4px]"
                style={{ 
                  background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                  border: '1px solid var(--bg-tertiary)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onClick={() => handleNoteClick(note)}
              >
                {/* Note Type Badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold" style={{
                    background: note.type === 'video' ? 'var(--color-youtube)' :
                                note.type === 'file' ? 'var(--color-file)' :
                                note.type === 'video-upload' ? 'var(--color-video)' :
                                'var(--color-text)',
                    color: 'var(--bg-primary)'
                  }}>
                    <span className="mr-2">{getTypeIcon(note.type)}</span>
                    {t(`dashboard.noteTypes.${note.type}`)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteConfirm(note);
                    }}
                    className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
                    style={{ color: 'var(--text-muted)' }}
                    title={t('dashboard.deleteNote')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Thumbnail for video notes */}
                {note.type === 'video' && note.thumbnail_url && (
                  <div className="mb-4">
                    <img
                      src={note.thumbnail_url}
                      alt={note.title}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Note Title */}
                <h3 className="text-xl font-semibold mb-3 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                  {note.title}
                </h3>

                {/* Note Content Preview */}
                {note.content && (
                  <p className="text-sm mb-4 line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {note.content.substring(0, 150)}...
                  </p>
                )}

                {/* File-specific information */}
                {note.type === 'file' && note.file_name && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">
                      📎 {note.file_name}
                    </p>
                    {note.slide_count && (
                      <p className="text-sm text-gray-500">
                        📊 {t('dashboard.slideCount', { count: note.slide_count })}
                      </p>
                    )}
                  </div>
                )}

                {/* Quiz indicator */}
                {note.quiz && note.quiz.length > 0 && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      🧠 {t('dashboard.quizAvailable', { count: note.quiz.length })}
                    </span>
                  </div>
                )}

                {/* Creation Date */}
                <p className="text-sm text-gray-500">
                  {t('dashboard.createdOn')} {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="rounded-2xl p-8 max-w-md mx-4" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.confirmLogout.title')}
              </h3>
              <p className="mb-8 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.confirmLogout.message')}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {t('dashboard.confirmLogout.cancel')}
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  {t('dashboard.confirmLogout.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="rounded-2xl p-8 max-w-md mx-4" style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--bg-tertiary)',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.deleteConfirm.title')}
              </h3>
              <p className="mb-3 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.deleteConfirm.message')}
              </p>
              <p className="text-lg font-semibold mb-6 p-4 rounded-xl" style={{ 
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-tertiary)'
              }}>
                "{deleteConfirm.noteTitle}"
              </p>
              <p className="text-sm mb-8 p-3 rounded-lg" style={{ 
                color: '#ef4444',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                {t('dashboard.deleteConfirm.warning')}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={closeDeleteConfirm}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {t('dashboard.deleteConfirm.cancel')}
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  {t('dashboard.deleteConfirm.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 