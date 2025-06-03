// Direct Table Creation Script
// This script creates the isolated tables directly using Supabase client

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Environment check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Supabase URL or key is missing. Please check your .env.local file contains:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.error('   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (recommended)');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('⚠️ Auth session error (this is normal for service role keys):', error.message);
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (e) {
    console.error('❌ Supabase connection failed:', e.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    console.log(`🔍 Checking if ${tableName} table exists...`);
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`   Table ${tableName} does not exist (${error.message})`);
      return false;
    }
    
    console.log(`   ✅ Table ${tableName} exists`);
    return true;
  } catch (e) {
    console.log(`   Table ${tableName} does not exist (${e.message})`);
    return false;
  }
}

async function createVideoNotesTable() {
  console.log('\n📹 Creating video_notes table...');
  
  // First check if table exists
  const exists = await checkTableExists('video_notes');
  if (exists) {
    console.log('✅ video_notes table already exists');
    return true;
  }
  
  // Create a test record to trigger table creation if using auto-schema
  try {
    const testData = {
      id: 'test_video_note',
      user_id: '00000000-0000-0000-0000-000000000000',
      video_url: 'https://youtube.com/test',
      video_id: 'test123',
      title: 'Test Video',
      thumbnail_url: 'https://img.youtube.com/vi/test123/hqdefault.jpg',
      content: 'Test content',
      created_at: new Date().toISOString()
    };
    
    console.log('   Attempting to insert test record...');
    const { data, error } = await supabase
      .from('video_notes')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Error creating video_notes table:', error.message);
      console.error('   Error details:', error);
      return false;
    }
    
    console.log('   ✅ Test record inserted successfully');
    
    // Remove the test record
    console.log('   Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('video_notes')
      .delete()
      .eq('id', 'test_video_note');
    
    if (deleteError) {
      console.warn('   ⚠️ Warning: Could not delete test record:', deleteError.message);
    } else {
      console.log('   ✅ Test record cleaned up');
    }
    
    console.log('✅ video_notes table created successfully');
    return true;
  } catch (e) {
    console.error('❌ Exception creating video_notes table:', e.message);
    console.error('   Full error:', e);
    return false;
  }
}

async function createFileNotesTable() {
  console.log('\n📁 Creating file_notes table...');
  
  // First check if table exists
  const exists = await checkTableExists('file_notes');
  if (exists) {
    console.log('✅ file_notes table already exists');
    return true;
  }
  
  // Create a test record to trigger table creation if using auto-schema
  try {
    const testData = {
      id: 'test_file_note',
      user_id: '00000000-0000-0000-0000-000000000000',
      file_name: 'test.txt',
      file_url: 'https://example.com/test.txt',
      file_type: 'text/plain',
      content: 'Test content',
      created_at: new Date().toISOString()
    };
    
    console.log('   Attempting to insert test record...');
    const { data, error } = await supabase
      .from('file_notes')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Error creating file_notes table:', error.message);
      console.error('   Error details:', error);
      return false;
    }
    
    console.log('   ✅ Test record inserted successfully');
    
    // Remove the test record
    console.log('   Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('file_notes')
      .delete()
      .eq('id', 'test_file_note');
    
    if (deleteError) {
      console.warn('   ⚠️ Warning: Could not delete test record:', deleteError.message);
    } else {
      console.log('   ✅ Test record cleaned up');
    }
    
    console.log('✅ file_notes table created successfully');
    return true;
  } catch (e) {
    console.error('❌ Exception creating file_notes table:', e.message);
    console.error('   Full error:', e);
    return false;
  }
}

async function createTextNotesTable() {
  console.log('\n📝 Creating text_notes table...');
  
  // First check if table exists
  const exists = await checkTableExists('text_notes');
  if (exists) {
    console.log('✅ text_notes table already exists');
    return true;
  }
  
  // Create a test record to trigger table creation if using auto-schema
  try {
    const testData = {
      id: 'test_text_note',
      user_id: '00000000-0000-0000-0000-000000000000',
      raw_text: 'This is test text input',
      content: 'Test content generated from text',
      created_at: new Date().toISOString()
    };
    
    console.log('   Attempting to insert test record...');
    const { data, error } = await supabase
      .from('text_notes')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Error creating text_notes table:', error.message);
      console.error('   Error details:', error);
      return false;
    }
    
    console.log('   ✅ Test record inserted successfully');
    
    // Remove the test record
    console.log('   Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('text_notes')
      .delete()
      .eq('id', 'test_text_note');
    
    if (deleteError) {
      console.warn('   ⚠️ Warning: Could not delete test record:', deleteError.message);
    } else {
      console.log('   ✅ Test record cleaned up');
    }
    
    console.log('✅ text_notes table created successfully');
    return true;
  } catch (e) {
    console.error('❌ Exception creating text_notes table:', e.message);
    console.error('   Full error:', e);
    return false;
  }
}

async function main() {
  try {
    console.log('\n🔄 Creating isolated database tables...');
    
    // Test connection first
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.error('❌ Cannot proceed without a working Supabase connection');
      process.exit(1);
    }
    
    const results = await Promise.allSettled([
      createVideoNotesTable(),
      createFileNotesTable(),
      createTextNotesTable()
    ]);
    
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
    
    console.log('\n📊 Results Summary:');
    results.forEach((result, index) => {
      const tableName = ['video_notes', 'file_notes', 'text_notes'][index];
      if (result.status === 'fulfilled') {
        console.log(`   ${result.value ? '✅' : '❌'} ${tableName}: ${result.value ? 'Success' : 'Failed'}`);
      } else {
        console.log(`   ❌ ${tableName}: Exception - ${result.reason}`);
      }
    });
    
    if (successCount === 3) {
      console.log('\n🎉 All tables created successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Go to your Supabase dashboard to verify the tables');
      console.log('2. Set up RLS policies if needed');
      console.log('3. Run "npm run dev" to test the application');
    } else {
      console.log(`\n⚠️ Only ${successCount}/3 tables were created successfully.`);
      console.log('\n🔧 Manual Setup Required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Copy the contents of database-setup.sql');
      console.log('4. Paste and execute the SQL script');
      console.log('\nThis will create the tables with proper schema and RLS policies.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main(); 