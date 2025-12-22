# Shared API Modules

**File:** `src/shared/supabase-client.ts`

All API modules use `.schema('employees')` for table queries.

---

## employeeApi

| Function | Tables | Operation | Returns |
|----------|--------|-----------|---------|
| `getAll()` | employees | SELECT | All active employees, ordered by first_name |
| `getByPin(pin)` | employees | SELECT | Single employee matching PIN (or null) |

---

## timeclockApi

| Function | Tables | Operation | Returns |
|----------|--------|-----------|---------|
| `getLastEvent(employeeId)` | time_entries | SELECT | Most recent clock event for employee |
| `clockInOut(employeeId)` | time_entries | INSERT | New time entry (determines in/out from last event) |
| `getEventsInRange(start, end)` | time_entries + employees | SELECT + JOIN | Events with employee info |
| `getEventsInRangeET(start, end)` | time_entries | RPC | Events with Eastern Time formatting |
| `getCurrentlyWorking()` | - | RPC | Currently clocked-in employees (optimized) |
| `getRecentEvents(limit)` | time_entries + employees | SELECT + JOIN | Last N events with employee info |
| `getRecentEventsET(limit)` | - | RPC | Recent events with pre-formatted ET timestamps |

---

## scheduleBuilderRpc

| Function | Tables | Operation | Returns |
|----------|--------|-----------|---------|
| `getData(start, end)` | draft_shifts, published_shifts, employees, availability, time_off_notices | RPC | Complete schedule builder data |
| `createShift(data)` | draft_shifts | RPC | New shift ID |
| `updateShift(id, updates)` | draft_shifts | RPC | Updated shift |
| `deleteShift(id)` | draft_shifts | RPC | Boolean success |
| `publishWeek(start, end, strict)` | draft_shifts → published_shifts | RPC | Publication result |
| `clearDrafts(start, end)` | draft_shifts | RPC | Count cleared |

---

## payRatesApi

| Function | Tables | Operation | Returns |
|----------|--------|-----------|---------|
| `getAll()` | pay_rates | SELECT | All pay rates |
| `getByEmployeeId(id)` | pay_rates | SELECT | Most recent rate for employee |
| `getAllWithEmployees()` | pay_rates + employees | SELECT + JOIN | Pay rates with employee info |

---

## Standalone Functions

| Function | Tables | Operation | Returns |
|----------|--------|-----------|---------|
| `calculatePayrollRpc(empId, start, end)` | time_entries, pay_rates | RPC | Timesheet data with hours + pay |
| `fetchPayrollDataRpc(start, end)` | employees, time_entries, pay_rates, payroll_records | RPC | All payroll data for date range |

---

## employeeRpc

| Function | Tables | Operation | Returns |
|----------|--------|-----------|---------|
| `getAll(activeOnly)` | employees | RPC | All employees |
| `getByPin(pin)` | employees | RPC | Single employee by PIN |
