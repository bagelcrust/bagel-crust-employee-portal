# Schedule Tab

**File:** `src/employee-portal/schedule/tab-schedule.tsx`

Shows your upcoming shifts for this week and next week. Each day expands to show your start time, end time, and location.

---

## How it works

When you open this tab, the system calls `fetch_my_schedule` to get your shifts from `published_shifts`. It fetches two weeks at once (this week and next), then groups them by day so Monday's shifts show under Monday, Tuesday's under Tuesday, etc.

If you're an owner, there's also a "Team Schedule" toggle that shows everyone's shifts for the week - that uses `fetch_team_schedule` which pulls the whole team from `published_shifts` and joins with `employees` to get names.

---

## Tables used

| Table | What we do |
|-------|------------|
| `published_shifts` | Read - get your scheduled shifts |
| `employees` | Read - get names for team view |
