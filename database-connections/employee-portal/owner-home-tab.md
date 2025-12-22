# Owner Home Tab

**File:** `src/employee-portal/owner-home/tab-owner-home.tsx`

A dashboard that combines Time Logs (problem shifts) and Team Schedule in one view. Just pulls from the same sources as those individual tabs.

---

## Tables used

| Table | What we do |
|-------|------------|
| `time_entries` | Read - problem shifts via Time Logs |
| `published_shifts` | Read - team schedule |
| `employees` | Read - names |
