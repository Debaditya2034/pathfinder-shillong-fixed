import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore'
import { db } from './firebase'

export async function createBooking(userId, bookingData) {
  const bookingRef = await addDoc(collection(db, 'bookings'), {
    userId,
    driverId: null,
    places: bookingData.places,
    scheduledAt: bookingData.scheduledAt,
    notes: bookingData.notes || null,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  // Trigger assignment
  await assignDriverToBooking(bookingRef.id, bookingData.places)

  return bookingRef.id
}

export async function assignDriverToBooking(bookingId, places) {
  try {
    await runTransaction(db, async (transaction) => {
      // Check if booking is already assigned
      const bookingRef = doc(db, 'bookings', bookingId)
      const bookingSnap = await transaction.get(bookingRef)

      if (!bookingSnap.exists()) {
        throw new Error('Booking does not exist')
      }

      const booking = bookingSnap.data()
      if (booking.status !== 'pending' || booking.driverId) {
        // Already assigned or not pending
        return
      }

      // Find eligible drivers
      const driverProfilesRef = collection(db, 'driverProfiles')
      const driverProfilesSnap = await getDocs(driverProfilesRef)

      const eligibleDrivers = []
      driverProfilesSnap.forEach((doc) => {
        const profile = doc.data()
        const placesServed = profile.placesServed || []
        // Check if driver serves all requested places
        const servesAllPlaces = places.every(place => placesServed.includes(place))
        if (servesAllPlaces) {
          eligibleDrivers.push({ uid: doc.id, profile })
        }
      })

      if (eligibleDrivers.length === 0) {
        // No eligible drivers found - keep as pending
        return
      }

      // Assign to first eligible driver (deterministic by creation order)
      // Sort by createdAt if available, otherwise by uid
      eligibleDrivers.sort((a, b) => {
        const aTime = a.profile.createdAt?.toMillis() || 0
        const bTime = b.profile.createdAt?.toMillis() || 0
        return aTime - bTime || a.uid.localeCompare(b.uid)
      })

      const assignedDriverId = eligibleDrivers[0].uid

      // Update booking
      transaction.update(bookingRef, {
        driverId: assignedDriverId,
        status: 'assigned',
        updatedAt: serverTimestamp()
      })
    })
  } catch (error) {
    console.error('Error assigning driver:', error)
    throw error
  }
}

export function subscribeToDriverBookings(driverId, callback) {
  const q = query(
    collection(db, 'bookings'),
    where('driverId', '==', driverId),
    where('status', 'in', ['assigned'])
  )

  return onSnapshot(q, (snapshot) => {
    const bookings = []
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      })
    })
    callback(bookings)
  })
}

export async function updateBookingStatus(bookingId, status) {
  const bookingRef = doc(db, 'bookings', bookingId)
  await updateDoc(bookingRef, {
    status,
    updatedAt: serverTimestamp()
  })
}

export async function getTouristBookings(userId) {
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId)
  )

  const snapshot = await getDocs(q)
  const bookings = []
  snapshot.forEach((doc) => {
    bookings.push({
      id: doc.id,
      ...doc.data()
    })
  })
  return bookings
}
