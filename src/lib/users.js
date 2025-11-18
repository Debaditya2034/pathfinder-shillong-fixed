import { signInWithPhoneNumber, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore, RecaptchaVerifier } from "@/firebase";

const LOCAL_USER_KEY = "pathfinder_user";
const isFirebaseReady = Boolean(auth && firestore);
let recaptchaVerifier = null;

const readLocalUser = () => {
  try {
    const data = localStorage.getItem(LOCAL_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn("Failed to parse local user data. Clearing corrupted value.", error);
    localStorage.removeItem(LOCAL_USER_KEY);
    return null;
  }
};

const writeLocalUser = (user) => {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  return user;
};

const getUserDocRef = (uid) => (firestore ? doc(firestore, "users", uid) : null);

export const ensureRecaptchaVerifier = (containerId = "recaptcha-container") => {
  if (!auth) return null;
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  }
  return recaptchaVerifier;
};

export const sendOtp = async (phoneNumber, containerId) => {
  if (!auth) {
    console.warn("Firebase auth unavailable — simulating OTP flow in demo mode.");
    return {
      confirm: async () => {
        const demoUser = { uid: `local-${Date.now()}`, phoneNumber };
        writeLocalUser(demoUser);
        return { user: demoUser };
      },
    };
  }

  const verifier = ensureRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const saveUserProfile = async (profile) => {
  if (!profile?.uid) {
    throw new Error("User profile requires a uid.");
  }

  if (!isFirebaseReady) {
    return writeLocalUser(profile);
  }

  await setDoc(
    getUserDocRef(profile.uid),
    { ...profile, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return profile;
};

export const getUserProfile = async (uid) => {
  if (!isFirebaseReady) {
    return uid ? readLocalUser() : readLocalUser();
  }

  const resolvedUid = uid || auth?.currentUser?.uid;
  if (!resolvedUid) return null;

  const snapshot = await getDoc(getUserDocRef(resolvedUid));
  if (snapshot.exists()) {
    return { uid: snapshot.id, ...snapshot.data() };
  }
  return null;
};

export const signOutUser = async () => {
  if (!isFirebaseReady) {
    localStorage.removeItem(LOCAL_USER_KEY);
    return;
  }
  await firebaseSignOut(auth);
};

