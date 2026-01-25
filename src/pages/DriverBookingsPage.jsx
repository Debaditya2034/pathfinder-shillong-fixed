import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { subscribeToDriverBookings, updateBookingStatus } from '../lib/bookings'
import { getPlaceNames } from '../lib/places'
import './DriverBookingsPage.css'

export default function DriverBookingsPage() {
  const { user, logout } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToDriverBookings(user.uid, (bookingsList) => {
      setBookings(bookingsList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdating(bookingId)
    try {
      await updateBookingStatus(bookingId, newStatus)
    } catch (error) {
      alert('Failed to update booking: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="driver-container">
      <header className="driver-header">
        <h1>My Bookings</h1>
        <div className="header-actions">
          <span className="user-email">{user?.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="driver-main">
        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <h2>No Active Bookings</h2>
            <p>You don't have any assigned bookings at the moment.</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h3>Booking #{booking.id.slice(0, 8)}</h3>
                  <span className={`status-badge status-${booking.status}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="detail-item">
                    <strong>Destinations:</strong>
                    <div className="places-list">
                      {getPlaceNames(booking.places || []).map((name, idx) => (
                        <span key={idx} className="place-tag">{name}</span>
                      ))}
                    </div>
                  </div>

                  <div className="detail-item">
                    <strong>Scheduled At:</strong>
                    <span>{formatDate(booking.scheduledAt)}</span>
                  </div>

                  {booking.notes && (
                    <div className="detail-item">
                      <strong>Notes:</strong>
                      <span>{booking.notes}</span>
                    </div>
                  )}

                  <div className="detail-item">
                    <strong>Created:</strong>
                    <span>{formatDate(booking.createdAt)}</span>
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                    disabled={updating === booking.id || booking.status === 'completed'}
                    className="action-button complete-button"
                  >
                    {updating === booking.id ? 'Updating...' : 'Mark as Completed'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                    disabled={updating === booking.id || booking.status === 'cancelled'}
                    className="action-button cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
