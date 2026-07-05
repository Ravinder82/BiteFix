// ─────────────────────────────────────────────────────────
// Firebase Configuration — CutSugar
// ─────────────────────────────────────────────────────────
// Firebase config keys are PUBLIC by design — security is
// enforced by Firebase Security Rules, not by hiding keys.
// See: https://firebase.google.com/docs/projects/api-keys
// ─────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-expect-error - getReactNativePersistence exists in React Native runtime bundle but is omitted in TS types definitions
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Using the verified iOS Firebase app config since the iOS API key is valid on Google's servers.
const firebaseConfig = {
  apiKey: 'AIzaSyAKaWR_eUVx8lKlElEumnPYemykPxTt0uQ',
  authDomain: 'cutsugar-6ad0f.firebaseapp.com',
  projectId: 'cutsugar-6ad0f',
  storageBucket: 'cutsugar-6ad0f.firebasestorage.app',
  messagingSenderId: '1097829102652',
  appId: '1:1097829102652:ios:9c28d13d4a6938618b7f39',
};

// Initialize Firebase App (prevent duplicate initialization on hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native AsyncStorage persistence.
// Wrap in try/catch to handle "auth/already-initialized" on hot reload.
let auth: any;
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

export { app, auth };
