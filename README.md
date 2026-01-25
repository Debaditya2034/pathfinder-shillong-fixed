# Shillong Driver Booking App

A production-ready MVP web application for booking local drivers for tourist trips in and around Shillong.

## Features

- **Role-based Authentication**: Separate signup/login for Tourists and Drivers
- **Tourist Features**:
  - Browse Shillong attractions
  - Create bookings with destination selection
  - View booking history
- **Driver Features**:
  - Real-time active bookings dashboard
  - Update booking status (complete/cancel)
- **Automatic Driver Assignment**: Drivers are automatically assigned based on places they serve
- **Firestore Security Rules**: Role-based access control

## Tech Stack

- **Frontend**: React 18 with Vite
- **Routing**: React Router v6
- **Backend**: Firebase
- **Authentication**: Firebase Authentication (Email/Password)
- **Database**: Cloud Firestore
- **Real-time Updates**: Firestore listeners

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Copy your Firebase config from Project Settings > General > Your apps
5. Update `src/lib/firebase.js` with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}
```

### 3. Deploy Firestore Security Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Deploy rules: `firebase deploy --only firestore:rules`

Or manually copy the contents of `firestore.rules` to Firebase Console > Firestore Database > Rules

### 4. Create Firestore Indexes

Create the following composite index in Firestore:

- Collection: `bookings`
- Fields: `driverId` (Ascending), `status` (Ascending)

You can create this in Firebase Console > Firestore Database > Indexes, or it will be suggested when you run queries.

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ProtectedRoute.jsx
│   └── ErrorBoundary.jsx
├── lib/                # Utilities and Firebase config
│   ├── auth.jsx        # Authentication context
│   ├── firebase.js     # Firebase initialization
│   ├── bookings.js     # Booking operations
│   └── places.js       # Shillong places data
├── pages/              # Page components
│   ├── AuthPage.jsx
│   ├── HomePage.jsx
│   ├── BookPage.jsx
│   └── DriverBookingsPage.jsx
├── App.jsx             # Main app component with routing
└── main.jsx            # Entry point
```

## User Flows

### Tourist Flow
1. Sign up/Login as Tourist
2. Browse attractions on Home page
3. Click "Book a Driver"
4. Select destinations, date/time, add notes
5. Submit booking (automatically assigned to eligible driver)

### Driver Flow
1. Sign up/Login as Driver
2. During signup, select places you serve
3. View active bookings in real-time
4. Update booking status (Complete/Cancel)

## Data Models

### User Profile (`users/{uid}`)
```javascript
{
  email: string,
  role: "tourist" | "driver",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Driver Profile (`driverProfiles/{uid}`)
```javascript
{
  uid: string,
  placesServed: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Booking (`bookings/{bookingId}`)
```javascript
{
  userId: string,
  driverId: string | null,
  places: string[],
  scheduledAt: timestamp,
  notes: string | null,
  status: "pending" | "assigned" | "completed" | "cancelled",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Driver Assignment Logic

When a booking is created:
1. System finds drivers whose `placesServed` contains ALL requested places
2. Assigns to the first eligible driver (deterministic by creation time)
3. Uses Firestore transaction to prevent double-assignment
4. Updates booking status to "assigned"

## Security

- Firestore Security Rules enforce role-based access
- Users can only read/write their own data
- Drivers can only see bookings assigned to them
- Tourists can only see their own bookings
- Role changes after signup are prevented

## Production Deployment

1. Build the app: `npm run build`
2. Deploy to Firebase Hosting or your preferred hosting service
3. Ensure Firestore rules are deployed
4. Configure environment variables if needed

## Notes

- The assignment logic runs client-side with transaction safety. For production at scale, consider moving to Cloud Functions.
- Real-time listeners automatically unsubscribe on component unmount
- Error boundaries catch and display errors gracefully
- Input validation is implemented on all forms
