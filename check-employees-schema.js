// Check tables in the employees schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgwNzEsImV4cCI6MjA3Nzg2NDA3MX0.9TNiFzrKPPv1yvUnsO0NkVdlh2V7CzH323j6DiBeOtg';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'employees' }
});

async function checkSchema() {
  console.log('=========================================');
  console.log('Checking "employees" schema');
  console.log('=========================================\n');

  // Try common table names in the employees schema
  const possibleTables = [
    'employees', 'employee', 'staff', 'team_members',
    'timeclock', 'timeclock_events', 'clock_events', 'punches',
    'schedules', 'posted_schedules', 'shifts'
  ];

  const foundTables = [];

  console.log('Scanning for tables in employees schema...\n');

  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error && data !== null) {
        foundTables.push(tableName);
        console.log(`✅ Found table: "${tableName}"`);

        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   Columns (${columns.length}): ${columns.slice(0, 10).join(', ')}${columns.length > 10 ? '...' : ''}`);
        } else {
          console.log(`   (empty table)`);
        }
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }

  if (foundTables.length === 0) {
    console.log('\n❌ No tables found in employees schema');
    console.log('\nPlease go to Supabase and tell me:');
    console.log('1. What schema are your tables in? (public, employees, etc.)');
    console.log('2. What are the table names?');
    return;
  }

  console.log(`\n=========================================`);
  console.log(`Found ${foundTables.length} table(s) in employees schema!`);
  console.log(`=========================================\n`);

  // Get detailed info for each table
  for (const tableName of foundTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        console.log(`\nTable: ${tableName}`);
        console.log(`❌ Error: ${error.message}\n`);
        continue;
      }

      console.log(`\n=========================================`);
      console.log(`Table: employees.${tableName}`);
      console.log(`=========================================`);
      console.log(`Total rows: ${count || 0}`);

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`\nColumns:`);
        columns.forEach(col => {
          const sampleValue = data[0][col];
          const type = sampleValue === null ? 'null' : typeof sampleValue;
          console.log(`  - ${col} (${type})`);
        });

        console.log(`\nSample data (first 3 rows):`);
        data.forEach((row, i) => {
          console.log(`\n  Row ${i + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            const displayValue = value === null ? 'NULL' :
                                value === '' ? '(empty)' :
                                typeof value === 'string' && value.length > 50 ? value.substring(0, 47) + '...' :
                                value;
            console.log(`    ${key}: ${displayValue}`);
          });
        });
      } else {
        console.log('  (No data yet)');
      }
    } catch (e) {
      console.log(`\n❌ Error with ${tableName}:`, e.message);
    }
  }

  console.log('\n=========================================');
  console.log('Schema Discovery Complete!');
  console.log('=========================================');
}

checkSchema().catch(console.error);
