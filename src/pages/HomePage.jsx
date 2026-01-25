import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { SHILLONG_PLACES } from '../lib/places'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Shillong</h1>
        <div className="header-actions">
          <span className="user-email">{user?.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <h2>Explore the Beautiful Hill Station</h2>
          <p>Discover the natural beauty and cultural heritage of Shillong</p>
          <button
            onClick={() => navigate('/book')}
            className="cta-button"
          >
            Book a Driver
          </button>
        </section>

        <section className="attractions-section">
          <h2>Popular Attractions</h2>
          <div className="attractions-grid">
            {SHILLONG_PLACES.map(place => (
              <div key={place.id} className="attraction-card">
                <h3>{place.name}</h3>
                <p>{place.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
