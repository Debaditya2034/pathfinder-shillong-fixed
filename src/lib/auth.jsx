import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Only show loading on initial load, not on subsequent auth changes
      if (isInitialLoad.current) {
        setLoading(true)
      }
      
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          let retries = 0
          const maxRetries = 5
          
          // Retry logic in case document was just created (signup flow)
          while (!userDoc.exists() && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 300))
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            retries++
          }
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData.role
            })
          } else {
            console.warn('User document not found for:', firebaseUser.uid)
            setUser(null)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
      isInitialLoad.current = false
    })

    return unsubscribe
  }, [])

  const login = async (email, password) => {
    console.log('Starting login for:', email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log('Firebase Auth successful, fetching user profile...')
    
    // Immediately fetch user profile and set state
    try {
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      console.log('Firestore response:', userDoc.exists() ? 'Document exists' : 'Document NOT found')
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log('User data:', userData)
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          role: userData.role
        })
        console.log('User state set with role:', userData.role)
      } else {
        console.error('User document not found in Firestore')
        throw new Error('User profile not found. Please contact support.')
      }
    } catch (firestoreError) {
      console.error('Error fetching user profile:', firestoreError)
      // Sign out since we couldn't get the user profile
      await signOut(auth)
      throw new Error('Failed to load user profile. Please try again.')
    }
  }

  const signup = async (email, password, role, driverData = null) => {
    console.log('Starting signup for:', email, 'with role:', role)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = userCredential.user.uid
    console.log('Firebase Auth user created with UID:', uid)

    try {
      // Create user profile
      console.log('Creating Firestore user document...')
      await setDoc(doc(db, 'users', uid), {
        email,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log('User document created successfully')

      // If driver, create driver profile
      if (role === 'driver' && driverData?.placesServed) {
        console.log('Creating driver profile...')
        await setDoc(doc(db, 'driverProfiles', uid), {
          uid,
          placesServed: driverData.placesServed,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        console.log('Driver profile created successfully')
      }

      // Immediately set user state after signup (don't wait for onAuthStateChanged)
      setUser({
        uid,
        email,
        role
      })
      console.log('User state set with role:', role)
    } catch (firestoreError) {
      console.error('Error creating user profile:', firestoreError)
      // Delete the auth user since we couldn't create the profile
      await userCredential.user.delete()
      throw new Error('Failed to create user profile. Please try again.')
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
