// ─────────────────────────────────────────────────────────
// Auth Store — BiteFix
// ─────────────────────────────────────────────────────────
// Dedicated Zustand store for Firebase Authentication.
// Handles Google, Apple, and Email sign-in flows.
// Listens to onAuthStateChanged for real-time auth state.
// ─────────────────────────────────────────────────────────

import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  deleteUser,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  EmailAuthProvider,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// ── Types ────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'apple' | 'email' | 'unknown';
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => () => void;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithApple: (identityToken: string, nonce: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  reauthWithGoogle: (idToken: string) => Promise<void>;
  reauthWithApple: (identityToken: string, nonce: string) => Promise<void>;
  reauthWithEmail: (email: string, password: string) => Promise<void>;
}

// ── Helpers ──────────────────────────────────────────────

function extractProvider(firebaseUser: User): AuthUser['provider'] {
  const providerId = firebaseUser.providerData[0]?.providerId;
  if (providerId === 'google.com') return 'google';
  if (providerId === 'apple.com') return 'apple';
  if (providerId === 'password') return 'email';
  return 'unknown';
}

function mapFirebaseUser(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    provider: extractProvider(firebaseUser),
  };
}

// ── Store ────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  // Subscribe to Firebase auth state changes.
  // Returns an unsubscribe function for cleanup.
  initialize: () => {
    // Safety guard if Firebase config keys are not loaded yet
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      set({ user: null, isLoading: false, isInitialized: true });
      return () => {};
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        set({
          user: mapFirebaseUser(firebaseUser),
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          user: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    });
    return unsubscribe;
  },

  // ── Google Sign-In ──────────────────────────────────
  // Receives the idToken from @react-native-google-signin
  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // onAuthStateChanged will update the user state
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Apple Sign-In ───────────────────────────────────
  // Receives identityToken + nonce from expo-apple-authentication
  signInWithApple: async (identityToken: string, nonce: string) => {
    set({ isLoading: true });
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });
      await signInWithCredential(auth, credential);
      // onAuthStateChanged will update the user state
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Email Sign-In ───────────────────────────────────
  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will update the user state
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Email Sign-Up ───────────────────────────────────
  signUpWithEmail: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Set the display name on the new user profile
      await updateProfile(result.user, { displayName });
      // Force a state refresh with the updated profile
      set({
        user: mapFirebaseUser(result.user),
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Password Reset ──────────────────────────────────
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // ── Sign Out ────────────────────────────────────────
  signOut: async () => {
    set({ isLoading: true });
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will clear user state
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Delete Account ──────────────────────────────────
  deleteAccount: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user signed in');
    set({ isLoading: true });
    try {
      await deleteUser(currentUser);
      // onAuthStateChanged will clear user state
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Re-authenticate with Google ─────────────────────
  reauthWithGoogle: async (idToken: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user signed in');
    const credential = GoogleAuthProvider.credential(idToken);
    await reauthenticateWithCredential(currentUser, credential);
  },

  // ── Re-authenticate with Apple ──────────────────────
  reauthWithApple: async (identityToken: string, nonce: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user signed in');
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });
    await reauthenticateWithCredential(currentUser, credential);
  },

  // ── Re-authenticate with Email ──────────────────────
  reauthWithEmail: async (email: string, password: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user signed in');
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(currentUser, credential);
  },
}));
