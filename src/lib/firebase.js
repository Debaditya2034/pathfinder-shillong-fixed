import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyADYC8zJv3hEnAhbjWimcU_Nm7kpl3mwIs",
  authDomain: "pathfinder3-4884c.firebaseapp.com",
  projectId: "pathfinder3-4884c",
  storageBucket: "pathfinder3-4884c.firebasestorage.app",
  messagingSenderId: "150162445022",
  appId: "1:150162445022:web:9a2502c346929cc7f7284f",
  measurementId: "G-ZGR81NPQZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
