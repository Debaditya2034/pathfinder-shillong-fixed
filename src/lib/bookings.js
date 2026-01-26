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
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new booking
 */
export async function createBooking(userId, places, notes = null, scheduledAt = null) {
  if (!places || places.length === 0) {
    throw new Error('Itinerary must have at least one place');
  }

  try {
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      userId,
      driverId: null,
      places,
      scheduledAt,
      notes,
      status: 'pending',
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
 * Accept a booking (transaction-based to prevent double-accept)
 */
export async function acceptBooking(bookingId, driverId) {
  try {
    await runTransaction(db, async (transaction) => {
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

      // Update booking
      transaction.update(bookingRef, {
        driverId,
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
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
 */
export async function confirmCompletion(bookingId, userId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

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

    await updateDoc(bookingRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
