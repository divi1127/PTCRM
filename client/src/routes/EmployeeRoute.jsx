import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EmployeeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  // If they are not admin and they try to go somewhere else, just let them in to employee section if they are logged in.
  if (!user?.role) return <Navigate to="/login" replace />;
  return <Outlet />;
};
export default EmployeeRoute;
