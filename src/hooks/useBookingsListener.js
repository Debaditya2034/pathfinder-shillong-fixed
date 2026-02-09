import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useBookingsListener(userId) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalDrivers, setTotalDrivers] = useState(0);

    // Fetch total driver count once
    useEffect(() => {
        async function fetchDriverCount() {
            try {
                const coll = collection(db, 'driverProfiles');
                const snapshot = await getCountFromServer(coll);
                setTotalDrivers(snapshot.data().count);
            } catch (err) {
                console.error('Error fetching driver count:', err);
            }
        }
        fetchDriverCount();
    }, []);

    // Listen to bookings
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'bookings'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setBookings(bookingsData);
            setLoading(false);
        }, (err) => {
            console.error('Error listening to bookings:', err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { bookings, loading, error, totalDrivers };
}
