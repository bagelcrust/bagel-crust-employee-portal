import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClockInOut from './pages/ClockInOut';
import EmployeePortal from './pages/EmployeePortal';
import ScheduleBuilder from './pages/ScheduleBuilder';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/clockinout" replace />} />
          <Route path="/clockinout" element={<ClockInOut />} />
          <Route path="/employee-portal" element={<EmployeePortal />} />
          <Route path="/schedule-builder" element={<ScheduleBuilder />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;