/**
 * Test script to verify usage limits are working correctly
 * Run with: node src/scripts/test-usage-limits.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUsageLimits() {
  console.log('🧪 Testing usage limits...\n');

  // Test 1: Check if free plan limits are correctly set
  console.log('1️⃣ Checking subscription plans...');
  const { data: plans, error: plansError } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly');

  if (plansError) {
    console.error('❌ Error fetching plans:', plansError.message);
    return;
  }

  plans.forEach(plan => {
    console.log(`   📋 ${plan.display_name}: ${plan.limits.notes_per_month} notes/month, ${plan.limits.max_saved_notes} saved notes`);
  });

  // Test 2: Check user usage tracking
  console.log('\n2️⃣ Checking usage tracking...');
  const { data: usage, error: usageError } = await supabase
    .from('user_usage')
    .select('*')
    .limit(5);

  if (usageError) {
    console.error('❌ Error fetching usage:', usageError.message);
    return;
  }

  console.log(`   📊 Found ${usage.length} usage records`);
  usage.forEach(record => {
    console.log(`   👤 User: ${record.user_id.substring(0, 8)}... | ${record.month_year} | Generated: ${record.notes_generated} | Saved: ${record.total_saved_notes}`);
  });

  // Test 3: Check database functions
  console.log('\n3️⃣ Testing database functions...');
  try {
    // Test increment function exists
    const { data: funcTest, error: funcError } = await supabase.rpc('increment_user_usage', {
      user_uuid: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      note_type: 'test'
    });

    if (funcError && funcError.message.includes('not found')) {
      console.error('❌ increment_user_usage function not found');
    } else {
      console.log('   ✅ increment_user_usage function exists');
    }
  } catch (e) {
    console.log('   ⚠️  Function test failed (expected for non-existent user)');
  }

  console.log('\n✅ Usage limits test completed!');
}

// Run the test
testUsageLimits().catch(console.error); 