# PathFinder MVP - Barebones Functionality Testing

A minimal viable product (MVP) for testing authentication, Firestore database operations, and basic itinerary management.

## Features

- ✅ User Sign Up
- ✅ User Login/Logout
- ✅ Forgot Password
- ✅ Firestore Database Integration
- ✅ Protected Routes
- ✅ Itinerary Maker (Home Page)
- ✅ Role-based Authentication

## Tech Stack

- React 18 with Vite
- React Router v6
- Firebase Authentication
- Cloud Firestore

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password provider)
3. Create a Firestore database
4. Copy your Firebase configuration

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore Security Rules

Deploy the security rules from `firestore.rules` to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

Or manually copy the rules from `firestore.rules` to your Firebase Console under Firestore Database > Rules.

### 5. Firestore Indexes

The following composite indexes are required for optimal query performance. Deploy them using:

```bash
firebase deploy --only firestore:indexes
```

Or manually create them in Firebase Console under Firestore Database > Indexes:

**Required Indexes:**

1. **bookings collection:**
   - `userId` (Ascending) + `updatedAt` (Descending)
   - Used for: Tourist viewing their bookings

2. **bookings collection:**
   - `driverId` (Ascending) + `status` (Ascending) + `updatedAt` (Descending)
   - Used for: Driver viewing active bookings (accepted/completed)

3. **bookings collection:**
   - `status` (Ascending) + `updatedAt` (Descending)
   - Used for: Fetching pending bookings for driver matching

The indexes file `firestore.indexes.json` is included in the project root for Firebase CLI deployment.

### 5. Firestore Indexes

The following collections will be created automatically:
- `users` - User profiles with role information
- `itineraries` - User-created itineraries

### 6. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
pathfinder4/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx    # Route protection wrapper
│   ├── contexts/
│   │   └── AuthContext.jsx      # Authentication context
│   ├── lib/
│   │   ├── firebase.js          # Firebase initialization
│   │   └── auth.js              # Authentication utilities
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   ├── SignUp.jsx           # Sign up page
│   │   ├── ForgotPassword.jsx   # Password reset page
│   │   ├── Home.jsx             # Home page with itinerary maker
│   │   └── Logout.jsx           # Logout page
│   ├── App.jsx                  # Main app component with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── firestore.rules              # Firestore security rules
├── package.json
├── vite.config.js
└── README.md
```

## Usage

1. **Sign Up**: Navigate to `/signup` to create a new account
2. **Login**: Navigate to `/login` to sign in with existing credentials
3. **Home**: After login, you'll be redirected to `/home` where you can:
   - Create an itinerary by adding stops
   - Save itineraries to Firestore
   - Access other pages
4. **Logout**: Click the logout button or navigate to `/logout`
5. **Forgot Password**: Use `/forgot-password` to reset your password

## Data Model

### Users Collection
```javascript
{
  uid: string,
  email: string,
  role: "tourist" | "driver" | "admin",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Itineraries Collection
```javascript
{
  userId: string,
  stops: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Notes

- This is a barebones MVP for functionality testing
- UI is minimal and functional
- All authentication is handled through Firebase Auth
- Data is stored in Firestore with security rules
- Protected routes require authentication

## Future Enhancements

- Enhanced UI/UX
- Driver role functionality
- Booking system
- Real-time updates
- Advanced itinerary features
