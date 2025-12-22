# Clock In/Out (`/clockinout`)

**File:** `src/clock-in-out/clock-in-out-page.tsx`

This is the kiosk-style terminal that runs on the iPad at each store. Employees walk up, punch in their 4-digit PIN, and the system either clocks them in or clocks them out depending on their current status.

---

## What's on the page

The screen is split into two columns:

**Left sidebar** has three widgets:
- A QR code linking to the Employee Portal (no database needed - just a static image)
- A calendar widget showing store operation status (pulls from `calendar_events` using `useGetCalendarEvents`)
- A "Recent Activity" panel showing the last 10 clock events across all employees

**Right side** is the main stage:
- A big clock showing current time
- A keypad for entering your PIN
- Success/error messages after clocking in or out

---

## How the database fits in

**When the page first loads:**
The system calls `get_recent_activity` to fetch the last 10 clock events from `time_entries`, joined with `employees` to get names. This populates the Recent Activity panel on the left.

**When someone enters their PIN:**
1. The system calls `get_employee_by_pin` to look up that PIN in the `employees` table
2. If found, it checks their last entry in `time_entries` to see if they're currently clocked in or out
3. Then it inserts a new record into `time_entries` with event_type = 'in' or 'out'
4. The Recent Activity panel updates automatically (there's a realtime subscription listening for new inserts)

**Offline support:**
If the WiFi goes down, clock events get saved to the browser's local storage (IndexedDB) and sync up when the connection comes back. Employees can still clock in/out even without internet.

---

## Tables used

| Table | What we do |
|-------|------------|
| `employees` | Read - look up employee by PIN |
| `time_entries` | Read + Write - check status, insert clock events, show recent activity |
| `calendar_events` | Read - calendar widget shows store operation status (closed/limited days, busy periods) |
