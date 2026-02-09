import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SHILLONG_PLACES } from '../data/places';
import Dialog from '../components/Dialog';
import { useNavigate } from 'react-router-dom';

function DriverAccount() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Profile Fields
    const [vehicleType, setVehicleType] = useState('Sedan');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedPlaces, setSelectedPlaces] = useState([]);

    // Dialog for success
    const [successDialog, setSuccessDialog] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchDriverProfile = async () => {
            try {
                const docRef = doc(db, 'driverProfiles', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setVehicleType(data.vehicleType || 'Sedan');
                    setLicenseNumber(data.licenseNumber || '');
                    setPhoneNumber(data.phoneNumber || '');
                    setSelectedPlaces(data.placesServed || []);
                } else {
                    // If no profile exists yet (shouldn't happen for valid drivers but safety check)
                    setError('Driver profile not found.');
                }
            } catch (err) {
                console.error('Error fetching driver profile:', err);
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchDriverProfile();
    }, [user]);

    const handlePlaceToggle = (place) => {
        setSelectedPlaces(prev =>
            prev.includes(place)
                ? prev.filter(p => p !== place)
                : [...prev, place]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        if (selectedPlaces.length === 0) {
            setError('Please select at least one service area.');
            setSaving(false);
            return;
        }

        try {
            const docRef = doc(db, 'driverProfiles', user.uid);
            await updateDoc(docRef, {
                vehicleType,
                licenseNumber,
                phoneNumber,
                placesServed: selectedPlaces,
                updatedAt: serverTimestamp()
            });
            setSuccessDialog(true);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

    // Ideally strictly for drivers, but profile optional check for robustness
    if (profile && profile.role !== 'driver') {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Access Denied</div>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h1>Driver Account</h1>

            {/* Success Dialog */}
            <Dialog
                isOpen={successDialog}
                title="Success"
                onClose={() => setSuccessDialog(false)}
                actions={[
                    {
                        label: 'OK',
                        onClick: () => {
                            setSuccessDialog(false);
                            // Option to navigate back or stay
                        },
                        variant: 'primary'
                    }
                ]}
            >
                <p>Profile updated successfully!</p>
            </Dialog>

            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Phone Number:</label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        placeholder="+91 9876543210"
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Vehicle Type:</label>
                    <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="Hatchback">Hatchback</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Driving License Number:</label>
                    <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Service Areas:</label>
                    <div style={{
                        marginTop: '10px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        padding: '10px',
                        borderRadius: '4px',
                        backgroundColor: '#fafafa'
                    }}>
                        {SHILLONG_PLACES.map(place => (
                            <label
                                key={place}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedPlaces.includes(place)}
                                    onChange={() => handlePlaceToggle(place)}
                                    style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                                />
                                {place}
                            </label>
                        ))}
                    </div>
                    <p style={{ marginTop: '5px', fontSize: '0.9em', color: '#666' }}>
                        Selected: {selectedPlaces.length}
                    </p>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/driver')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Dashboard
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: saving ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DriverAccount;
