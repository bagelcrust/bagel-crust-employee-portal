# Supabase Verification Checklist

## The Issue:
Getting "Invalid API key" even though credentials match. Let's verify everything step by step.

## Step 1: Verify Project is Active

1. Go to https://supabase.com/dashboard
2. Find project: **gyyjviynlwbbodyfmvoi**
3. Check project status - is it:
   - ✅ Active (green dot)
   - ⚠️ Paused
   - ❌ Inactive

If paused, click "Restore" to reactivate it.

---

## Step 2: Verify Tables Exist

1. In Supabase, click **Table Editor** (left sidebar)
2. Check if these tables exist:
   - `core_employees`
   - `timeclock_events`
   - `posted_schedules`

**If tables don't exist:** That's the problem! You need to create them.

---

## Step 3: Check If There's Data

1. Click on `core_employees` table
2. Do you see any employees?
3. Check the `pin` column - what PINs exist?

**If no data:** We need to add test employees first!

---

## Step 4: Test API Key Directly

Try this in your browser's console (F12 → Console tab):

```javascript
fetch('https://gyyjviynlwbbodyfmvoi.supabase.co/rest/v1/core_employees?select=*&limit=5', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo'
  }
})
.then(r => r.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));
```

**What do you see?**
- ✅ Array of employees = API key works!
- ❌ Error = API key or table issue
- ❌ "relation does not exist" = Tables not created

---

## Step 5: Check Row Level Security (RLS)

1. Go to **Authentication** → **Policies** in Supabase
2. Click on `core_employees` table
3. Are there any policies enabled?

**If RLS is enabled but no policies exist:** That's blocking all access!

### Quick Fix - Disable RLS for Testing:

In Supabase SQL Editor, run:
```sql
ALTER TABLE core_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeclock_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE posted_schedules DISABLE ROW LEVEL SECURITY;
```

Then try the clock in/out again!

---

## Step 6: Regenerate API Key

If nothing above works:

1. Go to **Project Settings** → **API**
2. Under "Project API keys"
3. Click **Regenerate** next to "anon public"
4. Copy the NEW key
5. Update everywhere:
   - `.env` file locally
   - Vercel environment variables
   - Redeploy Vercel

---

## Common Causes:

### Cause 1: Wrong Supabase Project
- Are you looking at the right project?
- Check the URL matches: `gyyjviynlwbbodyfmvoi`

### Cause 2: Tables Don't Exist
- The project might be new/empty
- Need to run SQL to create tables

### Cause 3: RLS Blocking Everything
- Row Level Security is on but no policies allow access
- Quick fix: Disable RLS for testing

### Cause 4: Project was Paused
- Free tier projects pause after inactivity
- Just click "Restore"

---

## Quick Diagnostic:

Tell me the answers to these:

1. **In Supabase Table Editor, do you see the `core_employees` table?**
   - Yes / No

2. **If yes, how many rows are in `core_employees`?**
   - Number of employees

3. **What PINs exist in the database?**
   - List of PINs

4. **Is RLS enabled on `core_employees`?**
   - Settings → Database → Tables → core_employees → scroll down to "Row Level Security"
   - Enabled / Disabled

5. **What happens when you run the browser console test (Step 4)?**
   - What error or data do you see?

This will help me figure out exactly what's wrong!
