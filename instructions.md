## Firebase Studio Prompt

Build a production-ready (MVP) web application for **booking local drivers for tourist trips in and around Shillong**, using the attached PRD as the source of truth for architecture patterns, data modeling conventions, and guardrails. The PRD will be provided to you separately—do not restate it; just follow it.

### Primary Goal
Deliver a **working, reliable** web app with robust authentication, role-based routing, and Firestore-backed booking + assignment flows. Functionality and correctness are higher priority than UI polish.

---

## Tech/Stack Requirements
- Frontend: React (Vite preferred), React Router.
- Backend: Firebase.
- Auth: Firebase Authentication (Email/Password).
- DB: Cloud Firestore.
- Use Firestore real-time listeners where appropriate (driver active bookings).
- Implement Firestore Security Rules (role-based access, least privilege).

---

## Roles
Two roles only for this build:
1. **Tourist/User**
2. **Driver**

Store role in Firestore user profile documents (e.g., `users/{uid}`).

---

## Core Pages & Routing
### Public Routes
- `/auth`  
  - Toggle between **User** login/signup and **Driver** login/signup (same underlying Auth provider but different role assignment).

### Tourist/User Routes (Protected)
- `/home` (default after user login)
  - Landing page with descriptive cards/sections of tourist attractions in and around Shillong.
  - Include a “Book a Driver” call-to-action that leads to booking creation.

- `/book`
  - Booking creation form:
    - Select destination(s) / places (multi-select)
    - Trip date/time (basic)
    - Notes (optional)
  - On submit: create a booking in Firestore with status **`pending`**, and store all relevant details.

### Driver Routes (Protected)
- `/driver/bookings` (default after driver login)
  - “Active bookings” list for that driver:
    - bookings assigned to the driver and not completed/cancelled
  - Real-time updates via Firestore listener/query.

---

## Signup & Profile Requirements
### Tourist Signup
- Email + password.
- Create `users/{uid}` with role = `tourist`.

### Driver Signup
- Email + password.
- Must capture **places the driver gives trips to** during signup:
  - Provide a multi-select list of places (consistent place IDs/names).
- Create:
  - `users/{uid}` with role = `driver`
  - `driverProfiles/{uid}` with `serviceAreas` or `placesServed: string[]`

---

## Booking Data Model (Firestore)
Implement these collections (minimum):
1. `users/{uid}`
   - `role: "tourist" | "driver"`
   - `email`
   - timestamps

2. `driverProfiles/{uid}`
   - `uid`
   - `placesServed: string[]`  // required
   - `createdAt`, `updatedAt`

3. `bookings/{bookingId}`
   - `userId` (tourist uid)
   - `driverId` (nullable initially)
   - `places: string[]` (selected destinations)
   - `scheduledAt` (timestamp)
   - `notes` (nullable)
   - `status: "pending" | "assigned" | "completed" | "cancelled"`
   - `createdAt`, `updatedAt`

Add indexes if needed for:
- driver active bookings query: `where("driverId", "==", uid)` + `where("status", "in", ["assigned"])`
- pending bookings matching: `where("status","==","pending")` + place matching strategy (see assignment section)

---

## Driver Assignment Logic (Must-Have)
A driver should be assigned a trip **based on the places they give trips to**.

Implement a reliable assignment flow using Firebase (prefer Cloud Functions, but can be client-triggered with strict rules if necessary):

### Minimum viable assignment approach
- When a booking is created:
  - Find eligible drivers whose `placesServed` contains **all** booking places (or at least the primary destination—define and implement one approach consistently).
  - Assign the booking to a driver deterministically (e.g., first eligible by createdAt, or random among eligible).
  - Write `driverId` into `bookings/{bookingId}` and set status to `assigned`.

### Concurrency & Consistency
- Use a **Firestore transaction** (or Cloud Function with transaction) so two drivers are never assigned the same booking incorrectly.
- Ensure idempotency: re-running assignment should not reassign if already assigned.

---

## Driver Active Bookings Page
- Query Firestore for bookings where:
  - `driverId == currentDriverUid`
  - `status in ["assigned"]` (and optionally include `on_trip` if you add it)
- Display booking details:
  - places
  - scheduledAt
  - notes
  - status
- Add actions:
  - Mark as Completed
  - Cancel (optional)
- Updates must enforce role-based permissions.

---

## Auth, Session, and Redirect Rules (Must-Have)
- After login:
  - If role is `tourist` → redirect to `/home`
  - If role is `driver` → redirect to `/driver/bookings`
- Protect routes with a reusable `<ProtectedRoute role="...">` pattern.
- Handle loading states reliably (avoid flicker and unauthorized brief renders).

---

## Firestore Security Rules (Must-Have)
Implement rules so:
- A user can read/write their own `users/{uid}` profile (except role changes after creation).
- Drivers can read their own `driverProfiles/{uid}` and update their own placesServed (optional).
- Tourists can create bookings for themselves.
- Tourists can read only their own bookings.
- Drivers can read only bookings where `driverId == request.auth.uid`.
- Only allowed fields can be updated by each role (e.g., driver can update status for assigned bookings; tourist can cancel their own booking, etc.).
- Prevent arbitrary assignment by clients unless handled through a trusted backend path (preferred: Cloud Function).

---

## Reliability Requirements
- Strong input validation on forms (client-side validation + defensive checks before Firestore writes).
- Clear error messages and non-crashing UI states.
- No infinite listeners; unsubscribe on unmount.
- Avoid over-fetching; paginate or limit where needed.
- Add an Error Boundary at app level.

---

## Deliverables
- Working web app with the above flows end-to-end.
- Clean project structure (components/pages/lib/firebase).
- Firestore rules included.
- Seed a small, static list of “Shillong attractions / places” used consistently across:
  - home page descriptions
  - booking multi-select
  - driver signup placesServed
