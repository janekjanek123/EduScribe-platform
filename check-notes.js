#!/usr/bin/env node

/**
 * Script to check what notes exist in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkNotes() {
  console.log('🔍 Checking notes in database...');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check each table
    const tables = ['video_notes', 'file_notes', 'text_notes', 'video_upload_notes'];
    
    for (const table of tables) {
      console.log(`\n📊 Checking ${table}:`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('id, user_id, title, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        continue;
      }

      console.log(`   📈 Total count: ${count || 0}`);
      
      if (data && data.length > 0) {
        console.log('   📝 Recent notes:');
        data.forEach((note, index) => {
          console.log(`     ${index + 1}. ${note.title || 'Untitled'} (${note.user_id}) - ${note.created_at}`);
        });
      } else {
        console.log('   📭 No notes found');
      }
    }

    // Check user_usage table
    console.log('\n📊 Checking user_usage:');
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (usageError) {
      console.log(`   ❌ Error: ${usageError.message}`);
    } else if (usageData && usageData.length > 0) {
      console.log('   📈 Recent usage records:');
      usageData.forEach((usage, index) => {
        console.log(`     ${index + 1}. User: ${usage.user_id}, Month: ${usage.month_year}, Saved: ${usage.total_saved_notes}, Generated: ${usage.notes_generated}`);
      });
    } else {
      console.log('   📭 No usage records found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
checkNotes(); 