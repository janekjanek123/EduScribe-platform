import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface VideoNote {
  id: string;
  user_id: string;
  video_url: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  content: string;
  created_at: string;
}

interface VideoNotesState {
  notes: VideoNote[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface UseVideoNotesReturn extends VideoNotesState {
  createNote: (url: string) => Promise<VideoNote | null>;
  refreshNotes: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing video notes in isolation from other note systems
 */
export function useVideoNotes(): UseVideoNotesReturn {
  const [state, setState] = useState<VideoNotesState>({
    notes: [],
    isLoading: false,
    isProcessing: false,
    error: null
  });
  
  const supabase = useSupabaseClient();
  const user = useUser();

  // Fetch video notes when the user changes
  useEffect(() => {
    if (user) {
      refreshNotes();
    }
  }, [user]);

  /**
   * Fetches all video notes for the current user
   */
  const refreshNotes = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Fetch video notes from the dedicated API
      const response = await fetch('/api/video-notes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch video notes');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        notes: data.data || [],
        isLoading: false
      }));
    } catch (error: any) {
      console.error('[Video Notes] Error fetching notes:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load video notes'
      }));
    }
  };

  /**
   * Creates a new video note from a YouTube URL
   */
  const createNote = async (url: string): Promise<VideoNote | null> => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to create notes'
      }));
      return null;
    }
    
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Send the URL to the video notes API
      const response = await fetch('/api/video-notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create video note');
      }
      
      // Update the local state with the new note
      setState(prev => ({
        ...prev,
        notes: [data.data, ...prev.notes],
        isProcessing: false
      }));
      
      return data.data;
    } catch (error: any) {
      console.error('[Video Notes] Error creating note:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to create video note'
      }));
      return null;
    }
  };

  /**
   * Clears any error message
   */
  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    createNote,
    refreshNotes,
    clearError
  };
} 