/**
 * TYPE GUARDS FOR API RESPONSES
 *
 * Runtime validation to ensure API responses match expected types.
 * TypeScript only checks types at compile time - these check at runtime.
 *
 * Benefits:
 * - Catch API schema changes immediately
 * - Prevent undefined errors from missing fields
 * - Better error messages when data is malformed
 *
 * Use these before using API response data in your app.
 */

import type { Employee, TimeEntry, Shift, TimeOff } from './supabase-client';
import { logger } from './logger';

/**
 * Check if value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Check if value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Check if value is a boolean
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for Employee
 *
 * Example:
 *   const data = await supabase.from('employees').select('*').single();
 *   if (!isEmployee(data)) {
 *     throw new Error('Invalid employee data');
 *   }
 *   // Now TypeScript knows data is Employee
 */
export function isEmployee(value: unknown): value is Employee {
  if (!isObject(value)) {
    logger.warn('isEmployee: value is not an object', value);
    return false;
  }

  const required = {
    id: isString(value.id),
    employee_code: isString(value.employee_code),
    first_name: isString(value.first_name),
    active: isBoolean(value.active),
    location: isString(value.location),
    role: isString(value.role),
    pay_schedule: isString(value.pay_schedule),
    pin: isString(value.pin),
    user_id: isString(value.user_id)
  };

  // Check required fields
  for (const [field, isValid] of Object.entries(required)) {
    if (!isValid) {
      logger.warn(`isEmployee: missing or invalid field "${field}"`, value);
      return false;
    }
  }

  return true;
}

/**
 * Type guard for array of Employees
 */
export function isEmployeeArray(value: unknown): value is Employee[] {
  if (!Array.isArray(value)) {
    logger.warn('isEmployeeArray: value is not an array', value);
    return false;
  }

  return value.every(isEmployee);
}

/**
 * Type guard for TimeEntry
 */
export function isTimeEntry(value: unknown): value is TimeEntry {
  if (!isObject(value)) {
    logger.warn('isTimeEntry: value is not an object', value);
    return false;
  }

  const valid =
    isNumber(value.id) &&
    isString(value.employee_id) &&
    (value.event_type === 'in' || value.event_type === 'out') &&
    isString(value.event_timestamp);

  if (!valid) {
    logger.warn('isTimeEntry: invalid time entry data', value);
  }

  return valid;
}

/**
 * Type guard for array of TimeEntries
 */
export function isTimeEntryArray(value: unknown): value is TimeEntry[] {
  if (!Array.isArray(value)) {
    logger.warn('isTimeEntryArray: value is not an array', value);
    return false;
  }

  return value.every(isTimeEntry);
}

/**
 * Type guard for Shift
 */
export function isShift(value: unknown): value is Shift {
  if (!isObject(value)) {
    logger.warn('isShift: value is not an object', value);
    return false;
  }

  const valid =
    isNumber(value.id) &&
    (value.employee_id === null || isString(value.employee_id)) &&
    isString(value.start_time) &&
    isString(value.end_time) &&
    isString(value.location) &&
    (value.status === 'draft' || value.status === 'published');

  if (!valid) {
    logger.warn('isShift: invalid shift data', value);
  }

  return valid;
}

/**
 * Type guard for array of Shifts
 */
export function isShiftArray(value: unknown): value is Shift[] {
  if (!Array.isArray(value)) {
    logger.warn('isShiftArray: value is not an array', value);
    return false;
  }

  return value.every(isShift);
}

/**
 * Type guard for TimeOff
 */
export function isTimeOff(value: unknown): value is TimeOff {
  if (!isObject(value)) {
    logger.warn('isTimeOff: value is not an object', value);
    return false;
  }

  const valid =
    isNumber(value.id) &&
    isString(value.employee_id) &&
    isString(value.start_time) &&
    isString(value.end_time) &&
    isString(value.status);

  if (!valid) {
    logger.warn('isTimeOff: invalid time off data', value);
  }

  return valid;
}

/**
 * Type guard for array of TimeOffs
 */
export function isTimeOffArray(value: unknown): value is TimeOff[] {
  if (!Array.isArray(value)) {
    logger.warn('isTimeOffArray: value is not an array', value);
    return false;
  }

  return value.every(isTimeOff);
}

/**
 * Safe parser for API responses
 *
 * Validates data and returns typed result or null if invalid.
 * Logs errors automatically.
 *
 * Example:
 *   const { data } = await supabase.from('employees').select('*');
 *   const employees = safeParseArray(data, isEmployee, 'employees');
 *   if (!employees) {
 *     // Handle invalid data
 *     return;
 *   }
 *   // employees is Employee[] and guaranteed valid
 */
export function safeParseArray<T>(
  data: unknown,
  guard: (value: unknown) => value is T,
  dataType: string
): T[] | null {
  if (!Array.isArray(data)) {
    logger.error(`Expected array of ${dataType}, got non-array`, data);
    return null;
  }

  const valid = data.filter(guard);

  if (valid.length !== data.length) {
    logger.error(
      `${data.length - valid.length} invalid ${dataType} records filtered out`,
      data
    );
  }

  return valid;
}

/**
 * Safe parser for single API response
 */
export function safeParse<T>(
  data: unknown,
  guard: (value: unknown) => value is T,
  dataType: string
): T | null {
  if (!guard(data)) {
    logger.error(`Invalid ${dataType} data`, data);
    return null;
  }

  return data;
}

/**
 * Assert type at runtime (throws error if invalid)
 *
 * Use when you're confident data should be valid.
 * Throws clear error if not.
 *
 * Example:
 *   const employee = assertType(data, isEmployee, 'Employee');
 *   // Throws if invalid, otherwise employee is Employee type
 */
export function assertType<T>(
  data: unknown,
  guard: (value: unknown) => value is T,
  dataType: string
): T {
  if (!guard(data)) {
    throw new Error(`Expected ${dataType}, got invalid data: ${JSON.stringify(data)}`);
  }

  return data;
}
