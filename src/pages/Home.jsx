import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../lib/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState([]);
  const [newStop, setNewStop] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddStop = () => {
    if (newStop.trim()) {
      setItinerary([...itinerary, { id: Date.now(), name: newStop }]);
      setNewStop('');
    }
  };

  const handleRemoveStop = (id) => {
    setItinerary(itinerary.filter(stop => stop.id !== id));
  };

  const handleSaveItinerary = async () => {
    if (itinerary.length === 0) {
      alert('Please add at least one stop to your itinerary');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'itineraries'), {
        userId: user.uid,
        stops: itinerary.map(s => s.name),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Itinerary saved successfully!');
      setItinerary([]);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary');
    } finally {
      setSaving(false);
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
        <h2>Create Itinerary</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newStop}
            onChange={(e) => setNewStop(e.target.value)}
            placeholder="Add a destination..."
            style={{ flex: 1, padding: '8px' }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddStop()}
          />
          <button
            onClick={handleAddStop}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Add Stop
          </button>
        </div>

        {itinerary.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Your Itinerary:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {itinerary.map((stop, index) => (
                <li
                  key={stop.id}
                  style={{
                    padding: '10px',
                    marginBottom: '5px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{index + 1}. {stop.name}</span>
                  <button
                    onClick={() => handleRemoveStop(stop.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSaveItinerary}
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: '10px'
              }}
            >
              {saving ? 'Saving...' : 'Save Itinerary'}
            </button>
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
