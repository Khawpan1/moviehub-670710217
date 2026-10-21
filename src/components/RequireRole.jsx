import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function RequireRole({ children }) {
  const { token, member } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (member?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireRole;