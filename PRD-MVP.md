# Shillong Driver Booking App - Product Requirements Document (PRD)

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** MVP - Production Ready  
**Document Type:** Product Requirements Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Technical Architecture](#technical-architecture)
4. [Data Models & Schemas](#data-models--schemas)
5. [User Flows & Features](#user-flows--features)
6. [Security & Access Control](#security--access-control)
7. [Performance Requirements](#performance-requirements)
8. [Deployment & Setup](#deployment--setup)
9. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**Shillong Driver Booking App** is a production-ready MVP web application that connects tourists with local drivers for trips in and around Shillong, Meghalaya, India. The platform features automatic driver assignment based on service areas, real-time booking management, and role-based access control.

**Key Metrics:**
- **Target Users:** Tourists and Local Drivers
- **Primary Use Case:** Booking local drivers for tourist trips to Shillong attractions
- **Technology Stack:** React 18, Vite, Firebase (Auth + Firestore), React Router v6
- **Deployment:** Web Application

---

## Product Overview

### Problem Statement

Tourists visiting Shillong face challenges in:
- Finding reliable local drivers for tourist trips
- Matching drivers to specific destinations/attractions
- Managing bookings and trip coordination
- Real-time communication with drivers

### Solution

A web-based platform that enables:
1. **Tourist Booking:** Simple booking form to select destinations, date/time, and notes
2. **Automatic Driver Assignment:** System automatically matches bookings to drivers based on places they serve
3. **Real-time Booking Management:** Drivers see active bookings in real-time with ability to update status
4. **Role-based Access:** Separate interfaces for tourists and drivers with appropriate permissions

### Target Users

#### 1. Tourists
- **Primary Actions:** Browse attractions, create bookings, view booking status
- **Key Needs:** Easy booking process, reliable drivers, clear communication

#### 2. Drivers
- **Primary Actions:** Register with service areas, view active bookings, update booking status
- **Key Needs:** Steady bookings, easy management interface, clear booking details

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React 18    │  │  React      │  │   Firebase   │       │
│  │   (Vite)      │  │  Router v6  │  │   SDK        │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              UI Component Layer                        │   │
│  │  (Custom CSS + React Components)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Backend Services                  │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Firebase    │  │  Firestore   │                         │
│  │  Auth        │  │  Database    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Routing:** React Router DOM 6.20.0
- **State Management:** React Hooks (useState, useEffect, useContext)
- **Styling:** Custom CSS with modern design patterns

#### Backend Services
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Cloud Firestore (NoSQL)
- **Real-time:** Firestore real-time listeners

### Project Structure

```
shillong-driver-booking/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ProtectedRoute.jsx
│   │   └── ErrorBoundary.jsx
│   ├── lib/                 # Utilities and Firebase config
│   │   ├── auth.jsx         # Authentication context
│   │   ├── firebase.js      # Firebase initialization
│   │   ├── bookings.js      # Booking operations
│   │   └── places.js        # Shillong places data
│   ├── pages/               # Page components
│   │   ├── AuthPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── BookPage.jsx
│   │   └── DriverBookingsPage.jsx
│   ├── App.jsx              # Main app component (routing)
│   └── main.jsx             # Application entry point
├── firestore.rules           # Firestore security rules
├── package.json
├── vite.config.js
└── README.md
```

---

## Data Models & Schemas

### Firestore Collections

#### 1. `users` Collection
**Purpose:** User profile data and authentication metadata

**Document Structure:**
```typescript
{
  email: string;
  role: "tourist" | "driver";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Document ID:** Firebase Auth UID

**Indexes Required:**
- `role` (ascending)
- `createdAt` (descending)

**Security Rules:**
- Read: Users can read their own document
- Write: Users can create/update their own document (role cannot be changed after creation)

---

#### 2. `driverProfiles` Collection
**Purpose:** Driver service area information

**Document Structure:**
```typescript
{
  uid: string;                    // Firebase Auth UID (must match document ID)
  placesServed: string[];         // Array of place IDs (required)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Document ID:** Firebase Auth UID (same as `uid` field)

**Indexes Required:**
- `uid` (ascending) - unique

**Security Rules:**
- Read: Drivers can read their own profile
- Write: Drivers can create/update their own profile

---

#### 3. `bookings` Collection
**Purpose:** Booking records with assignment and status

**Document Structure:**
```typescript
{
  userId: string;                 // Tourist UID
  driverId: string | null;        // Driver UID (null initially, assigned automatically)
  places: string[];               // Array of place IDs selected by tourist
  scheduledAt: string;            // ISO timestamp string
  notes: string | null;            // Optional notes from tourist
  status: "pending" | "assigned" | "completed" | "cancelled";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Document ID:** Auto-generated booking ID

**Indexes Required:**
- `userId` (ascending), `createdAt` (descending)
- `driverId` (ascending), `status` (ascending) - **Composite index required**
- `status` (ascending), `createdAt` (descending)

**Security Rules:**
- Read: Tourists can read their own bookings; Drivers can read bookings assigned to them
- Create: Tourists can create bookings for themselves
- Update: Drivers can update status for assigned bookings; Tourists can cancel pending bookings

---

### Seed Data

#### Shillong Places (`src/lib/places.js`)

Static list of 10 popular tourist attractions:

1. **Elephant Falls** - A beautiful three-tiered waterfall surrounded by lush greenery
2. **Shillong Peak** - The highest point in Shillong offering panoramic views
3. **Umiam Lake** - A serene man-made lake perfect for boating and water sports
4. **Don Bosco Museum** - A cultural museum showcasing the heritage of Northeast India
5. **Laitlum Canyons** - Breathtaking canyons with stunning views of the valleys
6. **Dawki** - Crystal clear river and the famous suspension bridge
7. **Cherrapunji** - One of the wettest places on earth with beautiful waterfalls
8. **Living Root Bridge** - Natural bridges formed by tree roots
9. **Mawlynnong** - Asia's cleanest village with beautiful landscapes
10. **Nohkalikai Falls** - The tallest plunge waterfall in India

**Place ID Format:** kebab-case (e.g., `elephant-falls`, `shillong-peak`)

---

## User Flows & Features

### 1. Tourist User Flow

#### 1.1 Registration & Authentication
1. User visits `/auth`
2. Toggles to "Tourist" mode
3. Selects "Sign Up" (if new user) or "Log In" (if existing)
4. Enters email and password
5. Submits form → Firebase Auth creates/authenticates user
6. User profile created/updated in Firestore `users` collection with `role: "tourist"`
7. Redirect to `/home`

**Technical Details:**
- Password requirements: minimum 6 characters (Firebase default)
- Email format validation handled by Firebase
- Role stored in Firestore user document
- Session managed by Firebase Auth

---

#### 1.2 Browse Attractions (Home Page)
1. User navigates to `/home` (default after tourist login)
2. Views grid of Shillong attractions with descriptions
3. Each attraction displayed as a card with name and description
4. "Book a Driver" call-to-action button prominently displayed
5. Clicking "Book a Driver" navigates to `/book`

**Features:**
- Responsive grid layout
- Attractive card-based design
- Clear call-to-action

---

#### 1.3 Create Booking
1. User navigates to `/book`
2. **Select Destinations:**
   - Multi-select checkboxes for all 10 Shillong places
   - User can select one or more destinations
   - Each place shows name and description
3. **Trip Details:**
   - Date picker (minimum date: today)
   - Time picker
   - Validation: Date/time must be in the future
4. **Additional Notes (Optional):**
   - Textarea for special requirements or notes
5. User clicks "Create Booking"
6. **Validation:**
   - At least one destination must be selected
   - Date and time are required
   - Date/time must be in the future
7. **Booking Creation:**
   - Booking document created in Firestore with `status: "pending"`
   - `driverId` set to `null` initially
   - All booking details stored
8. **Automatic Driver Assignment:**
   - System finds drivers whose `placesServed` contains ALL requested places
   - Assigns to first eligible driver (deterministic by creation time)
   - Uses Firestore transaction to prevent double-assignment
   - Updates booking: `driverId` set, `status` changed to `"assigned"`
9. Redirect to `/home` with success message

**Error Handling:**
- Client-side validation before submission
- Clear error messages for validation failures
- Network error handling with user-friendly messages

---

### 2. Driver User Flow

#### 2.1 Driver Registration
1. User visits `/auth`
2. Toggles to "Driver" mode
3. Selects "Sign Up"
4. Enters email and password
5. **Selects Places Served:**
   - Multi-select checkboxes for all 10 Shillong places
   - Must select at least one place
   - Driver can select multiple places they serve
6. Submits form → Firebase Auth creates user account
7. **Profile Creation:**
   - User profile created in Firestore `users` collection with `role: "driver"`
   - Driver profile created in Firestore `driverProfiles` collection with `placesServed` array
8. Redirect to `/driver/bookings`

**Validation:**
- At least one place must be selected during signup
- Email and password validation

---

#### 2.2 Driver Dashboard (Active Bookings)
1. Driver navigates to `/driver/bookings` (default after driver login)
2. **Real-time Booking List:**
   - Firestore listener queries bookings where:
     - `driverId == currentDriverUid`
     - `status == "assigned"`
   - List automatically updates when new bookings are assigned
   - List automatically updates when bookings are completed/cancelled
3. **Booking Display:**
   - Each booking shown as a card with:
     - Booking ID (truncated for display)
     - Status badge
     - Destinations (as tags)
     - Scheduled date/time
     - Notes (if provided)
     - Created timestamp
4. **Booking Actions:**
   - **Mark as Completed:** Updates status to `"completed"`
   - **Cancel:** Updates status to `"cancelled"`
   - Buttons disabled while update is in progress
5. **Empty State:**
   - If no active bookings, displays friendly message

**Real-time Updates:**
- Firestore `onSnapshot` listener for real-time updates
- Automatically unsubscribes on component unmount
- No manual refresh needed

---

### 3. Driver Assignment Logic

#### Assignment Algorithm

When a booking is created:

1. **Find Eligible Drivers:**
   - Query all `driverProfiles` documents
   - For each driver, check if `placesServed` array contains ALL places in booking's `places` array
   - Filter to eligible drivers only

2. **Select Driver:**
   - Sort eligible drivers by `createdAt` timestamp (ascending)
   - If `createdAt` not available, sort by `uid` (alphabetical)
   - Select first driver in sorted list (deterministic assignment)

3. **Assign Booking:**
   - Use Firestore transaction to ensure atomicity
   - Check if booking is still `pending` and `driverId` is still `null`
   - Update booking:
     - Set `driverId` to selected driver's UID
     - Set `status` to `"assigned"`
     - Update `updatedAt` timestamp
   - If no eligible drivers found, booking remains `pending`

**Concurrency Handling:**
- Firestore transaction ensures only one driver is assigned
- Idempotent: Re-running assignment won't reassign if already assigned
- Prevents race conditions

**Edge Cases:**
- No eligible drivers → Booking remains `pending`
- Booking already assigned → No action taken
- Booking not found → Error thrown

---

## Security & Access Control

### Authentication Security

1. **Firebase Authentication**
   - Email/password authentication
   - Password requirements: minimum 6 characters (Firebase default)
   - Session management via Firebase Auth tokens
   - Automatic token refresh

2. **Role-Based Access Control (RBAC)**
   - Two roles: `tourist` and `driver`
   - Role stored in Firestore `users/{uid}` document
   - Protected routes check role before rendering
   - Firestore security rules enforce role-based access

3. **Input Validation**
   - Client-side validation on all forms
   - Date/time validation (must be in future)
   - Required field validation
   - Email format validation (Firebase)

---

### Firestore Security Rules

**Key Principles:**
- Least privilege access
- Role-based permissions
- Users can only access their own data
- Drivers can only see bookings assigned to them
- Tourists can only see their own bookings

**Rules Summary:**

1. **Users Collection:**
   - Read: Users can read their own profile
   - Create: Users can create their own profile during signup
   - Update: Users can update their own profile (except role)
   - Delete: Not allowed

2. **Driver Profiles Collection:**
   - Read: Drivers can read their own profile
   - Create: Drivers can create their own profile during signup
   - Update: Drivers can update their own profile
   - Delete: Not allowed

3. **Bookings Collection:**
   - Read: Tourists can read their own bookings; Drivers can read bookings assigned to them
   - Create: Tourists can create bookings for themselves (with validation)
   - Update: 
     - Drivers can update status for assigned bookings (to `completed` or `cancelled`)
     - Tourists can cancel their own pending bookings
   - Delete: Not allowed

**Assignment Note:**
- Driver assignment happens client-side using Firestore transactions
- Security rules allow the transaction to update `driverId` and `status` fields
- For production at scale, consider moving assignment to Cloud Functions

---

### Route Protection

**Protected Routes:**
- `/home` - Requires `role: "tourist"`
- `/book` - Requires `role: "tourist"`
- `/driver/bookings` - Requires `role: "driver"`

**Redirect Logic:**
- Unauthenticated users → `/auth`
- Authenticated users → Redirect based on role:
  - `tourist` → `/home`
  - `driver` → `/driver/bookings`

**Loading States:**
- Loading indicator while checking authentication
- Prevents unauthorized brief renders
- Smooth transition between states

---

## Performance Requirements

### Frontend Performance

1. **Initial Load Time**
   - Target: < 3 seconds on 3G connection
   - Code splitting: Route-based (future enhancement)
   - Optimized bundle size

2. **Runtime Performance**
   - Efficient React rendering
   - Real-time listeners with proper cleanup
   - No memory leaks (unsubscribe on unmount)

3. **Real-time Updates**
   - Firestore listeners with efficient queries
   - Unsubscribe on component unmount
   - Minimal re-renders

---

### Backend Performance

1. **Firestore Queries**
   - Indexed queries only
   - Composite indexes for complex queries
   - Efficient query patterns

2. **Assignment Performance**
   - Assignment happens synchronously after booking creation
   - Transaction ensures consistency
   - Timeout handling for edge cases

---

### Scalability Considerations

1. **Database**
   - Firestore auto-scaling
   - Efficient query patterns
   - Index optimization

2. **Assignment Algorithm**
   - Current: O(n) where n = number of drivers
   - For scale: Consider Cloud Functions or background jobs
   - Consider driver availability/load balancing (future)

---

## Deployment & Setup

### Environment Configuration

**Required Firebase Setup:**
1. Create Firebase project
2. Enable Authentication (Email/Password provider)
3. Create Firestore database
4. Configure Firebase config in `src/lib/firebase.js`

**Firebase Config:**
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

---

### Firestore Setup

1. **Deploy Security Rules:**
   - Copy `firestore.rules` to Firebase Console > Firestore Database > Rules
   - Or use Firebase CLI: `firebase deploy --only firestore:rules`

2. **Create Composite Index:**
   - Collection: `bookings`
   - Fields: `driverId` (Ascending), `status` (Ascending)
   - Can be created manually or Firebase will suggest when query runs

---

### Build & Deployment

#### Development
```bash
npm install
npm run dev          # Starts Vite dev server
```

#### Production Build
```bash
npm run build        # Outputs to dist/
npm run preview      # Preview production build locally
```

#### Deployment Options

1. **Firebase Hosting**
   ```bash
   firebase init hosting
   firebase deploy --only hosting
   ```

2. **Vercel**
   ```bash
   vercel deploy
   ```

3. **Netlify**
   ```bash
   netlify deploy --prod
   ```

---

## Future Enhancements

### Phase 1: Core Enhancements
- [ ] Tourist booking history page
- [ ] Booking status notifications (email/SMS)
- [ ] Driver availability management
- [ ] Booking cancellation by tourist
- [ ] Enhanced error handling and retry logic

### Phase 2: Advanced Features
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Rating and review system
- [ ] In-app chat (driver-tourist communication)
- [ ] Route optimization
- [ ] Multi-language support (Khasi, Garo)

### Phase 3: Scale & Mobile
- [ ] Cloud Functions for driver assignment
- [ ] Driver load balancing
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Offline mode support
- [ ] Admin dashboard

### Phase 4: Advanced Features
- [ ] Real-time GPS tracking
- [ ] Weather integration
- [ ] Trip photos sharing
- [ ] Loyalty program
- [ ] Referral system

---

## Appendix

### A. Booking Status Flow

```
pending → assigned → completed
   ↓         ↓
cancelled  cancelled
```

**Status Definitions:**
- `pending`: Booking created, waiting for driver assignment
- `assigned`: Driver assigned, booking active
- `completed`: Trip finished successfully
- `cancelled`: Booking cancelled (can occur at any stage)

---

### B. Place ID Reference

| Place ID | Place Name |
|----------|------------|
| `elephant-falls` | Elephant Falls |
| `shillong-peak` | Shillong Peak |
| `umiam-lake` | Umiam Lake |
| `don-bosco-museum` | Don Bosco Museum |
| `laitlum-canyons` | Laitlum Canyons |
| `dawki` | Dawki |
| `cherrapunji` | Cherrapunji |
| `living-root-bridge` | Living Root Bridge |
| `mawlynnong` | Mawlynnong |
| `nohkalikai-falls` | Nohkalikai Falls |

---

### C. Error Handling

**Client-Side:**
- Form validation with clear error messages
- Network error handling with retry options
- Error boundary for React errors
- User-friendly error messages

**Server-Side:**
- Firestore security rules prevent unauthorized access
- Transaction rollback on assignment failures
- Graceful degradation if assignment fails

---

### D. Testing Checklist

**Manual Testing:**
- [ ] Tourist signup/login
- [ ] Driver signup/login
- [ ] Booking creation with validation
- [ ] Driver assignment (automatic)
- [ ] Real-time booking updates
- [ ] Status updates (complete/cancel)
- [ ] Route protection
- [ ] Security rules enforcement
- [ ] Error handling

**Future Automated Testing:**
- Unit tests for utility functions
- Integration tests for booking flow
- E2E tests for complete user journeys

---

## Document Metadata

- **Author:** Development Team
- **Version:** 1.0.0
- **Last Updated:** January 2025
- **Status:** MVP - Production Ready
- **Next Review:** As needed for enhancements

---

**End of Document**
