#!/usr/bin/env node

/**
 * Test script to verify webhook configuration
 * Run with: node scripts/test-webhook.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Webhook Configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

console.log('📋 Required Environment Variables:');
let missingRequired = 0;
requiredEnvVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  const status = exists ? '✅' : '❌';
  const value = exists ? '***configured***' : 'MISSING';
  console.log(`  ${status} ${envVar}: ${value}`);
  if (!exists) missingRequired++;
});

console.log('\n📋 Optional Environment Variables:');
let availableOptional = 0;
optionalEnvVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  const status = exists ? '✅' : '⚠️';
  const value = exists ? '***configured***' : 'not set';
  console.log(`  ${status} ${envVar}: ${value}`);
  if (exists) availableOptional++;
});

console.log('\n🔍 Configuration Summary:');
console.log(`  Required variables: ${requiredEnvVars.length - missingRequired}/${requiredEnvVars.length} configured`);
console.log(`  Optional variables: ${availableOptional}/${optionalEnvVars.length} configured`);

// Check Supabase key availability
const hasServiceRole = !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔑 Supabase Authentication:');
if (hasServiceRole) {
  console.log('  ✅ Using Service Role Key (recommended for webhooks)');
} else if (hasAnonKey) {
  console.log('  ⚠️  Using Anonymous Key (limited permissions)');
} else {
  console.log('  ❌ No Supabase key available');
}

// Test Stripe initialization
console.log('\n🎯 Testing Stripe Configuration...');
try {
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
  console.log('  ✅ Stripe client initialized successfully');
  console.log(`  📍 API Version: 2024-06-20`);
} catch (error) {
  console.log('  ❌ Stripe initialization failed:', error.message);
}

// Test Supabase initialization
console.log('\n🗄️  Testing Supabase Configuration...');
try {
  const { createClient } = require('@supabase/supabase-js');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseKey) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );
    console.log('  ✅ Supabase client initialized successfully');
    console.log(`  📍 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  } else {
    console.log('  ❌ Missing Supabase URL or key');
  }
} catch (error) {
  console.log('  ❌ Supabase initialization failed:', error.message);
}

// Overall status
console.log('\n📊 Overall Status:');
if (missingRequired > 0) {
  console.log('  ❌ Webhook NOT ready - missing required environment variables');
  console.log('\n💡 Next steps:');
  console.log('  1. Create a .env.local file in your project root');
  console.log('  2. Add the missing environment variables');
  console.log('  3. Restart your development server');
} else if (!supabaseKey) {
  console.log('  ⚠️  Webhook partially ready - no Supabase key available');
  console.log('\n💡 Recommendation:');
  console.log('  Add NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to .env.local for full webhook functionality');
} else {
  console.log('  ✅ Webhook is ready for testing!');
  console.log('\n🚀 You can now:');
  console.log('  1. Start your development server: npm run dev');
  console.log('  2. Test webhook endpoints at /api/stripe/webhook');
  console.log('  3. Use Stripe CLI for local testing: stripe listen --forward-to localhost:3000/api/stripe/webhook');
}

console.log('\n🔧 Webhook endpoint: /api/stripe/webhook');
console.log('📚 Supported events: checkout.session.completed, customer.subscription.updated'); 