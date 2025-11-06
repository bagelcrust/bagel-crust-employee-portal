/**
 * CENTRALIZED LOGGING UTILITY
 *
 * Provides structured logging that works in both dev and production:
 * - Development: Logs to console with colors/formatting
 * - Production: Silently collects errors for future error tracking service
 *
 * Benefits:
 * - No console.log littered everywhere
 * - Consistent log format
 * - Easy to add error tracking service (Sentry, LogRocket, etc.) later
 * - Type-safe log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

// Store errors in production for potential batch upload
const errorQueue: LogEntry[] = [];
const MAX_ERROR_QUEUE_SIZE = 50;

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, data?: unknown, context?: string) {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    context
  };

  // Development: Log to console with formatting
  if (import.meta.env.DEV) {
    const prefix = `[${level.toUpperCase()}]${context ? ` [${context}]` : ''}`;

    switch (level) {
      case 'debug':
        console.log(`%c${prefix}`, 'color: gray', message, data || '');
        break;
      case 'info':
        console.log(`%c${prefix}`, 'color: blue', message, data || '');
        break;
      case 'warn':
        console.warn(`%c${prefix}`, 'color: orange', message, data || '');
        break;
      case 'error':
        console.error(`%c${prefix}`, 'color: red', message, data || '');
        if (data instanceof Error) {
          console.error(data.stack);
        }
        break;
    }
  }

  // Production: Queue errors for potential tracking service
  if (import.meta.env.PROD && level === 'error') {
    errorQueue.push(entry);

    // Keep queue size manageable
    if (errorQueue.length > MAX_ERROR_QUEUE_SIZE) {
      errorQueue.shift();
    }
  }
}

/**
 * Logger object with typed methods
 */
export const logger = {
  /**
   * Debug logs (development only, verbose)
   * Use for detailed debugging information
   */
  debug(message: string, data?: unknown, context?: string) {
    log('debug', message, data, context);
  },

  /**
   * Info logs (general information)
   * Use for important events like "User logged in", "Data loaded"
   */
  info(message: string, data?: unknown, context?: string) {
    log('info', message, data, context);
  },

  /**
   * Warning logs (potential issues)
   * Use for recoverable errors or unexpected situations
   */
  warn(message: string, data?: unknown, context?: string) {
    log('warn', message, data, context);
  },

  /**
   * Error logs (actual errors)
   * Use for exceptions, API failures, validation errors
   */
  error(message: string, error?: unknown, context?: string) {
    log('error', message, error, context);
  },

  /**
   * Get error queue (for sending to error tracking service)
   */
  getErrorQueue(): LogEntry[] {
    return [...errorQueue];
  },

  /**
   * Clear error queue (after successful upload to tracking service)
   */
  clearErrorQueue() {
    errorQueue.length = 0;
  }
};

/**
 * Wrapper for async functions with automatic error logging
 *
 * Example:
 *   const safeGetEmployees = withErrorLogging(
 *     () => employeeApi.getAll(),
 *     'Failed to fetch employees',
 *     'EmployeeAPI'
 *   );
 */
export function withErrorLogging<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  context?: string
): () => Promise<T> {
  return async () => {
    try {
      return await fn();
    } catch (error) {
      logger.error(errorMessage, error, context);
      throw error; // Re-throw to maintain normal error flow
    }
  };
}

/**
 * Log API call for debugging
 */
export function logApiCall(
  method: string,
  endpoint: string,
  duration?: number,
  context?: string
) {
  const message = duration
    ? `${method} ${endpoint} (${duration}ms)`
    : `${method} ${endpoint}`;

  logger.debug(message, undefined, context || 'API');
}
