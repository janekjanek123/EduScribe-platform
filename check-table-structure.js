const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure(tableName) {
  console.log(`\n🔍 Checking ${tableName} table structure...`);
  
  try {
    // Get table information from information_schema
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.error(`❌ Error checking ${tableName}:`, error.message);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.error(`❌ Table ${tableName} not found or has no columns`);
      return null;
    }
    
    console.log(`✅ ${tableName} table found with ${data.length} columns:`);
    data.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });
    
    return data;
  } catch (err) {
    console.error(`❌ Exception checking ${tableName}:`, err.message);
    return null;
  }
}

async function addMissingColumns() {
  console.log('\n🔧 Adding missing columns...');
  
  const alterQueries = [];
  
  // Check video_notes table and add missing columns
  console.log('\n📋 Checking video_notes required columns...');
  const videoNotesColumns = await checkTableStructure('video_notes');
  if (videoNotesColumns) {
    const columnNames = videoNotesColumns.map(col => col.column_name);
    
    if (!columnNames.includes('title')) {
      alterQueries.push('ALTER TABLE video_notes ADD COLUMN title TEXT;');
      console.log('   + Adding title column to video_notes');
    }
    if (!columnNames.includes('thumbnail_url')) {
      alterQueries.push('ALTER TABLE video_notes ADD COLUMN thumbnail_url TEXT;');
      console.log('   + Adding thumbnail_url column to video_notes');
    }
    if (!columnNames.includes('video_id')) {
      alterQueries.push('ALTER TABLE video_notes ADD COLUMN video_id TEXT;');
      console.log('   + Adding video_id column to video_notes');
    }
    if (!columnNames.includes('video_url')) {
      alterQueries.push('ALTER TABLE video_notes ADD COLUMN video_url TEXT;');
      console.log('   + Adding video_url column to video_notes');
    }
  }
  
  // Check file_notes table and add missing columns
  console.log('\n📋 Checking file_notes required columns...');
  const fileNotesColumns = await checkTableStructure('file_notes');
  if (fileNotesColumns) {
    const columnNames = fileNotesColumns.map(col => col.column_name);
    
    if (!columnNames.includes('file_name')) {
      alterQueries.push('ALTER TABLE file_notes ADD COLUMN file_name TEXT;');
      console.log('   + Adding file_name column to file_notes');
    }
    if (!columnNames.includes('file_type')) {
      alterQueries.push('ALTER TABLE file_notes ADD COLUMN file_type TEXT;');
      console.log('   + Adding file_type column to file_notes');
    }
    if (!columnNames.includes('file_url')) {
      alterQueries.push('ALTER TABLE file_notes ADD COLUMN file_url TEXT;');
      console.log('   + Adding file_url column to file_notes');
    }
  }
  
  // Check text_notes table
  console.log('\n📋 Checking text_notes required columns...');
  const textNotesColumns = await checkTableStructure('text_notes');
  if (textNotesColumns) {
    const columnNames = textNotesColumns.map(col => col.column_name);
    
    if (!columnNames.includes('raw_text')) {
      alterQueries.push('ALTER TABLE text_notes ADD COLUMN raw_text TEXT;');
      console.log('   + Adding raw_text column to text_notes');
    }
  }
  
  // Execute the ALTER queries
  if (alterQueries.length > 0) {
    console.log(`\n🔧 Executing ${alterQueries.length} ALTER TABLE queries...`);
    
    for (const query of alterQueries) {
      try {
        console.log(`   Executing: ${query}`);
        const { error } = await supabase.rpc('sql', { query });
        if (error) {
          console.error(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Success`);
        }
      } catch (err) {
        console.error(`   ❌ Exception: ${err.message}`);
      }
    }
  } else {
    console.log('   ✅ No missing columns found');
  }
}

async function main() {
  console.log('🔍 TABLE STRUCTURE CHECKER');
  console.log('==========================');
  
  try {
    // Check current table structures
    await checkTableStructure('video_notes');
    await checkTableStructure('file_notes');
    await checkTableStructure('text_notes');
    
    // Add missing columns
    await addMissingColumns();
    
    console.log('\n✅ Table structure check complete!');
    console.log('Run the diagnosis again to verify all issues are resolved.');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
  }
}

main().catch(console.error); 