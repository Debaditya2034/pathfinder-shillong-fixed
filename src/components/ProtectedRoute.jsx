import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If profile is null but user exists, show loading state
  // This can happen briefly while profile is being fetched
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  // If a specific role is required, check it
  if (requiredRole && profile.role !== requiredRole) {
    // Redirect based on user's actual role
    if (profile.role === 'driver') {
      return <Navigate to="/driver" replace />;
    } else if (profile.role === 'tourist') {
      return <Navigate to="/home" replace />;
    } else {
      // Unknown role, redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
