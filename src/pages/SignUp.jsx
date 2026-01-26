import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../lib/auth';
import { SHILLONG_PLACES } from '../data/places';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tourist');
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePlaceToggle = (place) => {
    setSelectedPlaces(prev =>
      prev.includes(place)
        ? prev.filter(p => p !== place)
        : [...prev, place]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate driver places selection
    if (role === 'driver' && selectedPlaces.length === 0) {
      setError('Please select at least one place you serve');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, role, selectedPlaces);
      // Redirect based on role - ProtectedRoute will handle role validation
      if (role === 'driver') {
        navigate('/driver');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
      <h2>Sign Up</h2>
      
      {/* Role Toggle */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={() => {
            setRole('tourist');
            setSelectedPlaces([]);
          }}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: role === 'tourist' ? '#007bff' : '#f8f9fa',
            color: role === 'tourist' ? 'white' : '#333',
            border: '1px solid #ddd',
            cursor: 'pointer'
          }}
        >
          Tourist
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('driver');
            setSelectedPlaces([]);
          }}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: role === 'driver' ? '#007bff' : '#f8f9fa',
            color: role === 'driver' ? 'white' : '#333',
            border: '1px solid #ddd',
            cursor: 'pointer'
          }}
        >
          Driver
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        {/* Driver Places Selection */}
        {role === 'driver' && (
          <div style={{ marginBottom: '15px' }}>
            <label>Places You Serve (select all that apply):</label>
            <div style={{
              marginTop: '10px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {SHILLONG_PLACES.map(place => (
                <label
                  key={place}
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlaces.includes(place)}
                    onChange={() => handlePlaceToggle(place)}
                    style={{ marginRight: '8px' }}
                  />
                  {place}
                </label>
              ))}
            </div>
            {selectedPlaces.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                Selected: {selectedPlaces.length} place(s)
              </div>
            )}
          </div>
        )}

        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default SignUp;
