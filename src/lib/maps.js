// src/lib/maps.js
import { locationSchema, validateData } from "@/lib/validation";

/**
 * Google Maps integration
 * Loads Google Maps API and provides utilities for map operations
 */

let mapsLoaded = false;
let googleMaps = null;

/**
 * Load Google Maps API script
 */
export function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (mapsLoaded && window.google) {
      googleMaps = window.google.maps;
      resolve(googleMaps);
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Script already loading
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          mapsLoaded = true;
          googleMaps = window.google.maps;
          resolve(googleMaps);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,directions&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      mapsLoaded = true;
      googleMaps = window.google.maps;
      resolve(googleMaps);
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize map instance
 */
export function initMap(containerId, center, zoom = 12) {
  return new Promise(async (resolve, reject) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not found. Using fallback.");
        resolve(null);
        return;
      }

      const maps = await loadGoogleMaps(apiKey);
      const container = document.getElementById(containerId);
      if (!container) {
        reject(new Error(`Container ${containerId} not found`));
        return;
      }

      const map = new maps.Map(container, {
        center: center || { lat: 25.5788, lng: 91.8933 }, // Shillong default
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      resolve(map);
    } catch (error) {
      console.error("Map initialization error:", error);
      reject(error);
    }
  });
}

/**
 * Calculate route between multiple points
 */
export async function calculateRoute(stops) {
  const validation = validateData(
    locationSchema.array().min(2),
    stops
  );

  if (!validation.success) {
    throw new Error(validation.errors[0].message);
  }

  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Fallback to Haversine calculation
      return calculateRouteFallback(stops);
    }

    const maps = await loadGoogleMaps(apiKey);
    const directionsService = new maps.DirectionsService();
    const directionsRenderer = new maps.DirectionsRenderer();

    const waypoints = stops.slice(1, -1).map((stop) => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    return new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: { lat: stops[0].lat, lng: stops[0].lng },
          destination: { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng },
          waypoints: waypoints.length > 0 ? waypoints : undefined,
          travelMode: maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === maps.DirectionsStatus.OK) {
            const route = result.routes[0];
            const leg = route.legs[0];
            const totalDistance = route.legs.reduce(
              (sum, leg) => sum + leg.distance.value,
              0
            );
            const totalDuration = route.legs.reduce(
              (sum, leg) => sum + leg.duration.value,
              0
            );

            resolve({
              distance: totalDistance / 1000, // Convert to km
              duration: totalDuration / 60, // Convert to minutes
              polyline: route.overview_polyline,
              bounds: route.bounds,
              steps: route.legs.flatMap((leg) => leg.steps),
            });
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error("Route calculation error:", error);
    return calculateRouteFallback(stops);
  }
}

/**
 * Fallback route calculation using Haversine formula
 */
function calculateRouteFallback(stops) {
  let totalDistance = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const distance = calculateHaversineDistance(
      stops[i].lat,
      stops[i].lng,
      stops[i + 1].lat,
      stops[i + 1].lng
    );
    totalDistance += distance;
  }

  // Estimate duration assuming average speed of 40 km/h
  const duration = (totalDistance / 40) * 60; // minutes

  return {
    distance: totalDistance,
    duration,
    polyline: null,
    bounds: null,
    steps: [],
  };
}

/**
 * Haversine distance calculation
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(address) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const maps = await loadGoogleMaps(apiKey);
    const geocoder = new maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === maps.GeocoderStatus.OK && results.length > 0) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            address: results[0].formatted_address,
            placeId: results[0].place_id,
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat, lng) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const maps = await loadGoogleMaps(apiKey);
    const geocoder = new maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === maps.GeocoderStatus.OK && results.length > 0) {
          resolve({
            address: results[0].formatted_address,
            placeId: results[0].place_id,
            components: results[0].address_components,
          });
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw error;
  }
}

/**
 * Initialize Places Autocomplete
 */
export function initAutocomplete(inputElement, onPlaceSelect) {
  return new Promise(async (resolve, reject) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        reject(new Error("Google Maps API key not configured"));
        return;
      }

      const maps = await loadGoogleMaps(apiKey);
      const autocomplete = new maps.places.Autocomplete(inputElement, {
        types: ["geocode"],
        componentRestrictions: { country: "in" }, // Restrict to India
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          onPlaceSelect({
            name: place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address,
            placeId: place.place_id,
          });
        }
      });

      resolve(autocomplete);
    } catch (error) {
      console.error("Autocomplete initialization error:", error);
      reject(error);
    }
  });
}
