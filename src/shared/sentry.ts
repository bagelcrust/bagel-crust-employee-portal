/**
 * SENTRY ERROR TRACKING CONFIGURATION
 *
 * Automatically catches and reports errors in production.
 *
 * Setup Instructions:
 * 1. Create free account at https://sentry.io/signup/
 * 2. Create new project → Select "React"
 * 3. Copy your DSN (looks like: https://abc123@o123.ingest.sentry.io/456)
 * 4. Add to .env file: VITE_SENTRY_DSN=your_dsn_here
 * 5. Restart dev server
 *
 * Features enabled:
 * - Automatic error catching (React errors, API errors, async errors)
 * - Error grouping and deduplication
 * - User context (employee info when logged in)
 * - Performance monitoring (page loads, API calls)
 * - Session replay breadcrumbs (what user did before error)
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry
 * Call this once in App.tsx before rendering
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Skip initialization if no DSN configured
  if (!dsn) {
    console.warn('⚠️ Sentry DSN not configured. Error tracking disabled.');
    console.log('To enable: Add VITE_SENTRY_DSN to .env file');
    return;
  }

  Sentry.init({
    dsn,

    // Environment (production, development, etc.)
    environment: import.meta.env.MODE,

    // Only enable in production
    enabled: import.meta.env.PROD,

    // Integrations
    integrations: [
      // React error boundary integration
      Sentry.browserTracingIntegration(),

      // Replay integration (records user actions before error)
      Sentry.replayIntegration({
        maskAllText: false, // Show actual text (no PII concerns for employee portal)
        blockAllMedia: true, // Don't record images/videos
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

    // Session Replay
    replaysSessionSampleRate: 0.1, // Capture 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

    // Release tracking (uses git commit hash from Vercel)
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 'development',

    // Beforehand filter (clean up errors before sending)
    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      if (event.exception) {
        const exceptionValue = event.exception.values?.[0]?.value || '';
        if (
          exceptionValue.includes('chrome-extension://') ||
          exceptionValue.includes('moz-extension://')
        ) {
          return null; // Don't send
        }
      }

      // Log error locally in development
      if (import.meta.env.DEV) {
        console.error('[Sentry] Would send error:', event);
        console.error('[Sentry] Original error:', hint.originalException);
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized:', import.meta.env.MODE);
}

/**
 * Set user context (call after employee login)
 */
export function setSentryUser(employee: { id: string; first_name: string; role?: string }) {
  Sentry.setUser({
    id: employee.id,
    username: employee.first_name,
    role: employee.role,
  });
}

/**
 * Clear user context (call after logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Manually capture error
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Manually capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb (user action tracking)
 */
export function addBreadcrumb(message: string, category: string = 'user-action', data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}
