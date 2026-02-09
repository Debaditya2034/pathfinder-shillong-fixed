import React from 'react';

/**
 * StaySelector Component
 * Allows users to set stay durations for each stop in the itinerary.
 * 
 * Props:
 * - places: string[] - List of places/stops
 * - stayDurations: object - Map of place -> hours
 * - onDurationChange: (place: string, hours: number) => void
 * 
 * Behavior:
 * - Minimum duration: 5 minutes
 * - Input is in minutes for better UX, updates parent in hours
 */
const StaySelector = ({ places, stayDurations, onDurationChange }) => {
    // Filter out origin if needed, or handle in parent. 
    // Parent (Home.jsx) filters 'Shillong'. 
    // We'll assume 'places' passed here are the ones to show.

    const handleTimeChange = (place, minutes) => {
        // Enforce minimum 5 minutes
        const validMinutes = Math.max(5, minutes);
        const hours = validMinutes / 60;
        onDurationChange(place, hours);
    };

    if (!places || places.length === 0) return null;

    return (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Planned Stay Durations</h4>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                Estimate how much time you will spend at each stop (excluding travel time).
                Minimum stay is 5 minutes.
            </p>
            {places.map(place => {
                // Convert stored hours to minutes for display
                const hours = stayDurations[place] !== undefined ? stayDurations[place] : 1; // Default 1 hr
                const minutes = Math.round(hours * 60);

                return (
                    <div key={place} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ flex: 1 }}>{place}:</span>
                        <input
                            type="number"
                            min="5"
                            step="5"
                            value={minutes}
                            onChange={(e) => handleTimeChange(place, parseFloat(e.target.value) || 0)}
                            style={{ width: '80px', padding: '5px' }}
                        />
                        <span style={{ marginLeft: '5px', fontSize: '0.9em' }}>mins</span>
                        <span style={{ marginLeft: '10px', fontSize: '0.8em', color: '#888' }}>
                            ({(minutes / 60).toFixed(2)} hrs)
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default StaySelector;
