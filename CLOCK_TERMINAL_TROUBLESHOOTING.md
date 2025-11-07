# Clock Terminal - Troubleshooting Guide

**CRITICAL**: This document provides step-by-step troubleshooting for the Clock In/Out terminal.

## System Architecture

```
User enters PIN
    ↓
ClockInOut.tsx (Frontend)
    ↓
getEmployeeByPin() → employees Edge Function (SERVICE_ROLE_KEY)
    ↓
clockInOut() → timeclock Edge Function (SERVICE_ROLE_KEY)
    ↓
clock_in_out() RPC (SECURITY DEFINER)
    ↓
INSERT into employees.time_entries (BYPASSES ALL RLS)
    ↓
Realtime notification (supabase_realtime publication)
    ↓
Frontend receives update → refreshes Recent Activity
```

---

## Built-in Safety Features

### 1. Automatic Error Logging
All errors are logged with:
- Timestamp (ISO 8601)
- Error context and message
- Stack trace
- User agent (browser info)
- Network status (online/offline)

**Where to find logs:**
```bash
# Open browser console (F12)
# Filter by: ClockInOut Error
```

### 2. Timeout Protection
- Employee lookup: 15 second timeout
- Clock action: 15 second timeout
- Recent events load: 15 second timeout

### 3. Automatic Retry
- Clock operations retry up to 2 times
- 1 second delay between retries
- Prevents transient network failures

### 4. Double-Submission Prevention
- Only one clock action processes at a time
- Duplicate requests are ignored
- `isProcessing` state prevents race conditions

### 5. Realtime Health Monitoring
- Connection status indicator (green/gray/red dot)
- Health check every 30 seconds
- Automatic fallback to manual refresh

### 6. Graceful Degradation
- If Realtime fails: falls back to manual polling
- If Edge Function fails: shows detailed error message
- If network offline: shows "check your connection"

---

## Common Issues & Solutions

### Issue 1: "Clock action failed - Please try again"

**Possible Causes:**
1. Network timeout (>15 seconds)
2. Edge Function error
3. Database error
4. RLS policy blocking insert

**Diagnosis:**
```bash
# 1. Check browser console for detailed error
# Look for: [ClockInOut Error]

# 2. Check Edge Function logs
/supabase query edge-function-logs

# 3. Check database permissions
SELECT * FROM pg_roles WHERE rolname IN ('service_role', 'anon');

# 4. Verify clock_in_out RPC exists
SELECT proname, prosecdef
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'employees' AND p.proname = 'clock_in_out';
```

**Solution:**
```bash
# If RPC missing or broken, redeploy:
cd /bagelcrust/react-app/supabase/migrations
# Find and re-run the clock_in_out migration

# If Edge Function failing:
# Check /supabase logs or Vercel deployment logs
```

---

### Issue 2: "No internet connection - Please check your network"

**Cause:** Browser detected offline status

**Solution:**
1. Check WiFi/Ethernet connection
2. Test with: `ping 8.8.8.8`
3. Verify firewall not blocking Supabase domain

---

### Issue 3: Recent Activity not updating

**Possible Causes:**
1. Realtime subscription disconnected
2. RLS policy blocking SELECT
3. time_entries not in supabase_realtime publication

**Diagnosis:**
```bash
# 1. Check realtime indicator (green dot = good)

# 2. Verify Realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

# 3. Check RLS policy for anonymous SELECT
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'employees'
  AND tablename = 'time_entries'
  AND cmd = 'SELECT'
  AND roles::text = '{public}';
```

**Solution:**
```sql
-- If missing from Realtime publication:
ALTER PUBLICATION supabase_realtime ADD TABLE employees.time_entries;

-- If missing RLS policy:
CREATE POLICY "Anonymous users can read recent time entries for terminal"
ON employees.time_entries
FOR SELECT
TO public
USING (event_timestamp >= NOW() - INTERVAL '7 days');
```

---

### Issue 4: "Invalid PIN - Please try again" (but PIN is correct)

**Possible Causes:**
1. Employee marked as inactive
2. PIN mismatch (leading zeros stripped)
3. Employee deleted

