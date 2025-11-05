// Migration script to fix timezone issue in time_entries
// Adds 5 hours to entries that were stored as EST instead of UTC
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyyjviynlwbbodyfmvoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgwNzEsImV4cCI6MjA3Nzg2NDA3MX0.9TNiFzrKPPv1yvUnsO0NkVdlh2V7CzH323j6DiBeOtg';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'employees' }
});

async function fixTimezones() {
  console.log('=========================================');
  console.log('TIMEZONE FIX MIGRATION');
  console.log('=========================================\n');

  // Get all time entries
  const { data: allEntries, error } = await supabase
    .from('time_entries')
    .select('*')
    .order('event_timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return;
  }

  console.log(`Total entries found: ${allEntries.length}\n`);

  // Find the cutoff - entries with milliseconds are new (correct), entries without are old (need fixing)
  // Bryan's entries: 2025-11-05T03:34:39.072+00:00 (has .072 milliseconds)
  // Old entries: 2025-11-04T17:07:03+00:00 (no milliseconds or just .000)

  const entriesToFix = allEntries.filter(entry => {
    const timestamp = entry.event_timestamp;
    // Check if it's before 2025-11-05 (today) OR has .000 milliseconds
    const date = new Date(timestamp);
    const hasMilliseconds = timestamp.includes('.') && !timestamp.match(/\.0+\+/);

    // Fix entries that are before today AND don't have real milliseconds
    return date < new Date('2025-11-05T00:00:00Z') || !hasMilliseconds;
  });

  console.log(`Entries needing timezone fix: ${entriesToFix.length}`);
  console.log(`Entries already correct: ${allEntries.length - entriesToFix.length}\n`);

  if (entriesToFix.length === 0) {
    console.log('No entries need fixing!');
    return;
  }

  console.log('PREVIEW - First 10 entries to be fixed:');
  console.log('='.repeat(60));

  // Get employee names for preview
  const previewIds = entriesToFix.slice(0, 10).map(e => e.employee_id);
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .in('id', previewIds);

  const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);

  entriesToFix.slice(0, 10).forEach((entry, i) => {
    const emp = employeeMap.get(entry.employee_id);
    const empName = emp ? `${emp.first_name} ${emp.last_name || ''}`.trim() : 'Unknown';

    const oldDate = new Date(entry.event_timestamp);
    const newDate = new Date(oldDate.getTime() + (5 * 60 * 60 * 1000)); // Add 5 hours

    const oldEST = oldDate.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
    const newEST = newDate.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });

    console.log(`\n${i + 1}. ${empName} - ${entry.event_type.toUpperCase()}`);
    console.log(`   OLD: ${entry.event_timestamp} → displays as ${oldEST}`);
    console.log(`   NEW: ${newDate.toISOString()} → will display as ${newEST}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\nReady to fix ${entriesToFix.length} entries.`);
  console.log('\nStarting migration in 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Update entries in batches
  let updated = 0;
  let failed = 0;

  for (const entry of entriesToFix) {
    const oldDate = new Date(entry.event_timestamp);
    const newDate = new Date(oldDate.getTime() + (5 * 60 * 60 * 1000));
    const newTimestamp = newDate.toISOString();

    const { error: updateError } = await supabase
      .from('time_entries')
      .update({ event_timestamp: newTimestamp })
      .eq('id', entry.id);

    if (updateError) {
      console.error(`Failed to update entry ${entry.id}:`, updateError);
      failed++;
    } else {
      updated++;
      if (updated % 50 === 0) {
        console.log(`Progress: ${updated}/${entriesToFix.length} updated...`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✓ Successfully updated: ${updated}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total: ${entriesToFix.length}`);
  console.log('\nAll times should now display correctly in EST!');
}

fixTimezones().catch(console.error);
