# Stability Hardening Summary

## Overview
This document summarizes the stability hardening pass focused on Firestore rules, timestamps, and list ordering.

## 1. Query Ordering (Latest → Oldest)

All list views now use Firestore `orderBy` queries to ensure consistent ordering:

### Changes Made:

**File: `src/lib/bookings.js`**
- `getTouristBookings()`: Added `orderBy('updatedAt', 'desc')`
- `getEligibleBookingsForDriver()`: Added `orderBy('updatedAt', 'desc')`
- `getDriverActiveBookings()`: Added `orderBy('updatedAt', 'desc')`

**File: `src/pages/Home.jsx`**
- Tourist bookings query: Added `orderBy('updatedAt', 'desc')`
- Removed client-side sorting (now handled by Firestore)

**File: `src/pages/Driver.jsx`**
- Driver active bookings query: Added `orderBy('updatedAt', 'desc')`
- Removed client-side sorting (now handled by Firestore)

### Result:
- All queries now return results ordered by `updatedAt` descending (newest first)
- Consistent ordering across all list views
- Better performance (server-side sorting)

## 2. Timestamps

All create and update operations now properly set timestamps:

### Create Operations:
- ✅ `createBooking()`: Sets `createdAt` and `updatedAt` via `serverTimestamp()`
- ✅ `signUp()`: Sets `createdAt` and `updatedAt` for users and driverProfiles
- ✅ `handleSaveItinerary()`: Sets `createdAt` and `updatedAt` for itineraries

### Update Operations:
- ✅ `acceptBooking()`: Sets `updatedAt` via `serverTimestamp()`
- ✅ `declineBooking()`: Sets `updatedAt` via `serverTimestamp()`
- ✅ `cancelBooking()`: Sets `updatedAt` via `serverTimestamp()`
- ✅ `completeBooking()`: Sets `updatedAt` via `serverTimestamp()`

### Security Rules Validation:
- Rules now enforce `request.resource.data.createdAt == request.time` on create
- Rules now enforce `request.resource.data.updatedAt == request.time` on update
- Prevents client-side timestamp manipulation

## 3. Security Rules Hardening

### Role-Based Access Control:

**Users Collection:**
- ✅ Role is immutable after creation
- ✅ Users can only update their own profile
- ✅ Timestamps enforced on create/update

**Driver Profiles Collection:**
- ✅ Only drivers can create/update their own profiles
- ✅ `placesServed` must be non-empty array on create
- ✅ Timestamps enforced

**Itineraries Collection:**
- ✅ Only tourists can create/update/delete itineraries
- ✅ Users can only access their own itineraries
- ✅ `userId` cannot be changed on update
- ✅ Timestamps enforced

**Bookings Collection:**
- ✅ **Tourists:**
  - Can create bookings for themselves only
  - Can read their own bookings
  - Can cancel their own pending bookings
  - Cannot write `driverId`
  - Cannot force status changes (except cancel)
  
- ✅ **Drivers:**
  - Can read all bookings (needed for matching)
  - Can accept pending bookings (transaction-based)
  - Can complete their own accepted bookings
  - Can decline pending bookings (adds to `declinedBy` array)
  - Can only update bookings assigned to them

### Field-Level Restrictions:

All update operations now validate:
- Only allowed fields can be modified
- Immutable fields (`userId`, `createdAt`, `places` on bookings) cannot change
- `updatedAt` must be set to `request.time` (server timestamp)
- Role cannot be changed after creation

### Example Rule Pattern:
```javascript
allow update: if 
  // Role check
  getUserRole() == 'tourist' &&
  // Ownership check
  resource.data.userId == request.auth.uid &&
  // State validation
  resource.data.status == 'pending' &&
  // Allowed transition
  request.resource.data.status == 'cancelled' &&
  // Field immutability
  request.resource.data.userId == resource.data.userId &&
  // Timestamp enforcement
  request.resource.data.updatedAt == request.time &&
  // Only allowed fields changed
  request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt'])
```

## 4. Required Firestore Indexes

### Composite Indexes:

1. **bookings: userId + updatedAt (desc)**
   - Query: `where('userId', '==', uid).orderBy('updatedAt', 'desc')`
   - Used by: Tourist viewing their bookings
   - File: `src/pages/Home.jsx`, `src/lib/bookings.js`

2. **bookings: driverId + status + updatedAt (desc)**
   - Query: `where('driverId', '==', uid).where('status', 'in', [...]).orderBy('updatedAt', 'desc')`
   - Used by: Driver viewing active bookings
   - File: `src/pages/Driver.jsx`, `src/lib/bookings.js`

3. **bookings: status + updatedAt (desc)**
   - Query: `where('status', '==', 'pending').orderBy('updatedAt', 'desc')`
   - Used by: Fetching pending bookings for driver matching
   - File: `src/lib/bookings.js`

### Deployment:

**Option 1: Firebase CLI**
```bash
firebase deploy --only firestore:indexes
```

**Option 2: Manual**
1. Go to Firebase Console > Firestore Database > Indexes
2. Click "Create Index"
3. Create each index as specified above

**Option 3: Auto-create**
- Firestore will prompt you to create indexes when you run queries
- Click the link in the error message to auto-create

The `firestore.indexes.json` file is included for CLI deployment.

## Files Modified

### Query Changes:
- `src/lib/bookings.js` - Added `orderBy` to all queries
- `src/pages/Home.jsx` - Added `orderBy`, removed client-side sort
- `src/pages/Driver.jsx` - Added `orderBy`, removed client-side sort

### Security Rules:
- `firestore.rules` - Complete rewrite with strict field-level validation

### Documentation:
- `firestore.indexes.json` - Index definitions for Firebase CLI
- `README.md` - Updated with index deployment instructions
- `STABILITY_HARDENING.md` - This document

## Benefits

1. **Consistent Ordering**: All lists show newest items first
2. **Timestamp Integrity**: Server-enforced timestamps prevent manipulation
3. **Security**: Strict field-level validation prevents unauthorized changes
4. **Performance**: Server-side sorting and proper indexes
5. **Reliability**: Transaction-based operations prevent race conditions

## Testing Checklist

- [ ] Tourist bookings display newest first
- [ ] Driver active bookings display newest first
- [ ] Pending bookings for drivers are ordered correctly
- [ ] Cannot change role after account creation
- [ ] Tourists cannot write driverId to bookings
- [ ] Drivers can only update their own bookings
- [ ] Timestamps are set correctly on all creates/updates
- [ ] All composite indexes are created in Firestore
