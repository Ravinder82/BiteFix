// ─────────────────────────────────────────────────────────
// Firebase Configuration — CutSugar
// ─────────────────────────────────────────────────────────
// All config values are loaded from environment variables.
// Firebase config keys are PUBLIC by design — security is
// enforced by Firebase Security Rules, not by hiding keys.
// ─────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-expect-error - getReactNativePersistence exists in React Native runtime bundle but is omitted in TS types definitions
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasKeys = !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

let app: any;
let auth: any;

if (hasKeys) {
  // Initialize Firebase App (prevent duplicate initialization on hot reload)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Initialize Auth with React Native AsyncStorage persistence.
  // Wrap in try/catch to handle "auth/already-initialized" on hot reload.
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: any) {
    if (error.code === 'auth/already-initialized') {
      // Auth was already initialized (e.g. during hot reload), get existing instance
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
} else {
  console.warn(
    '⚠️ Firebase configuration keys are missing in your .env file. ' +
      'Please fill in EXPO_PUBLIC_FIREBASE_API_KEY in your .env file to enable authentication.'
  );
  app = {} as any;
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      // Simulate unauthenticated user so routing doesn't hang
      const timer = setTimeout(() => callback(null), 100);
      return () => clearTimeout(timer);
    },
  } as any;
}

export { app, auth };
