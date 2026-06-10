# Phase 6 — Firebase Auth Setup

## 6.1 Firebase Project Setup

1. `console.firebase.google.com` → New Project
2. Enable Authentication → Sign-in Methods:
   - Email/Password ✅
   - Google ✅
   - Apple ✅ (MANDATORY for iOS)
   - Phone ✅ (optional)
3. Enable Firestore → Start in production mode
4. Enable Storage
5. Enable Cloud Functions (for backend logic)
6. Add iOS app → download `GoogleService-Info.plist` → place in project root
7. Add Android app → download `google-services.json` → place in project root

## 6.2 Firebase Config

```ts
// src/config/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey:             process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain:         process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:          process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId:  process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:              process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const storage  = getStorage(app);
export const functions = getFunctions(app, 'asia-south1'); // use region near users
```

## 6.3 Auth Store (Zustand)

```ts
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '@config/firebase';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as firebaseSignOut, onAuthStateChanged,
  sendEmailVerification, sendPasswordResetEmail, User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initialize: () => () => void; // returns unsubscribe
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        set({ user, profile: profileDoc.data() as UserProfile, isInitialized: true });
      } else {
        set({ user: null, profile: null, isInitialized: true });
      }
    });
    return unsubscribe;
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true });
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(user);
    await setDoc(doc(db, 'users', user.uid), {
      name, email, uid: user.uid,
      createdAt: serverTimestamp(),
      plan: 'free',
    });
    set({ isLoading: false });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    await signInWithEmailAndPassword(auth, email, password);
    set({ isLoading: false });
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, profile: null });
  },

  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },
}));
```

## 6.4 Google Sign-In

```bash
npm install @react-native-google-signin/google-signin
```

```ts
// src/services/googleAuth.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@config/firebase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const { data } = await GoogleSignin.signIn();
  const credential = GoogleAuthProvider.credential(data!.idToken);
  return signInWithCredential(auth, credential);
}
```

## 6.5 Apple Sign-In (MANDATORY for iOS App Store)

```bash
npx expo install expo-apple-authentication
```

In `app.json`:
```json
"ios": {
  "usesAppleSignIn": true
}
```

```ts
// src/services/appleAuth.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@config/firebase';

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const provider = new OAuthProvider('apple.com');
  const oAuthCredential = provider.credential({
    idToken: credential.identityToken!,
    rawNonce: credential.authorizationCode!,
  });

  return signInWithCredential(auth, oAuthCredential);
}
```

**Important:** Apple only shares email/name on FIRST sign-in. Store it immediately in Firestore.

## 6.6 Root Layout Auth Gate

```tsx
// src/app/_layout.tsx
import { useEffect } from 'react';
import { Slot, router, useSegments } from 'expo-router';
import { useAuthStore } from '@stores/authStore';

export default function RootLayout() {
  const { user, isInitialized, initialize } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [user, isInitialized, segments]);

  if (!isInitialized) return <SplashScreen />;
  return <Slot />;
}
```

## 6.7 Secure Token Storage

```ts
// NEVER store sensitive data in AsyncStorage — it's plaintext on device

import * as SecureStore from 'expo-secure-store';

// Store
await SecureStore.setItemAsync('auth_token', token);

// Retrieve
const token = await SecureStore.getItemAsync('auth_token');

// Delete
await SecureStore.deleteItemAsync('auth_token');
```

## 6.8 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User's private data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public data (read-only)
    match /public/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 6.9 Account Deletion (Full Cascade)

```ts
// src/services/deleteAccount.ts
import { auth, db, storage } from '@config/firebase';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';

export async function deleteUserAccount(password?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('No user');

  // Step 1: Re-authenticate (Firebase requires this for account deletion)
  if (password) {
    const credential = EmailAuthProvider.credential(user.email!, password);
    await reauthenticateWithCredential(user, credential);
  }

  // Step 2: Delete Firestore data
  const batch = writeBatch(db);
  const subcollections = ['notes', 'preferences', 'subscriptions'];
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, 'users', user.uid, sub));
    snap.forEach(d => batch.delete(d.ref));
  }
  batch.delete(doc(db, 'users', user.uid));
  await batch.commit();

  // Step 3: Delete Storage files
  try {
    const folderRef = ref(storage, `users/${user.uid}`);
    const { items } = await listAll(folderRef);
    await Promise.all(items.map(item => deleteObject(item)));
  } catch { /* no files to delete */ }

  // Step 4: Revoke RevenueCat (if using payments)
  // await Purchases.logOut();

  // Step 5: Delete Firebase Auth user
  await deleteUser(user);
}
```
