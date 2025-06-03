/**
 * Create default free subscription for a specific user
 * Run with: node src/scripts/create-specific-user-subscription.js USER_ID
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY)');
  process.exit(1);
}

// Get user ID from command line args
const userId = process.argv[2];
if (!userId) {
  console.error('❌ Please provide a user ID');
  console.error('Usage: node src/scripts/create-specific-user-subscription.js USER_ID');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createUserSubscription() {
  console.log(`🚀 Creating subscription for user: ${userId}\n`);

  try {
    // Check if user already has a subscription
    console.log('1️⃣ Checking existing subscription...');
    const { data: existingSub, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing subscription:', checkError.message);
      return;
    }

    if (existingSub) {
      console.log('✅ User already has a subscription:');
      console.log(`   Plan ID: ${existingSub.plan_id}`);
      console.log(`   Status: ${existingSub.status}`);
      console.log(`   Billing: ${existingSub.billing_cycle}`);
      return;
    }

    // Create free subscription
    console.log('2️⃣ Creating free subscription...');
    const { data: newSub, error: createError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: 'free',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Error creating subscription: ${createError.message}`);
      console.error('Details:', createError);
      return;
    }

    console.log('✅ Created subscription successfully!');
    console.log(`   Subscription ID: ${newSub.subscription_id}`);

    // Create usage record for current month
    console.log('3️⃣ Creating usage record...');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { error: usageError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        notes_generated: 0,
        video_notes_count: 0,
        file_notes_count: 0,
        text_notes_count: 0,
        total_saved_notes: 0
      }, {
        onConflict: 'user_id,month_year',
        ignoreDuplicates: true
      });

    if (usageError) {
      console.error(`❌ Error creating usage record: ${usageError.message}`);
    } else {
      console.log('✅ Created usage record successfully!');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your Next.js dev server');
    console.log('   2. Try generating a note');
    console.log('   3. The subscription limits should now work properly');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
createUserSubscription().catch(console.error); 