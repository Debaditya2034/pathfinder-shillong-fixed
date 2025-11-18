/**
 * Compute analytics from bookings array
 * @param {Array} bookings - Array of booking objects
 * @returns {object} Analytics object with totals
 */
export function computeAnalytics(bookings = []) {
  const totalBookings = bookings.length;

  const totalEarnings = bookings.reduce((acc, b) => {
    const val = b.total ?? b.estimate?.total ?? b.price ?? b.estimatedCost ?? 0;
    const n = Number(val) || 0;
    return acc + n;
  }, 0);

  const accepted = bookings.filter(b => b.status === "accepted" || b.status === "completed").length;
  const pending = bookings.filter(b => b.status === "pending").length;
  const completed = bookings.filter(b => b.status === "completed").length;

  return { 
    totalBookings, 
    totalEarnings, 
    accepted, 
    pending,
    completed
  };
}

/**
 * Compute driver-specific analytics
 * @param {Array} bookings - Array of booking objects
 * @param {string} driverId - Driver user ID
 * @returns {object} Driver analytics
 */
export function computeDriverAnalytics(bookings = [], driverId) {
  const driverBookings = bookings.filter(
    b => b.driverId === driverId || (b.status === "pending" && !b.driverId)
  );

  const accepted = driverBookings.filter(
    b => (b.status === "accepted" || b.status === "completed") && b.driverId === driverId
  ).length;

  const pending = driverBookings.filter(b => b.status === "pending").length;

  const earnings = driverBookings
    .filter(b => (b.status === "completed" || b.status === "accepted") && b.driverId === driverId)
    .reduce((acc, b) => {
      const val = b.total ?? b.estimate?.total ?? b.price ?? b.estimatedCost ?? 0;
      return acc + (Number(val) || 0);
    }, 0);

  return {
    total: driverBookings.length,
    accepted,
    pending,
    earnings,
    completed: driverBookings.filter(b => b.status === "completed" && b.driverId === driverId).length
  };
}

