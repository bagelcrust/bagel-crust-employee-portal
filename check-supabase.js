// Check Supabase database tables and RLS policies
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('========================================');
  console.log('Supabase Database Diagnostic');
  console.log('========================================\n');

  // Test 1: Try to query employees table
  console.log('1. Checking core_employees table...');
  try {
    const { data, error, count } = await supabase
      .from('core_employees')
      .select('*', { count: 'exact' })
      .eq('active', true);

    if (error) {
      console.log('❌ Error querying core_employees:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Found', count, 'active employees');
      if (data && data.length > 0) {
        console.log('\nEmployees:');
        data.slice(0, 5).forEach(emp => {
          console.log(`   - ${emp.display_name || emp.name} (PIN: ${emp.pin || 'no PIN'})`);
        });
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  console.log('');

  // Test 2: Try to query timeclock_events
  console.log('2. Checking timeclock_events table...');
  try {
    const { data, error } = await supabase
      .from('timeclock_events')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Error querying timeclock_events:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Can read timeclock_events');
      console.log('   Found', data?.length || 0, 'recent events');
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  console.log('');

  // Test 3: Try a specific PIN lookup
  console.log('3. Testing PIN lookup (trying common PINs)...');
  const testPins = ['0000', '1234', '1111', '2222'];

  for (const pin of testPins) {
    try {
      const { data, error } = await supabase
        .from('core_employees')
        .select('*')
        .eq('pin', pin)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.log(`   PIN ${pin}: Error - ${error.message}`);
      } else if (data) {
        console.log(`   ✅ PIN ${pin}: Found employee "${data.display_name || data.name}"`);
      } else {
        console.log(`   PIN ${pin}: No employee found`);
      }
    } catch (e) {
      console.log(`   PIN ${pin}: Exception - ${e.message}`);
    }
  }
  console.log('');

  // Test 4: Check if we can insert
  console.log('4. Testing INSERT permission on timeclock_events...');
  try {
    const testId = `test_${Date.now()}`;
    const { data, error } = await supabase
      .from('timeclock_events')
      .insert({
        id: testId,
        employee_id: 'test-emp',
        event_type: 'in',
        event_date: '2025-01-01',
        event_time_est: '2025-01-01 12:00:00 EST'
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Cannot INSERT into timeclock_events:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   This is likely a Row Level Security (RLS) issue!');
    } else {
      console.log('✅ Can INSERT into timeclock_events');
      // Clean up test data
      await supabase.from('timeclock_events').delete().eq('id', testId);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  console.log('');

  console.log('========================================');
  console.log('Diagnosis Complete');
  console.log('========================================');
}

checkDatabase().catch(console.error);
