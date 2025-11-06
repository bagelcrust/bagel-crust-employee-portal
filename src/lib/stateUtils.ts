/**
 * State management utilities
 *
 * Helper functions for managing form state and UI state
 */

/**
 * Create a form state reset function
 *
 * @param setters - Array of state setter functions
 * @returns Function that resets all states
 */
export function createFormResetHandler(
  ...setters: Array<(value: string) => void>
): () => void {
  return () => {
    setters.forEach(setter => setter(''))
  }
}

/**
 * Time off form state type
 */
export interface TimeOffFormState {
  startDate: string
  endDate: string
  reason: string
}

/**
 * Create time off form reset handler
 *
 * @param setState - Object with state setters
 * @returns Reset function
 */
export function createTimeOffResetHandler(setState: {
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void
  setReason: (value: string) => void
}): () => void {
  return () => {
    setState.setStartDate('')
    setState.setEndDate('')
    setState.setReason('')
  }
}

/**
 * Check if any form field is filled
 *
 * @param values - Form values to check
 * @returns true if at least one field has value
 */
export function hasFormData(...values: string[]): boolean {
  return values.some(value => value.length > 0)
}

/**
 * Check if all form fields are filled
 *
 * @param values - Form values to check
 * @returns true if all fields have values
 */
export function isFormComplete(...values: string[]): boolean {
  return values.every(value => value.length > 0)
}

/**
 * Get form completion percentage
 *
 * @param values - Form values to check
 * @returns Percentage (0-100) of fields filled
 */
export function getFormCompletionPercentage(...values: string[]): number {
  if (values.length === 0) return 0
  const filledCount = values.filter(value => value.length > 0).length
  return Math.round((filledCount / values.length) * 100)
}

/**
 * Debounce a function call
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}
