import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EmployeeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!['admin', 'employee'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
export default EmployeeRoute;
