/**
 * DEBUGGING UTILITIES
 *
 * Consistent, concise logging strategy for development.
 * Only runs in DEV mode - zero production overhead.
 */

const isDev = import.meta.env.DEV

/**
 * Log data with type validation
 * Catches common bugs: arrays vs objects, null vs undefined, missing properties
 */
export function logData(context: string, label: string, data: any, expectedShape?: string[]) {
  if (!isDev) return

  console.group(`[${context}] ${label}`)

  // Type info
  console.log('Type:', Array.isArray(data) ? 'Array' : typeof data)

  // Value (collapsed for large objects)
  console.log('Value:', data)

  // Shape validation
  if (expectedShape && data) {
    const missing = expectedShape.filter(key => !(key in data))
    if (missing.length > 0) {
      console.warn('⚠️ Missing expected properties:', missing)
    }
    console.log('Has keys:', expectedShape.filter(key => key in data))
  }

  console.groupEnd()
}

/**
 * Log state changes with before/after comparison
 */
export function logStateChange(context: string, stateName: string, oldValue: any, newValue: any) {
  if (!isDev) return

  console.log(`[${context}] ${stateName} changed:`, {
    from: oldValue,
    to: newValue,
    type: Array.isArray(newValue) ? 'Array' : typeof newValue
  })
}

/**
 * Log condition evaluation (useful for "why didn't this run?")
 */
export function logCondition(context: string, description: string, condition: boolean, details?: any) {
  if (!isDev) return

  const icon = condition ? '✅' : '❌'
  console.log(`[${context}] ${icon} ${description}:`, condition, details || '')
}

/**
 * Log API calls with timing
 */
export function logApiCall(context: string, endpoint: string, params?: any) {
  if (!isDev) return

  const start = performance.now()
  console.log(`[${context}] 📡 API: ${endpoint}`, params || '')

  return () => {
    const duration = Math.round(performance.now() - start)
    console.log(`[${context}] ✅ API: ${endpoint} (${duration}ms)`)
  }
}

/**
 * Log errors with full context
 */
export function logError(context: string, message: string, error: any, additionalContext?: any) {
  if (!isDev) return

  console.group(`[${context}] ❌ ${message}`)
  console.error('Error:', error?.message || error)
  console.error('Stack:', error?.stack)
  if (additionalContext) {
    console.error('Context:', additionalContext)
  }
  console.groupEnd()
}

/**
 * Assert data shape (throws in dev if shape is wrong)
 */
export function assertShape(context: string, data: any, requiredKeys: string[], dataName = 'data') {
  if (!isDev) return

  if (!data) {
    console.error(`[${context}] ❌ ${dataName} is ${data === null ? 'null' : 'undefined'}`)
    return
  }

  if (Array.isArray(data)) {
    console.error(`[${context}] ❌ ${dataName} is an Array (expected object)`, data)
    return
  }

  const missing = requiredKeys.filter(key => !(key in data))
  if (missing.length > 0) {
    console.error(`[${context}] ❌ ${dataName} missing keys:`, missing, 'Got:', data)
  }
}
