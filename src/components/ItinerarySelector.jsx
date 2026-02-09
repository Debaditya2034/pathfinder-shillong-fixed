import { useState } from 'react';
import { SHILLONG_PLACES } from '../data/places';

/**
 * Reusable ItinerarySelector component
 * 
 * Props:
 * - value: string[] - current selected places (ordered)
 * - onChange: (places: string[]) => void - callback when itinerary changes
 * - onSave: (places: string[]) => Promise<void> - optional save handler
 * - disabled?: boolean - disable interactions
 */
function ItinerarySelector({ value = [], onChange, onSave, disabled = false }) {
  const [selectedPlace, setSelectedPlace] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Get available places (not already in itinerary)
  const availablePlaces = SHILLONG_PLACES.filter(place => !value.includes(place));

  const handleAddPlace = () => {
    if (!selectedPlace) {
      setError('Please select a place');
      return;
    }

    if (value.includes(selectedPlace)) {
      setError('This place is already in your itinerary');
      return;
    }

    setError('');
    onChange([...value, selectedPlace]);
    setSelectedPlace('');
  };

  const handleRemovePlace = (index) => {
    const newItinerary = value.filter((_, i) => i !== index);
    onChange(newItinerary);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newItinerary = [...value];
    [newItinerary[index - 1], newItinerary[index]] = [newItinerary[index], newItinerary[index - 1]];
    onChange(newItinerary);
  };

  const handleMoveDown = (index) => {
    if (index === value.length - 1) return;
    const newItinerary = [...value];
    [newItinerary[index], newItinerary[index + 1]] = [newItinerary[index + 1], newItinerary[index]];
    onChange(newItinerary);
  };

  const handleSave = async () => {
    if (value.length === 0) {
      setError('Please add at least one place to your itinerary');
      return;
    }

    if (onSave) {
      setSaving(true);
      setError('');
      try {
        await onSave(value);
      } catch (err) {
        setError(err.message || 'Failed to save itinerary');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Select Destination:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedPlace}
            onChange={(e) => {
              setSelectedPlace(e.target.value);
              setError('');
            }}
            disabled={disabled || availablePlaces.length === 0}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">-- Select a place --</option>
            {availablePlaces.map(place => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddPlace}
            disabled={disabled || !selectedPlace || availablePlaces.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled || !selectedPlace ? 'not-allowed' : 'pointer',
              opacity: disabled || !selectedPlace ? 0.6 : 1
            }}
          >
            Add
          </button>
        </div>
        {error && (
          <div style={{ color: 'red', marginTop: '8px', fontSize: '0.9em' }}>
            {error}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>Your Itinerary ({value.length} {value.length === 1 ? 'stop' : 'stops'}):</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {value.map((place, index) => (
              <li
                key={`${place}-${index}`}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span style={{ fontWeight: 'bold', minWidth: '30px' }}>{index + 1}.</span>
                  <span>{place}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={disabled || index === 0}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: disabled || index === 0 ? 'not-allowed' : 'pointer',
                      opacity: disabled || index === 0 ? 0.5 : 1
                    }}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={disabled || index === value.length - 1}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: disabled || index === value.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: disabled || index === value.length - 1 ? 0.5 : 1
                    }}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemovePlace(index)}
                    disabled={disabled}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onSave && value.length > 0 && (
        <button
          onClick={handleSave}
          disabled={disabled || saving || value.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled || saving || value.length === 0 ? 'not-allowed' : 'pointer',
            opacity: disabled || saving || value.length === 0 ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : 'Save Itinerary'}
        </button>
      )}
    </div>
  );
}

export default ItinerarySelector;
