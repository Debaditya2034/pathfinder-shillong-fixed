
import {
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Subscribe to driver analytics (real-time)
 * @param {string} driverId 
 * @param {function} callback
 * @returns {function} Unsubscribe function
 */
export function subscribeToDriverMetrics(driverId, callback) {
    const q = query(
        collection(db, 'bookings'),
        where('driverId', '==', driverId)
    );

    return onSnapshot(q, (snapshot) => {
        let totalRides = 0;
        let totalEarnings = 0;
        let totalDistance = 0;
        let disputedCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();

            if (data.status === 'completed') {
                totalRides++;
                totalEarnings += (Number(data.fare?.driverPayout) || 0);
                totalDistance += (Number(data.totalDistanceKm) || 0);
            } else if (data.status === 'disputed') {
                disputedCount++;
            }
        });

        const avgDistance = totalRides > 0 ? (totalDistance / totalRides) : 0;

        callback({
            totalRides,
            totalEarnings,
            avgDistance,
            disputedCount
        });
    }, (error) => {
        console.error('Error listening to driver metrics:', error);
    });
}
