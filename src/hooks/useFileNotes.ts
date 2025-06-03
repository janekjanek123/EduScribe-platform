import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface FileNote {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  content: string;
  created_at: string;
}

interface FileNotesState {
  notes: FileNote[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  progress: number | null;
}

interface UseFileNotesReturn extends FileNotesState {
  uploadFile: (file: File) => Promise<FileNote | null>;
  refreshNotes: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing file notes in isolation from other note systems
 */
export function useFileNotes(): UseFileNotesReturn {
  const [state, setState] = useState<FileNotesState>({
    notes: [],
    isLoading: false,
    isProcessing: false,
    error: null,
    progress: null
  });
  
  const supabase = useSupabaseClient();
  const user = useUser();

  // Fetch file notes when the user changes
  useEffect(() => {
    if (user) {
      refreshNotes();
    }
  }, [user]);

  /**
   * Fetches all file notes for the current user
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
      
      // Fetch file notes from the dedicated API
      const response = await fetch('/api/file-notes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch file notes');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        notes: data.data || [],
        isLoading: false
      }));
    } catch (error: any) {
      console.error('[File Notes] Error fetching notes:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load file notes'
      }));
    }
  };

  /**
   * Uploads a file and generates notes from its content
   */
  const uploadFile = async (file: File): Promise<FileNote | null> => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to upload files'
      }));
      return null;
    }
    
    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null,
        progress: 0 
      }));
      
      // Get the access token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Validate file
      if (file.size > 20 * 1024 * 1024) { // 20MB
        throw new Error('File size exceeds the 20MB limit');
      }
      
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/markdown',
        'text/csv',
        // PowerPoint support
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
        'application/vnd.ms-powerpoint' // ppt
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Unsupported file type. Please upload PDF, TXT, DOC, DOCX, MD, CSV, PPT, or PPTX files.');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Update progress as the upload proceeds
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setState(prev => ({ ...prev, progress }));
        }
      });
      
      // Wrap XHR in a promise
      const uploadPromise = new Promise<FileNote>((resolve, reject) => {
        xhr.open('POST', '/api/file-notes');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.success && data.data) {
                resolve(data.data);
              } else {
                reject(new Error(data.message || 'Failed to process file'));
              }
            } catch (parseError) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`));
            } catch (parseError) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during file upload'));
        };
        
        xhr.send(formData);
      });
      
      // Wait for upload and processing to complete
      const fileNote = await uploadPromise;
      
      // Update the local state with the new note
      setState(prev => ({
        ...prev,
        notes: [fileNote, ...prev.notes],
        isProcessing: false,
        progress: null
      }));
      
      return fileNote;
    } catch (error: any) {
      console.error('[File Notes] Error uploading file:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: null,
        error: error.message || 'Failed to upload and process file'
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
    uploadFile,
    refreshNotes,
    clearError
  };
} 