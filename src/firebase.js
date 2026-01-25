// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Enhanced Firebase config with environment variable support
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCLdrekMz4HOx3SWzHyfnWSCDxHYkLQbYI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pathfinder-shillong-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pathfinder-shillong-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pathfinder-shillong-demo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "67702476950",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:67702476950:web:d13be1e733154ef5ee32b7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TT2V3PS8L7"
};

let app;
let auth;
let db;
let storage;
let functions;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize Functions if in production or if explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_FUNCTIONS === "true") {
    functions = getFunctions(app);
  }
  
  if (import.meta.env.DEV) {
    console.log("🔥 Firebase initialized successfully");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Fallback: create mock objects to prevent crashes
  auth = null;
  db = null;
  storage = null;
  functions = null;
  console.warn("Firebase not initialized — running in local/demo mode.");
}

export { auth, db, storage, functions };
export default app;
