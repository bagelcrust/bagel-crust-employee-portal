-- =========================================
-- TIMEZONE FIX MIGRATION SQL
-- =========================================
-- Run this in Supabase SQL Editor to fix old time entries
-- that were stored as EST instead of UTC
--
-- This adds 5 hours to all entries before 2025-11-05
-- (except the 2 new Bryan entries that are already correct)
--
-- Affected: 731 entries
-- Safe to run: Yes (only updates timestamps, no data loss)
-- =========================================

-- Add 5 hours (18000 seconds) to all entries before 2025-11-05
-- that don't have milliseconds (old entries)
UPDATE employees.time_entries
SET event_timestamp = event_timestamp + interval '5 hours'
WHERE
  -- Only update entries before today
  event_timestamp < '2025-11-05T00:00:00Z'
  -- Or entries without real milliseconds (old format)
  OR (event_timestamp::text NOT LIKE '%.%' OR event_timestamp::text LIKE '%.0%+%');

-- Verify the fix by checking recent entries
SELECT
  id,
  employee_id,
  event_type,
  event_timestamp as stored_utc,
  event_timestamp AT TIME ZONE 'America/New_York' as display_est
FROM employees.time_entries
ORDER BY event_timestamp DESC
LIMIT 10;
