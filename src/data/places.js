// Canonical list of Shillong tourist destinations
// Single source of truth for places used across:
// - Tourist itinerary selector
// - Driver signup placesServed selection
// - Booking form

export const PLACES_DATA = {
  'Shillong': { lat: 25.5788, lng: 91.8933 },
  'Living Root Bridge': { lat: 25.2530, lng: 91.6700 }, // Riwai/Mawlynnong
  'Umiam Lake': { lat: 25.6667, lng: 91.9167 },
  'Elephant Falls': { lat: 25.5350, lng: 91.8210 },
  'Shillong Peak': { lat: 25.5400, lng: 91.8500 },
  'Don Bosco Museum': { lat: 25.5840, lng: 91.8990 },
  'Ward\'s Lake': { lat: 25.5780, lng: 91.8840 },
  'Lady Hydari Park': { lat: 25.5700, lng: 91.8850 },
  'Mawphlang Sacred Forest': { lat: 25.4430, lng: 91.7510 },
  'Seven Sisters Falls': { lat: 25.2750, lng: 91.7160 }, // Cherrapunji area
  'Mawlynnong Village': { lat: 25.1970, lng: 91.9160 },
  'Dawki': { lat: 25.1270, lng: 92.0190 },
  'Cherrapunji': { lat: 25.2702, lng: 91.7323 },
  'Mawsmai Cave': { lat: 25.2540, lng: 91.7240 },
  'Nohkalikai Falls': { lat: 25.2758, lng: 91.7050 },
  'Krang Suri Falls': { lat: 25.2440, lng: 92.2040 },
  'Double Decker Living Root Bridge': { lat: 25.2340, lng: 91.6830 },
  'Mawjymbuin Cave': { lat: 25.2950, lng: 91.5640 }, // Mawsynram area
  'Laitlum Grand Canyon': { lat: 25.4980, lng: 91.9050 },
  'Mawlyngbna': { lat: 25.1960, lng: 91.5790 }
};

export const SHILLONG_PLACES = Object.keys(PLACES_DATA);
