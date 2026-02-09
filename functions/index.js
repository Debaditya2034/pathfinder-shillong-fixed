const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const twilio = require('twilio');

admin.initializeApp();

const db = admin.firestore();

// --- Configuration (Env Vars) ---
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

const META_TOKEN = process.env.META_API_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_NUMBER_ID;

const SUPPORT_CONTACT = "+91-9876543210";

// --- Fare Logic Constants ---
const VEHICLE_RATES = { Hatchback: 10, Sedan: 12, SUV: 15 };
const TIME_RATES = {
    'Half Day': { base: 1500, hours: 4 },
    'Full Day': { base: 2500, hours: 8 },
    'Custom': { base: 0, hours: 0 }
};
const COMMISSION_RATE = 0.05;
const EXTRA_HOUR_RATE = 300;
const MIN_BILLABLE_DISTANCE_KM = 5;

// Canonical coordinates
const PLACES_DATA = {
    'Shillong': { lat: 25.5788, lng: 91.8933 },
    'Living Root Bridge': { lat: 25.2530, lng: 91.6700 },
    'Umiam Lake': { lat: 25.6667, lng: 91.9167 },
    'Elephant Falls': { lat: 25.5350, lng: 91.8210 },
    'Shillong Peak': { lat: 25.5400, lng: 91.8500 },
    'Don Bosco Museum': { lat: 25.5840, lng: 91.8990 },
    'Ward\'s Lake': { lat: 25.5780, lng: 91.8840 },
    'Lady Hydari Park': { lat: 25.5700, lng: 91.8850 },
    'Mawphlang Sacred Forest': { lat: 25.4430, lng: 91.7510 },
    'Seven Sisters Falls': { lat: 25.2750, lng: 91.7160 },
    'Mawlynnong Village': { lat: 25.1970, lng: 91.9160 },
    'Dawki': { lat: 25.1270, lng: 92.0190 },
    'Cherrapunji': { lat: 25.2702, lng: 91.7323 },
    'Mawsmai Cave': { lat: 25.2540, lng: 91.7240 },
    'Nohkalikai Falls': { lat: 25.2758, lng: 91.7050 },
    'Krang Suri Falls': { lat: 25.2440, lng: 92.2040 },
    'Double Decker Living Root Bridge': { lat: 25.2340, lng: 91.6830 },
    'Mawjymbuin Cave': { lat: 25.2950, lng: 91.5640 },
    'Laitlum Grand Canyon': { lat: 25.4980, lng: 91.9050 },
    'Mawlyngbna': { lat: 25.1960, lng: 91.5790 }
};

// --- Helpers ---

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateTotalDistance(places) {
    if (!places || places.length === 0) return 0;
    let calcPlaces = places.length === 1 ? ['Shillong', places[0]] : places;
    let totalDist = 0;
    for (let i = 0; i < calcPlaces.length - 1; i++) {
        const from = PLACES_DATA[calcPlaces[i]];
        const to = PLACES_DATA[calcPlaces[i + 1]];
        if (!from || !to) continue;
        totalDist += calculateDistance(from.lat, from.lng, to.lat, to.lng);
    }
    return parseFloat(totalDist.toFixed(2));
}

async function getUserProfile(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
}

async function getDriverProfile(uid) {
    const doc = await db.collection('driverProfiles').doc(uid).get();
    return doc.exists ? doc.data() : null;
}

