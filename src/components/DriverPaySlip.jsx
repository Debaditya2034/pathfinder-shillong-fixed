function DriverPaySlip({ booking }) {
    if (!booking || !booking.fare) return null;

    const { fare, totalDistanceKm } = booking;
    const f = fare;

    return (
        <div style={{
            padding: '15px',
            backgroundColor: '#f0fff4', // Light green background
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            marginTop: '15px'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.1em', color: '#155724' }}>
                💰 Payout Estimate
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#555' }}>Total Distance:</span>
                <span>{totalDistanceKm} km</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#555' }}>Gross Fare:</span>
                <span>₹{f.roundTrip}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#dc3545' }}>
                <span>Platform Fee (5%):</span>
                <span>- ₹{f.commission}</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #c3e6cb', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#155724' }}>Net Payout:</span>
                <strong style={{ fontSize: '1.2em', color: '#155724' }}>₹{f.driverPayout}</strong>
            </div>
        </div>
    );
}

export default DriverPaySlip;
