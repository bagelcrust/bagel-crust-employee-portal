import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDynamicManifest } from './hooks';
import * as Sentry from '@sentry/react';
import { initSentry } from './lib/sentry';

/**
 * ROUTE-BASED CODE SPLITTING
 *
 * Each page is loaded lazily (on-demand) to reduce initial bundle size.
 * Users only download the code for the page they visit.
 *
 * Performance Impact:
 * - Initial bundle: ~60-70% smaller
 * - Faster first page load
 * - Better caching (pages cached separately)
 *
 * DYNAMIC PWA MANIFEST (Two-Phase Approach):
 * Phase 1: Inline script in index.html sets manifest on initial page load
 * Phase 2: React hook updates manifest when navigating between pages
 *
 * This ensures manifest is always correct whether you:
 * - Directly navigate to a URL (inline script handles it)
 * - Navigate within the SPA (React hook handles it)
 *
 * ERROR TRACKING:
 * - Sentry automatically catches all errors in production
 * - Reports errors with user context and breadcrumbs
 * - See errors at https://sentry.io dashboard
 */

// Initialize Sentry error tracking
initSentry();

// Lazy load page components
const ClockInOut = lazy(() => import('./pages/ClockInOut'));
const EmployeePortal = lazy(() => import('./pages/EmployeePortal'));
const ScheduleBuilder = lazy(() => import('./pages/ScheduleBuilder'));

// Loading spinner component
function LoadingFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-base font-semibold text-gray-600">Loading...</div>
      </div>
    </div>
  );
}

function ManifestUpdater() {
  // Update manifest whenever route changes (React Router navigation)
  useDynamicManifest();
  return null;
}

// Development-only error testing component
function SentryTestButton() {
  if (!import.meta.env.DEV) return null;

  return (
    <button
      onClick={() => {
        throw new Error('Test error for Sentry - This is intentional!');
      }}
      className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-mono hover:bg-red-700 z-50"
      title="Click to test Sentry error tracking (Dev only)"
    >
      🧪 Test Error
    </button>
  );
}

function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return (
          <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                We've been notified about this error and will fix it soon.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-800 break-all">
                  {errorMessage || 'Unknown error'}
                </p>
              </div>
              <button
                onClick={resetError}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      }}
      showDialog={false}
    >
      <Router>
        <ManifestUpdater />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/clockinout" replace />} />
            <Route path="/clockinout" element={<ClockInOut />} />
            <Route path="/employee-portal" element={<EmployeePortal />} />
            <Route path="/schedule-builder" element={<ScheduleBuilder />} />
          </Routes>
        </Suspense>
        <SentryTestButton />
      </Router>
    </Sentry.ErrorBoundary>
  );
}

export default App;