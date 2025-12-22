# Schedule Builder (`/schedule-builder`)

**File:** `src/schedule-builder/schedule-builder-page.tsx`

---

## Tables Accessed

| Table | Read | Write | Notes |
|-------|------|-------|-------|
| employees | ✅ | ❌ | Get employee list for grid rows |
| draft_shifts | ✅ | ✅ | Create/edit/delete draft shifts |
| published_shifts | ✅ | ✅ | Read for comparison, write on publish |
| time_off_notices | ✅ | ❌ | Show time-off conflicts |
| availability | ✅ | ❌ | Show availability indicators |

---

## Hooks Used

- `useGetScheduleBuilderData()` - Main hook for all schedule data

---

## RPC Functions Called

| Function | Purpose |
|----------|---------|
| `fetch_schedule_builder_data(p_start_date, p_end_date)` | Get ALL data in single call: employees, drafts, published, time-offs, availability, pre-organized by employee+day |
| `create_shift(p_employee_id, p_start_time, p_end_time, p_location, p_role)` | Create new draft shift |
| `update_shift(p_shift_id, p_employee_id, p_start_time, p_end_time, p_location, p_role)` | Update existing draft shift |
| `delete_shift(p_shift_id)` | Delete draft shift |
| `publish_week(p_start_date, p_end_date, p_strict_mode)` | Copy drafts → published_shifts |
| `clear_draft_shifts(p_start_date, p_end_date)` | Clear drafts after publish |
| `detect_schedule_conflicts(p_start_date, p_end_date)` | Find shift/time-off conflicts |

---

## Direct Table Queries (via shiftService)

- `draft_shifts` - SELECT for getAllShifts()
- `published_shifts` - SELECT for getPublishedShifts(), isWeekPublished()

---

## Data Flow

1. Page loads → `fetch_schedule_builder_data` gets everything
2. User creates shift → `create_shift` RPC → refetch
3. User drags shift → `update_shift` RPC → refetch
4. User deletes shift → `delete_shift` RPC → refetch
5. User publishes → `publish_week` RPC (copies drafts → published)

---

## Key Files

| File | Purpose |
|------|---------|
| `fetch-schedule-data.ts` | `useGetScheduleBuilderData` hook |
| `shift-operations.ts` | `shiftService` CRUD operations |
| `publish-schedule.ts` | `publishService` publish workflow |
| `detect-shift-conflicts.ts` | `conflictService` validation |
