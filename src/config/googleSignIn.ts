import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

let isConfigured = false;

export function configureGoogleSignIn(): void {
  if (isConfigured) return;

  try {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const config: Parameters<typeof GoogleSignin.configure>[0] = {};

    if (webClientId) {
      config.webClientId = webClientId;
    }

    // iOS reads CLIENT_ID from GoogleService-Info.plist. Passing the separate
    // EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID here can override the native plist value.
    GoogleSignin.configure(config);
    isConfigured = true;
  } catch (error) {
    console.warn('[GoogleSignIn] configure warning:', error);
  }
}

export async function signInWithGoogleIdToken(): Promise<string> {
  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices();
  }

  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error('Google sign-in failed: no ID token received.');
  }

  return idToken;
}
