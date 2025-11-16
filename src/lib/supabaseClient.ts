/**
 * ENHANCED SUPABASE CLIENT
 *
 * Adds production-ready features on top of base Supabase client:
 * - Automatic retry logic for failed requests
 * - Connection health checks
 * - Timeout handling
 * - Better error messages
 * - Request logging (dev mode)
 *
 * Use this instead of direct supabase client for critical operations.
 */

import { createClient } from '@supabase/supabase-js';
import { validateEnv } from './envValidator';
import { logger } from './logger';

// Validate environment variables at import time (fail fast)
const env = validateEnv();

/**
 * Base Supabase client configuration
 */
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // PIN-based auth, no session persistence needed
      autoRefreshToken: false
    },
    global: {
      headers: {
        'x-app-version': '1.0.0', // Track which app version made the request
        'x-app-name': 'bagel-crust-employee-portal'
      }
    }
  }
);

/**
 * Health check: Verify Supabase connection is working
 * Call this on app startup to fail fast if database is unreachable
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    logger.info('Checking Supabase connection...', undefined, 'Supabase');

    // Simple query to verify connection
    const { error } = await supabase
      .schema('employees')
      .from('employees')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Supabase health check failed', error, 'Supabase');
      return false;
    }

    logger.info('✓ Supabase connection healthy', undefined, 'Supabase');
    return true;
  } catch (error) {
    logger.error('Supabase health check error', error, 'Supabase');
    return false;
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for Supabase operations
 *
 * Automatically retries failed operations with exponential backoff.
 * Use for critical operations like clock in/out, submitting forms, etc.
 *
 * Example:
 *   const employee = await withRetry(
 *     () => supabase.from('employees').select('*').eq('pin', pin).single(),
 *     { maxRetries: 3 }
 *   );
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, delayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };

  let lastError: Error | undefined;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      logger.warn(
        `Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${currentDelay}ms...`,
        error,
        'Supabase'
      );

      // Wait before retrying
      await sleep(currentDelay);

      // Exponential backoff
      currentDelay *= backoffMultiplier;
    }
  }

  // All retries exhausted
  logger.error(
    `Operation failed after ${maxRetries} attempts`,
    lastError,
    'Supabase'
  );

  throw lastError;
}

/**
 * Timeout wrapper for Supabase operations
 *
 * Prevents requests from hanging indefinitely.
 * Use for user-facing operations to provide faster feedback.
 *
 * Example:
 *   const data = await withTimeout(
 *     () => supabase.from('employees').select('*'),
 *     5000 // 5 second timeout
 *   );
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000 // Default 10 seconds
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
}

/**
 * Combined retry + timeout wrapper
 *
 * Best of both worlds: retries with timeout on each attempt.
 * Use for critical user operations.
 *
 * Example:
 *   const result = await withRetryAndTimeout(
 *     () => timeclockApi.clockInOut(employeeId),
 *     { maxRetries: 3 },
 *     5000
 *   );
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {},
  timeoutMs: number = 10000
): Promise<T> {
  return withRetry(
    () => withTimeout(operation, timeoutMs),
    retryConfig
  );
}

/**
 * Check if error is a network error (vs validation/business logic error)
 * Network errors should be retried, others should not
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const networkErrorMessages = [
    'network',
    'timeout',
    'fetch',
    'connection',
    'ECONNREFUSED',
    'ETIMEDOUT'
  ];

  return networkErrorMessages.some(msg =>
    error.message.toLowerCase().includes(msg)
  );
}

/**
 * Parse Supabase error into user-friendly message
 */
export function parseSupabaseError(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    // Check for common Supabase error codes
    const errorObj = error as any;

    // Connection errors
    if (isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    // RLS policy violations
    if (errorObj.code === '42501') {
      return 'You do not have permission to perform this action.';
    }

    // Foreign key violations
    if (errorObj.code === '23503') {
      return 'This action would create an invalid data reference.';
    }

    // Unique constraint violations
    if (errorObj.code === '23505') {
      return 'This record already exists.';
    }

    // Not found
    if (errorObj.code === 'PGRST116') {
      return 'Record not found.';
    }

    return error.message;
  }

  return 'An unexpected error occurred';
}
