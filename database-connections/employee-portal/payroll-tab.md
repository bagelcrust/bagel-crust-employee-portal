# Payroll Tab (Owner Only)

**File:** `src/employee-portal/payroll/tab-payroll.tsx`

The main screen for paying employees. Shows everyone who worked this week, their hours, their rate, and what they're owed.

---

## How it works

`fetch_payroll_data` pulls everything at once - all employees, all their clock events for the week, all their pay rates, and any existing payroll records. The system pairs up clock-ins with clock-outs, calculates hours, multiplies by rate.

Some employees have multiple pay arrangements (like Carlos who gets paid both weekly as 1099 and bi-weekly as W-2). The system tracks each arrangement separately.

When you pay someone, you tap "Log Payment" and it writes a record to `payroll.wages` with the amount, date, and payment method (cash or check).

You can also edit clock times right from here if something's wrong - same `update_time_entry` and `create_time_entry` functions as Time Logs.

---

## Tables used

| Table | What we do |
|-------|------------|
| `employees` | Read - who worked |
| `time_entries` | Read + Write - clock events, can edit times |
| `pay_rates` | Read - hourly rates for each employee |
| `payroll_records` | Read - check if already paid |
| `payroll.wages` | Write - log new payments |
