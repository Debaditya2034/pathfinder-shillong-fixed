# PathFinder Shillong - Product Requirements Document (PRD)

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production-Ready (Demo Mode)  
**Document Type:** Technical PRD for AI-Assisted Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Technical Architecture](#technical-architecture)
4. [Data Models & Schemas](#data-models--schemas)
5. [API Specifications](#api-specifications)
6. [User Flows & Features](#user-flows--features)
7. [Security & Compliance](#security--compliance)
8. [Performance Requirements](#performance-requirements)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Development Guidelines](#development-guidelines)
11. [Testing Strategy](#testing-strategy)
12. [Future Roadmap](#future-roadmap)

---

## Executive Summary

**PathFinder Shillong** is a localized travel services platform designed for Meghalaya, India. It connects tourists with verified local drivers for multi-stop itinerary-based transportation services. The platform features real-time booking management, driver verification workflows, payment processing, and comprehensive admin analytics.

**Key Metrics:**
- **Target Users:** Tourists, Local Drivers, Platform Administrators
- **Primary Use Case:** Multi-stop itinerary planning and driver matching
- **Technology Stack:** React 18, Firebase, Vite, Tailwind CSS
- **Deployment:** Web Application (PWA-ready)

---

## Product Overview

### Problem Statement

Tourists visiting Meghalaya face challenges in:
- Planning multi-stop itineraries efficiently
- Finding verified, reliable local drivers
- Transparent pricing for transportation services
- Real-time trip tracking and communication

### Solution

A web-based platform that enables:
1. **Itinerary Planning:** Multi-stop route builder with automatic distance/cost calculation
2. **Driver Matching:** Verified driver network with real-time availability
3. **Booking Management:** End-to-end booking lifecycle (pending → accepted → completed)
4. **Payment Processing:** Integrated payment gateway with cost breakdown transparency
5. **Real-time Tracking:** GPS-based driver location tracking during trips

### Target Users

#### 1. Tourists
- **Primary Actions:** Browse places, create itineraries, book trips, track rides
- **Key Needs:** Transparent pricing, verified drivers, easy booking process

#### 2. Drivers
- **Primary Actions:** Register, view bookings, accept/decline trips, track earnings
- **Key Needs:** Steady bookings, fair compensation, easy management tools

#### 3. Administrators
- **Primary Actions:** Verify drivers, monitor platform, view analytics, manage users
- **Key Needs:** Platform oversight, driver quality control, business insights

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React 18   │  │  React      │  │   React      │       │
│  │   (Vite)     │  │  Router v6  │  │  Query       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              UI Component Layer                        │   │
│  │  (shadcn/ui + Tailwind CSS + Custom Components)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Backend Services                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Firebase    │  │  Firestore   │  │  Firebase    │       │
│  │  Auth        │  │  Database    │  │  Storage     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Firebase    │  │  Google      │  │  Stripe      │       │
│  │  Functions   │  │  Maps API    │  │  Payments    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework:** React 18.3.1 (with Hooks)
- **Build Tool:** Vite 6.4.1
- **Routing:** React Router DOM 6.30.1
- **State Management:** 
  - React Query (TanStack Query) 5.83.0 for server state
  - React Hooks (useState, useEffect, useContext) for local state
  - localStorage for persistence (demo mode)
- **UI Framework:** 
  - Tailwind CSS 3.4.17
  - shadcn/ui components (Radix UI primitives)
  - Lucide React 0.462.0 (icons)
- **Form Handling:** React Hook Form 7.61.1 + Zod 3.25.76
- **Notifications:** Sonner 1.7.4 (toast notifications)

#### Backend Services
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Cloud Firestore (NoSQL)
- **Storage:** Firebase Storage (file uploads)
- **Functions:** Firebase Cloud Functions (serverless)
- **Real-time:** Firestore real-time listeners

#### External Services
- **Maps:** Google Maps API (with Haversine fallback)
- **Payments:** Stripe API
- **SMS:** Twilio/AWS SNS (framework ready)
- **Email:** SendGrid/AWS SES (framework ready)

### Project Structure

```
pathfinder-shillong/
├── src/
│   ├── assets/              # Static images and files
│   ├── components/          # Reusable React components
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── Navbar.jsx       # Main navigation component
│   │   ├── ProtectedRoute.jsx  # Route protection wrapper
│   │   ├── ErrorBoundary.jsx   # Error handling boundary
│   │   ├── BookingCodeDialog.jsx  # Booking lookup dialog
│   │   └── OnboardingFlow.jsx    # Multi-step driver registration
│   ├── pages/               # Route page components
│   │   ├── Index.jsx        # Homepage/Landing
│   │   ├── Auth.jsx         # Login/Signup
│   │   ├── Itinerary.jsx    # Trip planner
│   │   ├── BookingConfirm.jsx  # Booking confirmation
│   │   ├── DriverDashboard.jsx  # Driver interface
│   │   ├── AdminDashboard.jsx  # Admin panel
│   │   └── RideBoard.jsx   # Public ride board
│   ├── lib/                 # Utility libraries
│   │   ├── firebase.js      # Firebase initialization
│   │   ├── auth.js          # Authentication utilities
│   │   ├── createBooking.js # Booking creation service
│   │   ├── bookings.js     # Booking management
│   │   ├── payments.js     # Payment processing
│   │   ├── maps.js          # Maps integration
│   │   ├── notifications.js # SMS/Email notifications
│   │   ├── tracking.js      # Location tracking
│   │   ├── analytics.js    # Analytics utilities
│   │   ├── audit.js         # Audit logging
│   │   ├── validation.js   # Input validation (Zod)
│   │   ├── utils.js         # General utilities
│   │   └── i18n.jsx         # Internationalization
│   ├── hooks/               # Custom React hooks
│   ├── data/                # Static demo data
│   ├── App.jsx              # Main app component (routing)
│   └── main.jsx             # Application entry point
├── public/                  # Public static assets
├── .env.local               # Environment variables (gitignored)
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Dependencies and scripts
```

### Data Flow Architecture

#### Booking Creation Flow
```
User (Itinerary Page)
  ↓
1. Select stops, vehicle type, date
  ↓
2. Calculate distance (Haversine/Google Maps)
  ↓
3. Calculate cost breakdown (fuel + driver + time)
  ↓
4. Store in localStorage as "pending_booking"
  ↓
5. Navigate to BookingConfirm page
  ↓
6. createBooking() function called
  ↓
7. Validate payload (userId, stops, etc.)
  ↓
8. Format pickupPoints with lat/lng/address
  ↓
9. Calculate costBreakdown
  ↓
10. Write to Firestore "bookings" collection
  ↓
11. Return { bookingId, bookingCode, status }
  ↓
12. Update UI with booking details
```

#### Driver Acceptance Flow
```
Driver Dashboard
  ↓
1. Query Firestore "trips" collection (status: "requested")
  ↓
2. Display available bookings
  ↓
3. Driver clicks "Accept"
  ↓
4. Transaction: Update trip document
   - Set driverId
   - Set status: "assigned"
  ↓
5. Update corresponding booking document
   - Set driverId
   - Set status: "accepted"
  ↓
6. Trigger notification (SMS/Email)
  ↓
7. Real-time update to tourist dashboard
```

---

## Data Models & Schemas

### Firestore Collections

#### 1. `users` Collection
**Purpose:** User profile data and authentication metadata

**Document Structure:**
```typescript
{
  uid: string;                    // Firebase Auth UID (document ID)
  email: string | null;
  phone: string | null;
  role: "tourist" | "driver" | "admin";
  displayName?: string;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  emailVerified?: boolean;
  profilePicture?: string;         // Firebase Storage URL
}
```

**Indexes Required:**
- `role` (ascending)
- `createdAt` (descending)

**Security Rules:**
- Read: Users can read their own document
- Write: Users can update their own document (except role)
- Admin: Full read/write access

---

#### 2. `bookings` Collection
**Purpose:** Complete booking records with payment and trip details

**Document Structure:**
```typescript
{
  // Core Identification
  bookingId: string;               // Auto-set to document ID
  bookingCode: string;             // 6-digit numeric code
  userId: string;                  // Tourist UID
  userRole: "tourist" | "driver" | "admin";
  
  // Location Data
  pickupPoints: Array<{
    order: number;
    lat: number;
    lng: number;
    address: string;
    name: string;
  }>;
  stops: Array<{...}>;              // Alias for pickupPoints
  pickup: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  
  // Trip Details
  vehicleType: "sedan" | "suv" | "tempo";
  distanceKm: number;
  hours: number;                   // Estimated duration
  pickupTime: Timestamp | string | null;
  dropTime: Timestamp | string | null;
  
  // Cost Breakdown
  costBreakdown: {
    fuel: number;
    driverRate: number;
    food: number;
    total: number;
  };
  amount: number;                  // Alias for costBreakdown.total
  currency: string;                 // Default: "INR"
  
  // Status & Assignment
  status: "pending" | "accepted" | "assigned" | "on_trip" | "completed" | "cancelled";
  driverId: string | null;
  tripId: string | null;           // Reference to trips collection
  
  // Metadata
  createdAt: Timestamp;            // serverTimestamp()
  updatedAt?: Timestamp;
  notes: string | null;
  
  // Backward Compatibility
  touristId?: string;              // Alias for userId
  estimate?: object;
  vehicle?: object;
  scheduledAt?: Timestamp | string;
}
```

**Indexes Required:**
- `userId` (ascending), `status` (ascending), `createdAt` (descending)
- `bookingCode` (ascending) - unique
- `driverId` (ascending), `status` (ascending)
- `status` (ascending), `createdAt` (descending)

**Security Rules:**
- Read: Users can read their own bookings; Drivers can read assigned bookings; Admins can read all
- Write: Only system/Functions can create; Users can update their own (limited fields); Drivers can update assigned (status only)

---

#### 3. `trips` Collection
**Purpose:** Driver-facing trip management (separate from bookings for workflow separation)

**Document Structure:**
```typescript
{
  tripId: string;                  // Auto-set to document ID
  touristId: string;
  driverId: string | null;
  status: "requested" | "assigned" | "on_trip" | "completed" | "cancelled";
  
  // Location
  pickup: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  stops: Array<{...}>;
  
  // Scheduling
  requestedAt: Timestamp;
  scheduledFor: Timestamp | null;
  
  // Pricing
  fareEstimate: number | null;
  finalFare: number | null;
  
  // Metadata
  bookingCode: string;
  notes: string | null;
  createdAt: Timestamp;
}
```

**Indexes Required:**
- `status` (ascending), `requestedAt` (descending)
- `driverId` (ascending), `status` (ascending)
- `touristId` (ascending), `createdAt` (descending)

---

#### 4. `driverProfiles` Collection
**Purpose:** Extended driver information and verification status

**Document Structure:**
```typescript
{
  driverId: string;                 // Auto-set to document ID
  uid: string;                      // Firebase Auth UID
  status: "pending" | "verified" | "rejected" | "suspended";
  
  // Personal Information
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  
  // Documents
  licenseNumber: string;
  licenseExpiry?: Timestamp;
  licensePhoto?: string;           // Firebase Storage URL
  aadhaarNumber?: string;
  aadhaarPhoto?: string;
  
  // Vehicle Information
  vehicleIds: Array<string>;        // References to vehicles collection
  vehicles?: Array<{
    vehicleId: string;
    type: "sedan" | "suv" | "tempo";
    registrationNumber: string;
    model?: string;
    year?: number;
    photo?: string;
  }>;
  
  // Verification
  verifiedBy?: string;              // Admin UID
  verifiedAt?: Timestamp;
  rejectionReason?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  onboardingCompleted: boolean;
}
```

**Indexes Required:**
- `uid` (ascending) - unique
- `status` (ascending), `createdAt` (descending)
- `phone` (ascending) - unique

---

#### 5. `vehicles` Collection
**Purpose:** Vehicle registration and details

**Document Structure:**
```typescript
{
  vehicleId: string;                // Auto-set to document ID
  driverId: string;
  type: "sedan" | "suv" | "tempo";
  registrationNumber: string;       // Unique
  model?: string;
  year?: number;
  color?: string;
  photo?: string;                   // Firebase Storage URL
  verified: boolean;
  createdAt: Timestamp;
}
```

---

#### 6. `notifications` Collection
**Purpose:** Notification logs and delivery status

**Document Structure:**
```typescript
{
  notificationId: string;
  userId: string;
  type: "sms" | "email" | "push";
  channel: "booking_confirmation" | "driver_assigned" | "otp" | "status_update";
  status: "pending" | "sent" | "failed" | "delivered";
  recipient: string;                // Phone number or email
  subject?: string;
  body: string;
  metadata?: object;
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  error?: string;
  createdAt: Timestamp;
}
```

---

#### 7. `auditLogs` Collection
**Purpose:** System audit trail for compliance and debugging

**Document Structure:**
```typescript
{
  logId: string;
  action: string;                   // e.g., "booking.created", "driver.verified"
  userId: string;
  userRole: string;
  resourceType: string;              // "booking", "user", "driver"
  resourceId: string;
  details: object;                  // Action-specific data
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
}
```

**Indexes Required:**
- `userId` (ascending), `createdAt` (descending)
- `action` (ascending), `createdAt` (descending)
- `resourceType` (ascending), `resourceId` (ascending)

---

### Validation Schemas (Zod)

#### Booking Schema
```typescript
import { z } from "zod";

const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(1),
  name: z.string().optional(),
});

const BookingSchema = z.object({
  userId: z.string().min(1),
  userRole: z.enum(["tourist", "driver", "admin"]),
  stops: z.array(LocationSchema).min(2),
  vehicleType: z.enum(["sedan", "suv", "tempo"]),
  distanceKm: z.number().min(0),
  hours: z.number().min(0).optional(),
  pickupTime: z.string().datetime().optional(),
  dropTime: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
```

#### User Schema
```typescript
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  role: z.enum(["tourist", "driver", "admin"]).default("tourist"),
});
```

---

## API Specifications

### Firebase Functions (Serverless Endpoints)

#### 1. `createBooking`
**Type:** HTTP Callable Function  
**Purpose:** Server-side booking creation with validation

**Request:**
```typescript
{
  userId: string;
  stops: Array<Location>;
  vehicleType: string;
  distanceKm: number;
  scheduledAt: string;
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  bookingId: string;
  bookingCode: string;
  status: string;
  error?: string;
}
```

---

#### 2. `sendSMS`
**Type:** HTTP Callable Function  
**Purpose:** Send SMS via Twilio/AWS SNS

**Request:**
```typescript
{
  to: string;                      // Phone number
  message: string;
  type: "otp" | "booking" | "notification";
  bookingId?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
}
```

---

#### 3. `sendEmail`
**Type:** HTTP Callable Function  
**Purpose:** Send email via SendGrid/AWS SES

**Request:**
```typescript
{
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  bookingId?: string;
}
```

---

#### 4. `processPayment`
**Type:** HTTP Callable Function  
**Purpose:** Process Stripe payment

**Request:**
```typescript
{
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  paymentIntentId: string;
  status: string;
  error?: string;
}
```

---

### Client-Side Service Functions

#### Booking Services (`src/lib/createBooking.js`)

```typescript
/**
 * Creates a booking document in Firestore
 * @param {Object} payload - Booking data
 * @returns {Promise<{bookingId: string, bookingCode: string, status: string}>}
 */
export async function createBooking(payload: BookingPayload): Promise<BookingResponse>
```

**Error Handling:**
- Throws `Error` if Firestore not initialized
- Throws `Error` if userId missing
- Throws `Error` if stops < 2
- Throws `Error` on Firestore write failure

---

#### Authentication Services (`src/lib/auth.js`)

```typescript
export async function signUp({email, phone, password, role}): Promise<{user, role}>
export async function signIn(email, password): Promise<{user, profile}>
export async function signOut(): Promise<void>
export async function resetPassword(email): Promise<{success: boolean}>
export async function changePassword(currentPassword, newPassword): Promise<{success: boolean}>
export async function getUserProfile(uid): Promise<UserProfile | null>
export async function ensureUserProfile(user, role): Promise<UserProfile>
```

---

#### Payment Services (`src/lib/payments.js`)

```typescript
export async function createPaymentIntent(bookingId, amount, currency): Promise<PaymentIntent>
export async function processPayment(bookingId, paymentMethod, amount, currency): Promise<PaymentResult>
export async function refundPayment(bookingId, amount): Promise<RefundResult>
export async function getPaymentStatus(bookingId): Promise<PaymentStatus>
```

---

#### Maps Services (`src/lib/maps.js`)

```typescript
export async function initializeMap(containerId, options): Promise<GoogleMap>
export async function calculateRoute(stops): Promise<RouteResult>
export async function geocodeAddress(address): Promise<Coordinates>
export async function reverseGeocode(lat, lng): Promise<Address>
export function calculateRouteFallback(stops): RouteResult  // Haversine
```

**Route Result:**
```typescript
{
  distance: number;        // km
  duration: number;         // minutes
  polyline: string;
  bounds: LatLngBounds;
  steps: Array<RouteStep>;
}
```

---

#### Notification Services (`src/lib/notifications.js`)

```typescript
export async function sendSMS(to, message, type, bookingId): Promise<SMSResult>
export async function sendOTP(phoneNumber): Promise<{otp: string, expiresAt: Date}>
export async function verifyOTP(phoneNumber, otp): Promise<boolean>
export async function sendEmail(to, subject, htmlBody, textBody, bookingId): Promise<EmailResult>
export async function sendBookingConfirmationEmail(userEmail, bookingDetails): Promise<void>
export async function sendDriverAssignmentNotification(phoneNumber, email, driverDetails, bookingDetails): Promise<void>
```

---

#### Tracking Services (`src/lib/tracking.js`)

```typescript
export function getCurrentLocation(): Promise<Coordinates>
export async function updateRideStatus(bookingId, status, driverId, location): Promise<void>
export function subscribeToDriverLocation(bookingId, callback): UnsubscribeFunction
export function updateDriverLocation(bookingId, location): Promise<void>
```

---

## User Flows & Features

### 1. Tourist User Flow

#### 1.1 Registration & Authentication
1. User visits `/auth`
2. Selects "Sign Up" mode
3. Enters email, password, phone (optional)
4. Selects role: "Tourist"
5. Submits form → `signUp()` called
6. Firebase Auth creates user account
7. User profile created in Firestore `users` collection
8. Email verification sent (optional)
9. Redirect to `/itinerary`

**Technical Details:**
- Form validation via Zod schema
- Password requirements: min 8 characters
- Email format validation
- Role stored in Firestore user document
- Session managed by Firebase Auth

---

#### 1.2 Itinerary Planning
1. User navigates to `/itinerary`
2. Views popular locations (Shillong, Living Root Bridge, Umiam Lake, etc.)
3. Clicks location → Added to itinerary
4. System calculates distance between stops (Haversine formula)
5. User selects vehicle type (sedan/suv/tempo)
6. System recalculates cost based on:
   - Distance × rate (sedan: ₹15/km, suv: ₹20/km, tempo: ₹25/km)
   - Driver charge: ₹500 (fixed)
   - Time charge: Math.ceil(distance/40) × ₹200
7. User selects scheduled date
8. User clicks "Confirm Booking"
9. Data stored in localStorage as `pending_booking`
10. Navigate to `/booking/confirm`

**Cost Calculation Formula:**
```javascript
const rates = { sedan: 15, suv: 20, tempo: 25 };
const fuelCost = distance * rates[vehicleType];
const driverCharge = 500;
const timeCharge = Math.ceil(distance / 40) * 200;
const total = Math.round(fuelCost + driverCharge + timeCharge);
```

---

#### 1.3 Booking Confirmation
1. Component mounts → Reads `pending_booking` from localStorage
2. Validates user authentication
3. Calls `createBooking()` with payload:
   ```javascript
   {
     userId: user.uid,
     userRole: "tourist",
     stops: pending.stops,
     vehicleType: pending.vehicleType,
     distanceKm: pending.totalDistance,
     pickupTime: pending.scheduledDate,
     hours: calculateHours(pending.totalDistance),
   }
   ```
4. `createBooking()` function:
   - Validates payload
   - Formats pickupPoints with lat/lng/address
   - Calculates costBreakdown
   - Writes to Firestore `bookings` collection
   - Returns `{ bookingId, bookingCode, status }`
5. UI updates:
   - Displays booking ID
   - Displays booking code (6-digit)
   - Shows status badge ("PENDING")
   - Shows cost breakdown
   - Shows route details
6. localStorage updated with booking data
7. `pending_booking` cleared

**Error Handling:**
- If Firestore unavailable → Fallback to localStorage
- If validation fails → Error message displayed
- If network error → Retry mechanism

---

#### 1.4 Booking Status Tracking
1. User views booking in dashboard (future feature)
2. Real-time listener on Firestore booking document
3. Status updates: pending → accepted → on_trip → completed
4. Notifications sent on status changes

---

### 2. Driver User Flow

#### 2.1 Driver Registration
1. User signs up with role "driver"
2. Navigates to driver onboarding flow
3. Multi-step form:
   - **Step 1:** Personal information (name, phone, address)
   - **Step 2:** License details (number, expiry, photo upload)
   - **Step 3:** Vehicle registration (type, registration number, photo)
   - **Step 4:** Document upload (Aadhaar, license photo)
4. Data saved to `driverProfiles` collection
5. Status set to "pending"
6. Admin notified for verification

**File Upload:**
- Files uploaded to Firebase Storage
- URLs stored in Firestore
- File size limit: 5MB per file
- Allowed types: image/jpeg, image/png, application/pdf

---

#### 2.2 Driver Dashboard
1. Driver navigates to `/driver`
2. Protected route checks role === "driver"
3. Dashboard displays:
   - Available bookings (status: "requested")
   - Assigned bookings (status: "assigned")
   - Completed bookings
   - Earnings summary
4. Real-time listeners:
   - `trips` collection query: `where("status", "==", "requested")`
   - `trips` collection query: `where("driverId", "==", driver.uid)`

---

#### 2.3 Accept Booking
1. Driver views available booking
2. Clicks "Accept" button
3. Firestore transaction:
   ```javascript
   await runTransaction(async (transaction) => {
     const tripRef = doc(db, "trips", tripId);
     const bookingRef = doc(db, "bookings", bookingId);
     
     transaction.update(tripRef, {
       driverId: driver.uid,
       status: "assigned",
     });
     
     transaction.update(bookingRef, {
       driverId: driver.uid,
       status: "accepted",
     });
   });
   ```
4. Notification sent to tourist
5. Real-time update to tourist dashboard

---

### 3. Admin User Flow

#### 3.1 Admin Dashboard
1. Admin navigates to `/admin`
2. Protected route checks role === "admin"
3. Dashboard displays:
   - Platform statistics (total bookings, drivers, revenue)
   - Pending driver verifications
   - Recent bookings
   - Analytics charts

**Statistics Calculated:**
```javascript
{
  totalBookings: number;
  totalDrivers: number;
  pendingDrivers: number;
  totalRevenue: number;
  totalTourists: number;
  bookingsByStatus: { pending, accepted, completed, cancelled };
}
```

---

#### 3.2 Driver Verification
1. Admin views pending driver applications
2. Reviews documents (license, Aadhaar, vehicle)
3. Clicks "Approve" or "Reject"
4. Firestore update:
   ```javascript
   await updateDoc(driverProfileRef, {
     status: "verified" | "rejected",
     verifiedBy: admin.uid,
     verifiedAt: serverTimestamp(),
     rejectionReason: string | null,
   });
   ```
5. Notification sent to driver
6. Audit log created

---

## Security & Compliance

### Authentication Security

1. **Firebase Authentication**
   - Email/password authentication
   - Password requirements: min 8 characters
   - Email verification (optional)
   - Session management via Firebase Auth tokens

2. **Role-Based Access Control (RBAC)**
   - Roles: `tourist`, `driver`, `admin`
   - Protected routes check role before rendering
   - Firestore security rules enforce role-based access

3. **Input Validation**
   - All user inputs validated via Zod schemas
   - XSS prevention via input sanitization
   - SQL injection prevention (NoSQL, but still sanitize)

---

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.driverId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        (resource.data.driverId == request.auth.uid && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'driverId']))
      );
    }
    
    // Driver profiles
    match /driverProfiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/driverProfiles/$(profileId)).data.uid == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

---

### Data Privacy

1. **PII Protection**
   - Phone numbers stored encrypted (future)
   - Aadhaar numbers hashed (future)
   - Email addresses used only for authentication

2. **GDPR Compliance** (Future)
   - User data export functionality
   - User data deletion on request
   - Consent management

---

### Rate Limiting

**Client-Side:**
- Booking creation: Max 10 per hour per user
- SMS OTP: Max 5 per hour per phone number
- API calls: Exponential backoff on failures

**Server-Side (Future):**
- Firebase Functions rate limiting
- Firestore read/write quotas

---

## Performance Requirements

### Frontend Performance

1. **Initial Load Time**
   - Target: < 3 seconds on 3G connection
   - Bundle size: < 500KB gzipped
   - Code splitting: Route-based lazy loading

2. **Runtime Performance**
   - React render optimization (React.memo, useMemo)
   - Virtual scrolling for long lists
   - Image lazy loading
   - Debounced search inputs

3. **Real-time Updates**
   - Firestore listeners with efficient queries
   - Unsubscribe on component unmount
   - Batch updates where possible

---

### Backend Performance

1. **Firestore Queries**
   - Indexed queries only
   - Limit result sets (pagination)
   - Composite indexes for complex queries

2. **Firebase Functions**
   - Cold start: < 2 seconds
   - Execution time: < 5 seconds per function
   - Timeout: 60 seconds max

---

### Scalability Considerations

1. **Database**
   - Firestore auto-scaling
   - Collection sharding if needed (future)
   - Archive old bookings (future)

2. **Storage**
   - Firebase Storage with CDN
   - Image optimization/compression
   - File size limits enforced

---

## Deployment & Infrastructure

### Environment Configuration

**Required Environment Variables:**
```bash
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=

# Optional
VITE_ENABLE_FUNCTIONS=false
```

---

### Build & Deployment

#### Development
```bash
npm install
npm run dev          # Starts Vite dev server on :8080
```

#### Production Build
```bash
npm run build        # Outputs to dist/
npm run preview      # Preview production build locally
```

#### Deployment Options

1. **Vercel (Recommended)**
   ```bash
   vercel deploy
   ```

2. **Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

3. **Netlify**
   ```bash
   netlify deploy --prod
   ```

---

### Firebase Project Setup

1. **Create Firebase Project**
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Storage
   - Enable Functions (optional)

2. **Configure Firestore**
   - Create collections (auto-created on first write)
   - Set up security rules
   - Create indexes

3. **Configure Storage**
   - Set up storage buckets
   - Configure CORS
   - Set file size limits

---

## Development Guidelines

### Code Style

1. **JavaScript/React**
   - ES6+ syntax
   - Functional components with Hooks
   - PropTypes or TypeScript (future)
   - ESLint configuration enforced

2. **File Naming**
   - Components: PascalCase (e.g., `BookingConfirm.jsx`)
   - Utilities: camelCase (e.g., `createBooking.js`)
   - Constants: UPPER_SNAKE_CASE

3. **Component Structure**
   ```javascript
   // Imports
   import React from 'react';
   import { ... } from '@/lib/...';
   
   // Component
   const ComponentName = () => {
     // Hooks
     const [state, setState] = useState();
     
     // Effects
     useEffect(() => { ... }, []);
     
     // Handlers
     const handleClick = () => { ... };
     
     // Render
     return ( ... );
   };
   
   export default ComponentName;
   ```

---

### Error Handling

1. **Error Boundaries**
   - Wrap routes in ErrorBoundary
   - Display user-friendly error messages
   - Log errors to monitoring service (future)

2. **Async Error Handling**
   ```javascript
   try {
     const result = await createBooking(payload);
   } catch (error) {
     console.error('Booking creation failed:', error);
     toast.error(error.message || 'Failed to create booking');
   }
   ```

---

### Testing Strategy

**Unit Tests (Future):**
- Utility functions
- Validation schemas
- Cost calculation logic

**Integration Tests (Future):**
- Booking creation flow
- Authentication flow
- Payment processing

**E2E Tests (Future):**
- Complete user journeys
- Cross-browser testing

---

## Future Roadmap

### Phase 1: Core Enhancements
- [ ] Real SMS gateway integration (Twilio)
- [ ] Real email service (SendGrid)
- [ ] Stripe webhook handling
- [ ] Advanced analytics dashboard
- [ ] Rating and review system

### Phase 2: Advanced Features
- [ ] In-app chat (driver-passenger)
- [ ] Route optimization algorithm
- [ ] Weather integration
- [ ] Multi-language support (Khasi, Garo)
- [ ] Loyalty program

### Phase 3: Mobile & Scale
- [ ] React Native mobile app
- [ ] Push notifications (FCM)
- [ ] Offline mode
- [ ] Background location tracking
- [ ] Advanced admin features

---

## Appendix

### A. Cost Calculation Details

**Vehicle Rates (per km):**
- Sedan: ₹15/km
- SUV: ₹20/km
- Tempo Traveller: ₹25/km

**Fixed Charges:**
- Driver charge: ₹500 per trip
- Time charge: ₹200 per estimated hour (calculated as distance/40 km/h)

**Example Calculation:**
- Distance: 50 km
- Vehicle: SUV
- Fuel: 50 × 20 = ₹1,000
- Driver: ₹500
- Time: Math.ceil(50/40) × 200 = 2 × 200 = ₹400
- **Total: ₹1,900**

---

### B. Distance Calculation

**Haversine Formula:**
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

---

### C. Booking Code Generation

**Format:** 6-digit numeric code
```javascript
function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

**Uniqueness:** Checked against Firestore before assignment

---

### D. Status Flow Diagram

```
pending → accepted → assigned → on_trip → completed
   ↓         ↓          ↓
cancelled  cancelled  cancelled
```

**State Transitions:**
- `pending`: Initial state after booking creation
- `accepted`: Driver has accepted the booking
- `assigned`: Driver assigned to trip (synced with trips collection)
- `on_trip`: Trip has started
- `completed`: Trip finished successfully
- `cancelled`: Booking cancelled (can occur at any stage)

---

## Document Metadata

- **Author:** Development Team
- **Reviewers:** Product, Engineering, Design
- **Last Review Date:** 2024
- **Next Review Date:** Quarterly
- **Version History:**
  - v1.0.0: Initial comprehensive PRD

---

**End of Document**

