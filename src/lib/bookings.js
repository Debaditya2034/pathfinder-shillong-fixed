// REST-backed createBooking (demo mode) — put near top of src/lib/bookings.js
import { auth, firebaseApp } from "../firebase"; // adjust if your firebase export names differ

function genCode() { return Math.floor(100000+Math.random()*900000).toString(); }

export async function createBookingREST(payload = {}) {
  console.log('[bookings-rest] creating booking via REST', payload);
  // sanity
  if (!auth || !firebaseApp) {
    console.warn('[bookings-rest] firebase not ready — falling back to local save');
    const bk = { id:'local-'+Date.now(), ...payload, bookingCode: genCode(), status:'pending' };
    const arr = JSON.parse(localStorage.getItem('pf_demo_bookings')||'[]'); arr.push(bk); localStorage.setItem('pf_demo_bookings', JSON.stringify(arr));
    return { id: bk.id, bookingCode: bk.bookingCode, fallback: true };
  }

  const user = auth.currentUser;
  if (!user) throw new Error('user-not-signed-in');

  const idToken = await user.getIdToken(/* forceRefresh */ true);
  const projectId = (firebaseApp?.options && firebaseApp.options.projectId) || "<REPLACE_WITH_PROJECT_ID>";
  if (!projectId) throw new Error('Missing projectId in firebase config; set firebaseApp.options.projectId');

  // Build REST document body (simple fields; will store createdAt as string for demo)
  const bookingBase = {
    touristId: user.uid,
    stops: payload.stops || [],
    estimate: payload.estimate || {},
    vehicle: payload.vehicle || 'unknown',
    scheduledAt: payload.scheduledAt || new Date().toISOString(),
    status: 'pending',
    bookingCode: genCode(),
    demoPayment: { status: 'pending' },
    createdAt: new Date().toISOString(),
  };

  // Firestore REST expects a "document" with fields typed. Helper to wrap JS -> Firestore value.
  const wrap = v => {
    if (v === null) return { nullValue: null };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(wrap) } };
    switch (typeof v) {
      case 'string': return { stringValue: v };
      case 'number': return { doubleValue: v };
      case 'boolean': return { booleanValue: v };
      case 'object':
        // object/map
        return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k,val]) => [k, wrap(val)])) } };
      default: return { stringValue: String(v) };
    }
  };

  const docFields = {};
  for (const k of Object.keys(bookingBase)) docFields[k] = wrap(bookingBase[k]);

  // createDocument endpoint
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/bookings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: docFields })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[bookings-rest] REST write failed', res.status, text);
    // fallback local save
    const bk = { id:'local-'+Date.now(), ...bookingBase };
    const arr = JSON.parse(localStorage.getItem('pf_demo_bookings')||'[]'); arr.push(bk); localStorage.setItem('pf_demo_bookings', JSON.stringify(arr));
    return { id: bk.id, bookingCode: bk.bookingCode, fallback: true, error: text };
  }

  const body = await res.json();
  // body.name looks like: projects/PROJECTID/databases/(default)/documents/bookings/GENERATED_ID
  const parts = body.name.split('/');
  const docId = parts[parts.length-1];
  console.log('[bookings-rest] created doc', docId, body);
  return { id: docId, bookingCode: bookingBase.bookingCode };
}
