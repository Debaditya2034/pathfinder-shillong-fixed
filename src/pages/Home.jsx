import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../lib/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ItinerarySelector from '../components/ItinerarySelector';
import Dialog from '../components/Dialog';
import BookingReceipt from '../components/BookingReceipt';
import StaySelector from '../components/StaySelector';
import { createBooking, getTouristBookings, cancelBooking, confirmCompletion, disputeCompletion, createSupportTicket, retryBooking, getDriverProfile } from '../lib/bookings';
import {
  getUserItineraries,
  createItinerary,
  updateItinerary,
  deleteItinerary
} from '../lib/itineraries';
import { calculateTripFare } from '../lib/fareCalculator';
import { useBookingsListener } from '../hooks/useBookingsListener';

function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState([]);
  const { bookings, loading: bookingsLoading, error, totalDrivers } = useBookingsListener(user?.uid);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [specialMessage, setSpecialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);

  // Dialog States
  const [completionDialog, setCompletionDialog] = useState(null); // { bookingId, booking }
  const [disputeDialog, setDisputeDialog] = useState(null); // { bookingId }
  const [noDriversDialog, setNoDriversDialog] = useState(null); // { bookingId }
  const [genericDialog, setGenericDialog] = useState({ isOpen: false, title: '', content: null, actions: [] });

  // Dispute Form State
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  const [handledCompletions, setHandledCompletions] = useState(new Set()); // Track handled completion requests/escalations
  const [hasShownNoDriverDialog, setHasShownNoDriverDialog] = useState(new Set());
  const [copyMessage, setCopyMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [contactAdminDialog, setContactAdminDialog] = useState(null); // { bookingId, booking }
  const [contactCategory, setContactCategory] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [fareEstimate, setFareEstimate] = useState(null);
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [packageType, setPackageType] = useState('Full Day');

  const [stayDurations, setStayDurations] = useState({}); // { placeName: hours }
  const [startLocation, setStartLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [driverContactDialog, setDriverContactDialog] = useState(null); // { driverName, driverPhone }
  const copyMessageTimeoutRef = useRef(null);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }, [bookings]);

  // Calculate fare estimate whenever itinerary, vehicle type, package, or stays change
  useEffect(() => {
    if (itinerary.length > 0) {
      const estimate = calculateTripFare(itinerary, vehicleType, packageType, stayDurations);
      setFareEstimate(estimate);
    } else {
      setFareEstimate(null);
    }
  }, [itinerary, vehicleType, packageType, stayDurations]);

  // Helper to show generic alerts
  const showAlert = (title, message) => {
    setGenericDialog({
      isOpen: true,
      title,
      content: message,
      actions: [{
        label: 'OK',
        onClick: () => setGenericDialog(prev => ({ ...prev, isOpen: false })),
        variant: 'primary'
      }]
    });
  };

  // Helper to show confirmations
  const showConfirm = (title, message, onConfirm, confirmLabel = 'Yes', confirmVariant = 'primary') => {
    setGenericDialog({
      isOpen: true,
      title,
      content: message,
      actions: [
        {
          label: 'Cancel',
          onClick: () => setGenericDialog(prev => ({ ...prev, isOpen: false })),
          variant: 'secondary'
        },
        {
          label: confirmLabel,
          onClick: () => {
            // Close dialog then execute
            setGenericDialog(prev => ({ ...prev, isOpen: false }));
            onConfirm();
          },
          variant: confirmVariant
        }
      ]
    });
  };

  useEffect(() => {
    // setBookings(bookings); // Removed as bookings comes directly from hook
    if (error) setBookingsError(error.message);

    // Check for completion requests OR disputed bookings (Escalation Dialog)
    // Show ONCE per session (tracked by handledCompletions)
    const escalationNeeded = bookings.find(b =>
      (b.status === 'completion_requested' || b.status === 'disputed') &&
      !handledCompletions.has(b.id) &&
      (!completionDialog || completionDialog.bookingId !== b.id)
    );

    if (escalationNeeded) {
      setCompletionDialog({
        bookingId: escalationNeeded.id,
        booking: escalationNeeded
      });
    } else if (completionDialog) {
      // If the currently open dialog's booking is no longer in a relevant status, close it
      const bookingStillRelevant = bookings.find(b =>
        b.id === completionDialog.bookingId &&
        (b.status === 'completion_requested' || b.status === 'disputed')
      );
      if (!bookingStillRelevant) {
        setCompletionDialog(null);
        setDisputeDialog(null);
        // Do not add to handled here, as it might have been resolved cleanly
      }
    }

    // Check for "No Drivers" scenario
    // Trigger if: status is 'expired' OR (status is 'pending' AND declinedBy >= totalDrivers)
    // And we haven't shown it for this booking yet
    const failedBooking = bookings.find(b => {
      if (hasShownNoDriverDialog.has(b.id)) return false;

      const isExpired = b.status === 'expired';
      const allDeclined = b.status === 'pending' && totalDrivers > 0 && (b.declinedBy?.length || 0) >= totalDrivers;

      return isExpired || allDeclined;
    });

    if (failedBooking) {
      console.log('Booking failed (expired or all declined):', failedBooking.id);
      setNoDriversDialog({ bookingId: failedBooking.id, booking: failedBooking });
      setHasShownNoDriverDialog(prev => new Set([...prev, failedBooking.id]));
    }



  }, [bookings, error, totalDrivers]);

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

      bookingsDataSort(itinerariesData);
      setSavedItineraries(itinerariesData);
    }, (error) => {
      console.error('Error fetching itineraries:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const bookingsDataSort = (data) => {
    data.sort((a, b) => {
      const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }

  const handleSaveItinerary = async (places, saveAsNew = false) => {
    if (places.length === 0) {
      showAlert('Error', 'Please add at least one place to your itinerary');
      return;
    }

    setLoading(true);
    try {
      if (editingItineraryId && !saveAsNew) {
        await updateItinerary(editingItineraryId, user.uid, places, specialMessage || null, vehicleType);
        showAlert('Success', 'Itinerary updated successfully!');
        setEditingItineraryId(null);
      } else {
        await createItinerary(user.uid, places, specialMessage || null, vehicleType);
        showAlert('Success', 'Itinerary saved successfully!');
        setEditingItineraryId(null);
      }
      setItinerary([]);
      setSpecialMessage('');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      showAlert('Error', error.message || 'Failed to save itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadItinerary = (itineraryData) => {
    setItinerary(itineraryData.places || []);
    setSpecialMessage(itineraryData.specialMessage || '');
    setVehicleType(itineraryData.vehicleType || 'Sedan');
    setEditingItineraryId(itineraryData.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyItinerary = async (itineraryData) => {
    if (copyMessageTimeoutRef.current) {
      clearTimeout(copyMessageTimeoutRef.current);
    }

    const placesText = itineraryData.places.join(' → ');
    const messageText = itineraryData.specialMessage ? `\n\nSpecial Message: ${itineraryData.specialMessage}` : '';
    const textToCopy = `Itinerary:\n${placesText}${messageText}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopyMessage({ type: 'success', text: 'Copied to clipboard' });
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopyMessage({ type: 'success', text: 'Copied to clipboard' });
        } else {
          throw new Error('execCommand copy failed');
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        setCopyMessage({ type: 'error', text: 'Failed to copy. Please copy manually.' });
      }
    }

    copyMessageTimeoutRef.current = setTimeout(() => {
      setCopyMessage(null);
      copyMessageTimeoutRef.current = null;
    }, 3000);
  };

  const handleDeleteItinerary = (itineraryId) => {
    showConfirm(
      'Delete Itinerary',
      'Are you sure you want to delete this itinerary?',
      async () => {
        try {
          await deleteItinerary(itineraryId, user.uid);
          showAlert('Success', 'Itinerary deleted successfully');
          if (editingItineraryId === itineraryId) {
            setItinerary([]);
            setSpecialMessage('');
            setEditingItineraryId(null);
          }
        } catch (error) {
          console.error('Error deleting itinerary:', error);
          showAlert('Error', error.message || 'Failed to delete itinerary');
        }
      },
      'Delete',
      'danger'
    );
  };

  const handleNewItinerary = () => {
    setItinerary([]);
    setSpecialMessage('');
    setEditingItineraryId(null);
  };

  const handleRequestBooking = async () => {
    // Check for existing active bookings
    const activeBooking = bookings.find(b =>
      ['pending', 'accepted', 'completion_requested', 'disputed'].includes(b.status)
    );

    if (activeBooking) {
      showAlert('Active Booking Exists', 'You already have an active ride. Please complete it before creating a new one.');
      return;
    }

    if (itinerary.length === 0) {
      showAlert('Error', 'Please add at least one place to your itinerary');
      return;
    }

    if (!startLocation || !startTime) {
      showAlert('Required', 'Please provide a start location and time.');
      return;
    }

    setLoading(true);
    try {
      await createBooking(
        user.uid,
        itinerary,
        specialMessage || null,
        null,
        vehicleType,
        packageType,
        stayDurations,
        startLocation,
        startTime
      );
      showAlert('Success', 'Booking request created successfully!');
      setItinerary([]);
      setSpecialMessage('');
      setStayDurations({});
      setPackageType('Full Day');
      setStartLocation('');
      setStartTime('');
    } catch (error) {
      console.error('Error creating booking:', error);
      showAlert('Error', error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    showConfirm(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      async () => {
        try {
          await cancelBooking(bookingId, user.uid);
          showAlert('Success', 'Booking cancelled successfully');
        } catch (error) {
          console.error('Error cancelling booking:', error);
          showAlert('Error', error.message || 'Failed to cancel booking');
        }
      },
      'Yes, Cancel',
      'danger'
    );
  };

  const handleConfirmCompletion = async (bookingId) => {
    setLoading(true);
    try {
      await confirmCompletion(bookingId, user.uid);
      setCompletionDialog(null);
      setHandledCompletions(prev => new Set([...prev, bookingId]));
      showAlert('Thank You', 'Thanks for choosing us, hope you enjoyed your ride.');
    } catch (error) {
      console.error('Error confirming completion:', error);
      showAlert('Error', error.message || 'Failed to confirm completion');
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeCompletion = async (bookingId) => {
    if (!disputeReason) {
      showAlert('Required', 'Please select a reason for disputing');
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
      showAlert('Dispute Submitted', 'Dispute submitted. We will review your concern.');
    } catch (error) {
      console.error('Error disputing completion:', error);
      showAlert('Error', error.message || 'Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSupportTicket = async () => {
    // If opened from Escalation Dialog, we might not have category set, defaulting to 'Other' or demanding it
    if (!contactCategory && !contactMessage) {
      showAlert('Required', 'Please provide a category or message');
      return;
    }

    const category = contactCategory || 'General Issue';
    const message = contactMessage || 'Support requested via escalation dialog';

    setLoading(true);
    try {
      await createSupportTicket(
        contactAdminDialog.bookingId,
        user.uid,
        contactAdminDialog.booking.driverId,
        contactCategory,
        contactMessage
      );
      setContactAdminDialog(null);
      setContactCategory('');
      setContactMessage('');
      showAlert('Success', 'Support ticket created. Admin will review shortly.');
    } catch (error) {
      console.error('Error creating support ticket:', error);
      showAlert('Error', error.message || 'Failed to create support ticket');
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

      {/* Generic Dialog for Alerts/Confirms */}
      <Dialog
        isOpen={genericDialog.isOpen}
        title={genericDialog.title}
        actions={genericDialog.actions}
        onClose={() => setGenericDialog(prev => ({ ...prev, isOpen: false }))}
      >
        {genericDialog.content}
      </Dialog>

      {/* Escalation Dialog (replaces Completion Dialog) */}
      <Dialog
        isOpen={!!(completionDialog && !disputeDialog)}
        title="Was there an issue with your ride?"
        onClose={() => {
          // Treating close as "dismiss" without resolution
          if (completionDialog) setHandledCompletions(prev => new Set([...prev, completionDialog.bookingId]));
          setCompletionDialog(null);
        }}
        preventCloseOnOverlayClick={true}
        actions={[
          {
            label: 'Contact Support',
            onClick: () => {
              // Open Support Ticket Dialog
              setContactAdminDialog({
                bookingId: completionDialog.bookingId,
                booking: completionDialog.booking
              });
              // Mark as handled effectively, as we moved to support
              setHandledCompletions(prev => new Set([...prev, completionDialog.bookingId]));
              setCompletionDialog(null);
            },
            variant: 'danger',
            disabled: loading
          },
          {
            label: 'Everything was fine',
            onClick: () => {
              if (completionDialog.booking.status === 'completion_requested') {
                handleConfirmCompletion(completionDialog.bookingId);
              } else {
                // For disputed or other statuses, just dismiss strictly
                setHandledCompletions(prev => new Set([...prev, completionDialog.bookingId]));
                setCompletionDialog(null);
              }
            },
            variant: 'success',
            disabled: loading
          }
        ]}
      >
        <p style={{ marginBottom: '20px' }}>
          {completionDialog?.booking?.status === 'completion_requested'
            ? 'Your driver has requested to complete this ride.'
            : 'This ride is currently flagged as disputed.'}
        </p>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          Please confirm if everything went smoothly or contact support if you need assistance.
        </p>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog
        isOpen={!!disputeDialog}
        title="What's Wrong?"
        onClose={() => {
          setDisputeDialog(null);
          setDisputeReason('');
          setDisputeDetails('');
        }}
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setDisputeDialog(null);
              setDisputeReason('');
              setDisputeDetails('');
            },
            variant: 'secondary',
            disabled: loading
          },
          {
            label: loading ? 'Submitting...' : 'Submit Dispute',
            onClick: () => handleDisputeCompletion(disputeDialog.bookingId),
            variant: 'danger',
            disabled: loading || !disputeReason
          }
        ]}
      >
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
                fontFamily: 'inherit',
                resize: 'nav'
              }}
            />
          </div>
        )}
      </Dialog>

      {/* Contact Admin Dialog */}
      <Dialog
        isOpen={!!contactAdminDialog}
        title="Contact Support"
        onClose={() => {
          setContactAdminDialog(null);
          setContactCategory('');
          setContactMessage('');
        }}
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setContactAdminDialog(null);
              setContactCategory('');
              setContactMessage('');
            },
            variant: 'secondary',
            disabled: loading
          },
          {
            label: loading ? 'Submitting...' : 'Submit Ticket',
            onClick: handleSubmitSupportTicket,
            variant: 'primary',
            disabled: loading || !contactCategory
          }
        ]}
      >
        <p style={{ marginBottom: '15px' }}>Please provide details about your issue:</p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Category:
          </label>
          <select
            value={contactCategory}
            onChange={(e) => setContactCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Select a category...</option>
            <option value="Driver is asking to end early">Driver is asking to end early</option>
            <option value="Trip not completed">Trip not completed</option>
            <option value="Payment/fare issue">Payment/fare issue</option>
            <option value="Safety concern">Safety concern</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Message (Optional):
          </label>
          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Additional details..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minHeight: '80px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
      </Dialog>

      {/* No Drivers Dialog */}
      <Dialog
        isOpen={!!noDriversDialog}
        title="No Drivers Available"
        onClose={() => setNoDriversDialog(null)}
        actions={[
          {
            label: 'Keep Waiting',
            onClick: () => setNoDriversDialog(null),
            variant: 'secondary'
          },
          {
            label: 'Edit Booking',
            onClick: () => {
              if (noDriversDialog?.booking) {
                handleLoadItinerary(noDriversDialog.booking);
              }
              setNoDriversDialog(null);
            },
            variant: 'primary'
          },
          {
            label: 'Retry',
            onClick: async () => {
              try {
                if (noDriversDialog?.booking) {
                  const booking = noDriversDialog.booking;
                  await createBooking(
                    user.uid,
                    booking.places,
                    booking.notes,
                    null,
                    booking.vehicleType,
                    booking.packageType,
                    booking.stayDurations
                  );
                  await cancelBooking(booking.id, user.uid);
                  showAlert('Retrying', 'We have created a fresh request for drivers.');
                }
                setNoDriversDialog(null);
              } catch (e) {
                showAlert('Error', 'Failed to retry: ' + e.message);
              }
            },
            variant: 'success'
          }
        ]}
      >
        <p>
          Unfortunately, no drivers accepted your ride request for
          <strong> {noDriversDialog?.booking?.places?.join(' - ')}</strong>.
        </p>
        <p>You can try again or edit your itinerary.</p>
      </Dialog>



      {/* Driver Contact Dialog */}
      <Dialog
        isOpen={!!driverContactDialog}
        title="Contact Driver"
        onClose={() => setDriverContactDialog(null)}
        actions={[
          {
            label: 'Close',
            onClick: () => setDriverContactDialog(null),
            variant: 'secondary'
          }
        ]}
      >
        {driverContactDialog && (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '10px' }}>
              {driverContactDialog.driverName}
            </div>
            <div style={{ fontSize: '1.5em', color: '#007bff', marginBottom: '20px' }}>
              {driverContactDialog.driverPhone || 'No Phone Available'}
            </div>
            <a
              href={`tel:${driverContactDialog.realPhone}`}
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
            >
              Call Driver
            </a>
          </div>
        )}
      </Dialog>

      {/* Header and content */}
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
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Create Itinerary Section */}
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
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Start Location:
              </label>
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="e.g., Hotel Pinewood"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Start Time:
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Select Vehicle Type:
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['Hatchback', 'Sedan', 'SUV'].map(type => (
              <label
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: vehicleType === type ? '#e7f3ff' : '#f8f9fa',
                  border: `1px solid ${vehicleType === type ? '#007bff' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                <input
                  type="radio"
                  name="vehicleType"
                  value={type}
                  checked={vehicleType === type}
                  onChange={(e) => setVehicleType(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Select Package:
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'Half Day', label: 'Half Day (4 hrs)' },
              { id: 'Full Day', label: 'Full Day (8 hrs)' },
              { id: 'Custom', label: 'Custom' }
            ].map(type => (
              <label
                key={type.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: packageType === type.id ? '#e7f3ff' : '#f8f9fa',
                  border: `1px solid ${packageType === type.id ? '#007bff' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                <input
                  type="radio"
                  name="packageType"
                  value={type.id}
                  checked={packageType === type.id}
                  onChange={(e) => setPackageType(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {itinerary.length > 0 && (
          <StaySelector
            places={itinerary.filter(p => p !== 'Shillong')}
            stayDurations={stayDurations}
            onDurationChange={(place, hours) =>
              setStayDurations(prev => ({ ...prev, [place]: hours }))
            }
          />
        )}

        <ItinerarySelector
          value={itinerary}
          onChange={setItinerary}
        />

        {fareEstimate && (
          <div style={{
            marginTop: '20px',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #90caf9'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#0d47a1' }}>
              Fare Estimate
            </h3>

            {/* Time Usage Warning */}
            {fareEstimate.extraHours > 0 && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.9em' }}>
                <strong>Warning:</strong> Your planned itinerary ({fareEstimate.totalDutyHours} hrs) exceeds the {fareEstimate.packageType} limit ({fareEstimate.allowedHours} hrs).
                Extra charges applied for {fareEstimate.extraHours} hrs.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '0.9em', color: '#555' }}>Total Distance</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                  {fareEstimate.computedDistanceKm} km
                  {fareEstimate.minimumApplied && <span style={{ fontSize: '0.8em', fontWeight: 'normal', fontStyle: 'italic', marginLeft: '5px', color: '#666' }}>(Min. charged)</span>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.9em', color: '#555' }}>Package</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                  {fareEstimate.packageType} ({fareEstimate.allowedHours > 0 ? `${fareEstimate.allowedHours} hrs` : 'Custom'})
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.9em', color: '#555' }}>Total Time</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                  ~{fareEstimate.totalDutyHours} hrs
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.9em', color: '#555' }}>Vehicle Rate</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                  {fareEstimate.vehicleType} (₹{fareEstimate.ratePerKm}/km)
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #bbdefb', margin: '5px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#555' }}>Distance Fare:</span>
                <span style={{ fontWeight: 'bold' }}>₹{fareEstimate.fareBreakdown.distanceFare}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#555' }}>Base Time Fare:</span>
                <span style={{ fontWeight: 'bold' }}>₹{fareEstimate.fareBreakdown.baseTimeFare}</span>
              </div>
              {fareEstimate.fareBreakdown.extraStayFare > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c62828' }}>
                  <span>Extra Time Charge:</span>
                  <span style={{ fontWeight: 'bold' }}>+ ₹{fareEstimate.fareBreakdown.extraStayFare}</span>
                </div>
              )}

              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #bbdefb', margin: '5px 0' }}></div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#0d47a1' }}>Total Esimated Fare:</div>
                <div style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#2e7d32' }}>
                  ₹{fareEstimate.fareBreakdown.totalFare}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#666', fontStyle: 'italic' }}>
              * Final fare may vary based on actual distance traveled and waiting charges.
            </div>
          </div>
        )}

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

      {/* Saved Itineraries Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>Saved Itineraries ({savedItineraries.length})</h2>
          {copyMessage && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: copyMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                color: copyMessage.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${copyMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px',
                fontSize: '0.9em',
                fontWeight: '500',
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              {copyMessage.text}
            </div>
          )}
        </div>
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
                    {savedItinerary.fare && <BookingReceipt booking={savedItinerary} />}
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

      {/* Bookings Section */}
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
          </div>
        )}
        {bookings.length === 0 && !bookingsError ? (
          <div>
            <p style={{ color: '#666', marginTop: '10px' }}>No bookings yet. Create a booking request above.</p>
          </div>
        ) : bookings.length === 0 && bookingsError ? (
          <p style={{ color: '#dc3545', marginTop: '10px' }}>
            Error loading bookings. Check browser console (F12) for details.
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
                        booking.status === 'accepted' ? '#17a2b8' :
                          booking.status === 'completion_requested' ? '#28a745' :
                            booking.status === 'completed' ? '#28a745' :
                              booking.status === 'cancelled' ? '#dc3545' : '#6c757d',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '0.9em',
                    fontWeight: 'bold'
                  }}>
                    {booking.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                {/* Real-time Ride Status Tracker */}
                {(booking.status !== 'cancelled' && booking.status !== 'pending' && booking.status !== 'disputed') && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#333' }}>Ride Status</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      {/* Progress Bar Background */}
                      <div style={{
                        position: 'absolute',
                        left: '10%',
                        right: '10%',
                        top: '12px',
                        height: '4px',
                        backgroundColor: '#e9ecef',
                        zIndex: 0
                      }} />

                      {/* Progress Bar Active */}
                      <div style={{
                        position: 'absolute',
                        left: '10%',
                        width: booking.status === 'accepted' ? '0%' :
                          booking.status === 'completion_requested' ? '50%' :
                            booking.status === 'completed' ? '80%' : '0%',
                        top: '12px',
                        height: '4px',
                        backgroundColor: '#28a745',
                        zIndex: 0,
                        transition: 'width 0.3s ease'
                      }} />

                      {/* Steps */}
                      {[
                        { id: 'accepted', label: 'Accepted', icon: 'check' },
                        { id: 'completion_requested', label: 'Finishing', icon: 'flag' },
                        { id: 'completed', label: 'Completed', icon: 'star' }
                      ].map((step, index) => {
                        const isCompleted =
                          (step.id === 'accepted' && ['accepted', 'completion_requested', 'completed'].includes(booking.status)) ||
                          (step.id === 'completion_requested' && ['completion_requested', 'completed'].includes(booking.status)) ||
                          (step.id === 'completed' && booking.status === 'completed');

                        const isCurrent = booking.status === step.id;

                        return (
                          <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '33%' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: isCompleted ? '#28a745' : '#e9ecef',
                              border: isCurrent ? '2px solid #28a745' : '2px solid transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isCompleted ? 'white' : '#6c757d',
                              marginBottom: '8px',
                              transition: 'all 0.3s ease',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}>
                              {isCompleted ? '✓' : index + 1}
                            </div>
                            <span style={{
                              fontSize: '0.8rem',
                              color: isCompleted || isCurrent ? '#333' : '#adb5bd',
                              fontWeight: isCurrent ? 'bold' : 'normal',
                              textAlign: 'center'
                            }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {booking.places && booking.places.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Places:</strong> {booking.places.join(' → ')}
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
                {booking.startLocation && (
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Start Location:</strong> {booking.startLocation}
                  </div>
                )}
                {booking.startTime && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Start Time:</strong> {new Date(booking.startTime).toLocaleString()}
                  </div>
                )}
                {booking.fare && <BookingReceipt booking={booking} />}
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
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
                    Cancel Request
                  </button>
                )}

                {booking.status === 'accepted' && (
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const driver = await getDriverProfile(booking.driverId);

                        if (driver) {
                          // Masking: Show first 2 and last 4 digits
                          const phone = driver.phoneNumber;
                          const masked = phone ? `${phone.substring(0, 3)}XXXXXX${phone.substring(phone.length - 4)}` : 'N/A';

                          setDriverContactDialog({
                            driverName: driver.displayName || 'Driver',
                            driverPhone: masked,
                            realPhone: phone
                          });
                        } else {
                          showAlert('Error', 'Driver details not found');
                        }
                      } catch (e) {
                        console.error(e);
                        showAlert('Error', 'Failed to fetch driver details');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Contact Driver
                  </button>
                )}
                {booking.status === 'completion_requested' && (
                  <button
                    onClick={() => setCompletionDialog({ bookingId: booking.id, booking })}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    Review Completion Request
                  </button>
                )}
                {booking.status === 'disputed' && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      fontSize: '0.9em',
                      borderLeft: '4px solid #17a2b8'
                    }}>
                      <strong>Guidance:</strong> Please ensure you have safely completed the ride. This process helps us resolve any disagreements fairly.
                    </div>
                    <button
                      onClick={() => {
                        setContactAdminDialog({
                          bookingId: booking.id,
                          booking: booking
                        });
                        setContactCategory(booking.completionDispute?.reason || '');
                      }}
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
                      Contact Admins
                    </button>
                  </div>
                )}

                {/* Reminder Banner for Unresolved Escalations */}
                {(booking.status === 'completion_requested' || booking.status === 'disputed') && handledCompletions.has(booking.id) && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeeba',
                    borderRadius: '4px',
                    color: '#856404',
                    fontSize: '0.9em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      <strong>Action Needed:</strong> {booking.status === 'disputed' ? 'Ride disputed.' : 'Completion requested.'} Issue unresolved?
                    </span>
                    <button
                      onClick={() => {
                        setCompletionDialog({ bookingId: booking.id, booking });
                        // Un-handle it to show dialog
                        setHandledCompletions(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(booking.id);
                          return newSet;
                        });
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ffc107',
                        border: 'none',
                        borderRadius: '3px',
                        color: '#212529',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        fontWeight: 'bold'
                      }}
                    >
                      Details
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
        }
      `}</style>
    </div>
  );
}

export default Home;
