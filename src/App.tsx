import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClockInOut from './pages/ClockInOut';
import EmployeePortal from './pages/EmployeePortal';
import ScheduleBuilder from './pages/ScheduleBuilder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/clockinout" replace />} />
        <Route path="/clockinout" element={<ClockInOut />} />
        <Route path="/employee-portal" element={<EmployeePortal />} />
        <Route path="/schedule-builder" element={<ScheduleBuilder />} />
      </Routes>
    </Router>
  );
}

export default App;