import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  getAggregateFromServer,
  sum,
  average,
  count
} from 'firebase/firestore';
import { db } from './firebase';
import { calculateTripFare } from './fareCalculator';

/**
 * Create a new booking
 */
export async function createBooking(userId, places, notes = null, scheduledAt = null, vehicleType = 'Sedan', packageType = 'Full Day', stayDurations = {}, startLocation = '', startTime = null) {
  if (!places || places.length === 0) {
    throw new Error('Itinerary must have at least one place');
  }

  try {
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      userId,
      driverId: null,
      places,
      scheduledAt, // Kept for backward compatibility, but startTime is preferred
      startLocation,
      startTime,
      notes,
      vehicleType,
      packageType,
      stayDurations,
      packageType,
      stayDurations,
      status: 'pending',
      // New status fields
      systemStatus: 'pending',
      driverStatus: 'searching',
      touristStatus: 'active',

      ...calculateTripFare(places, vehicleType, packageType, stayDurations),
      declinedBy: [], // Array of driver UIDs who declined
      completionRequestedAt: null,
      completedAt: null,
      completionDispute: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { bookingId: bookingRef.id, success: true };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Get bookings for a tourist (their own bookings)
 */
export async function getTouristBookings(userId) {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tourist bookings:', error);
    throw error;
  }
}

/**
 * Get driver profile with placesServed
 */
export async function getDriverProfile(driverId) {
  try {
    const driverDoc = await getDoc(doc(db, 'driverProfiles', driverId));
    return driverDoc.exists() ? driverDoc.data() : null;
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    throw error;
  }
}

/**
 * Check if driver is eligible for a booking
 * Matching rule: booking.places must have at least 1 overlap with driverProfiles.placesServed
 */
export function isDriverEligible(bookingPlaces, driverPlacesServed) {
  if (!driverPlacesServed || driverPlacesServed.length === 0) {
    return false;
  }
  // Check if at least one booking place is in driver's placesServed
  return bookingPlaces.some(place => driverPlacesServed.includes(place));
}

/**
 * Get eligible pending bookings for a driver
 * Note: This fetches all pending bookings and filters client-side
 * For production, consider using array-contains-any or a different data structure
 */
export async function getEligibleBookingsForDriver(driverId) {
  try {
    // Get driver profile
    const driverProfile = await getDriverProfile(driverId);
    if (!driverProfile || !driverProfile.placesServed) {
      return [];
    }

    // Get all pending bookings (use simple query, sort client-side)
    // This avoids index requirements
    const q = query(
      collection(db, 'bookings'),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);

    // Filter client-side for eligible bookings
    const eligibleBookings = [];
    snapshot.docs.forEach(doc => {
      const booking = { id: doc.id, ...doc.data() };
      // Check if driver hasn't declined this booking
      const declinedBy = booking.declinedBy || [];
      if (!declinedBy.includes(driverId) && isDriverEligible(booking.places, driverProfile.placesServed)) {
        eligibleBookings.push(booking);
      }
    });

    // Sort by updatedAt if we used fallback query
    eligibleBookings.sort((a, b) => {
      const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return eligibleBookings;
  } catch (error) {
    console.error('Error fetching eligible bookings:', error);
    throw error;
  }
}

/**
 * Get active bookings for a driver (accepted by them)
 */
export async function getDriverActiveBookings(driverId) {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('driverId', '==', driverId),
      where('status', 'in', ['accepted', 'completion_requested', 'completed', 'disputed'])
    );
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort client-side by updatedAt (newest first)
    bookings.sort((a, b) => {
      const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return bookings;
  } catch (error) {
    console.error('Error fetching driver active bookings:', error);
    throw error;
  }
}

/**
 * Accept a booking (transaction-based to prevent double-accept and enforce single active booking)
 */
export async function acceptBooking(bookingId, driverId) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get the booking
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await transaction.get(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data();

      // Validate booking is still pending and not already accepted
      if (booking.status !== 'pending') {
        throw new Error('Booking is no longer available');
      }

      if (booking.driverId !== null) {
        throw new Error('Booking has already been accepted by another driver');
      }

      // 2. Check and lock driver status
      const driverStatusRef = doc(db, 'driverStatus', driverId);
      const driverStatusSnap = await transaction.get(driverStatusRef);

      if (driverStatusSnap.exists()) {
        const driverStatus = driverStatusSnap.data();
        if (driverStatus.activeBookingId) {
          throw new Error('You already have an active ride. Complete it before accepting another.');
        }
      }

      // 3. Update booking
      transaction.update(bookingRef, {
        driverId,
        status: 'accepted',
        systemStatus: 'accepted',
        driverStatus: 'scheduled',
        touristStatus: 'ride_scheduled',
        updatedAt: serverTimestamp()
      });

      // 4. Update driver status
      transaction.set(driverStatusRef, {
        activeBookingId: bookingId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    return { success: true };
  } catch (error) {
    console.error('Error accepting booking:', error);
    throw error;
  }
}

/**
 * Decline a booking (adds driver to declinedBy array)
 */
export async function declineBooking(bookingId, driverId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data();

    // Only allow declining if booking is still pending
    if (booking.status !== 'pending') {
      throw new Error('Can only decline pending bookings');
    }

    // Add driver to declinedBy array (using arrayUnion to prevent duplicates)
    await updateDoc(bookingRef, {
      declinedBy: arrayUnion(driverId),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error declining booking:', error);
    throw error;
  }
}

/**
 * Cancel a booking (tourist can cancel their own pending booking)
 */
export async function cancelBooking(bookingId, userId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data();

    // Validate user owns the booking
    if (booking.userId !== userId) {
      throw new Error('Unauthorized: You can only cancel your own bookings');
    }

    // Only allow canceling pending bookings
    if (booking.status !== 'pending') {
      throw new Error('Can only cancel pending bookings');
    }

    await updateDoc(bookingRef, {
      status: 'cancelled',
      systemStatus: 'cancelled',
      driverStatus: 'cancelled',
      touristStatus: 'cancelled',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}

/**
 * Request completion (driver requests tourist confirmation)
 * Changes status from "accepted" to "completion_requested"
 */
export async function requestCompletion(bookingId, driverId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data();

    // Validate driver owns the booking
    if (booking.driverId !== driverId) {
      throw new Error('Unauthorized: You can only complete your own bookings');
    }

    // Only allow requesting completion for accepted bookings
    if (booking.status !== 'accepted') {
      throw new Error('Can only request completion for accepted bookings');
    }

    await updateDoc(bookingRef, {
      status: 'completion_requested',
      systemStatus: 'completion_requested',
      driverStatus: 'completing',
      touristStatus: 'action_required',
      completionRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error requesting completion:', error);
    throw error;
  }
}

/**
 * Confirm completion (tourist confirms ride is complete)
 * Changes status from "completion_requested" to "completed"
 * AND releases driver from active booking
 */
export async function confirmCompletion(bookingId, userId) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get booking
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await transaction.get(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data();

      // Validate user owns the booking
      if (booking.userId !== userId) {
        throw new Error('Unauthorized: You can only confirm your own bookings');
      }

      // Only allow confirming if status is completion_requested
      if (booking.status !== 'completion_requested') {
        throw new Error('Can only confirm completion for bookings with completion requested');
      }

      // 2. Update booking
      transaction.update(bookingRef, {
        status: 'completed',
        systemStatus: 'completed',
        driverStatus: 'completed',
        touristStatus: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Release driver (if driverId exists)
      if (booking.driverId) {
        const driverStatusRef = doc(db, 'driverStatus', booking.driverId);
        transaction.set(driverStatusRef, {
          activeBookingId: null,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error confirming completion:', error);
    throw error;
  }
}

/**
 * Dispute completion (tourist disagrees with completion request)
 * Changes status from "completion_requested" to "disputed"
 */
export async function disputeCompletion(bookingId, userId, reason, details = null) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data();

    // Validate user owns the booking
    if (booking.userId !== userId) {
      throw new Error('Unauthorized: You can only dispute your own bookings');
    }

    // Only allow disputing if status is completion_requested
    if (booking.status !== 'completion_requested') {
      throw new Error('Can only dispute bookings with completion requested');
    }

    await updateDoc(bookingRef, {
      status: 'disputed',
      systemStatus: 'disputed',
      driverStatus: 'dispute_active',
      touristStatus: 'dispute_active',
      completionDispute: {
        reason,
        details: details || null,
        createdAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error disputing completion:', error);
    throw error;
  }
}

/**
 * Create a support ticket
 */
export async function createSupportTicket(bookingId, userId, driverId, reason, message) {
  try {
    const ticketRef = await addDoc(collection(db, 'supportTickets'), {
      bookingId,
      userId,
      driverId: driverId || null,
      reason,
      message: message || '',
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { ticketId: ticketRef.id, success: true };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
}

/**
 * Retry a booking (reset declinedBy and update timestamp)
 */
export async function retryBooking(bookingId, userId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data();

    if (booking.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (booking.status !== 'pending') {
      throw new Error('Can only retry pending bookings');
    }

    await updateDoc(bookingRef, {
      declinedBy: [],
      systemStatus: 'pending',
      driverStatus: 'searching',
      touristStatus: 'active',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp() // Reset created at to restart the "timer" conceptually
    });

    return { success: true };
  } catch (error) {
    console.error('Error retrying booking:', error);
    throw error;
  }
}

/**
 * Get driver analytics (using aggregation queries)
 */
export async function getDriverAnalytics(driverId) {
  try {
    const bookingsRef = collection(db, 'bookings');

    // 1. Completed bookings stats
    const completedQuery = query(
      bookingsRef,
      where('driverId', '==', driverId),
      where('status', '==', 'completed')
    );

    const completedSnapshot = await getAggregateFromServer(completedQuery, {
      totalRides: count(),
      totalEarnings: sum('fare.driverPayout'),
      avgDistance: average('totalDistanceKm')
    });

    const completedStats = completedSnapshot.data();

    // 2. Disputed bookings count
    const disputedQuery = query(
      bookingsRef,
      where('driverId', '==', driverId),
      where('status', '==', 'disputed')
    );

    const disputedSnapshot = await getAggregateFromServer(disputedQuery, {
      disputedCount: count()
    });

    const disputedStats = disputedSnapshot.data();

    return {
      totalRides: completedStats.totalRides || 0,
      totalEarnings: completedStats.totalEarnings || 0,
      avgDistance: completedStats.avgDistance || 0,
      disputedCount: disputedStats.disputedCount || 0
    };
  } catch (error) {
    console.error('Error fetching driver analytics:', error);
    return {
      totalRides: 0,
      totalEarnings: 0,
      avgDistance: 0,
      disputedCount: 0
    };
  }
}
