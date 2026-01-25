import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import BookPage from './pages/BookPage'
import DriverBookingsPage from './pages/DriverBookingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          user ? (
            user.role === 'tourist' ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/driver/bookings" replace />
            )
          ) : (
            <AuthPage />
          )
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute role="tourist">
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute role="tourist">
            <BookPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/bookings"
        element={
          <ProtectedRoute role="driver">
            <DriverBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user ? (
            user.role === 'tourist' ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/driver/bookings" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
