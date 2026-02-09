import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../lib/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Dialog from '../components/Dialog';
import DriverPaySlip from '../components/DriverPaySlip';
import {
    getEligibleBookingsForDriver,
    acceptBooking,
    declineBooking,
    requestCompletion
} from '../lib/bookings';
import { subscribeToDriverMetrics } from '../utils/analytics';

function DriverDashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [openRequests, setOpenRequests] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [bookingsError, setBookingsError] = useState(null);
    const [analytics, setAnalytics] = useState({
        totalRides: 0,
        totalEarnings: 0,
        avgDistance: 0,
        disputedCount: 0
    });

    // Dialog State
    const [notificationDialog, setNotificationDialog] = useState(null); // { type, title, message, bookingId }
    const [genericDialog, setGenericDialog] = useState({ isOpen: false, title: '', content: null, actions: [] });

    const lastSeenStatusesRef = useRef(new Map()); // Map<bookingId, status> to track last seen status
    const previousBookingsRef = useRef([]); // Track previous bookings to detect new ones

    const [wellnessDialog, setWellnessDialog] = useState(null);
    const [handledWellnessChecks, setHandledWellnessChecks] = useState(new Set());

    // Helper to show generic alerts
    const showAlert = (title, message, type = 'info') => {
        setGenericDialog({
            isOpen: true,
            title,
            content: message,
            actions: [{
                label: 'OK',
                onClick: () => setGenericDialog(prev => ({ ...prev, isOpen: false })),
                variant: type === 'error' ? 'primary' : 'primary'
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
                        setGenericDialog(prev => ({ ...prev, isOpen: false }));
                        onConfirm();
                    },
                    variant: confirmVariant
                }
            ]
        });
    };

    // Fetch eligible bookings, active bookings, and analytics
    // Fetch eligible bookings, active bookings, and analytics
    useEffect(() => {
        if (!user || !profile || profile.role !== 'driver') {
            if (user && profile && profile.role !== 'driver') {
                setLoading(false);
            }
            return;
        }

        // 1. Fetch eligible pending bookings (Initial)
        getEligibleBookingsForDriver(user.uid)
            .then(setOpenRequests)
            .catch(err => console.error('Error fetching open requests:', err));

        // 2. Real-time Analytics Listener
        const unsubAnalytics = subscribeToDriverMetrics(user.uid, setAnalytics);

        // 3. Active Bookings Listener
        const q = query(
            collection(db, 'bookings'),
            where('driverId', '==', user.uid),
            where('status', 'in', ['accepted', 'completion_requested', 'completed', 'disputed'])
        );

        const unsubBookings = onSnapshot(q, (snapshot) => {
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

            handleBookingUpdates(bookingsData);

            setActiveBookings(bookingsData);
            setBookingsError(null);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching active bookings:', error);
            setBookingsError(error.message || 'Failed to load bookings');
            setLoading(false);
        });

        return () => {
            unsubAnalytics();
            unsubBookings();
        };
    }, [user, profile]);

    // Wellness check effect
    useEffect(() => {
        const wellnessNeeded = activeBookings.find(b =>
            b.status === 'completed'
            && !b.wellness
            && !handledWellnessChecks.has(b.id)
            && !wellnessDialog
        );

        if (wellnessNeeded) {
            setWellnessDialog({ bookingId: wellnessNeeded.id });
        }
    }, [activeBookings, handledWellnessChecks, wellnessDialog]);

    const handleWellnessConfirm = async () => {
        if (!wellnessDialog) return;
        try {
            await updateDoc(doc(db, 'bookings', wellnessDialog.bookingId), {
                wellness: true
            });
            setHandledWellnessChecks(prev => new Set([...prev, wellnessDialog.bookingId]));
            setWellnessDialog(null);
            showAlert('Confirmed', 'Thank you for your feedback.', 'success');
        } catch (error) {
            console.error('Error updating wellness:', error);
            showAlert('Error', 'Failed to update feedback', 'error');
        }
    };

    const handleWellnessIssue = () => {
        if (!wellnessDialog) return;
        setHandledWellnessChecks(prev => new Set([...prev, wellnessDialog.bookingId]));
        setWellnessDialog(null);
        showAlert('Report Issue', 'Please contact admin support immediately to resolve the issue.', 'warning');
    };

    const handleBookingUpdates = (bookingsData) => {
        // Detect status changes and new bookings
        const previousBookings = previousBookingsRef.current;
        const lastSeenStatuses = lastSeenStatusesRef.current;
        const isInitialLoad = previousBookings.length === 0;

        // On initial load, initialize last seen statuses without showing notifications
        if (isInitialLoad) {
            bookingsData.forEach(booking => {
                lastSeenStatuses.set(booking.id, booking.status);
            });
            previousBookingsRef.current = bookingsData;
            return;
        }

        // Track status changes
        bookingsData.forEach(booking => {
            const previousStatus = lastSeenStatuses.get(booking.id);
            const currentStatus = booking.status;

            // Check if this is a meaningful status change
            if (previousStatus && previousStatus !== currentStatus) {
                if (!notificationDialog) {
                    if (currentStatus === 'completion_requested' && previousStatus === 'accepted') {
                        setNotificationDialog({
                            type: 'info',
                            title: 'Completion Requested',
                            message: `You requested completion for booking ${booking.id.substring(0, 8)}... Waiting for tourist confirmation.`,
                            bookingId: booking.id
                        });
                    } else if (currentStatus === 'completed' && previousStatus === 'completion_requested') {
                        setNotificationDialog({
                            type: 'success',
                            title: 'Booking Completed',
                            message: `Booking ${booking.id.substring(0, 8)}... has been confirmed as completed by the tourist.`,
                            bookingId: booking.id
                        });
                        // Analytics auto-updates via listener
                    } else if (currentStatus === 'disputed' && previousStatus === 'completion_requested') {
                        const disputeReason = booking.completionDispute?.reason || 'Unknown reason';
                        setNotificationDialog({
                            type: 'warning',
                            title: 'Booking Disputed',
                            message: `Booking ${booking.id.substring(0, 8)}... has been disputed. Reason: ${disputeReason}\n\nPlease ensure you finish the ride properly and follow protocol. Admin will review the dispute.`,
                            bookingId: booking.id
                        });
                        // Analytics auto-updates via listener
                    }
                    // If dialog is open, we still might want to refresh analytics if it was a completion
                    // Analytics handles itself via listener now
                }
            }

            // Update last seen status
            lastSeenStatuses.set(booking.id, currentStatus);
        });

        // Detect new bookings (bookings that weren't in previous list)
        const previousIds = new Set(previousBookings.map(b => b.id));
        const newBookings = bookingsData.filter(b => !previousIds.has(b.id));

        if (newBookings.length > 0 && !notificationDialog) {
            // Show notification for newly accepted bookings (when driver accepts)
            const newAccepted = newBookings.find(b => b.status === 'accepted');
            if (newAccepted) {
                setNotificationDialog({
                    type: 'success',
                    title: 'Booking Accepted',
                    message: `You have successfully accepted booking ${newAccepted.id.substring(0, 8)}...`,
                    bookingId: newAccepted.id
                });
            }
        }

        // Update refs
        previousBookingsRef.current = bookingsData;
    }

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
            setOpenRequests(prev => prev.filter(b => b.id !== bookingId));
            // Dialog will be shown by real-time listener
        } catch (error) {
            console.error('Error accepting booking:', error);
            showAlert('Failed to Accept Booking', error.message || 'Failed to accept booking', 'error');
        } finally {
            setProcessing({ ...processing, [bookingId]: null });
        }
    };

    const handleDecline = (bookingId) => {
        showConfirm(
            'Decline Booking',
            'Are you sure you want to decline this booking request?',
            async () => {
                setProcessing({ ...processing, [bookingId]: 'declining' });
                try {
                    await declineBooking(bookingId, user.uid);
                    setOpenRequests(prev => prev.filter(b => b.id !== bookingId));
                } catch (error) {
                    console.error('Error declining booking:', error);
                    showAlert('Failed to Decline Booking', error.message || 'Failed to decline booking', 'error');
                } finally {
                    setProcessing({ ...processing, [bookingId]: null });
                }
            },
            'Decline',
            'danger'
        );
    };

    const handleRequestCompletion = (bookingId) => {
        showConfirm(
            'Request Completion',
            'Request completion? The tourist will need to confirm.',
            async () => {
                setProcessing({ ...processing, [bookingId]: 'requesting' });
                try {
                    await requestCompletion(bookingId, user.uid);
                    // Dialog will be shown by real-time listener
                } catch (error) {
                    console.error('Error requesting completion:', error);
                    showAlert('Failed to Request Completion', error.message || 'Failed to request completion', 'error');
                } finally {
                    setProcessing({ ...processing, [bookingId]: null });
                }
            },
            'Request',
            'info'
        );
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

            {/* Generic Dialog */}
            <Dialog
                isOpen={genericDialog.isOpen}
                title={genericDialog.title}
                actions={genericDialog.actions}
                onClose={() => setGenericDialog(prev => ({ ...prev, isOpen: false }))}
            >
                {genericDialog.content}
            </Dialog>

            {/* Wellness Check Dialog */}
            <Dialog
                isOpen={!!wellnessDialog}
                title="Ride Update"
                onClose={() => { }}
                preventCloseOnOverlayClick={true}
                actions={[
                    {
                        label: 'No, Report Issue',
                        onClick: handleWellnessIssue,
                        variant: 'danger'
                    },
                    {
                        label: 'Yes, All Good',
                        onClick: handleWellnessConfirm,
                        variant: 'success'
                    }
                ]}
            >
                <p style={{ fontSize: '1.1em' }}>Did the ride finish smoothly?</p>
            </Dialog>

            {/* Notification Dialog */}
            <Dialog
                isOpen={!!notificationDialog}
                title={notificationDialog?.title}
                onClose={() => setNotificationDialog(null)}
                actions={[
                    {
                        label: 'OK',
                        onClick: () => setNotificationDialog(null),
                        variant: notificationDialog?.type === 'error' || notificationDialog?.type === 'dispute' ? 'danger' : 'primary'
                    }
                ]}
            >
                {notificationDialog && (
                    <div style={{ display: 'flex', alignItems: 'start' }}>
                        <div style={{
                            minWidth: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor:
                                notificationDialog.type === 'success' ? '#d4edda' :
                                    notificationDialog.type === 'error' ? '#f8d7da' :
                                        notificationDialog.type === 'warning' ? '#fff3cd' : '#d1ecf1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '15px',
                            fontSize: '24px',
                            flexShrink: 0
                        }}>
                            {notificationDialog.type === 'success' ? '✓' :
                                notificationDialog.type === 'error' ? '✗' :
                                    notificationDialog.type === 'warning' ? '⚠' : 'ℹ'}
                        </div>
                        <div style={{ marginTop: '8px', lineHeight: '1.4' }}>
                            {notificationDialog.message}
                        </div>
                    </div>
                )}
            </Dialog>

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
                            cursor: 'pointer',
                            borderRadius: '4px'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <div style={{ marginBottom: '30px' }}>
                <h2>Performance</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px',
                    marginTop: '15px'
                }}>
                    {/* Earnings Card */}
                    <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8em', color: '#28a745' }}>
                            ₹{analytics.totalEarnings.toLocaleString()}
                        </h3>
                        <p style={{ margin: 0, color: '#666' }}>Total Earnings</p>
                    </div>

                    {/* Rides Card */}
                    <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8em', color: '#007bff' }}>
                            {analytics.totalRides}
                        </h3>
                        <p style={{ margin: 0, color: '#666' }}>Completed Trips</p>
                    </div>

                    {/* Avg Distance Card */}
                    <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8em', color: '#17a2b8' }}>
                            {Math.round(analytics.avgDistance)} km
                        </h3>
                        <p style={{ margin: 0, color: '#666' }}>Avg. Distance</p>
                    </div>

                    {/* Disputed Card */}
                    <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8em', color: analytics.disputedCount > 0 ? '#dc3545' : '#6c757d' }}>
                            {analytics.disputedCount}
                        </h3>
                        <p style={{ margin: 0, color: '#666' }}>Disputed</p>
                    </div>
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

                                {/* Trip Details */}
                                <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.95em' }}>
                                        <div>
                                            <strong>Est. Fare:</strong> ₹{booking.fare?.roundTrip || 'N/A'}
                                        </div>
                                        <div>
                                            <strong>Distance:</strong> {booking.totalDistanceKm || 'N/A'} km
                                        </div>
                                        <div>
                                            <strong>Vehicle:</strong> {booking.vehicleType || 'Any'}
                                        </div>
                                    </div>
                                </div>

                                {booking.scheduledAt && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong>Scheduled:</strong> {new Date(booking.scheduledAt.seconds * 1000).toLocaleString()}
                                    </div>
                                )}
                                {booking.notes && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong>Message:</strong> {booking.notes}
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
                    </div>
                ) : activeBookings.length === 0 && bookingsError ? (
                    <p style={{ color: '#dc3545', marginTop: '10px' }}>
                        Error loading bookings. Check browser console (F12) for details.
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
                                        padding: '5px 10px',
                                        backgroundColor:
                                            booking.status === 'completed' ? '#28a745' : // Green
                                                booking.status === 'completion_requested' ? '#fd7e14' : // Orange
                                                    booking.status === 'disputed' ? '#dc3545' : // Red
                                                        booking.status === 'cancelled' ? '#6c757d' : // Grey
                                                            booking.status === 'accepted' ? '#007bff' : '#6c757d', // Blue for active
                                        color: 'white',
                                        borderRadius: '15px',
                                        fontSize: '0.85em',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {
                                            booking.status === 'completed' ? 'Completed' :
                                                booking.status === 'completion_requested' ? 'Pending Confirmation' :
                                                    booking.status === 'disputed' ? 'Disputed' :
                                                        booking.status === 'cancelled' ? 'Cancelled' :
                                                            booking.status === 'accepted' ? 'In Progress' :
                                                                booking.status.replace('_', ' ').toUpperCase()
                                        }
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
                                {/* Show Pay Slip for active/completed rides */}
                                <DriverPaySlip booking={booking} />
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

export default DriverDashboard;
