#!/usr/bin/env node

/**
 * Script to refresh the Supabase schema cache
 * 
 * This makes POST requests to refresh the schema cache so the
 * database will recognize any schema changes we've made
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

// Get Supabase credentials from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

// Extract domain from Supabase URL
const domain = supabaseUrl.replace('https://', '');

// Prepare the request options for the POST request
const options = {
  hostname: domain,
  port: 443,
  path: '/rest/v1/rpc/pg_catalog.pg_reload_conf',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

// Make the request
const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Schema cache refresh request completed');
    if (res.statusCode === 200) {
      console.log('Success! Schema cache has been refreshed');
    } else {
      console.log('Error refreshing schema cache');
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

// Send the request
req.end();

console.log('Refreshing Supabase schema cache...'); 