// Shim module that tries existing booking module, otherwise falls back to REST
export { createBookingREST } from "./bookingsRest.js";

export async function createBooking(payload) {
  // Try dynamic import of existing app booking module
  const maybe = await import("/src/lib/bookings.js").catch(() => null);

  if (maybe && typeof maybe.createBooking === "function") {
    return maybe.createBooking(payload);
  }

  // Otherwise use REST fallback
  const { createBookingREST } = await import("./bookingsRest.js");
  return createBookingREST(payload);
}

