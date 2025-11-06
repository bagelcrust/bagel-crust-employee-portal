/**
 * Form validation utilities for Employee Portal
 *
 * Provides reusable validation functions for forms
 * with consistent error messages
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
}

/**
 * Validate time off request dates
 *
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Validation result with error message if invalid
 */
export function validateTimeOffDates(
  startDate: string,
  endDate: string
): ValidationResult {
  // Check if both dates are provided
  if (!startDate || !endDate) {
    return {
      isValid: false,
      errorMessage: 'Please select both start and end dates'
    }
  }

  // Check if end date is after start date
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (end < start) {
    return {
      isValid: false,
      errorMessage: 'End date must be after start date'
    }
  }

  return { isValid: true }
}

/**
 * Validate employee ID exists
 *
 * @param employeeId - Employee ID to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmployeeId(employeeId: string | undefined | null): ValidationResult {
  if (!employeeId) {
    return {
      isValid: false,
      errorMessage: 'Employee ID is required'
    }
  }

  return { isValid: true }
}

/**
 * Validate time off request form
 *
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param employeeId - Employee ID
 * @returns Validation result with error message if invalid
 */
export function validateTimeOffRequest(
  startDate: string,
  endDate: string,
  employeeId: string | undefined | null
): ValidationResult {
  // Validate employee ID first
  const employeeIdValidation = validateEmployeeId(employeeId)
  if (!employeeIdValidation.isValid) {
    return employeeIdValidation
  }

  // Then validate dates
  return validateTimeOffDates(startDate, endDate)
}

/**
 * Validate PIN code format
 *
 * @param pin - PIN string to validate
 * @returns Validation result with error message if invalid
 */
export function validatePinFormat(pin: string): ValidationResult {
  if (!pin) {
    return {
      isValid: false,
      errorMessage: 'PIN is required'
    }
  }

  if (pin.length < 4) {
    return {
      isValid: false,
      errorMessage: 'PIN must be at least 4 digits'
    }
  }

  if (!/^\d+$/.test(pin)) {
    return {
      isValid: false,
      errorMessage: 'PIN must contain only numbers'
    }
  }

  return { isValid: true }
}

/**
 * Check if a date range is valid (end after start)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns true if valid range
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return endDate >= startDate
}

/**
 * Check if a date is in the future
 *
 * @param date - Date to check
 * @returns true if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Reset to start of day for comparison
  return date > now
}

/**
 * Check if a date is in the past
 *
 * @param date - Date to check
 * @returns true if date is in the past
 */
export function isPastDate(date: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Reset to start of day for comparison
  return date < now
}
