/**
 * Create default free subscription for user
 * Run with: node src/scripts/create-user-subscription.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUserSubscription() {
  console.log('🚀 Creating user subscription...\n');

  // Get all users who don't have subscriptions
  console.log('1️⃣ Finding users without subscriptions...');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    return;
  }

  console.log(`   Found ${users.users.length} total users`);

  // Check existing subscriptions
  const { data: existingSubs, error: subsError } = await supabase
    .from('user_subscriptions')
    .select('user_id');

  if (subsError) {
    console.error('❌ Error checking existing subscriptions:', subsError.message);
    return;
  }

  const existingUserIds = new Set(existingSubs?.map(sub => sub.user_id) || []);
  const usersWithoutSubs = users.users.filter(user => !existingUserIds.has(user.id));

  console.log(`   Found ${usersWithoutSubs.length} users without subscriptions`);

  if (usersWithoutSubs.length === 0) {
    console.log('✅ All users already have subscriptions!');
    return;
  }

  // Create free subscriptions for users without them
  console.log('\n2️⃣ Creating free subscriptions...');
  
  for (const user of usersWithoutSubs) {
    console.log(`   Creating subscription for user: ${user.id.substring(0, 8)}...`);
    
    const { error: createError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: 'free',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (createError) {
      console.error(`   ❌ Error creating subscription for ${user.id}: ${createError.message}`);
    } else {
      console.log(`   ✅ Created free subscription for ${user.id.substring(0, 8)}...`);
    }
  }

  // Also create usage records for current month
  console.log('\n3️⃣ Creating usage records...');
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  for (const user of usersWithoutSubs) {
    const { error: usageError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: user.id,
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
      console.error(`   ❌ Error creating usage record for ${user.id}: ${usageError.message}`);
    } else {
      console.log(`   ✅ Created usage record for ${user.id.substring(0, 8)}...`);
    }
  }

  console.log('\n✅ User subscription setup completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your Next.js dev server');
  console.log('   2. Try generating a note');
  console.log('   3. The subscription limits should now work properly');
}

// Run the setup
createUserSubscription().catch(console.error); 