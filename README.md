# PathFinder Shillong - Localized Travel Services Platform

A mobile-first travel services platform for Meghalaya featuring itinerary planning, driver matching, and booking management.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:8080`

## 🧪 Quick Checks

Run these before opening a PR or deploying:

```bash
npm run lint
npm run build
```

## 🎯 Demo Mode Features

This is a **DEMO VERSION** with the following capabilities:

### For Tourists
- Browse featured places in Meghalaya
- Build multi-stop itineraries with automatic distance calculation
- Get instant cost estimates (fuel + driver + time)
- Choose vehicle type and schedule trips
- Confirm bookings with SMS/OTP simulation
- Receive booking codes for driver verification

### For Drivers
- Register with vehicle and document details
- View available bookings
- Accept/decline trip requests
- Generate driver verification codes
- Track earnings (demo mode)

### For Admins
- Verify driver registrations
- View all bookings and analytics
- Monitor platform statistics
- Manage user verification

## 🔑 Demo Credentials

**Any email/password combination works in demo mode**

To access different dashboards:
- **Tourist**: Sign up as "Tourist" role
- **Driver**: Sign up as "Driver" role
- **Admin**: Add `?admin=true` to URL or sign up as "Admin"

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + JavaScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions) - **NOTE: Removed in chore/remove-firebase-clean-slate branch**
- **Routing**: React Router v6
- **State**: React Query + localStorage (demo)
- **Icons**: Lucide React
- **Maps**: Integration-ready for Mapbox/Google Maps

## 📁 Project Structure

```
src/
├── assets/            # Images and static files
├── components/        # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── Navbar.jsx     # Main navigation
├── lib/               # Utilities and Firebase config
├── pages/             # Route pages
│   ├── Index.jsx            # Homepage
│   ├── Auth.jsx             # Login/Signup
│   ├── Itinerary.jsx        # Trip planner
│   ├── BookingConfirm.jsx   # Booking confirmation
│   ├── DriverDashboard.jsx  # Driver interface
│   └── AdminDashboard.jsx   # Admin panel
├── data/              # Local demo data
└── App.jsx            # Main app with routing
```

## 🔧 Firebase Configuration

**NOTE: Firebase removed in chore/remove-firebase-clean-slate branch — re-add when ready.**

Firebase is optional. In demo mode the helpers store everything in `localStorage`, but if you want real OTP auth + Firestore writes:

1. Create a Firebase project and enable **Auth (Phone/OTP)**, **Firestore**, and **Storage**.
2. Create a `.env` (or `.env.local`) file in the project root with:

```bash
VITE_FIREBASE_API_KEY="xxx"
VITE_FIREBASE_AUTH_DOMAIN="xxx.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="xxx"
VITE_FIREBASE_STORAGE_BUCKET="xxx.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="0000000"
VITE_FIREBASE_APP_ID="1:0000000:web:abcdef"
```

3. Restart `npm run dev`. The new `src/firebase.js` loader will detect the env vars and initialize Firebase; otherwise it will log `Firebase not initialized — running in local/demo mode.` and all helpers (`src/lib/bookings.js`, `src/lib/users.js`) will keep using `localStorage`.

## 📱 Key Features Implemented

### P1 (Priority 1) ✅
- ✅ Firebase-ready authentication structure
- ✅ Multi-stop itinerary builder
- ✅ Haversine distance calculation
- ✅ Dynamic cost estimation
- ✅ Booking flow (pending → accepted)
- ✅ Booking code generation
- ✅ SMS/OTP simulation

### P2 (Priority 2) ✅
- ✅ Driver dashboard
- ✅ Accept/decline bookings
- ✅ Driver verification workflow
- ✅ Notification system (demo)

### P3 (Priority 3) ✅
- ✅ Admin dashboard
- ✅ Driver verification management
- ✅ Analytics and statistics
- ✅ Booking overview

## 🎨 Design System

The app uses a nature-inspired color scheme reflecting Meghalaya:

- **Primary**: Forest green (#2d7a5f)
- **Secondary**: Sky blue
- **Accent**: Earth tone yellow
- **Gradients**: Smooth transitions between nature colors

All colors are HSL-based and fully customizable in `src/index.css` and `tailwind.config.js`.

## 📦 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy 'dist' folder to Vercel
```

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

## 🔒 Security Notes (For Production)

- Replace demo localStorage with Firebase Authentication
- Implement proper RLS policies in Firestore
- Enable Firebase App Check
- Set up Firebase Security Rules
- Use environment variables for API keys
- Implement rate limiting
- Add input validation and sanitization

## 📞 Support & Contact

For demo purposes, all features use simulated data stored in browser localStorage.

---

**Built with ❤️ for Meghalaya tourism**

# Firebase test (client)
**NOTE: Firebase removed in chore/remove-firebase-clean-slate branch — re-add when ready.**

1. cp .env.example .env.local and fill your Firebase credentials (or leave blank to use local/demo fallback).
2. npm install
3. npm run dev
4. In browser console (after app loads), run:
   import { createBooking } from '/src/lib/bookings.js'
   createBooking({ touristId: 'demo', stops:[{name:'Dawki',lat:25.17,lng:92.3}], estimate:{distance_km:12,total:500}, vehicle:'SUV', scheduledAt: new Date().toISOString(), phone:'+919876543210' }).then(console.log)
5. If Firestore is configured you will see the doc in the console and in Firestore. Otherwise it will be saved to localStorage under key `pf_demo_bookings`.