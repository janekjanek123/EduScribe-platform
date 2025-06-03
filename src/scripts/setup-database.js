/**
 * Database setup script for subscription system
 * Run with: node src/scripts/setup-database.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up subscription system database...\n');

  // Read the SQL file
  const sqlFilePath = path.join(__dirname, '..', '..', 'database-subscription-system.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ SQL file not found:', sqlFilePath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('📄 SQL file loaded successfully');

  // Split SQL content into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '\n');

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip empty statements and comments
    if (statement.trim() === ';' || statement.trim().startsWith('--')) {
      continue;
    }

    try {
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase
          .from('_temp_')
          .select('*')
          .limit(0);
        
        // If we can't use RPC, we'll need to run this manually
        console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log('   This is expected for checking non-existent tables');
        }
        errorCount++;
      } else {
        console.log(`✅ Statement ${i + 1}: Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Execution Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}`);

  // Test the setup
  console.log('\n🧪 Testing the setup...');
  
  try {
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .limit(1);

    if (plansError) {
      console.log('❌ subscription_plans table test failed:', plansError.message);
    } else {
      console.log('✅ subscription_plans table is accessible');
    }

    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .limit(1);

    if (usageError) {
      console.log('❌ user_usage table test failed:', usageError.message);
    } else {
      console.log('✅ user_usage table is accessible');
    }
  } catch (err) {
    console.log('❌ Setup test failed:', err.message);
  }

  console.log('\n🎉 Database setup completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: node src/scripts/test-usage-limits.js');
  console.log('   2. Test note generation with limits');
}

// Run the setup
setupDatabase().catch(console.error); 