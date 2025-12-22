# Database Schema

**All tables are in the `employees` schema (NOT `public`)**

---

## employees.employees

Employee master data (24 records)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PRIMARY KEY |
| `employee_code` | text | e.g., "emp_020" |
| `first_name` | text | Required |
| `last_name` | text | Nullable |
| `email` | text | Nullable |
| `hire_date` | date | Nullable |
| `active` | boolean | Default: true |
| `location` | text | e.g., "Calder" |
| `role` | text | e.g., "staff_two", "manager", "owner" |
| `pay_schedule` | text | e.g., "Bi-weekly" |
| `pin` | text | 4-digit clock-in PIN |
| `phone_number` | text | |
| `user_id` | uuid | Links to auth.users |
| `preferred_language` | varchar | Default: 'en' |

---

## employees.availability

Employee availability windows by day of week

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PRIMARY KEY |
| `employee_id` | uuid | → employees.id |
| `day_of_week` | enum | 'monday', 'tuesday', etc. (lowercase) |
| `start_time` | time | e.g., "07:00:00" |
| `end_time` | time | e.g., "23:59:00" |
| `effective_start_date` | date | |

---

## employees.time_entries

Clock in/out events (731+ records)

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PRIMARY KEY |
| `employee_id` | uuid | → employees.id |
| `event_type` | text | 'in' or 'out' |
| `event_timestamp` | timestamptz | **UTC - convert to Eastern!** |
| `manually_edited` | boolean | Default: false |

---

## employees.pay_rates

Hourly rates (24+ records)

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PRIMARY KEY |
| `employee_id` | uuid | → employees.id |
| `current_rate` | numeric | Hourly wage |
| `pay_type` | text | Default: 'hourly' |
| `effective_date` | date | |
| `payment_method` | text | Default: 'cash' |
| `pay_schedule` | text | |
| `tax_classification` | text | |

---

## employees.draft_shifts

Draft schedule - manager workspace (not visible to employees)

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PRIMARY KEY (auto-increment) |
| `employee_id` | uuid | → employees.id |
| `start_time` | timestamptz | **UTC** |
| `end_time` | timestamptz | **UTC** |
| `location` | text | |
| `role` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## employees.published_shifts

Published schedule - visible to employees

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PRIMARY KEY |
| `employee_id` | uuid | → employees.id |
| `start_time` | timestamptz | **UTC** |
| `end_time` | timestamptz | **UTC** |
| `location` | text | |
| `role` | text | |
| `shift_status` | text | 'assigned' or 'open' |
| `published_at` | timestamptz | |
| `week_start` | date | |
| `week_end` | date | |

---

## employees.time_off_notices

Time-off requests

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PRIMARY KEY |
| `employee_id` | uuid | → employees.id |
| `start_date` | date | |
| `end_date` | date | |
| `all_day` | boolean | |
| `start_time_only` | time | For partial day |
| `end_time_only` | time | For partial day |
| `reason` | text | |
| `status` | text | 'pending', 'approved', 'denied' |
| `requested_date` | timestamptz | |
| `requested_via` | text | |
| `source_text` | text | |

---

## employees.payroll_records

Processed payroll data

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PRIMARY KEY (auto-increment) |
| `employee_id` | uuid | → employees.id |
| `pay_period_start` | date | |
| `pay_period_end` | date | |
| `total_hours` | numeric | |
| `hourly_rate` | numeric | |
| `gross_pay` | numeric | |
| `deductions` | numeric | Default: 0 |
| `net_pay` | numeric | |
| `payment_date` | date | |
| `payment_method` | text | |
| `check_number` | text | |
| `status` | text | Default: 'pending' |
| `payment_type` | text | Default: 'regular' |
| `pay_rate_id` | bigint | |
| `notes` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## Accounting Schema (separate schema)

**Schema: `accounting`** - Bank transactions & tax categorization

| Table | Records | Purpose |
|-------|---------|---------|
| `accounting.accounts` | 3 | Bank account definitions |
| `accounting.categories` | 70 | Tax categories for Schedule C |
| `accounting.vendors` | 395 | Vendor reference with aliases |
| `accounting.tax_rules` | 79 | Categorization logic |
| `accounting.transactions` | 10,496 | Bank transactions (Jan 2024 - Oct 2025) |
