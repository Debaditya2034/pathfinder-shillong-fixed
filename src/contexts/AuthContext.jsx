import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserProfile } from '../lib/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // If profile doesn't exist, create a default one (for backward compatibility)
          if (!userProfile) {
            console.log('Profile not found, creating default profile for:', firebaseUser.uid);
            userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'tourist', // default role
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
              console.log('Default profile created successfully');
            } catch (createError) {
              console.error('Error creating default profile:', createError);
              // Still set the profile locally so the app can continue
            }
          }
          
          setProfile(userProfile);
          console.log('Profile loaded:', userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Set a minimal profile to prevent infinite loading
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'tourist'
          });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
