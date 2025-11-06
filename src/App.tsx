import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDynamicManifest } from './hooks';

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
 */

// Lazy load page components
const ClockInOut = lazy(() => import('./pages/ClockInOut'));
const EmployeePortal = lazy(() => import('./pages/EmployeePortal'));
const ScheduleBuilder = lazy(() => import('./pages/ScheduleBuilder'));
const Timesheets = lazy(() => import('./pages/Timesheets'));

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

function App() {
  return (
    <Router>
      <ManifestUpdater />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/clockinout" replace />} />
          <Route path="/clockinout" element={<ClockInOut />} />
          <Route path="/employee-portal" element={<EmployeePortal />} />
          <Route path="/schedule-builder" element={<ScheduleBuilder />} />
          <Route path="/timesheets" element={<Timesheets />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;