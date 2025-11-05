-- Grant permissions to anon role for employees schema
-- Run this in Supabase SQL Editor

-- Grant usage on schema
GRANT USAGE ON SCHEMA employees TO anon;

-- Grant SELECT on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA employees TO anon;

-- Grant INSERT on time_entries (for clock in/out)
GRANT INSERT ON employees.time_entries TO anon;

-- Grant future permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA employees
  GRANT SELECT ON TABLES TO anon;

-- Verify grants (optional - just to check)
SELECT
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_schema = 'employees'
ORDER BY table_name, privilege_type;
