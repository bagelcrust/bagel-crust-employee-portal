# P&L Tab (Accountant Only)

**File:** `src/employee-portal/pl/tab-pl.tsx`

Profit & Loss statement showing revenue, cost of goods, and expenses grouped by tax category.

---

## What's on the page

- Period selector (full year or individual month)
- Revenue section with totals
- Cost of Goods section with vendor breakdown
- Expenses section grouped by Schedule C categories
- Each line item expands to show individual transactions

---

## How the database fits in

**When you open the tab:**
1. You select a period (e.g., "Full Year 2025" or "November 2025")
2. System calls `get_pnl_summary` in the `accounting` schema
3. That function aggregates all categorized transactions for the date range
4. Returns totals grouped by: revenue sources, COGS vendors, expense categories
5. The tab displays the summary with expandable sections

**When you tap a line item to drill down:**
1. System calls `fetchTransactionsBySubcategory`
2. Queries `07_transactions_final` view filtered by that category/vendor
3. Returns individual transactions (date, description, amount)
4. Shows up to 10 transactions under that line item

---

## Tables/Views used (accounting schema)

| Table/View | What we do |
|------------|------------|
| `get_pnl_summary` (function) | Aggregates transactions into P&L format |
| `07_transactions_final` (view) | Read - individual transactions for drilldown |

---

## Connection to Accounting Pipeline

This tab is the "output" end of the accounting pipeline:
- Bank statements get imported → categorized → this tab displays the results
- See `data-pipelines/accounting-pipeline.md` for how data gets here
