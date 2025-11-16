# Clock In/Out Debugging Session - November 16, 2025

## Table of Contents
- [Overview](#overview)
- [The Four Problems](#the-four-problems)
  - [Problem 1: PostgREST Cache](#problem-1-postgrest-cache)
  - [Problem 2: Whack-A-Mole Pattern](#problem-2-whack-a-mole-pattern)
  - [Problem 3: RPC Returns Array](#problem-3-rpc-returns-array)
  - [Problem 4: Missing RLS Policy](#problem-4-missing-rls-policy)
- [What Went Wrong](#what-went-wrong)
- [The Right Approach](#the-right-approach)
- [Technical Details](#technical-details)
- [Lessons Learned](#lessons-learned)

---

## Overview

A 3-hour debugging session that resulted in 15 commits to fix a single feature: clock in/out functionality. The problem appeared as a simple 404 error, but was actually FOUR separate issues that only revealed themselves one at a time.

**Main issues:**

- PostgREST schema cache refusing to refresh
- Incomplete file updates (fixing one file at a time)
- RPC function returning unexpected data structure
- Missing database security policy

---

## The Four Problems

### Problem 1: PostgREST Cache

**Error:** `Could not find the function public.employee_clock_toggle in the schema cache`

**What was tried:**

- Creating new function with different name (`employee_clock_toggle`)
- Adding comments to force cache refresh
- Removing `.schema('employees')` prefixes from RPC calls
- Running NOTIFY commands (failed - not exposed to anon users)

**Why it failed:**

PostgREST's schema cache is stubborn. It caches database function metadata and doesn't refresh easily. Adding comments or recreating functions doesn't guarantee cache invalidation.

**What actually worked:**

Abandoned RPC functions entirely. Used direct table operations instead:

```typescript
// OLD (broken - cache issues):
const { data } = await supabase.rpc('employee_clock_toggle', { p_employee_id: id })

// NEW (works - bypasses cache):
const { data: lastEvent } = await supabase
  .schema('employees')
  .from('time_entries')
  .select('event_type')
  .eq('employee_id', id)
  .order('event_timestamp', { ascending: false })
  .limit(1)
  .maybeSingle()

const newEventType = (!lastEvent || lastEvent.event_type === 'out') ? 'in' : 'out'

const { data } = await supabase
  .schema('employees')
  .from('time_entries')
  .insert({ employee_id: id, event_type: newEventType, event_timestamp: new Date().toISOString() })
  .select()
  .single()
```

**Commits:** 2994b26, 45853f0, b6faa5d, 99c65da, 14fa509

### Problem 2: Whack-A-Mole Pattern

**Symptom:** Fixed one file, tested, failed. Fixed another file, tested, failed. Repeat 5 times.

**Files updated one at a time:**

1. `offlineClockAction.ts` - Updated to use `employee_clock_toggle`
2. `syncManager.ts` - Updated to use `employee_clock_toggle`
3. `supabase.ts` - Updated to use `employee_clock_toggle`
4. `ClockInOutPage.tsx` - Removed `.schema()` from `get_recent_activity`
5. Multiple files - Removed `.schema()` from `get_employee_by_pin`

**Why this happened:**

Didn't search the entire codebase FIRST to find all instances. Fixed what was visible, tested, then discovered another file calling the old function.

**Should have done:**

```bash
# Find ALL instances BEFORE fixing
grep -r "employee_clock_toggle" src/
grep -r "\.schema.*\.rpc" src/
grep -r "get_employee_by_pin" src/

# Fix ALL files in ONE commit
# Test ONCE
```

**Commits:** b6faa5d, 99c65da, 14fa509, ed0dadc, abc0423

### Problem 3: RPC Returns Array

**Error:** `employeeId: undefined, employeeName: undefined`

**Root cause:**

```typescript
// get_employee_by_pin RPC returns ARRAY of employees
const { data: employee } = await supabase.rpc('get_employee_by_pin', { p_pin: pin })
// employee = [{id: "...", first_name: "...", last_name: "..."}]

// Code expected SINGLE object
console.log(employee.id) // undefined (can't read .id on array)
```

**Console showed:**

```
Employee lookup result: [{...}]
Employee ID: undefined
Employee object keys: ['0']  <- This was the clue!
```

**Fix:**

```typescript
const { data } = await supabase.rpc('get_employee_by_pin', { p_pin: pin })
const employee = Array.isArray(data) ? data[0] : data  // Extract first element
```

**Commit:** 1901828

### Problem 4: Missing RLS Policy

**Error:** `new row violates row-level security policy for table "time_entries"`

**Root cause:**

Database had RLS policies for reading `time_entries` as anonymous user, but NO policy for inserting.

**Existing policies:**

- `Anonymous users can read recent time entries for terminal` (SELECT only)
- `Employees can manage their own time entries` (requires auth)
- `Managers and Owners have full access` (requires auth)

**Missing policy:**

Anonymous users needed INSERT permission for clock terminal to work.

**Fix:**

```sql
CREATE POLICY "Anonymous users can insert time entries for clock terminal"
ON employees.time_entries
FOR INSERT
TO anon
WITH CHECK (true);
```

**Migration:** `allow_anon_insert_time_entries`

---

## What Went Wrong

**The pattern across all problems:**

1. Saw error message
2. Fixed what seemed obvious
3. Tested
4. Got different error (revealing next problem)
5. Repeat

**Result:** 15 commits in 3 hours instead of 2 commits in 30 minutes

**Why this happened:**

- No comprehensive logging added FIRST
- Didn't search for ALL broken spots BEFORE fixing
- Fixed symptoms instead of root causes
- Tested incrementally instead of fixing comprehensively

---

## The Right Approach

**Step 1: Add Logging (FIRST)**

```typescript
console.log('[Component] Input:', input)
console.log('[Component] API response:', response)
console.log('[Component] Transformed data:', transformed)
```

**Step 2: Search Comprehensively**

```bash
# Find ALL instances
grep -r "function_name" src/
grep -r "pattern" src/

# List all files that need changes
# Fix ALL files BEFORE testing
```

**Step 3: Fix All Instances**

One commit with all fixes, not 5 commits with one fix each.

**Step 4: Test Once**

After ALL fixes are in place, test comprehensively.

---

## Technical Details

**PostgREST Schema Cache:**

- Caches database schema metadata (tables, functions, types)
- Refresh triggers: server restart, NOTIFY pgrst
- Problem: NOTIFY not accessible to anonymous users
- Solution: Bypass cache by using table operations instead of RPC

**Supabase RPC vs Table Operations:**

RPC (cached):
```typescript
supabase.rpc('function_name', { params })
```

Table operations (not cached):
```typescript
supabase.schema('employees').from('table_name').select()
supabase.schema('employees').from('table_name').insert()
```

**RLS Policies Required for Anonymous Users:**

```sql
-- Read permission
CREATE POLICY "policy_name" ON table FOR SELECT TO anon USING (true);

-- Write permission
CREATE POLICY "policy_name" ON table FOR INSERT TO anon WITH CHECK (true);
```

---

## Lessons Learned

**1. Add logging before fixing**

Logs reveal ALL problems at once instead of one at a time.

**2. Search globally before editing**

```bash
grep -r "pattern" src/
```

Find every file that needs changes, fix all at once.

**3. Fix comprehensively, test once**

Not: fix → test → fail → fix → test → fail

Yes: fix everything → test once

**4. PostgREST cache is stubborn**

When RPC functions fail with cache errors, switch to table operations instead of fighting the cache.

**5. RPC functions return arrays**

Even if they logically return one row, they return `[{row}]` not `{row}`. Always extract first element.

**6. RLS policies must match use case**

Anonymous clock terminal needs both SELECT and INSERT permissions on `time_entries`.

**7. Check security policies early**

If table operations work in authenticated context but fail as anon, check RLS policies immediately.
