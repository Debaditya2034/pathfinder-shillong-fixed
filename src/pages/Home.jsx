import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../lib/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ItinerarySelector from '../components/ItinerarySelector';
import { createBooking, getTouristBookings, cancelBooking, confirmCompletion, disputeCompletion } from '../lib/bookings';
import { 
  getUserItineraries, 
  createItinerary, 
  updateItinerary, 
  deleteItinerary 
} from '../lib/itineraries';

function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [specialMessage, setSpecialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [completionDialog, setCompletionDialog] = useState(null); // { bookingId, booking }
  const [disputeDialog, setDisputeDialog] = useState(null); // { bookingId }
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [handledCompletions, setHandledCompletions] = useState(new Set()); // Track handled completion requests

  // Listen to user's bookings in real-time
  useEffect(() => {
    if (!user) return;

    console.log('Setting up bookings listener for user:', user.uid);

    // Start with simple query (no orderBy) to ensure it works
    // This avoids index requirements
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid)
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
      
      console.log('Bookings loaded:', bookingsData.length, 'bookings');
      if (bookingsData.length > 0) {
        console.log('Sample booking:', bookingsData[0]);
      }
      
      // Check for completion_requested bookings and show dialog
      // Only show if not already handled and not currently showing
      const completionRequested = bookingsData.find(b => 
        b.status === 'completion_requested' && 
        !handledCompletions.has(b.id) &&
        (!completionDialog || completionDialog.bookingId !== b.id)
      );
      if (completionRequested) {
        setCompletionDialog({
          bookingId: completionRequested.id,
          booking: completionRequested
        });
      } else if (completionDialog) {
        // If dialog is open but booking no longer has completion_requested status, close it
        const stillRequested = bookingsData.find(b => 
          b.id === completionDialog.bookingId && b.status === 'completion_requested'
        );
        if (!stillRequested) {
          setCompletionDialog(null);
          setDisputeDialog(null);
          setHandledCompletions(prev => new Set([...prev, completionDialog.bookingId]));
        }
      }
      
      setBookings(bookingsData);
      setBookingsError(null);
    }, (error) => {
      console.error('Error fetching bookings:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setBookingsError(error.message || 'Failed to load bookings');
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to user's saved itineraries in real-time
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'itineraries'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itinerariesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort client-side by updatedAt (newest first)
      itinerariesData.sort((a, b) => {
        const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      setSavedItineraries(itinerariesData);
    }, (error) => {
      console.error('Error fetching itineraries:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveItinerary = async (places, saveAsNew = false) => {
    if (places.length === 0) {
      alert('Please add at least one place to your itinerary');
      return;
    }

    setLoading(true);
    try {
      if (editingItineraryId && !saveAsNew) {
        // Update existing itinerary
        await updateItinerary(editingItineraryId, user.uid, places, specialMessage || null);
        alert('Itinerary updated successfully!');
        setEditingItineraryId(null);
      } else {
        // Create new itinerary (either new or "save as new")
        await createItinerary(user.uid, places, specialMessage || null);
        alert('Itinerary saved successfully!');
        setEditingItineraryId(null);
      }
      setItinerary([]);
      setSpecialMessage('');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert(error.message || 'Failed to save itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadItinerary = (itineraryData) => {
    setItinerary(itineraryData.places || []);
    setSpecialMessage(itineraryData.specialMessage || '');
    setEditingItineraryId(itineraryData.id);
    // Scroll to top of itinerary editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyItinerary = async (itineraryData) => {
    const placesText = itineraryData.places.join(' → ');
    const messageText = itineraryData.specialMessage ? `\n\nSpecial Message: ${itineraryData.specialMessage}` : '';
    const textToCopy = `Itinerary:\n${placesText}${messageText}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert('Itinerary copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Itinerary copied to clipboard!');
    }
  };

  const handleDeleteItinerary = async (itineraryId) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) {
      return;
    }

    try {
      await deleteItinerary(itineraryId, user.uid);
      alert('Itinerary deleted successfully');
      // If we were editing this itinerary, clear the editor
      if (editingItineraryId === itineraryId) {
        setItinerary([]);
        setSpecialMessage('');
        setEditingItineraryId(null);
      }
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert(error.message || 'Failed to delete itinerary');
    }
  };

  const handleNewItinerary = () => {
    setItinerary([]);
    setSpecialMessage('');
    setEditingItineraryId(null);
  };

  const handleRequestBooking = async () => {
    if (itinerary.length === 0) {
      alert('Please add at least one place to your itinerary');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating booking with:', { userId: user.uid, places: itinerary, notes: specialMessage });
      const result = await createBooking(user.uid, itinerary, specialMessage || null, null);
      console.log('Booking created successfully:', result);
      alert('Booking request created successfully!');
      setItinerary([]);
      setSpecialMessage('');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await cancelBooking(bookingId, user.uid);
      alert('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.message || 'Failed to cancel booking');
    }
  };

  const handleConfirmCompletion = async (bookingId) => {
    setLoading(true);
    try {
      await confirmCompletion(bookingId, user.uid);
      setCompletionDialog(null);
      setHandledCompletions(prev => new Set([...prev, bookingId]));
      alert('Thanks for choosing us, hope you enjoyed your ride.');
    } catch (error) {
      console.error('Error confirming completion:', error);
      alert(error.message || 'Failed to confirm completion');
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeCompletion = async (bookingId) => {
    if (!disputeReason) {
      alert('Please select a reason for disputing');
      return;
    }

    setLoading(true);
    try {
      await disputeCompletion(bookingId, user.uid, disputeReason, disputeDetails || null);
      setCompletionDialog(null);
      setDisputeDialog(null);
      setHandledCompletions(prev => new Set([...prev, bookingId]));
      setDisputeReason('');
      setDisputeDetails('');
      alert('Dispute submitted. We will review your concern.');
    } catch (error) {
      console.error('Error disputing completion:', error);
      alert(error.message || 'Failed to submit dispute');
    } finally {
      setLoading(false);
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Completion Confirmation Dialog */}
      {completionDialog && !disputeDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>Ride Completion Confirmation</h2>
            <p style={{ marginBottom: '20px' }}>
              Driver marked ride as complete. Do you agree?
            </p>
            {completionDialog.booking && (
              <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div><strong>Places:</strong> {completionDialog.booking.places?.join(' → ')}</div>
                {completionDialog.booking.completionRequestedAt && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                    Requested: {new Date(completionDialog.booking.completionRequestedAt.seconds * 1000).toLocaleString()}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDisputeDialog({ bookingId: completionDialog.bookingId })}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Disagree
              </button>
              <button
                onClick={() => handleConfirmCompletion(completionDialog.bookingId)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Dialog */}
      {disputeDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>What's Wrong?</h2>
            <p style={{ marginBottom: '15px' }}>Please select a reason for disputing the completion:</p>
            
            <div style={{ marginBottom: '15px' }}>
              {[
                'Driver is asking to end early',
                'Trip not completed',
                'Payment/fare issue',
                'Other'
              ].map(reason => (
                <label
                  key={reason}
                  style={{
                    display: 'block',
                    padding: '10px',
                    marginBottom: '8px',
                    backgroundColor: disputeReason === reason ? '#e7f3ff' : '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="disputeReason"
                    value={reason}
                    checked={disputeReason === reason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  {reason}
                </label>
              ))}
            </div>

            {disputeReason === 'Other' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Please provide details:
                </label>
                <textarea
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="Describe the issue..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setDisputeDialog(null);
                  setDisputeReason('');
                  setDisputeDetails('');
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisputeCompletion(disputeDialog.bookingId)}
                disabled={loading || !disputeReason}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !disputeReason ? 'not-allowed' : 'pointer',
                  opacity: loading || !disputeReason ? 0.6 : 1
                }}
              >
                {loading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Home - Itinerary Maker</h1>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>
            {editingItineraryId ? 'Edit Itinerary' : 'Create Booking Request'}
          </h2>
          {editingItineraryId && (
            <button
              onClick={handleNewItinerary}
              style={{
                padding: '5px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              New Itinerary
            </button>
          )}
        </div>
        <ItinerarySelector
          value={itinerary}
          onChange={setItinerary}
        />
        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Special Message (optional):
          </label>
          <textarea
            value={specialMessage}
            onChange={(e) => setSpecialMessage(e.target.value)}
            placeholder="Any special requests or notes..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minHeight: '60px',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRequestBooking}
            disabled={loading || itinerary.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || itinerary.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || itinerary.length === 0 ? 0.6 : 1
            }}
          >
            {loading ? 'Creating...' : 'Request Booking'}
          </button>
          <button
            onClick={() => handleSaveItinerary(itinerary)}
            disabled={loading || itinerary.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || itinerary.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || itinerary.length === 0 ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : editingItineraryId ? 'Save Changes' : 'Save Itinerary'}
          </button>
          {editingItineraryId && (
            <button
              onClick={() => handleSaveItinerary(itinerary, true)}
              disabled={loading || itinerary.length === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || itinerary.length === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || itinerary.length === 0 ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save as New'}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Saved Itineraries ({savedItineraries.length})</h2>
        {savedItineraries.length === 0 ? (
          <p style={{ color: '#666', marginTop: '10px' }}>No saved itineraries yet. Create one above.</p>
        ) : (
          <div style={{ marginTop: '15px' }}>
            {savedItineraries.map(savedItinerary => (
              <div
                key={savedItinerary.id}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: editingItineraryId === savedItinerary.id ? '#e7f3ff' : '#f8f9fa',
                  borderRadius: '5px',
                  border: editingItineraryId === savedItinerary.id ? '2px solid #007bff' : '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>
                        {savedItinerary.places && savedItinerary.places.length > 0 
                          ? savedItinerary.places[0] 
                          : 'Empty Itinerary'}
                        {savedItinerary.places && savedItinerary.places.length > 1 && ` (+${savedItinerary.places.length - 1} more)`}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>
                      {savedItinerary.places?.length || 0} {savedItinerary.places?.length === 1 ? 'place' : 'places'}
                      {savedItinerary.specialMessage && ' • Has special message'}
                    </div>
                    {savedItinerary.updatedAt && (
                      <div style={{ fontSize: '0.85em', color: '#999' }}>
                        Updated: {new Date(savedItinerary.updatedAt.seconds * 1000).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleLoadItinerary(savedItinerary)}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleCopyItinerary(savedItinerary)}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleDeleteItinerary(savedItinerary.id)}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {savedItinerary.places && savedItinerary.places.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
                    <strong>Route:</strong> {savedItinerary.places.join(' → ')}
                  </div>
                )}
                {savedItinerary.specialMessage && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px', fontStyle: 'italic' }}>
                    "{savedItinerary.specialMessage}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>My Bookings ({bookings.length})</h2>
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
        {bookings.length === 0 && !bookingsError ? (
          <div>
            <p style={{ color: '#666', marginTop: '10px' }}>No bookings yet. Create a booking request above.</p>
            <p style={{ color: '#999', fontSize: '0.9em', marginTop: '5px' }}>
              Debug: User ID: {user?.uid?.substring(0, 8)}... | Check console for query details
            </p>
          </div>
        ) : bookings.length === 0 && bookingsError ? (
          <p style={{ color: '#dc3545', marginTop: '10px' }}>
            Error loading bookings. Check browser console (F12) for details.
            <br />
            <small>Debug: User ID: {user?.uid?.substring(0, 8)}... | Verify bookings exist in Firestore Console</small>
          </p>
        ) : (
          <div style={{ marginTop: '15px' }}>
            {bookings.map(booking => (
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
                      booking.status === 'pending' ? '#ffc107' :
                      booking.status === 'accepted' ? '#28a745' :
                      booking.status === 'completion_requested' ? '#ff9800' :
                      booking.status === 'completed' ? '#17a2b8' :
                      booking.status === 'disputed' ? '#dc3545' :
                      booking.status === 'cancelled' ? '#dc3545' : '#6c757d',
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
                {booking.driverId && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Driver ID:</strong> {booking.driverId.substring(0, 8)}...
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
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    style={{
                      padding: '5px 15px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Other Pages</h2>
        <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="#" style={{ padding: '10px', backgroundColor: '#f8f9fa', textDecoration: 'none', color: '#333' }}>
            About
          </a>
          <a href="#" style={{ padding: '10px', backgroundColor: '#f8f9fa', textDecoration: 'none', color: '#333' }}>
            Contact
          </a>
          <a href="#" style={{ padding: '10px', backgroundColor: '#f8f9fa', textDecoration: 'none', color: '#333' }}>
            Help
          </a>
        </nav>
      </div>
    </div>
  );
}

export default Home;
