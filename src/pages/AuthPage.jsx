import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { SHILLONG_PLACES } from '../lib/places'
import './AuthPage.css'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState('tourist') // 'tourist' or 'driver'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedPlaces, setSelectedPlaces] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { user, loading: authLoading, login, signup } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Auth state changed:', { user, authLoading })
    if (!authLoading && user) {
      console.log('Redirecting user with role:', user.role)
      if (user.role === 'tourist') {
        navigate('/home', { replace: true })
      } else if (user.role === 'driver') {
        navigate('/driver/bookings', { replace: true })
      } else {
        console.error('Unknown user role:', user.role)
      }
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isLogin) {
        // Signup validation
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        if (userType === 'driver' && selectedPlaces.length === 0) {
          setError('Please select at least one place you serve')
          setLoading(false)
          return
        }

        await signup(email, password, userType, {
          placesServed: userType === 'driver' ? selectedPlaces : null
        })
      } else {
        await login(email, password)
      }

      // Success - navigation will happen via useEffect when user state updates
      console.log('Auth successful, user should be set now')
      setLoading(false)
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed')
      setLoading(false)
    }
  }

  const togglePlace = (placeId) => {
    setSelectedPlaces(prev =>
      prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    )
  }

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center', color: 'white' }}>Loading...</div>
      </div>
    )
  }

  // If user is authenticated, don't render the form (redirect will happen)
  if (user) {
    return null
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Shillong Driver Booking</h1>
        <div className="auth-tabs">
          <button
            className={userType === 'tourist' ? 'active' : ''}
            onClick={() => {
              setUserType('tourist')
              setSelectedPlaces([])
              setError('')
            }}
          >
            Tourist
          </button>
          <button
            className={userType === 'driver' ? 'active' : ''}
            onClick={() => {
              setUserType('driver')
              setSelectedPlaces([])
              setError('')
            }}
          >
            Driver
          </button>
        </div>

        <div className="auth-mode-toggle">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="link-button"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          )}

          {!isLogin && userType === 'driver' && (
            <div className="form-group">
              <label>Places You Serve (Select all that apply)</label>
              <div className="places-selector">
                {SHILLONG_PLACES.map(place => (
                  <label key={place.id} className="place-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedPlaces.includes(place.id)}
                      onChange={() => togglePlace(place.id)}
                      disabled={loading}
                    />
                    <span>{place.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}
