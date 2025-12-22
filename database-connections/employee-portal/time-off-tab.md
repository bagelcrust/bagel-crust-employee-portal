# Time Off Tab

**File:** `src/employee-portal/time-off/tab-time-off.tsx`

Request time off and see your upcoming requests.

---

## How it works

When the tab opens, `fetch_my_time_off` pulls your time-off requests from `time_off_notices`. You see them listed with dates and reason.

To request new time off, you pick dates and enter a reason. When you submit, `submit_my_time_off` inserts a new record into `time_off_notices`.

---

## Tables used

| Table | What we do |
|-------|------------|
| `time_off_notices` | Read + Write - view your requests, submit new ones |
