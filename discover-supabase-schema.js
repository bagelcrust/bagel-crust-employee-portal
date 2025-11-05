// Discover the actual Supabase database schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function discoverSchema() {
  console.log('=========================================');
  console.log('Discovering Your Supabase Database Schema');
  console.log('=========================================\n');

  // Common table name patterns to try
  const possibleTableNames = [
    // Employee-related
    'employees', 'core_employees', 'employee', 'staff', 'users', 'team_members',
    // Timeclock-related
    'timeclock_events', 'timeclock', 'clock_events', 'punches', 'time_entries',
    'clock_ins', 'attendance', 'time_tracking',
    // Schedule-related
    'posted_schedules', 'schedules', 'schedule', 'shifts', 'roster',
    // Other common tables
    'profiles', 'accounts'
  ];

  const foundTables = [];

  console.log('Scanning for tables...\n');

  for (const tableName of possibleTableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        foundTables.push(tableName);
        console.log(`✅ Found table: "${tableName}"`);

        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   Columns: ${columns.join(', ')}`);
        }
        console.log('');
      }
    } catch (e) {
      // Ignore - table doesn't exist
    }
  }

  if (foundTables.length === 0) {
    console.log('❌ No tables found with common names.');
    console.log('');
    console.log('Please tell me:');
    console.log('1. What are your table names?');
    console.log('2. Open Supabase → Table Editor and list them here');
    return;
  }

  console.log('=========================================');
  console.log(`Found ${foundTables.length} table(s)!\n`);

  // Get detailed info for each found table
  for (const tableName of foundTables) {
    console.log('=========================================');
    console.log(`Table: "${tableName}"`);
    console.log('=========================================');

    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        console.log(`❌ Error: ${error.message}\n`);
        continue;
      }

      console.log(`Total rows: ${count || 0}`);

      if (data && data.length > 0) {
        console.log('\nColumns and sample data:\n');

        const columns = Object.keys(data[0]);
        console.log('Column names:', columns.join(', '));
        console.log('');

        console.log('Sample rows:');
        data.forEach((row, i) => {
          console.log(`\nRow ${i + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            const displayValue = value === null ? 'NULL' :
                                value === '' ? '(empty string)' :
                                typeof value === 'string' && value.length > 50 ? value.substring(0, 47) + '...' :
                                value;
            console.log(`  ${key}: ${displayValue}`);
          });
        });
      } else {
        console.log('(Table is empty - no data yet)');
      }

      console.log('\n');
    } catch (e) {
      console.log(`❌ Exception: ${e.message}\n`);
    }
  }

  console.log('=========================================');
  console.log('Schema Discovery Complete!');
  console.log('=========================================');
  console.log('\nNext step: Update React code to use these table/column names');
}

discoverSchema().catch(console.error);
