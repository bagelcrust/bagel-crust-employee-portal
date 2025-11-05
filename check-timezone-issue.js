// Check timezone handling in time_entries
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgwNzEsImV4cCI6MjA3Nzg2NDA3MX0.9TNiFzrKPPv1yvUnsO0NkVdlh2V7CzH323j6DiBeOtg';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'employees' }
});

async function checkTimezones() {
  console.log('=========================================');
  console.log('Checking Recent Time Entries Timestamps');
  console.log('=========================================\n');

  console.log(`Current time (server): ${new Date().toISOString()}`);
  console.log(`Current time (EST): ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}\n`);

  // Get recent time entries with employee info
  const { data: events, error } = await supabase
    .from('time_entries')
    .select('*')
    .order('event_timestamp', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Get employee IDs and fetch employee details
  const employeeIds = [...new Set(events?.map(e => e.employee_id) || [])];
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .in('id', employeeIds);

  const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);

  console.log('Recent Time Entries:\n');

  events?.forEach((event, i) => {
    const emp = employeeMap.get(event.employee_id);
    const empName = emp ? `${emp.first_name} ${emp.last_name || ''}`.trim() : 'Unknown';

    const timestamp = new Date(event.event_timestamp);
    const utcTime = timestamp.toISOString();
    const estTime = timestamp.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    console.log(`${i + 1}. ${empName}`);
    console.log(`   Event: ${event.event_type.toUpperCase()}`);
    console.log(`   Stored as: ${event.event_timestamp}`);
    console.log(`   UTC: ${utcTime}`);
    console.log(`   EST: ${estTime}`);
    console.log('');
  });
}

checkTimezones().catch(console.error);
