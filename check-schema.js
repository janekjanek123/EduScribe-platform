#!/usr/bin/env node

/**
 * Schema Diagnostic Tool for EduScribe
 * 
 * This script checks the current schema in Supabase and reports any issues
 * or mismatches that might be causing problems.
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

// Check youtube_notes table
const checkYoutubeNotesTable = () => {
  console.log('Checking youtube_notes table schema...');

  const options = {
    hostname: domain,
    port: 443,
    path: '/rest/v1/youtube_notes?limit=0',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      
      if (res.statusCode !== 200) {
        console.error('Error retrieving table info:', data);
        return;
      }
      
      // Get column info from response headers
      const rangeHeader = res.headers['content-range'] || '';
      console.log('Range header:', rangeHeader);
      
      // Get the table definition
      console.log('\nRetrieving youtube_notes definition...');
      getTableDefinition('youtube_notes');
    });
  });
  
  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });
  
  req.end();
};

// Get table definition
const getTableDefinition = (tableName) => {
  const options = {
    hostname: domain,
    port: 443,
    path: '/rest/v1/rpc/get_table_definition',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    }
  };
  
  const data = JSON.stringify({
    table_name: tableName
  });
  
  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          console.log(`\nTable definition for ${tableName}:`);
          console.log(JSON.parse(responseData));
        } catch (e) {
          console.log('Raw response:', responseData);
        }
      } else {
        console.log('Error retrieving table definition:');
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', responseData);
        
        // Try alternate approach - get columns directly
        getColumnsInfo(tableName);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });
  
  req.write(data);
  req.end();
};

// Get columns info
const getColumnsInfo = (tableName) => {
  console.log(`\nRetrieving column information for ${tableName}...`);
  
  const options = {
    hostname: domain,
    port: 443,
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const apiDocs = JSON.parse(data);
          
          // Look for the table definition in the swagger docs
          if (apiDocs.definitions && apiDocs.definitions[tableName]) {
            console.log(`\nFound table ${tableName} in API definitions:`);
            console.log('Columns:');
            
            const properties = apiDocs.definitions[tableName].properties;
            for (const column in properties) {
              console.log(`- ${column} (${properties[column].format || properties[column].type || 'unknown'})`);
            }
            
            const requiredColumns = apiDocs.definitions[tableName].required || [];
            console.log('\nRequired columns:', requiredColumns.join(', '));
            
            // Check for problematic columns
            const mixedCaseColumns = Object.keys(properties).filter(col => 
              col !== col.toLowerCase() && col !== col.toUpperCase()
            );
            
            if (mixedCaseColumns.length > 0) {
              console.log('\nPotential problem: Mixed case columns detected:');
              mixedCaseColumns.forEach(col => {
                console.log(`- ${col}`);
              });
              console.log('\nNote: PostgreSQL converts column names to lowercase unless quoted.');
            }
            
            // Check for duplicate columns with different casing
            const lowerCaseColumns = {};
            const duplicateColumns = [];
            
            Object.keys(properties).forEach(col => {
              const lower = col.toLowerCase();
              if (lowerCaseColumns[lower] && lowerCaseColumns[lower] !== col) {
                duplicateColumns.push([lowerCaseColumns[lower], col]);
              } else {
                lowerCaseColumns[lower] = col;
              }
            });
            
            if (duplicateColumns.length > 0) {
              console.log('\nCRITICAL ISSUE: Duplicate columns with different casing:');
              duplicateColumns.forEach(pair => {
                console.log(`- "${pair[0]}" and "${pair[1]}" (PostgreSQL treats these as the same column)`);
              });
            }
          } else {
            console.log(`Table ${tableName} not found in API definitions`);
          }
        } catch (e) {
          console.error('Error parsing API docs:', e);
          console.log('Raw data:', data.substring(0, 500) + '...');
        }
      } else {
        console.error(`Error ${res.statusCode}:`, data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });
  
  req.end();
};

// Start the diagnosis
console.log('Starting schema diagnosis...');
checkYoutubeNotesTable(); 