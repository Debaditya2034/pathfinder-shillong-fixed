function BookingReceipt({ booking }) {
    if (!booking || !booking.fare) return null;

    const { fare, totalDistanceKm, ratePerKm, vehicleType } = booking;

    // Handle case where fare might be nested or flat, depending on when it was saved
    // The logic in bookings.js spreads the result of calculateTripFare, which has:
    // { totalDistanceKm, vehicleType, ratePerKm, fare: { oneWay, roundTrip, commission, ... } }

    const f = fare;

    return (
        <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginTop: '15px',
            fontSize: '0.95em'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.1em', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                Trip Assessment
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>Est. Distance:</span>
                <strong>{totalDistanceKm} km</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>Vehicle Type:</span>
                <strong>{vehicleType}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>Rate:</span>
                <span>₹{ratePerKm}/km</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #ddd', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#666' }}>One-Way Fare:</span>
                <span>₹{f.oneWay}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '1.1em', color: '#007bff' }}>
                <span style={{ fontWeight: 'bold' }}>Round Trip Total:</span>
                <strong>₹{f.roundTrip}</strong>
            </div>

            <div style={{ fontSize: '0.8em', color: '#888', marginTop: '10px', fontStyle: 'italic' }}>
                * Includes all base fares. Parking/Entry fees extra.
            </div>
        </div>
    );
}

export default BookingReceipt;
