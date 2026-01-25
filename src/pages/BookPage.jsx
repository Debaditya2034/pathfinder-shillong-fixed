import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { SHILLONG_PLACES } from '../lib/places'
import { createBooking } from '../lib/bookings'
import './BookPage.css'

export default function BookPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedPlaces, setSelectedPlaces] = useState([])
  const [tripDate, setTripDate] = useState('')
  const [tripTime, setTripTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const togglePlace = (placeId) => {
    setSelectedPlaces(prev =>
      prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (selectedPlaces.length === 0) {
      setError('Please select at least one destination')
      return
    }
    if (!tripDate) {
      setError('Please select a trip date')
      return
    }
    if (!tripTime) {
      setError('Please select a trip time')
      return
    }

    // Combine date and time
    const scheduledAt = new Date(`${tripDate}T${tripTime}`)
    if (scheduledAt < new Date()) {
      setError('Trip date and time must be in the future')
      return
    }

    setLoading(true)
    try {
      await createBooking(user.uid, {
        places: selectedPlaces,
        scheduledAt: scheduledAt.toISOString(),
        notes: notes.trim() || null
      })
      navigate('/home', { state: { message: 'Booking created successfully!' } })
    } catch (err) {
      setError(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="book-container">
      <header className="book-header">
        <button onClick={() => navigate('/home')} className="back-button">
          ← Back to Home
        </button>
        <h1>Book a Driver</h1>
      </header>

      <main className="book-main">
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-section">
            <h2>Select Destinations</h2>
            <p className="section-description">Choose one or more places you'd like to visit</p>
            <div className="places-selector">
              {SHILLONG_PLACES.map(place => (
                <label key={place.id} className="place-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPlaces.includes(place.id)}
                    onChange={() => togglePlace(place.id)}
                    disabled={loading}
                  />
                  <div>
                    <strong>{place.name}</strong>
                    <p>{place.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2>Trip Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  min={today}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={tripTime}
                  onChange={(e) => setTripTime(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Additional Notes (Optional)</h2>
            <div className="form-group">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or notes for the driver..."
                rows={4}
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Creating Booking...' : 'Create Booking'}
          </button>
        </form>
      </main>
    </div>
  )
}
