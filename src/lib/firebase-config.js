// Firebase configuration placeholder for future use
// This is a demo app - Firebase integration is optional

// To enable Firebase:
// 1. Create project at https://console.firebase.google.com
// 2. Enable Authentication (Email + Phone)
// 3. Create Firestore database
// 4. Update config below with your values
// 5. Uncomment imports and initialization code

export const firebaseConfig = {
  apiKey: "DEMO_MODE",
  authDomain: "demo.firebaseapp.com",
  projectId: "pathfinder-demo",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "000000000000",
  appId: "demo-app-id"
};

// Demo mode - Firebase not initialized
// Uncomment when ready to use Firebase:
/*
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
*/
