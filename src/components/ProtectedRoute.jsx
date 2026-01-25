import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (user.role !== role) {
    // Redirect based on user role
    if (user.role === 'tourist') {
      return <Navigate to="/home" replace />
    } else if (user.role === 'driver') {
      return <Navigate to="/driver/bookings" replace />
    }
    return <Navigate to="/auth" replace />
  }

  return children
}
