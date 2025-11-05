// Map the actual database schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgwNzEsImV4cCI6MjA3Nzg2NDA3MX0.9TNiFzrKPPv1yvUnsO0NkVdlh2V7CzH323j6DiBeOtg';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'employees' }
});

async function mapSchema() {
  console.log('=========================================');
  console.log('Mapping Database Schema');
  console.log('=========================================\n');

  const tables = ['employees', 'time_entries', 'shifts'];

  for (const tableName of tables) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Table: employees.${tableName}`);
    console.log('='.repeat(60));

    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(2);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        continue;
      }

      console.log(`\n📊 Total rows: ${count || 0}`);

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);

        console.log(`\n📋 COLUMNS (${columns.length} total):`);
        console.log('-'.repeat(60));

        columns.forEach(col => {
          const sampleValue = data[0][col];
          const type = sampleValue === null ? 'null' : typeof sampleValue;
          const displayValue = sampleValue === null ? 'NULL' :
                              sampleValue === '' ? '(empty)' :
                              typeof sampleValue === 'string' && sampleValue.length > 30 ?
                                sampleValue.substring(0, 27) + '...' : sampleValue;
          console.log(`  • ${col.padEnd(25)} [${type}] = ${displayValue}`);
        });

        console.log(`\n📝 SAMPLE DATA (first 2 rows):`);
        console.log('-'.repeat(60));

        data.forEach((row, i) => {
          console.log(`\nRow ${i + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            const displayValue = value === null ? 'NULL' :
                                value === '' ? '(empty)' :
                                typeof value === 'string' && value.length > 40 ?
                                  value.substring(0, 37) + '...' : value;
            console.log(`  ${key}: ${displayValue}`);
          });
        });
      } else {
        console.log('\n⚠️  Table exists but has no data');
      }

    } catch (e) {
      console.log(`❌ Exception: ${e.message}`);
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('MAPPING COMPLETE');
  console.log('='.repeat(60));
  console.log('\nNext: Update React code to use:');
  console.log('  - Schema: employees');
  console.log('  - Tables: employees, time_entries, shifts');
}

mapSchema().catch(console.error);
