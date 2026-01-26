import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../lib/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  getEligibleBookingsForDriver, 
  getDriverActiveBookings, 
  acceptBooking, 
  declineBooking,
  requestCompletion
} from '../lib/bookings';

function Driver() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [openRequests, setOpenRequests] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [bookingsError, setBookingsError] = useState(null);

  // Fetch eligible bookings and active bookings
  useEffect(() => {
    if (!user || !profile || profile.role !== 'driver') {
      if (user && profile && profile.role !== 'driver') {
        setLoading(false);
      }
      return;
    }

    const fetchBookings = async () => {
      try {
        // Fetch eligible pending bookings
        const eligible = await getEligibleBookingsForDriver(user.uid);
        setOpenRequests(eligible);

        // Listen to active bookings in real-time
        // Use simple query without orderBy to avoid index requirements
        const q = query(
          collection(db, 'bookings'),
          where('driverId', '==', user.uid),
          where('status', 'in', ['accepted', 'completion_requested', 'completed', 'disputed'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const bookingsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data
            };
          });
          
          // Sort client-side by updatedAt (newest first)
          bookingsData.sort((a, b) => {
            const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
            const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
          
          console.log('Active bookings loaded:', bookingsData.length, 'bookings');
          if (bookingsData.length > 0) {
            console.log('Sample booking:', bookingsData[0]);
          }
          setActiveBookings(bookingsData);
          setBookingsError(null);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching active bookings:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          setBookingsError(error.message || 'Failed to load bookings');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, profile]);

  // Refresh open requests periodically (every 10 seconds)
  useEffect(() => {
    if (!user || !profile || profile.role !== 'driver') return;

    const interval = setInterval(async () => {
      try {
        const eligible = await getEligibleBookingsForDriver(user.uid);
        setOpenRequests(eligible);
      } catch (error) {
        console.error('Error refreshing open requests:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, profile]);

  const handleAccept = async (bookingId) => {
    setProcessing({ ...processing, [bookingId]: 'accepting' });
    try {
      await acceptBooking(bookingId, user.uid);
      alert('Booking accepted successfully!');
      // Remove from open requests
      setOpenRequests(prev => prev.filter(b => b.id !== bookingId));
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert(error.message || 'Failed to accept booking');
    } finally {
      setProcessing({ ...processing, [bookingId]: null });
    }
  };

  const handleDecline = async (bookingId) => {
    if (!confirm('Are you sure you want to decline this booking request?')) {
      return;
    }

    setProcessing({ ...processing, [bookingId]: 'declining' });
    try {
      await declineBooking(bookingId, user.uid);
      alert('Booking declined');
      // Remove from open requests
      setOpenRequests(prev => prev.filter(b => b.id !== bookingId));
    } catch (error) {
      console.error('Error declining booking:', error);
      alert(error.message || 'Failed to decline booking');
    } finally {
      setProcessing({ ...processing, [bookingId]: null });
    }
  };

  const handleRequestCompletion = async (bookingId) => {
    if (!confirm('Request completion? The tourist will need to confirm.')) {
      return;
    }

    setProcessing({ ...processing, [bookingId]: 'requesting' });
    try {
      await requestCompletion(bookingId, user.uid);
      alert('Completion requested! Waiting for tourist confirmation.');
    } catch (error) {
      console.error('Error requesting completion:', error);
      alert(error.message || 'Failed to request completion');
    } finally {
      setProcessing({ ...processing, [bookingId]: null });
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading driver dashboard...</p>
      </div>
    );
  }

  if (profile.role !== 'driver') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Access denied. This page is for drivers only.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Driver Dashboard</h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Open Requests</h2>
        {loading ? (
          <p style={{ color: '#666', marginTop: '10px' }}>Loading...</p>
        ) : openRequests.length === 0 ? (
          <p style={{ color: '#666', marginTop: '10px' }}>No open booking requests at the moment.</p>
        ) : (
          <div style={{ marginTop: '15px' }}>
            {openRequests.map(booking => (
              <div
                key={booking.id}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '5px',
                  border: '1px solid #ffc107'
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <strong>Booking ID:</strong> {booking.id.substring(0, 8)}...
                </div>
                {booking.places && booking.places.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Places:</strong> {booking.places.join(' → ')}
                  </div>
                )}
                {booking.scheduledAt && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Scheduled:</strong> {new Date(booking.scheduledAt.seconds * 1000).toLocaleString()}
                  </div>
                )}
                {booking.notes && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
                {booking.createdAt && (
                  <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
                    Requested: {new Date(booking.createdAt.seconds * 1000).toLocaleString()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => handleAccept(booking.id)}
                    disabled={processing[booking.id]}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: processing[booking.id] ? 'not-allowed' : 'pointer',
                      opacity: processing[booking.id] ? 0.6 : 1
                    }}
                  >
                    {processing[booking.id] === 'accepting' ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDecline(booking.id)}
                    disabled={processing[booking.id]}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: processing[booking.id] ? 'not-allowed' : 'pointer',
                      opacity: processing[booking.id] ? 0.6 : 1
                    }}
                  >
                    {processing[booking.id] === 'declining' ? 'Declining...' : 'Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>My Active Bookings ({activeBookings.length})</h2>
        {bookingsError && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107', 
            borderRadius: '4px',
            marginBottom: '10px',
            color: '#856404'
          }}>
            <strong>Warning:</strong> {bookingsError}
            <br />
            <small>Check browser console (F12) for detailed error information.</small>
          </div>
        )}
        {activeBookings.length === 0 && !bookingsError ? (
          <div>
            <p style={{ color: '#666', marginTop: '10px' }}>No active bookings at the moment.</p>
            <p style={{ color: '#999', fontSize: '0.9em', marginTop: '5px' }}>
              Debug: Driver ID: {user?.uid?.substring(0, 8)}... | Check console for query details
            </p>
          </div>
        ) : activeBookings.length === 0 && bookingsError ? (
          <p style={{ color: '#dc3545', marginTop: '10px' }}>
            Error loading bookings. Check browser console (F12) for details.
            <br />
            <small>Debug: Driver ID: {user?.uid?.substring(0, 8)}... | Verify bookings exist in Firestore Console</small>
          </p>
        ) : (
          <div style={{ marginTop: '15px' }}>
            {activeBookings.map(booking => (
              <div
                key={booking.id}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <strong>Booking ID:</strong> {booking.id.substring(0, 8)}...
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: 
                      booking.status === 'accepted' ? '#28a745' :
                      booking.status === 'completion_requested' ? '#ffc107' :
                      booking.status === 'completed' ? '#17a2b8' :
                      booking.status === 'disputed' ? '#dc3545' : '#6c757d',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '0.9em',
                    fontWeight: 'bold'
                  }}>
                    {booking.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                {booking.places && booking.places.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Places:</strong> {booking.places.join(' → ')}
                  </div>
                )}
                {booking.scheduledAt && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Scheduled:</strong> {new Date(booking.scheduledAt.seconds * 1000).toLocaleString()}
                  </div>
                )}
                {booking.notes && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
                {booking.createdAt && (
                  <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
                    Created: {new Date(booking.createdAt.seconds * 1000).toLocaleString()}
                  </div>
                )}
                {booking.status === 'accepted' && (
                  <button
                    onClick={() => handleRequestCompletion(booking.id)}
                    disabled={processing[booking.id]}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: processing[booking.id] ? 'not-allowed' : 'pointer',
                      opacity: processing[booking.id] ? 0.6 : 1
                    }}
                  >
                    {processing[booking.id] === 'requesting' ? 'Requesting...' : 'Mark as Complete'}
                  </button>
                )}
                {booking.status === 'completion_requested' && (
                  <div style={{ color: '#856404', fontSize: '0.9em', marginTop: '5px' }}>
                    ⏳ Waiting for tourist confirmation...
                  </div>
                )}
                {booking.status === 'disputed' && booking.completionDispute && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                    <strong>Dispute Reason:</strong> {booking.completionDispute.reason}
                    {booking.completionDispute.details && (
                      <div style={{ marginTop: '5px' }}>
                        <strong>Details:</strong> {booking.completionDispute.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Driver Information</h2>
        <p style={{ marginTop: '10px' }}>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Role:</strong> {profile?.role || 'driver'}
        </p>
      </div>
    </div>
  );
}

export default Driver;
