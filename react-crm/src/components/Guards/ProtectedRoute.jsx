import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    const role = user.role || 'student';
    const fallback = role === 'super_admin' || role === 'admin' ? '/admin/dashboard'
      : role === 'student' ? '/dashboard'
      : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
