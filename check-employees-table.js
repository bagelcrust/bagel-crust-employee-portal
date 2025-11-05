// Check the employees table structure
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgwNzEsImV4cCI6MjA3Nzg2NDA3MX0.9TNiFzrKPPv1yvUnsO0NkVdlh2V7CzH323j6DiBeOtg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmployees() {
  console.log('=========================================');
  console.log('Checking "employees" table');
  console.log('=========================================\n');

  try {
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('Code:', error.code);
      console.log('Details:', error.details);
      return;
    }

    console.log(`✅ Successfully connected to "employees" table`);
    console.log(`Total employees: ${count}\n`);

    if (data && data.length > 0) {
      console.log('COLUMN STRUCTURE:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        const sampleValue = data[0][col];
        const type = typeof sampleValue;
        console.log(`  - ${col} (${type})`);
      });

      console.log('\n=========================================');
      console.log('SAMPLE DATA (first 5 employees):');
      console.log('=========================================\n');

      data.forEach((emp, i) => {
        console.log(`Employee ${i + 1}:`);
        Object.entries(emp).forEach(([key, value]) => {
          const displayValue = value === null ? 'NULL' :
                              value === '' ? '(empty)' :
                              typeof value === 'string' && value.length > 60 ? value.substring(0, 57) + '...' :
                              value;
          console.log(`  ${key}: ${displayValue}`);
        });
        console.log('');
      });

      console.log('=========================================');
      console.log('KEY QUESTIONS:');
      console.log('=========================================');
      console.log('1. Which column stores the PIN?');
      console.log('2. Which column is the employee name?');
      console.log('3. Which column is the employee ID?');
      console.log('4. Is there an "active" status column?');
      console.log('');

    } else {
      console.log('⚠️  Table exists but has no data yet\n');
    }

  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
}

checkEmployees().catch(console.error);
