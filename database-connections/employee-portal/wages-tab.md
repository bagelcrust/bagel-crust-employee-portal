# Wages Tab (Accountant Only)

**File:** `src/employee-portal/wages/tab-wages.tsx`

Shows paychecks that actually cleared the bank. This is the "what really got paid" view - pulled from bank records, not from what we logged in Payroll.

---

## How it works

Pulls from `payroll.wages_v2` which has the clean, deduplicated check data imported from bank statements. Joins with `employees` to show names. Can also show check images if we have them (stored in `accounting.02_raw_transactions`).

---

## Tables used

| Table | What we do |
|-------|------------|
| `payroll.wages_v2` | Read - bank check records |
| `employees` | Read - employee names |
| `accounting.02_raw_transactions` | Read - check images |
