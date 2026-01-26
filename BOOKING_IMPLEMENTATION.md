# Booking Functionality Implementation

## Overview
End-to-end booking functionality implemented with Firebase Auth + Firestore, focusing on reliability and correct state transitions.

## Firestore Data Model

### Collection: `bookings/{bookingId}`
```javascript
{
  userId: string,              // Tourist UID
  driverId: string | null,     // Driver UID (set when accepted)
  places: string[],            // Ordered itinerary
  scheduledAt: timestamp | null, // Optional scheduling
  notes: string | null,        // Optional notes
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed",
  declinedBy: string[],        // Array of driver UIDs who declined
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Tourist Flow

### 1. Create Booking Request
- **Location**: `/home` page
- **Component**: Uses `ItinerarySelector` component
- **Process**:
  1. Tourist selects destinations using itinerary selector
  2. Optionally adds notes
  3. Clicks "Request Booking"
  4. Validates: itinerary must have at least 1 place
  5. Creates booking with:
     - `status: "pending"`
     - `driverId: null`
     - `places: string[]` (ordered)
     - `declinedBy: []`

### 2. View Bookings
- **Location**: `/home` page - "My Bookings" section
- **Features**:
  - Real-time updates via Firestore listeners
  - Shows all bookings for the tourist
  - Displays: status, places, driver ID (if accepted), notes, timestamps
  - Color-coded status badges

### 3. Cancel Booking
- **Action**: Tourist can cancel their own pending bookings
- **Validation**: Only pending bookings can be cancelled
- **State Transition**: `pending` → `cancelled`

## Driver Flow

### 1. View Open Requests
- **Location**: `/driver` page - "Open Requests" section
- **Matching Logic**:
  - Fetches all pending bookings
  - Filters client-side for eligibility:
    - Booking must have at least 1 place overlap with driver's `placesServed`
    - Driver must not have already declined (not in `declinedBy` array)
- **Display**: Shows booking details, places, notes, timestamps

### 2. Accept Booking
- **Action**: Driver clicks "Accept" on an eligible booking
- **Transaction Logic**:
  ```javascript
  1. Start Firestore transaction
  2. Read booking document
  3. Validate:
     - status === "pending"
     - driverId === null
  4. Update:
     - driverId = driver.uid
     - status = "accepted"
     - updatedAt = serverTimestamp()
  5. Commit transaction
  ```
- **Race Condition Prevention**: Transaction ensures only one driver can accept
- **State Transition**: `pending` → `accepted`

### 3. Decline Booking
- **Action**: Driver clicks "Decline" on an eligible booking
- **Process**:
  - Adds driver UID to `declinedBy` array (using `arrayUnion`)
  - Booking remains available for other drivers
  - Driver won't see this booking in future requests
- **State**: Booking remains `pending` (not a state transition)

### 4. View Active Bookings
- **Location**: `/driver` page - "My Active Bookings" section
- **Query**: Real-time listener for bookings where:
  - `driverId == currentDriver.uid`
  - `status in ["accepted", "completed"]`
- **Display**: Shows accepted and completed bookings

### 5. Complete Booking
- **Action**: Driver clicks "Mark as Completed" on accepted booking
- **Validation**:
  - Booking must be `accepted`
  - `driverId` must match current driver
- **State Transition**: `accepted` → `completed`

## Matching Logic

### Driver Eligibility
- **Rule**: Booking is eligible if `booking.places` has at least 1 overlap with `driverProfiles.placesServed`
- **Implementation**: Client-side filtering after fetching all pending bookings
- **Rationale**: 
  - Simple and reliable
  - Works with Firestore query limitations
  - Can be optimized later with Cloud Functions if needed

### Example:
```javascript
// Driver serves: ["Shillong", "Umiam Lake", "Elephant Falls"]
// Booking places: ["Shillong", "Living Root Bridge"]
// Result: Eligible (overlap: "Shillong")

// Driver serves: ["Dawki", "Cherrapunji"]
// Booking places: ["Shillong", "Living Root Bridge"]
// Result: Not eligible (no overlap)
```

## Transaction Logic

### Accept Booking Transaction
```javascript
runTransaction(db, async (transaction) => {
  const bookingRef = doc(db, 'bookings', bookingId);
  const bookingSnap = await transaction.get(bookingRef);
  
  // Validate booking exists
  if (!bookingSnap.exists()) throw new Error('Booking not found');
  
  const booking = bookingSnap.data();
  
  // Validate state
  if (booking.status !== 'pending') {
    throw new Error('Booking is no longer available');
  }
  
  if (booking.driverId !== null) {
    throw new Error('Booking has already been accepted');
  }
  
  // Atomic update
  transaction.update(bookingRef, {
    driverId: driverId,
    status: 'accepted',
    updatedAt: serverTimestamp()
  });
});
```

**Why Transactions?**
- Prevents double-accept race conditions
- Ensures atomic state transitions
- Guarantees consistency

## Firestore Security Rules

### Read Access
- **Tourists**: Can read their own bookings
- **Drivers**: Can read all bookings (needed for matching)

### Create Access
- **Tourists**: Can create bookings for themselves
- **Validation**: 
  - `userId == request.auth.uid`
  - `status == "pending"`
  - `driverId == null`
  - `places` is non-empty array

### Update Access
1. **Tourist Cancel**: 
   - Own booking
   - Status: `pending` → `cancelled`
   - Only `status` and `updatedAt` can change

2. **Driver Accept**:
   - Booking status: `pending` → `accepted`
   - Set `driverId` to self
   - Cannot change `userId`, `places`

3. **Driver Complete**:
   - Own accepted booking
   - Status: `accepted` → `completed`
   - Cannot change `userId`, `places`, `driverId`

4. **Driver Decline**:
   - Add self to `declinedBy` array
   - Cannot change other fields

### Delete Access
- **None**: Bookings cannot be deleted (only cancelled/completed)

## Files Created/Modified

### New Files
- `src/lib/bookings.js` - Booking service functions

### Modified Files
- `src/pages/Home.jsx` - Added booking creation and viewing
- `src/pages/Driver.jsx` - Added open requests and accept/decline
- `firestore.rules` - Updated booking security rules

## State Transitions

```
pending → accepted (driver accepts)
pending → cancelled (tourist cancels)
accepted → completed (driver completes)
```

**Note**: `declined` is not a booking status - it's tracked via `declinedBy` array. Booking remains `pending` after decline.

## Real-time Updates

- **Tourist Bookings**: Real-time listener on `bookings` collection filtered by `userId`
- **Driver Active Bookings**: Real-time listener on `bookings` collection filtered by `driverId` and `status`
- **Open Requests**: Polled every 10 seconds (can be optimized with real-time listeners if needed)

## Error Handling

- All booking operations include try-catch blocks
- User-friendly error messages displayed via alerts
- Console logging for debugging
- Transaction failures automatically retry (Firestore handles this)

## Future Optimizations

1. **Real-time Open Requests**: Replace polling with Firestore listeners
2. **Cloud Functions**: Move matching logic server-side for better performance
3. **Indexes**: Add composite indexes for complex queries
4. **Pagination**: Add pagination for large booking lists
5. **Notifications**: Add push notifications for booking status changes
