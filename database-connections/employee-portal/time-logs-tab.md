# Time Logs Tab (Owner Only)

**File:** `src/employee-portal/time-logs/tab-time-logs.tsx`

This is the "fix problems" screen. It shows a list of shifts that look wrong and need attention.

---

## What counts as a problem?

- **Long shifts (13+ hours)** - Someone probably forgot to clock out
- **Short shifts (under 30 min)** - Accidental clock-in or something weird
- **Auto clock-out** - The system automatically clocked them out at 6:30 PM

---

## How it works

Uses the same data as Payroll (`fetch_payroll_data`), but filters to only show problem shifts. When you tap on one, you can edit the clock-in or clock-out time using `update_time_entry`. If someone forgot to clock out entirely, you can add the missing clock-out with `create_time_entry`.

---

## Tables used

| Table | What we do |
|-------|------------|
| `time_entries` | Read + Write - view clock events, fix times |
| `employees` | Read - employee names |
