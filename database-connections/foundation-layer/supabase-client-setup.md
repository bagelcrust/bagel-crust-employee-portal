# Supabase Client Setup

**File:** `src/shared/supabase-client.ts`

**Connection:**
- URL: `VITE_SUPABASE_URL` (from .env)
- Key: `VITE_SUPABASE_ANON_KEY` (from .env)
- Client: `createClient()` from `@supabase/supabase-js`

**CRITICAL: Schema is `employees`, not `public`**
- All table queries use `.schema('employees').from('table_name')`
- RPC functions are in public schema but call employees schema functions

**Type System:**
- Auto-generated types from `database-types.ts`
- Row types: `Employee`, `TimeEntry`, `DraftShift`, `PublishedShift`, `TimeOff`, `PayRate`, `Availability`, `PayrollRecord`
- Insert types: `EmployeeInsert`, `TimeEntryInsert`, etc.
- Update types: `EmployeeUpdate`, `TimeEntryUpdate`, etc.

**Helper Function:**
- `getDisplayName(employee)` - Safely formats full name (handles null last_name)
