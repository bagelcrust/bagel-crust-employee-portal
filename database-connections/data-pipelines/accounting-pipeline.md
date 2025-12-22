# Accounting Pipeline (Bank Statement Import)

This is not a page in the app - it's a backend process for getting bank statement data into the database and categorizing it for tax purposes.

---

## What this does

Takes raw bank statements (CSV exports) and transforms them into categorized transactions ready for P&L reports and tax filing.

---

## How the database fits in

**When a bank statement CSV is imported:**
1. A record is created in `00_import_batches` to track the file
2. Each row from the CSV is inserted into `02_raw_transactions`
3. The insert triggers `on_raw_transaction_insert`
4. That trigger calls `match_transaction` to find a matching pattern
5. `match_transaction` looks through `03_vendor_patterns` (longest patterns first)
6. If a pattern matches, it gets the vendor from `04_vendors`
7. The vendor has a default category from `05_tax_categories`
8. A new record is created in `06_categorized_transactions` with vendor + category
9. The trigger `on_categorized_transaction_insert` fires for any post-processing

**When someone adds a new pattern:**
1. Pattern is inserted into `03_vendor_patterns`
2. Trigger `on_pattern_insert` fires
3. System re-scans `02_raw_transactions` for any transactions that now match this pattern
4. Those transactions get updated in `06_categorized_transactions`

**When someone changes a pattern's vendor:**
1. Update happens in `03_vendor_patterns`
2. Trigger `on_pattern_vendor_change` fires
3. All transactions that used this pattern get their vendor updated in `06_categorized_transactions`

**When someone changes a vendor's default category:**
1. Update happens in `04_vendors`
2. Trigger `on_vendor_category_change` fires
3. All transactions for that vendor get their category updated in `06_categorized_transactions`

**When you need to re-run everything:**
Call `recategorize_all()` - it re-matches every transaction from scratch.

**When the accountant views data:**
They query `07_transactions_final` which joins everything together into one readable view.

---

## Tables used (accounting schema)

| Table | Records | What it does |
|-------|---------|--------------|
| `00_import_batches` | - | Tracks each CSV import session |
| `01_accounts` | 3 | Bank accounts (BC Out, Payroll & Tax, All-In) |
| `02_raw_transactions` | 11,377 | Raw bank data - NEVER modified |
| `03_vendor_patterns` | 1,135 | Pattern matching rules |
| `04_vendors` | 636 | Vendor directory with default categories |
| `05_tax_categories` | 64 | IRS Schedule C categories |
| `06_categorized_transactions` | 11,377 | Enriched transactions with vendor + category |
| `bank_statement_summaries` | 82 | Monthly statement totals |

---

## Views

| View | What it shows |
|------|---------------|
| `07_transactions_final` | Main output - all transactions with vendor and category |
| `08_uncategorized` | Transactions that couldn't be matched |

---

## Key principles

1. **Raw data is sacred** - Never edit `02_raw_transactions`. If something's wrong, fix it in `06_categorized_transactions` with an override.

2. **Pattern priority** - Longer patterns match first. "SHELL OIL 57432" beats "SHELL" because it's more specific.

3. **Manual overrides don't erase system matches** - The system's guess is preserved even if you override it. You can always see what it originally matched.
