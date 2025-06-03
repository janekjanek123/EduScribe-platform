import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface TextNote {
  id: string;
  user_id: string;
  raw_text: string;
  content: string;
  created_at: string;
}

interface TextNotesState {
  notes: TextNote[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface UseTextNotesReturn extends TextNotesState {
  createNote: (text: string) => Promise<TextNote | null>;
  refreshNotes: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing text notes in isolation from other note systems
 */
export function useTextNotes(): UseTextNotesReturn {
  const [state, setState] = useState<TextNotesState>({
    notes: [],
    isLoading: false,
    isProcessing: false,
    error: null
  });
  
  const supabase = useSupabaseClient();
  const user = useUser();

  // Fetch text notes when the user changes
  useEffect(() => {
    if (user) {
      refreshNotes();
    }
  }, [user]);

  /**
   * Fetches all text notes for the current user
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
      
      // Fetch text notes from the dedicated API
      const response = await fetch('/api/text-notes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch text notes');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        notes: data.data || [],
        isLoading: false
      }));
    } catch (error: any) {
      console.error('[Text Notes] Error fetching notes:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load text notes'
      }));
    }
  };

  /**
   * Creates a new note from raw text input
   */
  const createNote = async (text: string): Promise<TextNote | null> => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to create notes'
      }));
      return null;
    }
    
    try {
      // Validate text
      if (!text || text.trim().length === 0) {
        throw new Error('Please provide non-empty text content');
      }
      
      // Limit text length
      const MAX_TEXT_LENGTH = 50000;
      if (text.length > MAX_TEXT_LENGTH) {
        throw new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
      }
      
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Send the text to the text notes API
      const response = await fetch('/api/text-notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create text note');
      }
      
      // Update the local state with the new note
      setState(prev => ({
        ...prev,
        notes: [data.data, ...prev.notes],
        isProcessing: false
      }));
      
      return data.data;
    } catch (error: any) {
      console.error('[Text Notes] Error creating note:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to create text note'
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