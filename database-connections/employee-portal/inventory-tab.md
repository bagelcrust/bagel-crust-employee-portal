# Inventory Tab (Owner Only)

**File:** `src/employee-portal/inventory/tab-inventory.tsx`

For counting stock at each store. Pick a location (Calder or Beaver), and go through the list counting items.

---

## How it works

Uses a separate `inventory` schema (not `employees`). When you start a count:

1. Creates a new "session" in `inventory.count_sessions`
2. Loads all items for that location from `inventory.items`
3. As you enter counts, they save to `inventory.stock_counts` with a slight delay (debounced so it doesn't save on every keystroke)

You can also edit item details if something's wrong (name, variety, units).

---

## Tables used

| Table | What we do |
|-------|------------|
| `inventory.count_sessions` | Read + Write - create/resume counting sessions |
| `inventory.items` | Read + Write - list of items, can edit details |
| `inventory.stock_counts` | Read + Write - the actual counts you enter |
