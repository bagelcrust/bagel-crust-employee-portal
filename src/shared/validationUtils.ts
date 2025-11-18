/**
 * Form validation utilities for Employee Portal
 *
 * Provides reusable validation functions for forms
 * with consistent error messages
 */

import { logCondition, logData } from './debug-utils';

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
  logData('validateTimeOffDates', 'Input', { startDate, endDate });

  // Check if both dates are provided
  const hasBothDates = !!startDate && !!endDate;
  logCondition('validateTimeOffDates', 'Has both dates', hasBothDates, { startDate, endDate });

  if (!hasBothDates) {
    logData('validateTimeOffDates', 'Validation failed - missing dates', { isValid: false });
    return {
      isValid: false,
      errorMessage: 'Please select both start and end dates'
    }
  }

  // Check if end date is after start date
  const start = new Date(startDate)
  const end = new Date(endDate)
  const validRange = end >= start;

  logCondition('validateTimeOffDates', 'Valid date range (end >= start)', validRange, { start, end });

  if (!validRange) {
    logData('validateTimeOffDates', 'Validation failed - invalid range', { isValid: false, start, end });
    return {
      isValid: false,
      errorMessage: 'End date must be after start date'
    }
  }

  logData('validateTimeOffDates', 'Validation passed', { isValid: true });
  return { isValid: true }
}

/**
 * Validate employee ID exists
 *
 * @param employeeId - Employee ID to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmployeeId(employeeId: string | undefined | null): ValidationResult {
  const hasEmployeeId = !!employeeId;
  logCondition('validateEmployeeId', 'Has employee ID', hasEmployeeId, { employeeId });

  if (!hasEmployeeId) {
    logData('validateEmployeeId', 'Validation failed - no employee ID', { isValid: false });
    return {
      isValid: false,
      errorMessage: 'Employee ID is required'
    }
  }

  logData('validateEmployeeId', 'Validation passed', { isValid: true, employeeId });
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
  logData('validateTimeOffRequest', 'Input', { startDate, endDate, employeeId });

  // Validate employee ID first
  const employeeIdValidation = validateEmployeeId(employeeId)
  logCondition('validateTimeOffRequest', 'Employee ID valid', employeeIdValidation.isValid);

  if (!employeeIdValidation.isValid) {
    logData('validateTimeOffRequest', 'Failed at employee ID check', employeeIdValidation);
    return employeeIdValidation
  }

  // Then validate dates
  const dateValidation = validateTimeOffDates(startDate, endDate);
  logData('validateTimeOffRequest', 'Final result', dateValidation);
  return dateValidation;
}

/**
 * Validate PIN code format
 *
 * @param pin - PIN string to validate
 * @returns Validation result with error message if invalid
 */
export function validatePinFormat(pin: string): ValidationResult {
  logData('validatePinFormat', 'Input', { pin, length: pin?.length });

  const hasPin = !!pin;
  logCondition('validatePinFormat', 'Has PIN', hasPin);

  if (!hasPin) {
    logData('validatePinFormat', 'Validation failed - no PIN', { isValid: false });
    return {
      isValid: false,
      errorMessage: 'PIN is required'
    }
  }

  const hasMinLength = pin.length >= 4;
  logCondition('validatePinFormat', 'PIN length >= 4', hasMinLength, { length: pin.length });

  if (!hasMinLength) {
    logData('validatePinFormat', 'Validation failed - too short', { isValid: false, length: pin.length });
    return {
      isValid: false,
      errorMessage: 'PIN must be at least 4 digits'
    }
  }

  const isNumeric = /^\d+$/.test(pin);
  logCondition('validatePinFormat', 'PIN is numeric', isNumeric, { pin });

  if (!isNumeric) {
    logData('validatePinFormat', 'Validation failed - not numeric', { isValid: false, pin });
    return {
      isValid: false,
      errorMessage: 'PIN must contain only numbers'
    }
  }

  logData('validatePinFormat', 'Validation passed', { isValid: true });
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
  const isValid = endDate >= startDate;
  logCondition('isValidDateRange', 'Valid range', isValid, { startDate, endDate });
  return isValid;
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
  const isFuture = date > now;
  logCondition('isFutureDate', 'Is future date', isFuture, { date, now });
  return isFuture;
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
  const isPast = date < now;
  logCondition('isPastDate', 'Is past date', isPast, { date, now });
  return isPast;
}
