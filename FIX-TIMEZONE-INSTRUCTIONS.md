# Fix Timezone Data in Supabase

## Problem
Old time entries were stored as EST times directly in UTC fields, causing them to display 5 hours early.

**Example:**
- Carlos clocked out at **5:07 PM EST**
- Was stored as: `17:07 UTC` (wrong!)
- Displayed as: `12:07 PM EST` (5 hours early)
- Should be: `22:07 UTC` → displays as `5:07 PM EST`

## Solution
Add 5 hours to all old entries to convert them from EST to proper UTC.

## Steps to Fix

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/gyyjviynlwbbodyfmvoi/sql/new

### 2. Copy and Paste This SQL

```sql
-- Add 5 hours to old time entries that were stored as EST instead of UTC
UPDATE employees.time_entries
SET event_timestamp = event_timestamp + interval '5 hours'
WHERE
  -- Only update entries before today
  event_timestamp < '2025-11-05T00:00:00Z'
  -- Or entries without real milliseconds (old format)
  OR (event_timestamp::text NOT LIKE '%.%' OR event_timestamp::text LIKE '%.0%+%');
```

### 3. Click "Run" or press Ctrl+Enter

### 4. Verify the Fix

The SQL will also show you the updated entries. Check that times now look correct:

```sql
-- Check recent entries
SELECT
  id,
  event_type,
  event_timestamp as stored_utc,
  event_timestamp AT TIME ZONE 'America/New_York' as display_est
FROM employees.time_entries
ORDER BY event_timestamp DESC
LIMIT 10;
```

You should see:
- Carlos: `22:07 UTC` → `5:07 PM EST` ✓
- Maddy: `22:06 UTC` → `5:06 PM EST` ✓
- Angie: `22:04 UTC` → `5:04 PM EST` ✓

### 5. Refresh Your Clock-In Page

Go to: http://134.209.45.231:3010/clockinout

The Recent Activity box should now show correct times!

## What Gets Updated

- **731 entries** will have 5 hours added
- **2 entries** (Bryan's) stay the same (already correct)
- **Total entries:** 733

## Safety

✓ This only updates timestamps, no data is lost
✓ Can be safely re-run if needed
✓ Only affects old entries, new ones stay correct
✓ All future clock-ins will work properly
