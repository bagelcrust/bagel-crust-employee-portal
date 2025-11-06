/**
 * Application-wide constants for Bagel Crust Employee Portal
 *
 * Centralizes magic strings and numbers for maintainability
 */

// ============================================================================
// PAGE TITLES
// ============================================================================
export const PAGE_TITLES = {
  EMPLOYEE_PORTAL: 'Bagel Crust - Employee Portal',
  CLOCK_IN_OUT: 'Bagel Crust - Time Clock',
  ADMIN: 'Bagel Crust - Admin',
  TIMESHEETS: 'Bagel Crust - Timesheets',
  SCHEDULE: 'Bagel Crust - Schedule',
  SCHEDULE_BUILDER: 'Bagel Crust - Schedule Builder'
} as const

// ============================================================================
// ROLES
// ============================================================================
export const ROLES = {
  OWNER: 'Owner',
  STAFF: 'Staff',
  STAFF_ONE: 'staff_one',
  STAFF_TWO: 'staff_two',
  CASHIER: 'cashier'
} as const

// ============================================================================
// LANGUAGES
// ============================================================================
export const LANGUAGES = {
  ENGLISH: 'en',
  SPANISH: 'es'
} as const

// ============================================================================
// DEFAULT VALUES
// ============================================================================
export const DEFAULTS = {
  LANGUAGE: LANGUAGES.ENGLISH,
  LOADING_DELAY_MS: 300,
  ANIMATION_DURATION_MS: 200
} as const

// ============================================================================
// TIME OFF REQUEST STATUS
// ============================================================================
export const TIME_OFF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied'
} as const

// ============================================================================
// ALERT MESSAGES
// ============================================================================
export const ALERTS = {
  TIME_OFF: {
    SUCCESS: 'Time off request submitted!',
    FAILED: 'Failed to submit request'
  },
  LOGIN: {
    INVALID_PIN: 'Invalid PIN. Please try again.',
    ERROR: 'Login error. Please try again.'
  },
  VALIDATION: {
    MISSING_DATES: 'Please select both start and end dates',
    INVALID_DATE_RANGE: 'End date must be after start date',
    MISSING_EMPLOYEE_ID: 'Employee ID is required'
  }
} as const

// ============================================================================
// LOADING MESSAGES
// ============================================================================
export const LOADING_MESSAGES = {
  SCHEDULE: 'Loading schedule...',
  TIMESHEET: 'Loading timesheet...',
  TEAM_SCHEDULE: 'Loading team schedule...',
  LOGGING_IN: 'Verifying...',
  SUBMITTING: 'Submitting...'
} as const

// ============================================================================
// PWA SAFE AREA INSETS (CSS values)
// ============================================================================
export const SAFE_AREA = {
  TOP_PADDING: 'calc(env(safe-area-inset-top,0px)+12px)',
  BOTTOM_PADDING: 'calc(96px+env(safe-area-inset-bottom,0px))',
  BOTTOM_NAV_PADDING: 'calc(4px+env(safe-area-inset-bottom,0px))'
} as const

// ============================================================================
// API ENDPOINTS (if needed in future)
// ============================================================================
export const API_ENDPOINTS = {
  EMPLOYEES: '/employees',
  TIME_ENTRIES: '/time_entries',
  SHIFTS: '/shifts',
  TIME_OFF: '/time_off_requests'
} as const

// ============================================================================
// SCHEDULE BUILDER
// ============================================================================
export const SCHEDULE_MESSAGES = {
  PUBLISH_CONFIRM: "Publish this week's schedule? Employees will be able to see their shifts.",
  DELETE_SHIFT_CONFIRM: 'Delete this shift?',
  PUBLISH_SUCCESS: 'Schedule published successfully!',
  PUBLISH_ERROR: 'Error publishing schedule',
  DELETE_ERROR: 'Error deleting shift',
  LOADING_SCHEDULE: 'Loading schedule...',
  NO_EMPLOYEES: 'No employees found',
  NO_SHIFTS: 'No shifts scheduled'
} as const

export const SHIFT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  COMPLETED: 'completed'
} as const

export const LOCATIONS = {
  CALDER: 'Calder',
  BEAVER: 'Beaver',
  BAGEL_CRUST: 'Bagel Crust'
} as const
