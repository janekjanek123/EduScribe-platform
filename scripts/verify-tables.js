// Verify Tables Script
// This script checks if the isolated tables were created successfully

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or key is missing. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  try {
    console.log(`🔍 Checking ${tableName} table...`);
    
    // Try to select from the table
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ ${tableName}: Table exists and is accessible`);
    return true;
  } catch (e) {
    console.log(`   ❌ ${tableName}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying isolated database tables...\n');
  
  const tables = ['video_notes', 'file_notes', 'text_notes'];
  const results = [];
  
  for (const table of tables) {
    const success = await checkTable(table);
    results.push({ table, success });
  }
  
  console.log('\n📊 Verification Results:');
  const successCount = results.filter(r => r.success).length;
  
  results.forEach(({ table, success }) => {
    console.log(`   ${success ? '✅' : '❌'} ${table}`);
  });
  
  console.log(`\n${successCount}/${tables.length} tables verified successfully.`);
  
  if (successCount === tables.length) {
    console.log('\n🎉 All tables are ready! You can now:');
    console.log('1. Run "npm run dev" to start the application');
    console.log('2. Test each system independently');
    console.log('3. Check the isolated API endpoints work correctly');
  } else {
    console.log('\n⚠️ Some tables are missing. Please:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Copy and paste the contents of create-tables-manual.sql');
    console.log('4. Run the SQL script');
  }
}

main(); 