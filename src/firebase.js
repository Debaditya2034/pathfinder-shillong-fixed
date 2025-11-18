// Minimal stub to keep imports working during removal branch.
// TODO: re-add firebase wiring - removed in chore/remove-firebase-clean-slate

export const firebaseStub = {
  auth: {
    currentUser: null,
    signIn: async () => {
      throw new Error("firebase removed");
    },
  },
  firestore: {},
  storage: {},
};

// Export individual stubs for compatibility
export const auth = firebaseStub.auth;
export const firestore = firebaseStub.firestore;
export const storage = firebaseStub.storage;
export const firebaseApp = null;
export const app = null;
export const RecaptchaVerifier = class {
  constructor() {
    throw new Error("firebase removed - RecaptchaVerifier not available");
  }
};

