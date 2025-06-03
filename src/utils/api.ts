import { supabase } from '@/lib/supabase';

/**
 * Store the current token in localStorage for fallback use
 * This helps ensure the token is available across all requests
 */
export async function updateStoredToken() {
  try {
    if (typeof window !== 'undefined') {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Store the token in localStorage for fallback
        localStorage.setItem('sb-access-token', session.access_token);
        console.log('[API] Stored access token in localStorage');
      }
    }
  } catch (error) {
    console.error('[API] Error updating stored token:', error);
  }
}

/**
 * Makes an authenticated API request using the current Supabase session
 * Will automatically include the bearer token if a session exists
 */
export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  console.log(`[API] Initiating authenticated fetch to: ${url}`);
  
  // Update stored token first to ensure it's fresh
  await updateStoredToken();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Clone the provided options to avoid modifying the original
  const fetchOptions = { ...options };
  
  // Set up headers with authentication if we have a session
  if (!fetchOptions.headers) {
    fetchOptions.headers = {};
  }
  
  // Add the Authorization header with Bearer token if we have a session
  if (session?.access_token) {
    console.log(`[API] Adding auth token to request (token length: ${session.access_token.length})`);
    (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    console.warn('[API] No token from session, checking localStorage fallback');
    
    // Try to get token from localStorage as fallback
    try {
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : null;
      if (localToken) {
        console.log('[API] Using token from localStorage as fallback');
        (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${localToken}`;
      } else {
        console.error('[API] No authentication token available. User may need to log in again.');
      }
    } catch (e) {
      console.error('[API] Error retrieving token from localStorage:', e);
    }
  }
  
  // Log request details for debugging
  console.log(`[API] Sending ${options.method || 'GET'} request to ${url}`);
  
  try {
    // Make the fetch request with the modified options
    const response = await fetch(url, fetchOptions);
    
    console.log(`[API] Received response: ${response.status} ${response.statusText}`);
    
    return response;
  } catch (error) {
    console.error(`[API] Network error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * JSON-specific version of fetchWithAuth that handles JSON parsing
 */
export async function fetchJsonWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Ensure we have headers and JSON content type
  const fetchOptions = { 
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  
  // Add credentials to ensure cookies are sent
  fetchOptions.credentials = 'include';
  
  try {
    const response = await fetchWithAuth(url, fetchOptions);
    
    // Check if the request was successful
    if (!response.ok) {
      // Clone the response before trying to read it
      const clonedResponse = response.clone();
      
      // Handle specific error codes
      if (response.status === 404) {
        console.error(`[API] Endpoint not found (404): ${url}`);
        throw new Error(`API error: 404 - Endpoint not found: ${url}`);
      }
      
      if (response.status === 401 || response.status === 403) {
        console.error(`[API] Authentication error (${response.status}): ${url}`);
        throw new Error(`API error: ${response.status} - Authentication required`);
      }
      
      // Special handling for 422 - typically means content processing issue
      if (response.status === 422) {
        try {
          const errorData = await clonedResponse.json();
          console.error(`[API] Content processing error (422): ${url}`, errorData);
          
          // Extract the error message from the response
          const errorMessage = errorData.message || errorData.error || `This content cannot be processed`;
          throw new Error(errorMessage);
        } catch (parseError) {
          throw new Error(`This YouTube video does not have an available transcript or captions.`);
        }
      }
      
      // Parse error response if possible
      try {
        const errorData = await clonedResponse.json();
        console.error(`[API] Error response from ${url} (${response.status}):`, errorData);
        
        // Extract the error message from the response
        const errorMessage = errorData.message || errorData.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      } catch (parseError) {
        // If JSON parsing fails, use a generic error message
        console.error(`[API] Could not parse error response:`, parseError);
        throw new Error(`API error: ${response.status}`);
      }
    }
    
    // Parse successful response
    try {
      const data = await response.json();
      return data;
    } catch (e) {
      console.error(`[API] Error parsing JSON response:`, e);
      throw new Error('Invalid JSON response from API');
    }
  } catch (error) {
    console.error(`[API] Error in fetchJsonWithAuth for ${url}:`, error);
    throw error;
  }
} 