# Itinerary Management Implementation

## Overview
Enhanced itinerary management with multiple saved itineraries, load/copy functionality, and editing capabilities.

## Firestore Schema

### Collection: `itineraries/{itineraryId}`

```javascript
{
  userId: string,              // Tourist UID
  places: string[],            // Ordered array of place names
  specialMessage: string | null, // Optional special message/notes
  createdAt: Timestamp,        // Server timestamp on create
  updatedAt: Timestamp        // Server timestamp on create/update
}
```

## Features Implemented

### 1. Multiple Saved Itineraries
- **Location**: Home page - "Saved Itineraries" section
- **Display**: List of all saved itineraries ordered by `updatedAt` (newest first)
- **Information Shown**:
  - First destination name
  - Total places count
  - Special message indicator
  - Updated timestamp
  - Full route (places joined with →)
  - Special message preview

### 2. Load Functionality
- **Button**: "Load" button on each saved itinerary
- **Behavior**:
  - Loads places into the itinerary editor
  - Loads special message into the textarea
  - Sets editing mode (highlights the itinerary being edited)
  - Scrolls to top of editor
- **Use Case**: Edit an existing itinerary

### 3. Copy Functionality
- **Button**: "Copy" button on each saved itinerary
- **Behavior**:
  - Copies itinerary to clipboard in readable format:
    ```
    Itinerary:
    Place1 → Place2 → Place3
    
    Special Message: [message if exists]
    ```
  - Uses modern `navigator.clipboard` API with fallback for older browsers
  - Shows success alert

### 4. Editing Saved Itineraries

#### Update Existing
- **Trigger**: When an itinerary is loaded (editing mode active)
- **Button**: "Save Changes" (replaces "Save Itinerary")
- **Behavior**:
  - Updates the same Firestore document
  - Updates `updatedAt` timestamp
  - Preserves `createdAt` and `userId`
  - Updates `places` and `specialMessage`

#### Save as New
- **Button**: "Save as New" (only visible when editing)
- **Behavior**:
  - Clears editing mode
  - Creates a new Firestore document
  - Original itinerary remains unchanged

#### New Itinerary
- **Button**: "New Itinerary" (only visible when editing)
- **Behavior**:
  - Clears editor (places and special message)
  - Exits editing mode

### 5. Special Message Persistence
- **Field**: `specialMessage` in Firestore
- **Type**: `string | null`
- **Saved**: On both create and update
- **Loaded**: When loading an itinerary
- **Used**: Also passed to booking creation

## Files Changed/Added

### New Files
- `src/lib/itineraries.js` - Itinerary service functions

### Modified Files
- `src/pages/Home.jsx` - Added itinerary management UI and functionality
- `firestore.rules` - Updated rules to validate `specialMessage` field

## Functions in `src/lib/itineraries.js`

1. **`getUserItineraries(userId)`**
   - Fetches all itineraries for a user
   - Returns sorted by `updatedAt` (newest first)

2. **`getItinerary(itineraryId)`**
   - Fetches a single itinerary by ID

3. **`createItinerary(userId, places, specialMessage)`**
   - Creates a new itinerary document
   - Sets `createdAt` and `updatedAt` timestamps

4. **`updateItinerary(itineraryId, userId, places, specialMessage)`**
   - Updates existing itinerary
   - Validates ownership
   - Updates `updatedAt` timestamp

5. **`deleteItinerary(itineraryId, userId)`**
   - Deletes an itinerary
   - Validates ownership

## UI Components

### Saved Itineraries List
- Shows count in header: "Saved Itineraries (X)"
- Each item displays:
  - First destination + count
  - Places count and special message indicator
  - Updated timestamp
  - Full route
  - Special message preview
- Visual indicator when editing (blue border, highlighted background)

### Action Buttons
- **Load**: Blue button - loads itinerary into editor
- **Copy**: Gray button - copies to clipboard
- **Delete**: Red button - deletes itinerary (with confirmation)

### Editor Mode
- Header changes to "Edit Itinerary" when editing
- "New Itinerary" button appears
- "Save Itinerary" becomes "Save Changes"
- "Save as New" button appears

## Firestore Security Rules

### Create
- User must be tourist
- `userId` must match authenticated user
- `places` must be non-empty array
- `specialMessage` must be string or null
- Timestamps must be server-set

### Update
- User must be tourist
- Must own the itinerary
- `places` must be non-empty array
- `specialMessage` must be string or null
- Cannot change `userId` or `createdAt`
- `updatedAt` must be server-set

### Delete
- User must be tourist
- Must own the itinerary

## End-to-End Flow

### Create New Itinerary
1. User selects places using ItinerarySelector
2. User optionally adds special message
3. Clicks "Save Itinerary"
4. New document created in Firestore
5. Appears in saved itineraries list (newest first)

### Load and Edit
1. User clicks "Load" on a saved itinerary
2. Places and special message loaded into editor
3. Editor enters edit mode (highlighted)
4. User modifies places/message
5. Clicks "Save Changes"
6. Same document updated in Firestore
7. List refreshes with new `updatedAt` timestamp

### Copy Itinerary
1. User clicks "Copy" on a saved itinerary
2. Formatted text copied to clipboard
3. Success alert shown
4. User can paste elsewhere

### Delete Itinerary
1. User clicks "Delete"
2. Confirmation dialog appears
3. On confirm, document deleted from Firestore
4. Removed from list
5. If was being edited, editor clears

## Testing Checklist

- [ ] Create new itinerary saves correctly
- [ ] Special message persists on save
- [ ] Saved itineraries list shows newest first
- [ ] Load button populates editor correctly
- [ ] Copy button copies to clipboard
- [ ] Edit mode highlights correct itinerary
- [ ] "Save Changes" updates existing document
- [ ] "Save as New" creates new document
- [ ] "New Itinerary" clears editor
- [ ] Delete removes itinerary
- [ ] Real-time updates work (list refreshes automatically)
- [ ] Special message used in booking creation
