# Inventory Feature Status

## What Works
- Counting sessions (start/resume/submit)
- On Hand + Order quantities with auto-save
- Order summary on dashboard cards
- Submit button changes status to 'submitted'

## Files
- `tab-inventory.tsx` - Main container
- `InventoryDashboard.tsx` - Session list + submit
- `ActiveCountView.tsx` - Counting UI
- `InventoryItemRow.tsx` - Item card with steppers
- `useInventorySession.ts` - Data hook

## Database (inventory schema)
- `items` - 183 items
- `count_sessions` - Sessions (draft/submitted)
- `stock_counts` - Counts per item
- `vendors` - 10 vendors
- `item_vendor_prices` - 189 records with price, unit_size, units_per_case

## What's Missing

### Smart Units
Want: "2 cases (8 gallons)" instead of just "2"

**Blocker**: Need vendor selection first - same item has different units per vendor:
- Oat Milk/Sysco: 12 per case
- Oat Milk/Walmart: 1 per case

### Vendor Selection
Data exists in `item_vendor_prices` and `vendor_preferences` tables. Need UI to select which vendor for each order.

## Source Data
`/bagelcrust/other-files/uploads/inventory-all-items.json`
