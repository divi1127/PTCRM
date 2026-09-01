import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role?.toLowerCase() !== 'admin') return <Navigate to="/employee/dashboard" replace />;
  return <Outlet />;
};
export default AdminRoute;
