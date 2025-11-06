/*
 * =============================================================================
 * GRANT SERVICE_ROLE PERMISSIONS ON EMPLOYEES SCHEMA
 * =============================================================================
 *
 * Date: 2025-11-06
 *
 * PROBLEM:
 * Edge Functions use SUPABASE_SERVICE_ROLE_KEY but were getting this error:
 * "permission denied for schema employees"
 *
 * ROOT CAUSE:
 * When you create a custom schema (like 'employees'), PostgreSQL does NOT
 * automatically grant permissions to service_role. You must explicitly grant them.
 *
 * The 'public' schema auto-grants permissions to anon/authenticated/service_role,
 * but custom schemas require manual GRANT statements.
 *
 * SOLUTION:
 * Grant full permissions to service_role on the employees schema.
 * This allows Edge Functions to access tables, functions, and sequences.
 *
 * AFFECTED EDGE FUNCTIONS:
 * - clock-terminal-data
 * - employee-portal-data
 * - schedule-builder-data
 * - timesheets-data
 *
 * =============================================================================
 */

-- Grant usage on the employees schema itself
GRANT USAGE ON SCHEMA employees TO service_role;

-- Grant all table permissions (SELECT, INSERT, UPDATE, DELETE)
GRANT ALL ON ALL TABLES IN SCHEMA employees TO service_role;

-- Grant usage on sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA employees TO service_role;

-- Grant execute permissions on all functions (RPC functions)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA employees TO service_role;

-- Apply permissions to future objects created in this schema
-- This prevents the same issue from happening when new tables/functions are added
ALTER DEFAULT PRIVILEGES IN SCHEMA employees
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA employees
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA employees
  GRANT EXECUTE ON FUNCTIONS TO service_role;

/*
 * =============================================================================
 * FUTURE REFERENCE
 * =============================================================================
 *
 * If you create a new custom schema, remember to grant permissions:
 *
 * CREATE SCHEMA my_new_schema;
 *
 * GRANT USAGE ON SCHEMA my_new_schema TO service_role;
 * GRANT ALL ON ALL TABLES IN SCHEMA my_new_schema TO service_role;
 * GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA my_new_schema TO service_role;
 *
 * ALTER DEFAULT PRIVILEGES IN SCHEMA my_new_schema
 *   GRANT ALL ON TABLES TO service_role;
 *
 * OR... just use the 'public' schema for new features to avoid this entirely!
 *
 * =============================================================================
 */
