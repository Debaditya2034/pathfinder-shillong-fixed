// src/lib/auth.js
import { auth, db } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function ensureUserProfile(user, role = "tourist") {
  if (!user || !user.uid) throw new Error("Invalid user for ensureUserProfile");
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const payload = {
    uid: user.uid,
    email: user.email || null,
    phone: user.phoneNumber || null,
    role,
    createdAt: new Date().toISOString()
  };

  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function signUp({ email, phone, password, role = "tourist" }) {
  if (!email || !password) throw new Error("Email and password are required");
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  try { await updateProfile(user, { displayName: role === "admin" ? "Admin" : "" }); } catch (e) { console.warn("updateProfile warning:", e); }

  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email || null,
      phone: phone || null,
      role,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to create user profile doc:", e);
  }

  try { await sendEmailVerification(user); } catch (e) { console.warn("sendEmailVerification warning:", e); }

  return { user, role };
}

export async function signIn(email, password) {
  if (!email || !password) throw new Error("Email and password are required");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  let profile = null;
  try {
    profile = await getUserProfile(user.uid);
    if (!profile) profile = await ensureUserProfile(user, "tourist");
  } catch (err) { console.warn("Could not read/create user profile:", err); }

  return { user, profile };
}

export async function driverSignIn(email, password) {
  const { user, profile } = await signIn(email, password);

  if (!profile || profile.role !== "driver") {
    try { await firebaseSignOut(auth); } catch (e) { console.warn("Failed to sign out non-driver user:", e); }
    throw new Error("This account is not registered as a driver.");
  }

  return { user, profile };
}

export async function signOut() { await firebaseSignOut(auth); }

export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => { unsub(); resolve(user); });
  });
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!email) throw new Error("Email is required");
  if (!auth) throw new Error("Firebase Auth not initialized");
  
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    throw new Error(error.message || "Failed to send password reset email");
  }
}

/**
 * Change user password (requires reauthentication)
 */
export async function changePassword(currentPassword, newPassword) {
  if (!auth?.currentUser) throw new Error("User must be logged in");
  
  try {
    // Reauthenticate user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Update password
    await updatePassword(auth.currentUser, newPassword);
    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    throw new Error(error.message || "Failed to change password");
  }
}
