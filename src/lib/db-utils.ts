import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ensures all notes tables exist in the database
 * @param client Supabase client to use for database operations
 */
export async function ensureAllNotesTablesExist(client: SupabaseClient) {
  try {
    console.log('[DB] Checking if notes tables exist...');
    
    // Ensure all three tables exist
    const textTableExists = await ensureTextNotesTableExists(client);
    const fileTableExists = await ensureFileNotesTableExists(client);
    const youtubeTableExists = await ensureYoutubeNotesTableExists(client);
    
    return textTableExists && fileTableExists && youtubeTableExists;
  } catch (error) {
    console.error('[DB] Error checking/creating notes tables:', error);
    return false;
  }
}

/**
 * Ensures the text_notes table exists in the database
 * @param client Supabase client to use for database operations
 */
export async function ensureTextNotesTableExists(client: SupabaseClient) {
  try {
    console.log('[DB] Checking if text_notes table exists...');
    
    // Check if the table exists
    const { error: checkError } = await client
      .from('text_notes')
      .select('*', { count: 'exact', head: true })
      .limit(0);
      
    if (checkError) {
      // Table likely doesn't exist, create it
      console.log('[DB] Text_notes table does not exist, creating it...');

      try {
        // First try using RPC if available
        console.log('[DB] Attempting to create table via RPC...');
        const { error: rpcError } = await client.rpc('create_text_notes_table', {});
        
        if (rpcError) {
          console.error('[DB] Error creating text_notes table via RPC:', rpcError);
          throw new Error('RPC failed, trying SQL approach');
        }
        
        console.log('[DB] Table created successfully via RPC');
        return true;
      } catch (rpcError) {
        console.error('[DB] Error creating text_notes table:', rpcError);
        return false;
      }
    }
    
    // Table exists
    console.log('[DB] Text_notes table already exists');
    return true;
  } catch (error) {
    console.error('[DB] Error checking/creating text_notes table:', error);
    return false;
  }
}

/**
 * Ensures the file_notes table exists in the database
 * @param client Supabase client to use for database operations
 */
export async function ensureFileNotesTableExists(client: SupabaseClient) {
  try {
    console.log('[DB] Checking if file_notes table exists...');
    
    // Check if the table exists
    const { error: checkError } = await client
      .from('file_notes')
      .select('*', { count: 'exact', head: true })
      .limit(0);
      
    if (checkError) {
      // Table likely doesn't exist, create it
      console.log('[DB] File_notes table does not exist, creating it...');

      try {
        // First try using RPC if available
        console.log('[DB] Attempting to create table via RPC...');
        const { error: rpcError } = await client.rpc('create_file_notes_table', {});
        
        if (rpcError) {
          console.error('[DB] Error creating file_notes table via RPC:', rpcError);
          throw new Error('RPC failed, trying SQL approach');
        }
        
        console.log('[DB] Table created successfully via RPC');
        return true;
      } catch (rpcError) {
        console.error('[DB] Error creating file_notes table:', rpcError);
        return false;
      }
    }
    
    // Table exists
    console.log('[DB] File_notes table already exists');
    return true;
  } catch (error) {
    console.error('[DB] Error checking/creating file_notes table:', error);
    return false;
  }
}

/**
 * Ensures the youtube_notes table exists in the database
 * @param client Supabase client to use for database operations
 */
export async function ensureYoutubeNotesTableExists(client: SupabaseClient) {
  try {
    console.log('[DB] Checking if youtube_notes table exists...');
    
    // Check if the table exists
    const { error: checkError } = await client
      .from('youtube_notes')
      .select('*', { count: 'exact', head: true })
      .limit(0);
      
    if (checkError) {
      // Table likely doesn't exist, create it
      console.log('[DB] Youtube_notes table does not exist, creating it...');

      try {
        // First try using RPC if available
        console.log('[DB] Attempting to create table via RPC...');
        const { error: rpcError } = await client.rpc('create_youtube_notes_table', {});
        
        if (rpcError) {
          console.error('[DB] Error creating youtube_notes table via RPC:', rpcError);
          throw new Error('RPC failed, trying SQL approach');
        }
        
        console.log('[DB] Table created successfully via RPC');
        return true;
      } catch (rpcError) {
        console.error('[DB] Error creating youtube_notes table:', rpcError);
        return false;
      }
    }
    
    // Table exists
    console.log('[DB] Youtube_notes table already exists');
    return true;
  } catch (error) {
    console.error('[DB] Error checking/creating youtube_notes table:', error);
    return false;
  }
} 