async function logNotification(bookingId, type, status, channel, recipient) {
    await db.collection('notifications').add({
        bookingId,
        type,
        status, // 'sent' | 'failed'
        channel, // 'sms' | 'whatsapp'
        recipient,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
}

// --- Notification Sending Logic ---

async function sendDualNotification(recipientPhone, recipientName, templateName, variables, smsBody) {
    if (!recipientPhone) {
        console.warn('Skipping notification: No phone number');
        return;
    }

    // 1. Send SMS (Twilio)
    try {
        if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
            const client = twilio(TWILIO_SID, TWILIO_TOKEN);
            await client.messages.create({
                body: smsBody,
                from: TWILIO_FROM,
                to: recipientPhone
            });
            await logNotification(variables.bookingId, templateName, 'sent', 'sms', recipientPhone);
        } else {
            console.log('Mock SMS Sent:', smsBody);
            await logNotification(variables.bookingId, templateName, 'mock_sent', 'sms', recipientPhone);
        }
    } catch (error) {
        console.error('SMS Error:', error);
        await logNotification(variables.bookingId, templateName, 'failed', 'sms', recipientPhone);
    }

    // 2. Send WhatsApp (Meta)
    try {
        if (META_TOKEN && META_PHONE_ID) {
            await axios.post(
                `https://graph.facebook.com/v17.0/${META_PHONE_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: recipientPhone,
                    type: "template",
                    template: {
                        name: templateName, // Assumes approved template "pathfinder_notification"
                        language: { code: "en" },
                        components: [
                            {
                                type: "body",
                                parameters: variables.params.map(v => ({ type: "text", text: String(v) }))
                            }
                        ]
                    }
                },
                { headers: { Authorization: `Bearer ${META_TOKEN}` } }
            );
            await logNotification(variables.bookingId, templateName, 'sent', 'whatsapp', recipientPhone);
        } else {
            console.log('Mock WhatsApp Sent (Template):', templateName);
            await logNotification(variables.bookingId, templateName, 'mock_sent', 'whatsapp', recipientPhone);
        }
    } catch (error) {
        console.error('WhatsApp Error:', error);
        await logNotification(variables.bookingId, templateName, 'failed', 'whatsapp', recipientPhone);
    }
}

// --- Triggers ---

/**
 * 1. Booking Created: Calculate Fare & Notify Tourist
 */
exports.onBookingCreate = functions.firestore
    .document('bookings/{bookingId}')
    .onCreate(async (snap, context) => {
        const booking = snap.data();
        const bookingId = context.params.bookingId;

        // A. Fare Calculation
        const places = booking.places || [];
        const vehicleType = booking.vehicleType || 'Sedan';
        const packageType = booking.packageType || 'Full Day';
        const stayDurations = booking.stayDurations || {};

        let computedDistanceKm = calculateTotalDistance(places);
        let minimumApplied = false;
        if (computedDistanceKm < MIN_BILLABLE_DISTANCE_KM) {
            computedDistanceKm = MIN_BILLABLE_DISTANCE_KM;
            minimumApplied = true;
        }

        const ratePerKm = VEHICLE_RATES[vehicleType] || VEHICLE_RATES.Sedan;
        const distanceFare = Math.round(computedDistanceKm * ratePerKm * 2);

        // Time Calculation
        const packageInfo = TIME_RATES[packageType] || TIME_RATES['Full Day'];
        const baseTimeFare = packageInfo.base;
        const allowedHours = packageInfo.hours;

        // Calculate total planned duration
        let totalStayHours = 0;
        places.forEach(place => {
            if (place !== 'Shillong') {
                totalStayHours += parseFloat(stayDurations[place] || 1);
            }
        });

        const travelTimeHours = computedDistanceKm / 30;
        const totalDutyHours = (travelTimeHours * 2) + totalStayHours;

        let extraHours = 0;
        let extraStayFare = 0;

        if (packageType !== 'Custom' && totalDutyHours > allowedHours) {
            extraHours = Math.ceil(totalDutyHours - allowedHours);
            extraStayFare = extraHours * EXTRA_HOUR_RATE;
        }

        const totalFare = distanceFare + baseTimeFare + extraStayFare;
        const platformCommission = Math.round(totalFare * COMMISSION_RATE);
        const driverPayout = totalFare - platformCommission;

        const fareData = {
            totalDistanceKm: computedDistanceKm,
            computedDistanceKm,
            minimumApplied,
            vehicleType,
            ratePerKm,
            packageType,
            allowedHours,
            totalDutyHours: parseFloat(totalDutyHours.toFixed(1)),
            extraHours,
            stayDurations,
            fare: {
                distanceFare,
                baseTimeFare,
                extraStayFare,
                totalFare,
                commission: platformCommission,
                driverPayout,
                currency: 'INR',
                roundTrip: totalFare, // Backward compatibility
                oneWay: Math.round(totalFare / 2) // Backward compatibility
            },
            fareBreakdown: {
                distanceFare,
                baseTimeFare,
                extraStayFare,
                totalFare,
                commission: platformCommission,
                driverPayout,
                currency: 'INR'
            },
            computedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Update booking with fare
        await snap.ref.update(fareData);

        // B. Notification: Booking Created
        const user = await getUserProfile(booking.userId);
        if (user && user.phoneNumber) {
            const smsBody = `Pathfinder: Booking #${bookingId.slice(0, 6)} created. Est Fare: ₹${roundTripFare}. Need help? Call ${SUPPORT_CONTACT}`;
            await sendDualNotification(
                user.phoneNumber,
                user.displayName || 'Traveler',
                'booking_created', // Template Name
                {
                    bookingId,
                    params: [bookingId.slice(0, 6), roundTripFare, SUPPORT_CONTACT]
                },
                smsBody
            );
        }

        // C. Update Tourist Status (Create if not exists)
        await db.collection('touristStatus').doc(booking.userId).set({
            activeBookingId: bookingId,
            lastBooking: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });

/**
 * 2. Booking Status Updates
 */
/**
 * Helper: Release Booking Locks
 * Clears activeBookingId from driverStatus and touristStatus if it matches the completed booking.
 */
async function releaseBookingLocks(bookingId, driverId, touristId) {
    const performUnlock = async (forceContext = "") => {
        const updates = [];

        if (driverId) {
            const driverStatusRef = db.collection('driverStatus').doc(driverId);
            updates.push(db.runTransaction(async (t) => {
                const doc = await t.get(driverStatusRef);
                // Unlock if activeBooking matches OR if we are forcing a cleanup
                if (doc.exists && (doc.data().activeBookingId === bookingId)) {
                    t.update(driverStatusRef, {
                        activeBookingId: null,
                        lastUnlock: admin.firestore.FieldValue.serverTimestamp(),
                        unlockContext: forceContext || 'normal'
                    });
                }
            }));
        }

        if (touristId) {
            const touristStatusRef = db.collection('touristStatus').doc(touristId);
            updates.push(db.runTransaction(async (t) => {
                const doc = await t.get(touristStatusRef);
                if (doc.exists && (doc.data().activeBookingId === bookingId)) {
                    t.update(touristStatusRef, {
                        activeBookingId: null,
                        lastUnlock: admin.firestore.FieldValue.serverTimestamp(),
                        unlockContext: forceContext || 'normal'
                    });
                }
            }));
        }

        await Promise.all(updates);
    };

    // 1. Initial Attempt
    await performUnlock('initial');

    // 2. Log Unlock Event
    try {
        await db.collection('logs').add({
            type: 'unlock_event',
            bookingId,
            driverId,
            touristId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error('Failed to log unlock event:', e);
    }

    // 3. Fallback: Wait 5s and force ensure clear
    // Cloud functions might terminate early, but this provides a best-effort safety net
    await new Promise(resolve => setTimeout(resolve, 5000));
    await performUnlock('fallback_retry');
}

exports.onBookingStatusChange = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const after = change.after.data();
        const before = change.before.data();
        const bookingId = context.params.bookingId;

        const statusChanged = after.status !== before.status;
        const wellnessChanged = after.wellness !== before.wellness;

        // 1. Lock Release (Completed or Wellness Confirmed)
        if (
            (after.status === 'completed' && statusChanged) ||
            (after.wellness === true && wellnessChanged)
        ) {
            await releaseBookingLocks(bookingId, after.driverId, after.userId);
        }

        // 2. Notifications (Only if status changed)
        if (statusChanged) {
            const user = await getUserProfile(after.userId);
            if (!user || !user.phoneNumber) return;

            let driverName = 'Unknown Driver';
            if (after.driverId) {
                const driverIdx = await getDriverProfile(after.driverId);
                if (driverIdx) driverName = driverIdx.displayName || 'A Driver';
            }

            const fare = after.fare ? after.fare.roundTrip : 'N/A';

            // Event: Driver Accepted
            if (after.status === 'accepted' && before.status === 'pending') {
                const smsBody = `Pathfinder: Driver ${driverName} accepted your booking #${bookingId.slice(0, 6)}. Fare: ₹${fare}. Support: ${SUPPORT_CONTACT}`;
                await sendDualNotification(
                    user.phoneNumber,
                    user.displayName,
                    'driver_accepted',
                    { bookingId, params: [driverName, bookingId.slice(0, 6), fare] },
                    smsBody
                );
            }

            // Event: Completion Requested
            if (after.status === 'completion_requested') {
                const smsBody = `Pathfinder: Driver requested completion for #${bookingId.slice(0, 6)}. Please confirm in app.`;
                await sendDualNotification(
                    user.phoneNumber,
                    user.displayName,
                    'completion_requested',
                    { bookingId, params: [bookingId.slice(0, 6)] },
                    smsBody
                );
            }

            // Event: Ride Completed
            if (after.status === 'completed') {
                const smsBody = `Pathfinder: Ride #${bookingId.slice(0, 6)} completed. Total: ₹${fare}. Thanks for riding! Support: ${SUPPORT_CONTACT}`;
                await sendDualNotification(
                    user.phoneNumber,
                    user.displayName,
                    'ride_completed',
                    { bookingId, params: [bookingId.slice(0, 6), fare] },
                    smsBody
                );
            }

            // Event: Ride Disputed
            if (after.status === 'disputed') {
                const smsBody = `Pathfinder: Dispute raised for #${bookingId.slice(0, 6)}. Support will contact you shortly. ${SUPPORT_CONTACT}`;
                await sendDualNotification(
                    user.phoneNumber,
                    user.displayName,
                    'ride_disputed',
                    { bookingId, params: [bookingId.slice(0, 6)] },
                    smsBody
                );
            }
        }
    });

