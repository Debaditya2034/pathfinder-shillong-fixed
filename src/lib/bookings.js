// src/lib/bookings.js
import { db, auth } from "@/firebase";
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";

function genCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }

export async function createBooking(payload = {}) {
  const bookingCode = genCode();

  const bookingBase = {
    tripId: payload.tripId || null,
    touristId: payload.touristId || (auth?.currentUser?.uid || null),
    driverId: payload.driverId || null,
    amount: payload.amount ?? payload.finalFare ?? 0,
    currency: payload.currency || "INR",
    status: payload.status || "pending",
    finalFare: payload.finalFare ?? null,
    stops: payload.stops || [],
    estimate: payload.estimate || {},
    vehicle: payload.vehicle || null,
    scheduledAt: payload.scheduledAt || null,
    bookingCode,
    demoPayment: payload.demoPayment || { status: "pending" },
    notes: payload.notes || null,
    createdAt: serverTimestamp(),
  };

  try {
    if (!db) throw new Error("No Firestore (db) available");

    const colRef = collection(db, "bookings");
    const docRef = await addDoc(colRef, bookingBase);
    await setDoc(doc(db, "bookings", docRef.id), { bookingId: docRef.id }, { merge: true });

    return { id: docRef.id, bookingCode, fallback: false };
  } catch (clientErr) {
    console.warn("createBooking: client SDK write failed, falling back:", clientErr && clientErr.message);
    // ... fallback to REST/local as before (omitted here for brevity; keep client SDK primary)
    const bk = { id: "local-" + Date.now(), ...bookingBase, createdAt: new Date().toISOString() };
    const arr = JSON.parse(localStorage.getItem("pf_demo_bookings") || "[]");
    arr.push(bk);
    localStorage.setItem("pf_demo_bookings", JSON.stringify(arr));
    return { id: bk.id, bookingCode, fallback: true, error: clientErr ? clientErr.message : "client-failure" };
  }
}

export function listLocalBookings() {
  return JSON.parse(localStorage.getItem("pf_demo_bookings") || "[]");
}
