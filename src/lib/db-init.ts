import { supabase } from './supabase';
import { ensureAllNotesTablesExist, ensureTextNotesTableExists, ensureFileNotesTableExists, ensureYoutubeNotesTableExists } from './db-utils';

/**
 * Initializes the database tables for the application
 */
export async function initializeDatabase() {
  console.log('[DB] Initializing database tables...');
  
  try {
    // Ensure all three tables exist
    const result = await ensureAllNotesTablesExist(supabase);
    
    if (result) {
      console.log('[DB] All database tables initialized successfully');
      return true;
    } else {
      console.error('[DB] Failed to initialize all database tables');
      
      // Try to initialize each table individually
      console.log('[DB] Attempting to initialize tables individually');
      
      const textResult = await ensureTextNotesTableExists(supabase);
      console.log('[DB] Text notes table initialization:', textResult ? 'success' : 'failed');
      
      const fileResult = await ensureFileNotesTableExists(supabase);
      console.log('[DB] File notes table initialization:', fileResult ? 'success' : 'failed');
      
      const youtubeResult = await ensureYoutubeNotesTableExists(supabase);
      console.log('[DB] YouTube notes table initialization:', youtubeResult ? 'success' : 'failed');
      
      // Return true if at least one table was initialized
      return textResult || fileResult || youtubeResult;
    }
  } catch (error) {
    console.error('[DB] Error initializing database:', error);
    return false;
  }
} 