**Diagnosis:**
```bash
# Check employee exists with PIN
/supabase query employees --eq "pin,2255"

# Check if active
SELECT id, first_name, last_name, pin, is_active
FROM employees.employees
WHERE pin = '2255';
```

**Solution:**
```sql
-- If employee exists but inactive:
UPDATE employees.employees
SET is_active = true
WHERE pin = '2255';

-- If PIN stored incorrectly (e.g., 255 instead of 2255):
UPDATE employees.employees
SET pin = '2255'
WHERE id = '<employee-uuid>';
```

---

### Issue 5: Realtime connection shows red dot

**Cause:** Realtime subscription failed

**Diagnosis:**
```bash
# Check browser console for:
# [Realtime] Subscription status: CHANNEL_ERROR
```

**Solution:**
```bash
# 1. Refresh page (Ctrl+R or Cmd+R)
# 2. Check Supabase project status at dashboard
# 3. Verify Realtime is enabled in Supabase project settings
```

---

## Emergency Recovery Procedures

### If Clock Terminal is Completely Broken

1. **Check if it's a deployment issue:**
   ```bash
   cd /bagelcrust/react-app
   git log -1 --oneline
   # If recent changes, consider reverting
   ```

2. **Test database directly:**
   ```bash
   /supabase query employees --limit 1
   # If this fails, database connection is broken
   ```

3. **Test Edge Functions:**
   ```bash
   curl -X POST https://gyyjviynlwbbodyfmvoi.supabase.co/functions/v1/employees \
     -H "Authorization: Bearer SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"operation":"getAll","activeOnly":true}'
   ```

4. **Rollback to last known good version:**
   ```bash
   cd /bagelcrust/react-app
   git log --oneline | head -20
   # Find last working commit
   git checkout <commit-hash>
   pm2 restart react-dev-server
   ```

---

## Health Check Checklist

Run these checks periodically to ensure system health:

```bash
# 1. ✅ Database responding
/supabase query employees --limit 1

# 2. ✅ RPC function exists
/supabase execute "SELECT proname FROM pg_proc WHERE proname='clock_in_out'"

# 3. ✅ Edge Functions responding
curl https://gyyjviynlwbbodyfmvoi.supabase.co/functions/v1/employees

# 4. ✅ Realtime enabled
/supabase execute "SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime'"

# 5. ✅ RLS policies correct
/supabase execute "SELECT count(*) FROM pg_policies WHERE tablename='time_entries'"

# 6. ✅ Recent entries exist
/supabase query time_entries --order "event_timestamp,desc" --limit 1
```

---

## Critical Files Reference

**Frontend:**
- `/bagelcrust/react-app/src/pages/ClockInOut.tsx` - Main clock terminal UI
- `/bagelcrust/react-app/src/supabase/edgeFunctions.ts` - API wrappers

**Edge Functions:**
- `/bagelcrust/react-app/supabase/functions/timeclock/index.ts` - Clock operations
- `/bagelcrust/react-app/supabase/functions/employees/index.ts` - Employee lookup
- `/bagelcrust/react-app/supabase/functions/clock-terminal-data/index.ts` - Recent events

**Database:**
- Schema: `employees`
- Key tables: `employees`, `time_entries`
- Key RPC: `clock_in_out(p_employee_id uuid)`
- Realtime publication: `supabase_realtime`

**Deployment:**
- Dev server: http://134.209.45.231:3010/clock-in-out (PM2: react-dev-server)
- Production: https://bagelcrust.biz/clock-in-out (Vercel auto-deploy from main)

---

## Contact & Escalation

If all troubleshooting fails:

1. **Check Supabase Status:** https://status.supabase.com
2. **Check Vercel Status:** https://www.vercel-status.com
3. **Review Edge Function logs:** Supabase Dashboard → Edge Functions → timeclock → Logs
4. **Check database health:** Supabase Dashboard → Database → Health

---

## Version History

- **2025-11-07**: Added bulletproof error handling, retry logic, timeouts, health monitoring
- **2025-11-06**: Fixed Realtime RLS policies
- **2025-11-05**: Migrated to Edge Functions with SERVICE_ROLE_KEY

---

**REMEMBER**: The clock terminal is mission-critical. When in doubt, consult this guide first.
