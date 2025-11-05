import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClockInOut from './components/ClockInOut';
import Dashboard from './components/Dashboard';
import EmployeePortal from './components/EmployeePortal';
import EmployeePortal_A from './components/EmployeePortal_A';
import EmployeePortal_B from './components/EmployeePortal_B';
import EmployeePortal_C from './components/EmployeePortal_C';
import DesignComparison from './components/DesignComparison';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/compare" replace />} />
        <Route path="/compare" element={<DesignComparison />} />
        <Route path="/clockinout" element={<ClockInOut />} />
        <Route path="/employee-portal" element={<EmployeePortal />} />
        <Route path="/design-a" element={<EmployeePortal_A />} />
        <Route path="/design-b" element={<EmployeePortal_B />} />
        <Route path="/design-c" element={<EmployeePortal_C />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;