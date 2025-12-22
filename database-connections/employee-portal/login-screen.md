# Login Screen

**File:** `src/employee-portal/login-screen.tsx`

This is the first thing employees see when they open the Employee Portal on their phone. A simple keypad where you enter your 4-digit PIN.

---

## What's on the page

- Bagel Crust logo and "Employee Portal" header
- A message saying "Enter your PIN"
- A keypad with numbers 0-9
- Error message area (shows "Invalid PIN" if wrong)

---

## How the database fits in

**When the page first loads:**
Nothing happens with the database yet. The keypad just waits for you to enter your PIN.

**When you enter your 4-digit PIN:**
1. The keypad auto-submits after you tap the 4th digit
2. System calls `get_employee_by_pin` to look up your PIN in the `employees` table
3. If PIN doesn't match anyone → shows "Invalid PIN" error, keypad resets
4. If PIN matches → pulls back your name, role, location, and other info
5. Your role decides which tabs you see:
   - **Staff**: Schedule, Time Off, Hours, Profile
   - **Owner**: Everything above + Time Logs, Payroll, Inventory
   - **Accountant**: P&L, Wages, Documents
6. Behind the scenes, we quietly log that you signed in (writes to `login_log`)

---

## Tables used

| Table | What we do |
|-------|------------|
| `employees` | Read - look up PIN, get name/role/location |
| `login_log` | Write - record that you logged in (for tracking) |
