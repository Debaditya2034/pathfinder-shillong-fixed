// src/lib/createBooking.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

/** Simple numeric booking code */
function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * createBooking(payload)
 * Writes both a trip (drivers act on) and a booking (payment record).
 * Returns { tripId, bookingId, bookingCode }
 */
export async function createBooking(payload = {}) {
  if (!db) throw new Error("Firestore (db) not initialized");

  const bookingCode = payload.bookingCode || genCode();
  const now = serverTimestamp();

  const tripDoc = {
    touristId: payload.touristId || null,
    driverId: payload.driverId || null,
    status: payload.status || "requested", // requested | assigned | on_trip | completed | cancelled
    pickup: payload.pickup || (payload.stops && payload.stops[0]) || null,
    dropoff: payload.dropoff || (payload.stops && payload.stops[payload.stops.length - 1]) || null,
    stops: payload.stops || [],
    requestedAt: now,
    scheduledFor: payload.scheduledAt || null,
    fareEstimate: payload.estimate || payload.fareEstimate || null,
    finalFare: payload.finalFare || null,
    notes: payload.notes || null,
    bookingCode,
    createdAt: now
  };

  // create trip
  const tripsCol = collection(db, "trips");
  const tripRef = await addDoc(tripsCol, tripDoc);

  // create booking record (payment)
  const bookingDoc = {
    tripId: tripRef.id,
    touristId: payload.touristId || null,
    amount: payload.amount || payload.estimate || payload.fareEstimate || null,
    currency: payload.currency || "INR",
    status: payload.bookingStatus || "pending",
    bookingCode,
    createdAt: now
  };

  const bookingsCol = collection(db, "bookings");
  const bookingRef = await addDoc(bookingsCol, bookingDoc);

  return { tripId: tripRef.id, bookingId: bookingRef.id, bookingCode };
}

export default createBooking;
