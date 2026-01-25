// src/lib/tracking.js
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";

/**
 * Real-time location tracking for drivers
 * Uses Geolocation API and updates Firestore
 */

let watchId = null;
let trackingInterval = null;

/**
 * Start tracking driver location
 */
export async function startLocationTracking(driverId, bookingId, onLocationUpdate = null) {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by this browser");
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  };

  watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      // Update Firestore with driver location
      if (db) {
        try {
          await updateDoc(doc(db, "drivers", driverId), {
            currentLocation: location,
            lastUpdated: serverTimestamp(),
          });

          // Update booking with driver location if bookingId provided
          if (bookingId) {
            await updateDoc(doc(db, "bookings", bookingId), {
              driverLocation: location,
              driverLocationUpdatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error("Failed to update location in Firestore:", error);
        }
      }

      // Call callback if provided
      if (onLocationUpdate) {
        onLocationUpdate(location);
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    options
  );

  // Also update periodically via interval (backup)
  trackingInterval = setInterval(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };

          if (db) {
            try {
              await updateDoc(doc(db, "drivers", driverId), {
                currentLocation: location,
                lastUpdated: serverTimestamp(),
              });
            } catch (error) {
              console.error("Interval location update error:", error);
            }
          }
        },
        (error) => console.error("Interval geolocation error:", error)
      );
    }
  }, 30000); // Update every 30 seconds

  return watchId;
}

/**
 * Stop tracking driver location
 */
export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (trackingInterval !== null) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

/**
 * Get driver's current location
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Update ride status
 */
export async function updateRideStatus(bookingId, status, driverId = null, location = null) {
  if (!db) {
    console.warn("Firestore not available, cannot update ride status");
    return;
  }

  try {
    const updateData = {
      status,
      statusUpdatedAt: serverTimestamp(),
    };

    if (location) {
      updateData.driverLocation = location;
    }

    if (driverId) {
      updateData.driverId = driverId;
    }

    await updateDoc(doc(db, "bookings", bookingId), updateData);

    // Log status change for audit trail
    await addDoc(collection(db, "rideStatusHistory"), {
      bookingId,
      status,
      driverId,
      location,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to update ride status:", error);
    throw error;
  }
}

/**
 * Subscribe to driver location updates for a booking
 */
export function subscribeToDriverLocation(bookingId, callback) {
  if (!db) {
    console.warn("Firestore not available, cannot subscribe to location");
    return () => {};
  }

  return import("firebase/firestore").then(({ onSnapshot, doc }) => {
    const bookingRef = doc(db, "bookings", bookingId);
    
    return onSnapshot(bookingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.driverLocation) {
          callback(data.driverLocation);
        }
      }
    });
  });
}
