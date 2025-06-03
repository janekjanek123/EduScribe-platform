#!/usr/bin/env node

/**
 * Script to manually fix the storage counter for a user
 * This script counts all notes from all tables and updates the user_usage table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Replace with your user ID
const userId = '2753a475-9efd-44bf-bdfe-441fa33adfa6';

async function fixStorageCounter() {
  console.log('🔧 Fixing storage counter for user:', userId);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Count notes from all tables
    console.log('📊 Counting notes from all tables...');
    
    const [videoResult, fileResult, textResult, uploadVideoResult] = await Promise.all([
      supabase
        .from('video_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('file_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('text_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('video_upload_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);

    const videoCount = videoResult.count || 0;
    const fileCount = fileResult.count || 0;
    const textCount = textResult.count || 0;
    const uploadVideoCount = uploadVideoResult.count || 0;
    const totalCount = videoCount + fileCount + textCount + uploadVideoCount;

    console.log('📈 Note counts:');
    console.log(`   Video notes: ${videoCount}`);
    console.log(`   File notes: ${fileCount}`);
    console.log(`   Text notes: ${textCount}`);
    console.log(`   Upload video notes: ${uploadVideoCount}`);
    console.log(`   Total: ${totalCount}`);

    // Update the usage record
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(`📅 Updating usage for month: ${currentMonth}`);

    const { data, error } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        total_saved_notes: totalCount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month_year'
      })
      .select();

    if (error) {
      console.error('❌ Error updating usage:', error);
      console.error('This might be due to RLS policies. Try using the refresh button in the UI instead.');
      process.exit(1);
    }

    console.log('✅ Successfully updated storage counter!');
    console.log(`📊 New saved notes count: ${totalCount}`);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();

    if (!verifyError && verifyData) {
      console.log('🔍 Verification:');
      console.log(`   Stored count: ${verifyData.total_saved_notes}`);
      console.log(`   Last updated: ${verifyData.updated_at}`);
    }

    console.log('\n🎉 Storage counter fixed successfully!');
    console.log('💡 The counter should now show the correct number in the UI.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('💡 Try using the refresh button in the UI instead.');
    process.exit(1);
  }
}

// Run the script
fixStorageCounter(); 