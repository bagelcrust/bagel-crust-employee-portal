/**
 * Role-based tab configuration
 *
 * Defines which tabs each employee role can access in the Employee Portal.
 *
 * ROLE PERMISSIONS:
 * - test: All tabs (for development/testing - sees everything)
 * - staff_one: Hours and Profile tabs (typically Spanish-speaking production staff)
 * - staff_two, cashier: Standard tabs (Schedule, Time Off, Hours, Profile)
 * - owner: Management tabs (Schedule, Payroll, Profile) - No Time Off or Hours
 */

export type TabKey = 'weeklySchedule' | 'timeOff' | 'timesheet' | 'payroll' | 'profile' | 'calendar'

export interface TabConfig {
  key: TabKey
  label: string
  iconName: 'calendar' | 'map-pin' | 'clock' | 'dollar-sign' | 'user' | 'calendar-days'
}

// Test role sees ALL tabs (for development/testing)
const TEST_TABS: TabConfig[] = [
  { key: 'weeklySchedule', label: 'Schedule', iconName: 'calendar' },
  { key: 'calendar', label: 'Calendar', iconName: 'calendar-days' },
  { key: 'timeOff', label: 'Time Off', iconName: 'map-pin' },
  { key: 'timesheet', label: 'Hours', iconName: 'clock' },
  { key: 'payroll', label: 'Payroll', iconName: 'dollar-sign' },
  { key: 'profile', label: 'Profile', iconName: 'user' }
]

// Standard tabs (staff_two, cashier, etc.)
const STANDARD_TABS: TabConfig[] = [
  { key: 'weeklySchedule', label: 'Schedule', iconName: 'calendar' },
  { key: 'timeOff', label: 'Time Off', iconName: 'map-pin' },
  { key: 'timesheet', label: 'Hours', iconName: 'clock' },
  { key: 'profile', label: 'Profile', iconName: 'user' }
]

// Owner gets Schedule, Payroll, and Profile (no Time Off or Hours for manager view)
const OWNER_TABS: TabConfig[] = [
  { key: 'weeklySchedule', label: 'Schedule', iconName: 'calendar' },
  { key: 'payroll', label: 'Payroll', iconName: 'dollar-sign' },
  { key: 'profile', label: 'Profile', iconName: 'user' }
]

// Staff 1 sees Calendar, Hours, and Profile tabs
const STAFF_ONE_TABS: TabConfig[] = [
  { key: 'calendar', label: 'Calendar', iconName: 'calendar-days' },
  { key: 'timesheet', label: 'Hours', iconName: 'clock' },
  { key: 'profile', label: 'Profile', iconName: 'user' }
]

/**
 * Get tabs accessible by a specific employee role
 *
 * @param role - Employee role from database
 * @returns Array of tab configurations the role can access
 */
export function getTabsForRole(role: string): TabConfig[] {
  // Normalize role: trim whitespace and convert to lowercase for comparison
  // Handle undefined/null roles gracefully
  const normalizedRole = role?.trim()?.toLowerCase()

  // Test role sees ALL tabs (for development/testing)
  if (normalizedRole === 'test') {
    return TEST_TABS
  }

  // Staff 1 gets Hours and Profile tabs
  if (normalizedRole === 'staff_one') {
    return STAFF_ONE_TABS
  }

  // Owner gets management tabs (Schedule, Payroll, Profile)
  // No Time Off or Hours tabs - those are for employees to track their own data
  if (normalizedRole === 'owner') {
    return OWNER_TABS
  }

  // Everyone else gets standard tabs (Schedule, Time Off, Hours, Profile)
  return STANDARD_TABS
}

/**
 * Get the default tab for a role (first available tab)
 *
 * @param role - Employee role from database
 * @returns Default tab key for the role
 */
export function getDefaultTabForRole(role: string): TabKey {
  const tabs = getTabsForRole(role)
  return tabs[0].key
}

/**
 * Check if a specific tab is available for a role
 *
 * @param role - Employee role from database
 * @param tabKey - Tab key to check
 * @returns true if tab is available for the role
 */
export function isTabAvailableForRole(role: string, tabKey: TabKey): boolean {
  const tabs = getTabsForRole(role)
  return tabs.some(tab => tab.key === tabKey)
}

/**
 * Validate and fix active tab based on role permissions
 * If current tab is not available, returns default tab for role
 *
 * @param role - Employee role from database
 * @param currentTab - Current active tab
 * @returns Valid tab key for the role
 */
export function validateTabForRole(role: string, currentTab: TabKey): TabKey {
  if (isTabAvailableForRole(role, currentTab)) {
    return currentTab
  }
  return getDefaultTabForRole(role)
}
