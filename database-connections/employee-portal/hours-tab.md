# Hours Tab (Timesheet)

**File:** `src/employee-portal/timesheet/tab-timesheet.tsx`

Shows how many hours you worked this week and last week, broken down by day.

---

## How it works

The system calls `fetch_timesheet_data` which looks at your clock-in/out events in `time_entries` and pairs them up. If you clocked in at 7:00 AM and out at 3:00 PM, that's 8 hours. It adds up all your shifts for the week.

It also pulls your hourly rate from `pay_rates` and calculates what you earned (hours × rate). You see each day listed with clock-in time, clock-out time, and hours worked, plus totals at the bottom.

---

## Tables used

| Table | What we do |
|-------|------------|
| `time_entries` | Read - your clock in/out events |
| `pay_rates` | Read - your hourly rate |
