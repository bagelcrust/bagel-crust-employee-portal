/**
 * Role-based tab configuration
 *
 * Defines which tabs each employee role can access in the Employee Portal.
 *
 * ROLE PERMISSIONS:
 * - staff_one: Only Hours tab (typically Spanish-speaking production staff)
 * - staff_two, Staff, Owner, cashier: All tabs (Schedule, Time Off, Hours, Profile)
 */

export type TabKey = 'weeklySchedule' | 'timeOff' | 'timesheet' | 'profile'

export interface TabConfig {
  key: TabKey
  label: string
  iconName: 'calendar' | 'map-pin' | 'clock' | 'user'
}

// All available tabs
const ALL_TABS: TabConfig[] = [
  { key: 'weeklySchedule', label: 'Schedule', iconName: 'calendar' },
  { key: 'timeOff', label: 'Time Off', iconName: 'map-pin' },
  { key: 'timesheet', label: 'Hours', iconName: 'clock' },
  { key: 'profile', label: 'Profile', iconName: 'user' }
]

// Staff 1 only sees Hours tab
const STAFF_ONE_TABS: TabConfig[] = [
  { key: 'timesheet', label: 'Hours', iconName: 'clock' }
]

/**
 * Get tabs accessible by a specific employee role
 *
 * @param role - Employee role from database
 * @returns Array of tab configurations the role can access
 */
export function getTabsForRole(role: string): TabConfig[] {
  // Staff 1 only gets Hours tab
  if (role === 'staff_one') {
    return STAFF_ONE_TABS
  }

  // Everyone else gets all tabs
  return ALL_TABS
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
