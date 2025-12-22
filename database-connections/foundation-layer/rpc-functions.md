# RPC Functions (Database Functions)

All functions are in the `employees` schema.

---

## Timezone Helpers (ALWAYS USE THESE)

| Function | Parameters | Returns | Notes |
|----------|------------|---------|-------|
| `eastern_to_utc(text)` | Eastern timestamp string | timestamptz (UTC) | For database writes |
| `utc_to_eastern(timestamptz)` | UTC timestamp | text (Eastern) | For display |
| `get_eastern_dow(timestamptz)` | UTC timestamp | integer (0-6) | 0=Mon, 6=Sun (not Postgres default) |

**NEVER do manual UTC offset math! Always use these helpers.**

---

## Employee Functions

| Function | Parameters | Returns |
|----------|------------|---------|
| `fetch_employees()` | none | All active employees |
| `get_employee_by_pin(p_pin)` | PIN string | Single employee or null |
| `fetch_availability()` | none | All availability records |

---

## Schedule Functions

| Function | Parameters | Returns |
|----------|------------|---------|
| `fetch_my_schedule(p_start_date, p_end_date, p_employee_id)` | dates, employee UUID | Employee's published shifts |
| `fetch_team_schedule(p_start_date, p_end_date)` | dates | All team published shifts |
| `fetch_schedule_builder_data(p_start_date, p_end_date)` | dates | Complete schedule builder JSON (employees, drafts, published, availability, time-offs, indexed by employee+day) |

---

## Shift Management

| Function | Parameters | Returns |
|----------|------------|---------|
| `create_shift(p_employee_id, p_start_time, p_end_time, p_location, p_role)` | shift data | New shift ID |
| `update_shift(p_shift_id, p_employee_id, p_start_time, p_end_time, p_location, p_role)` | shift ID + updates | Updated shift |
| `delete_shift(p_shift_id)` | shift ID | Boolean success |
| `publish_week(p_start_date, p_end_date, p_strict_mode)` | dates, strict flag | Moves drafts to published_shifts |
| `clear_draft_shifts(p_start_date, p_end_date)` | dates | Count of cleared drafts |

---

## Time-Off Functions

| Function | Parameters | Returns |
|----------|------------|---------|
| `fetch_my_time_off(p_employee_id)` | employee UUID | Employee's time-off requests |
| `fetch_timeoffs()` | none | All time-off requests |
| `submit_my_time_off(p_employee_id, p_start_date, p_end_date, p_all_day, p_start_time, p_end_time, p_reason)` | request data | New time-off record |

---

## Timesheet/Payroll Functions

| Function | Parameters | Returns |
|----------|------------|---------|
| `fetch_timesheet_data(p_employee_id, p_start_date, p_end_date)` | employee, dates | Hours + pay calculation |
| `fetch_payroll_data(p_start_date, p_end_date)` | dates | All employees, time entries, pay rates, payroll records |
| `fetch_currently_working()` | none | Currently clocked-in employees with clock_in_time |
| `fetch_incomplete_time_entries(p_employee_id, p_start_date, p_end_date)` | employee, dates | Unpaired clock events |
| `get_time_entries_et(p_start_date, p_end_date, p_employee_id)` | dates, optional employee | Time entries with ET formatting |
| `calculate_all_employee_hours(p_start_date, p_end_date, p_published_only)` | dates, flag | Hours per employee |

---

## Utility Functions

| Function | Trigger/Purpose |
|----------|-----------------|
| `auto_clock_out_after_12_hours()` | Automatic clock-out trigger |
| `update_draft_shifts_updated_at()` | Trigger for updated_at |
| `update_payroll_timestamp()` | Trigger for payroll updates |
| `detect_schedule_conflicts(p_start_date, p_end_date)` | Find shift/time-off conflicts |

---

## Accounting Functions

| Function | Parameters | Returns |
|----------|------------|---------|
| `accounting.fetch_transactions(p_start_date, p_end_date, p_account_id, p_category_id)` | dates, optional filters | Transactions with joins |
| `accounting.fetch_profit_loss(p_start_date, p_end_date)` | dates | Totals by category for P&L |
| `accounting.fetch_category_totals(p_start_date, p_end_date)` | dates | Schedule C line totals |
| `accounting.fetch_account_summary(p_start_date, p_end_date)` | dates | Debits/deposits/net by account |
