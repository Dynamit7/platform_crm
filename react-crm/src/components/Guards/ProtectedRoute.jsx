import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'super_admin' || user.role === 'admin' ? '/admin/dashboard'
      : user.role === 'student' ? '/dashboard'
      : `/${user.role}/dashboard`;
    return <Navigate to={fallback} replace />;
  }

  return children;
}
