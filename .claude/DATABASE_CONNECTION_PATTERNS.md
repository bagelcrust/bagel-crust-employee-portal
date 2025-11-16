# Database Connection Patterns - Simple Reference

## The Confusion

We have THREE different patterns for database calls. Here's what each means and when to use it.

---

## Pattern 1: RPC Functions in `employees` Schema

**When to use:** Calling Postgres functions that live in `employees` schema

**Code:**
```typescript
const { data, error } = await supabase
  .schema('employees')
  .rpc('function_name', { params })
```

**Examples in codebase:**
- `get_my_schedule` - Employee portal
- `get_schedule_builder_data` - Schedule builder
- `publish_schedule_builder_week` - Schedule builder
- `find_shift_conflicts` - Schedule builder

**Status:** ✅ Works - functions exist, code is correct

---

## Pattern 2: Table Operations in `employees` Schema

**When to use:** Reading/writing directly to tables (no RPC function)

**Code:**
```typescript
// Read
const { data } = await supabase
  .schema('employees')
  .from('time_entries')
  .select('*')
  .eq('employee_id', id)

// Insert
const { data } = await supabase
  .schema('employees')
  .from('time_entries')
  .insert({ employee_id: id, event_type: 'in' })
  .select()
  .single()
```

**Examples in codebase:**
- Clock in/out (we switched to this from broken RPC)
- Reading last event before inserting new one

**Status:** ✅ Works - bypasses PostgREST cache completely

---

## Pattern 3: RPC Functions in `public` Schema (BROKEN)

**When to use:** DON'T. This breaks due to PostgREST cache.

**Code:**
```typescript
// ❌ BROKEN - cache won't refresh
const { data } = await supabase
  .rpc('employee_clock_toggle', { params })
```

**What happened:**
- Created `employee_clock_toggle` in `public` schema
- PostgREST cached old schema
- Calls returned 404 even though function existed
- Couldn't force cache refresh

**Solution:** Switched to Pattern 2 (table operations)

---

## Which Pattern to Use?

**Use Pattern 1 (RPC in employees schema) when:**
- Function already exists in `employees` schema
- Function does complex logic (conflict detection, calculations)
- Function returns formatted data

**Use Pattern 2 (table operations) when:**
- Simple read/write operations
- RPC cache issues
- Need to bypass PostgREST entirely

**Never use Pattern 3** - creates cache problems

---

## Current Codebase Status

### Clock In/Out (Pattern 2)
**Files:**
- `/src/lib/offlineClockAction.ts`
- `/src/lib/syncManager.ts`
- `/src/supabase/supabase.ts`

**Calls:** Table operations (SELECT last event → INSERT new event)

### Employee Portal (Pattern 1)
**Files:**
- `/src/employee-portal/schedule/useSchedule.ts`
- `/src/employee-portal/login/useEmployeeAuth.ts`

**Calls:** `.schema('employees').rpc()` - Works ✅

### Schedule Builder (Pattern 1)
**Files:**
- `/src/schedule-builder/useScheduleData.ts`
- `/src/schedule-builder/publishing/publishDrafts.ts`
- `/src/schedule-builder/grid/calculateHours.ts`
- `/src/schedule-builder/shifts/shiftCRUD.ts`
- `/src/schedule-builder/shifts/detectConflicts.ts`

**Calls:** `.schema('employees').rpc()` - Works ✅

---

## Quick Checklist

**If you get 404 on RPC call:**

1. Check where function exists:
```sql
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name = 'your_function_name'
```

2. If in `employees` schema → Add `.schema('employees')`
3. If in `public` schema → Switch to table operations (Pattern 2)

**If you get RLS error:**

Check policies:
```sql
SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'employees.your_table'::regclass
```

Add INSERT policy if missing:
```sql
CREATE POLICY "policy_name"
ON employees.your_table
FOR INSERT
TO anon
WITH CHECK (true);
```

---

## Summary

**Simple rule:** All our functions are in `employees` schema, so always use `.schema('employees')` before `.rpc()` or `.from()`.

**Exception:** Clock in/out doesn't use RPC anymore - uses table operations to avoid cache issues.
