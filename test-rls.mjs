import { createClient } from '@supabase/supabase-js'

// Use ANON key - this respects RLS policies (unlike service role key)
const supabase = createClient(
  'https://gyyjviynlwbbodyfmvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgwNzEsImV4cCI6MjA3Nzg2NDA3MX0.9TNiFzrKPPv1yvUnsO0NkVdlh2V7CzH323j6DiBeOtg',
  { db: { schema: 'employees' } }
)

async function testFunction(name, params) {
  console.log(`\n🧪 Testing: ${name}`)
  console.log(`   Params:`, JSON.stringify(params))

  const { data, error } = await supabase.rpc(name, params)

  if (error) {
    console.error(`   ❌ FAILED:`, error.message)
    if (error.message.includes('policy')) {
      console.error(`   🚨 RLS POLICY BLOCKING REQUEST`)
    }
    return false
  }

  console.log(`   ✅ SUCCESS - Returned ${Array.isArray(data) ? data.length : 1} result(s)`)
  if (Array.isArray(data) && data.length > 0) {
    console.log(`   First result:`, data[0])
  } else if (!Array.isArray(data)) {
    console.log(`   Result:`, data)
  }
  return true
}

console.log('═══════════════════════════════════════')
console.log('🔒 RLS Policy Test (using anon key)')
console.log('═══════════════════════════════════════')

// Test Clock Terminal Functions
console.log('\n⏰ CLOCK TERMINAL FUNCTIONS:')
await testFunction('get_employee_by_pin', { p_pin: '2276' })
await testFunction('get_recent_activity', { p_limit: 10 })
console.log('   ⚠️  Skipping clock_in_out (writes data)')

// Test Mobile Site Functions
console.log('\n📱 MOBILE SITE FUNCTIONS:')
await testFunction('get_my_schedule', {
  p_employee_id: '48ae000b-b07a-4d90-8da2-85e85d919dec',
  p_start_date: '2025-11-10',
  p_end_date: '2025-11-16'
})
await testFunction('get_team_schedule', {
  p_start_date: '2025-11-10',
  p_end_date: '2025-11-16'
})
await testFunction('get_my_timesheets', {
  p_employee_id: '48ae000b-b07a-4d90-8da2-85e85d919dec',
  p_start_date: '2025-11-10',
  p_end_date: '2025-11-16'
})

// Test Schedule Builder Functions
console.log('\n📅 SCHEDULE BUILDER FUNCTIONS:')
await testFunction('get_schedule_builder_data', {
  p_start_date: '2025-11-10',
  p_end_date: '2025-11-16'
})

console.log('\n═══════════════════════════════════════')
console.log('✅ Test complete')
console.log('═══════════════════════════════════════\n')
