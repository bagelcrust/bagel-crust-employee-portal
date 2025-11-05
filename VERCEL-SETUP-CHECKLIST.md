# Vercel + Supabase Setup Checklist

## ⚠️ CRITICAL: Environment Variables

Your clock in/out isn't working because Vercel needs the Supabase credentials!

### Step 1: Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project: **bagel-crust-employee-portal**
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)
5. Add these TWO variables:

#### Variable 1:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://gyyjviynlwbbodyfmvoi.supabase.co`
- **Environment:** Production, Preview, Development (check all 3)
- Click **Save**

#### Variable 2:
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo
```
- **Environment:** Production, Preview, Development (check all 3)
- Click **Save**

### Step 2: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Wait 1-2 minutes for the build

---

## ✅ Supabase Database Setup

Make sure your Supabase has these tables:

### Table 1: `core_employees`
Columns:
- `id` (text, primary key)
- `name` (text)
- `first_name` (text)
- `last_name` (text)
- `display_name` (text)
- `pin` (text)
- `active` (boolean)
- `phone_number` (text, nullable)
- `email` (text, nullable)

**Test Data:**
```sql
INSERT INTO core_employees (id, name, first_name, last_name, display_name, pin, active)
VALUES ('test-employee-1', 'Test Employee', 'Test', 'Employee', 'Test Employee', '0000', true);
```

### Table 2: `timeclock_events`
Columns:
- `id` (text, primary key)
- `employee_id` (text, foreign key to core_employees.id)
- `event_type` (text) - 'in' or 'out'
- `event_date` (text) - YYYY-MM-DD format
- `event_time_est` (text) - Full timestamp with EST

### Table 3: `posted_schedules`
Columns:
- `id` (integer, primary key, auto-increment)
- `employee_id` (text, foreign key to core_employees.id)
- `schedule_date` (text)
- `shift_start_time_est` (text)
- `shift_end_time_est` (text)
- `location` (text)
- `hours_scheduled` (numeric)

---

## 🔒 Row Level Security (RLS)

Make sure RLS policies allow:
- **SELECT** on all tables (public read)
- **INSERT** on `timeclock_events` (public write for clock in/out)

In Supabase:
1. Go to **Authentication** → **Policies**
2. For each table, add policies to allow anon access

---

## 🧪 Test After Setup

1. Go to: https://bagel-crust-employee-portal.vercel.app/clockinout
2. Enter PIN: `0000`
3. Check if it clocks in successfully
4. Check "Recent Activity" box shows the event
5. Go to Supabase → Table Editor → `timeclock_events`
6. Verify the new event appears!

---

## Common Issues

### Issue: "Invalid API key"
- **Fix:** Make sure you added both environment variables to Vercel
- **Fix:** Redeploy after adding variables

### Issue: Clock in works but doesn't show in Recent Activity
- **Fix:** Check RLS policies allow SELECT on timeclock_events
- **Fix:** Verify core_employees table has the test employee

### Issue: "No rows returned"
- **Fix:** Add test employee with PIN 0000 to core_employees table

---

## Quick Supabase SQL Setup

Run this in Supabase SQL Editor:

```sql
-- Create test employee
INSERT INTO core_employees (id, name, first_name, last_name, display_name, pin, active, email)
VALUES (
  'emp-test-0000',
  'Test Employee',
  'Test',
  'Employee',
  'Test Employee',
  '0000',
  true,
  'test@bagelcrust.com'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE core_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeclock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE posted_schedules ENABLE ROW LEVEL SECURITY;

-- Allow public read on employees
CREATE POLICY "Allow public read access" ON core_employees
  FOR SELECT USING (true);

-- Allow public read on timeclock events
CREATE POLICY "Allow public read access" ON timeclock_events
  FOR SELECT USING (true);

-- Allow public insert on timeclock events
CREATE POLICY "Allow public insert access" ON timeclock_events
  FOR INSERT WITH CHECK (true);

-- Allow public read on schedules
CREATE POLICY "Allow public read access" ON posted_schedules
  FOR SELECT USING (true);
```
