import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// Routes
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';
import EmployeeRoute from './routes/EmployeeRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLeads from './pages/admin/AdminLeads';
import LocationMap from './pages/admin/LeadImport';
import DataModule from './pages/admin/DataModule';
import AdminClients from './pages/admin/AdminClients';
import AdminEmployees from './pages/admin/AdminUsers'; // Repurposing Users for Employees
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminMeetings from './pages/admin/AdminMeetings';
import AdminTargets from './pages/admin/AdminTargets';
import AdminPayments from './pages/admin/AdminPayments';
import SettingsPage from './pages/admin/SettingsPage';
import ReportsPage from './pages/reports/ReportsPage';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeLeads from './pages/employee/EmployeeLeads';
import EmployeeTargets from './pages/employee/EmployeeTargets';
import AttendanceModule from './pages/attendance/AttendanceModule';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Specific Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/data-module" element={<DataModule />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/import" element={<LocationMap />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/employees" element={<AdminEmployees />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/meetings" element={<AdminMeetings />} />
            <Route path="/admin/targets" element={<AdminTargets />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Employee Specific Routes */}
          <Route element={<EmployeeRoute />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/leads" element={<EmployeeLeads />} />
            <Route path="/employee/attendance" element={<AttendanceModule />} />
            <Route path="/employee/meetings" element={<AdminMeetings />} />
            <Route path="/employee/targets" element={<EmployeeTargets />} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
