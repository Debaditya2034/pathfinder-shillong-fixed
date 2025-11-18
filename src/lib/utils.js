import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export function calculateCost(distance, vehicleType) {
  const rates = {
    sedan: 15,
    suv: 20,
    tempo: 25,
  };
  const rate = rates[vehicleType] ?? 15;
  const fuelCost = distance * rate;
  const driverCharge = 500;
  const timeCharge = Math.ceil(distance / 40) * 200;
  return Math.round(fuelCost + driverCharge + timeCharge);
}

export function generateBookingCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function formatCurrency(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
