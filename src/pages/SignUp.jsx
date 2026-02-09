import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, setupRecaptcha, signInPhone } from '../lib/auth';
import { SHILLONG_PLACES } from '../data/places';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tourist');
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Driver specific fields
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [licenseNumber, setLicenseNumber] = useState('');

  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

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

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      setError('Please enter a valid phone number');
      return;
    }

    // Simple basic validation for demonstration (assuming +91 or similar format)
    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code (e.g., +91...)');
      return;
    }

    try {
      setError('');
      const appVerifier = setupRecaptcha('recaptcha-container');
      const confirmation = await signInPhone(phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error sending OTP: ' + err.message);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) return;
    setVerifying(true);
    try {
      await confirmationResult.confirm(otp);
      setIsPhoneVerified(true);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPhoneVerified) {
      setError('Please verify your phone number first');
      return;
    }

    // Validate driver places selection
    if (role === 'driver' && selectedPlaces.length === 0) {
      setError('Please select at least one place you serve');
      return;
    }

    setLoading(true);

    try {
      // Pass phoneNumber to signUp
      const { user } = await signUp(email, password, role, selectedPlaces, phoneNumber);

      // If driver, update profile with additional details
      if (role === 'driver') {
        await setDoc(doc(db, 'driverProfiles', user.uid), {
          vehicleType,
          licenseNumber,
          // phoneNumber is now handled in signUp for both, but we can keep it here if we want or remove it. 
          // The signUp function handles putting it in the main user doc. 
          // Driver profile might duplicate it or just reference it. 
          // Let's remove it from here to avoid redundancy or keep it if existing code expects it.
          // The previous code had it. Let's keep it but it's already in 'users' collection.
          phoneNumber,
          firstName: '', // Placeholder
          lastName: '', // Placeholder
          updatedAt: serverTimestamp()
        }, { merge: true });

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



        {/* Phone Number Verification - Common for both roles */}
        <div style={{ marginBottom: '15px' }}>
          <label>Phone Number:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="+91 9876543210"
              disabled={isPhoneVerified}
              style={{ flex: 1, padding: '8px', marginTop: '5px' }}
            />
            {!isPhoneVerified && (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpSent}
                style={{
                  marginTop: '5px',
                  padding: '8px 15px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {otpSent ? 'OTP Sent' : 'Verify'}
              </button>
            )}
            {isPhoneVerified && (
              <span style={{ color: 'green', display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                ✓ Verified
              </span>
            )}
          </div>
          <div id="recaptcha-container"></div>
        </div>

        {/* OTP Input */}
        {
          otpSent && !isPhoneVerified && (
            <div style={{ marginBottom: '15px' }}>
              <label>Enter OTP:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  style={{ flex: 1, padding: '8px', marginTop: '5px' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={verifying}
                  style={{
                    marginTop: '5px',
                    padding: '8px 15px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {verifying ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            </div>
          )
        }

        {/* Driver Specific Fields */}
        {
          role === 'driver' && (
            <>
              {/* Phone number moved up */}

              <div style={{ marginBottom: '15px' }}>
                <label>Vehicle Type:</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>Driving License Number:</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
            </>
          )
        }

        {/* Driver Places Selection */}
        {
          role === 'driver' && (
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
          )
        }

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
      </form >
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div >
  );
}

export default SignUp;
