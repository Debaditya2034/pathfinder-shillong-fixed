import { PLACES_DATA } from '../data/places';

// Vehicle Rates per km
export const VEHICLE_RATES = {
    Hatchback: 10,
    Sedan: 12,
    SUV: 15
};

export const COMMISSION_RATE = 0.05;

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculates total trip distance for an ordered list of place names
 * @param {string[]} places 
 * @returns {number} Total distance in km
 */
export function calculateTotalDistance(places) {
    if (!places || places.length === 0) return 0;

    // If only one place, calculate distance from Shillong (default origin)
    let calcPlaces = places;
    if (places.length === 1) {
        calcPlaces = ['Shillong', places[0]];
    }

    let totalDist = 0;
    for (let i = 0; i < calcPlaces.length - 1; i++) {
        const from = PLACES_DATA[calcPlaces[i]];
        const to = PLACES_DATA[calcPlaces[i + 1]];

        // Skip if coordinates missing
        if (!from || !to) continue;

        totalDist += calculateDistance(from.lat, from.lng, to.lat, to.lng);
    }

    return parseFloat(totalDist.toFixed(2));
}

export const MIN_BILLABLE_DISTANCE_KM = 5;

/**
 * Calculates fare details for a trip
 * @param {string[]} places List of destinations
 * @param {string} vehicleType 'Hatchback', 'Sedan', 'SUV'
 * @returns {Object} Fare details
 */
export const TIME_RATES = {
    'Half Day': { base: 1500, hours: 4 }, // Half Day (4 hrs)
    'Full Day': { base: 2500, hours: 8 }, // Full Day (8 hrs)
    'Custom': { base: 0, hours: 0 }
};

export const EXTRA_HOUR_RATE = 300; // Extra charge per hour exceeding limit

/**
 * Calculates fare details for a trip
 * @param {string[]} places List of destinations
 * @param {string} vehicleType 'Hatchback', 'Sedan', 'SUV'
 * @param {string} packageType 'Half Day', 'Full Day', 'Custom'
 * @param {Object} stayDurations Map of place -> hours
 * @returns {Object} Fare details
 */
export function calculateTripFare(places, vehicleType = 'Sedan', packageType = 'Full Day', stayDurations = {}) {
    let computedDistanceKm = calculateTotalDistance(places);
    const ratePerKm = VEHICLE_RATES[vehicleType] || VEHICLE_RATES.Sedan;

    // Apply minimum distance rule
    let minimumApplied = false;
    if (computedDistanceKm < MIN_BILLABLE_DISTANCE_KM) {
        computedDistanceKm = MIN_BILLABLE_DISTANCE_KM;
        minimumApplied = true;
    }

    const distanceFare = Math.round(computedDistanceKm * ratePerKm * 2); // Round Trip Distance Fare

    // Time Calculation
    const packageInfo = TIME_RATES[packageType] || TIME_RATES['Full Day'];
    const baseTimeFare = packageInfo.base;
    const allowedHours = packageInfo.hours;

    // Calculate total planned duration
    // Default 1 hour per stop if not specified, excluding Shillong (origin)
    let totalStayHours = 0;
    places.forEach(place => {
        if (place !== 'Shillong') {
            totalStayHours += parseFloat(stayDurations[place] || 1);
        }
    });

    // Add estimated travel time (approx 30km/h average speed in hills)
    const travelTimeHours = computedDistanceKm / 30; // One way travel time? Or Round Trip? 
    // Usually distanceFare covers travel, timeFare covers holding content.
    // But "exceeded time" usually counts total duty time.
    // Let's assume Total Duty Time = Travel Time (Round Trip) + Stay Time
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

    return {
        totalDistanceKm: computedDistanceKm, // Legacy
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
            driverPayout: driverPayout,
            currency: 'INR',
            // Compatibility mapping for existing UI that uses 'roundTrip' as total?
            // Existing UI shows `fare.roundTrip` as total. Let's map totalFare to roundTrip to keep UI working without major refactor, 
            // but also provide the breakdown.
            roundTrip: totalFare,
            oneWay: Math.round(totalFare / 2) // Approximate for compatibility
        },
        fareBreakdown: {
            distanceFare,
            baseTimeFare,
            extraStayFare,
            totalFare,
            commission: platformCommission,
            driverPayout,
            currency: 'INR'
        }
    };
}
