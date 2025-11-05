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
 * DYNAMIC PWA MANIFEST:
 * - Generates manifest based on current page
 * - "Add to Home Screen" remembers which page you were on
 */

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

function AppContent() {
  // Dynamically update PWA manifest based on current page
  useDynamicManifest();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/clockinout" replace />} />
        <Route path="/clockinout" element={<ClockInOut />} />
        <Route path="/employee-portal" element={<EmployeePortal />} />
        <Route path="/schedule-builder" element={<ScheduleBuilder />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;