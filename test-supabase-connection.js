// Quick test script to verify Supabase connection and data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('====================================');
  console.log('Testing Supabase Connection');
  console.log('====================================\n');

  // Test 1: Check for employee with PIN 0000
  console.log('1. Checking for test employee (PIN: 0000)...');
  const { data: employee, error: empError } = await supabase
    .from('core_employees')
    .select('*')
    .eq('pin', '0000')
    .eq('active', true)
    .single();

  if (empError) {
    console.log('❌ Error:', empError.message);
    console.log('   Need to create test employee!\n');
  } else {
    console.log('✅ Found employee:', employee.display_name || employee.name);
    console.log('   ID:', employee.id);
    console.log('   PIN:', employee.pin, '\n');
  }

  // Test 2: Check recent timeclock events
  console.log('2. Checking recent timeclock events...');
  const { data: events, error: eventsError } = await supabase
    .from('timeclock_events')
    .select(`
      *,
      core_employees!inner (
        name,
        display_name
      )
    `)
    .order('event_time_est', { ascending: false })
    .limit(5);

  if (eventsError) {
    console.log('❌ Error:', eventsError.message, '\n');
  } else {
    console.log('✅ Found', events?.length || 0, 'recent events');
    events?.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.core_employees.display_name}: ${event.event_type} at ${event.event_time_est}`);
    });
    console.log('');
  }

  // Test 3: Try to create a test clock event
  if (employee) {
    console.log('3. Testing clock in/out...');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const { data: testEvent, error: testError } = await supabase
      .from('timeclock_events')
      .insert({
        id: `test_${Date.now()}`,
        employee_id: employee.id,
        event_type: 'in',
        event_date: dateStr,
        event_time_est: `${dateStr} ${timeStr} EST`
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Error creating test event:', testError.message);
      console.log('   Code:', testError.code);
      console.log('   Details:', testError.details, '\n');
    } else {
      console.log('✅ Test clock in successful!');
      console.log('   Event ID:', testEvent.id);
      console.log('   Type:', testEvent.event_type);
      console.log('   Time:', testEvent.event_time_est, '\n');
    }
  }

  console.log('====================================');
  console.log('Test Complete');
  console.log('====================================');
}

testConnection().catch(console.error);
