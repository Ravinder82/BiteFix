// ─────────────────────────────────────────────────────────
// Auth Screen — CutSugar
// ─────────────────────────────────────────────────────────
// Premium Sign In / Sign Up screen with Google, Apple,
// and Email authentication. Uses CutSugar's warm amber
// design tokens and the OrbMascot character.
// ─────────────────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { OrbMascot } from '../../components/features/OrbMascot';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';

// ── Configure Google Sign-In ─────────────────────────────
// Note: iosClientId is only passed when explicitly set.
// The native SDK reads CLIENT_ID from GoogleService-Info.plist at build time.
// If you see "You must specify clientID in GIDConfiguration", you need to:
// 1. Enable Google Sign-In in Firebase Console → Authentication → Sign-in method
// 2. Re-download GoogleService-Info.plist (it will now contain CLIENT_ID)
// 3. Replace the file in the project root
// 4. Run a new EAS development build
const googleConfig: { webClientId?: string; iosClientId?: string } = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};
// Only pass iosClientId if it has an actual value (not empty string)
if (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
  googleConfig.iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
}
GoogleSignin.configure(googleConfig);

// ── Main Component ──────────────────────────────────────

export default function AuthScreen() {
  const { colors, isDark } = useTheme();
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const passwordRef = useRef<TextInput>(null);

  // ── Error Message Parser ──────────────────────────────
  const parseFirebaseError = (code: string): string | undefined => {
    const map: Record<string, string> = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Try again.',
      'auth/email-already-in-use': 'An account already exists with this email.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/invalid-credential': 'Invalid credentials. Please try again.',
      'auth/operation-not-allowed': 'Email/Password sign-in is disabled in your Firebase console. Please enable it under Authentication > Sign-in method.',
    };
    return map[code];
  };

  // ── Google Sign-In ────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('No ID token received from Google');
      await signInWithGoogle(idToken);
      Alert.alert(
        'Success',
        'Signed in with Google successfully!',
        [{ text: 'Continue', onPress: () => router.replace('/paywall') }]
      );
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User cancelled — do nothing
      } else if (error.message?.includes('clientID') || error.message?.includes('GIDConfiguration')) {
        setErrorMsg(
          'Google Sign-In is not fully configured yet. ' +
          'Please re-download GoogleService-Info.plist from Firebase Console ' +
          '(after enabling Google Sign-In provider) and create a new development build.'
        );
      } else {
        setErrorMsg(error.message || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Apple Sign-In ─────────────────────────────────────
  const handleAppleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Generate a cryptographically secure nonce
      const rawNonce = Array.from(
        await Crypto.getRandomBytesAsync(32)
      ).map(b => b.toString(16).padStart(2, '0')).join('');

      // SHA-256 hash the nonce for Apple
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) throw new Error('No identity token from Apple');
      await signInWithApple(credential.identityToken, rawNonce);
      Alert.alert(
        'Success',
        'Signed in with Apple successfully!',
        [{ text: 'Continue', onPress: () => router.replace('/paywall') }]
      );
    } catch (error: any) {
      console.error('Apple Sign-In Error:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        setErrorMsg(error.message || 'Apple sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Email Sign-In / Sign-Up ───────────────────────────
  const handleEmailAuth = async () => {
    Keyboard.dismiss();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
        Alert.alert(
          'Success',
          'Signed in successfully!',
          [{ text: 'Continue', onPress: () => router.replace('/paywall') }]
        );
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim());
        Alert.alert(
          'Account Created',
          `Welcome to FixBite, ${displayName.trim()}! Your account has been successfully created.`,
          [{ text: 'Get Started', onPress: () => router.replace('/paywall') }]
        );
      }
    } catch (error: any) {
      console.error("Firebase Email Auth Error:", error);
      setErrorMsg(parseFirebaseError(error.code) || error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your email first, then tap Forgot Password.');
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert('Check Your Email', `Password reset link sent to ${email.trim()}`);
    } catch (error: any) {
      console.error("Firebase Password Reset Error:", error);
      setErrorMsg(parseFirebaseError(error.code) || error.message || 'Something went wrong. Please try again.');
    }
  };

  // ── Render ────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Test Bypass / Pass to Paywall Button ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 16 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Set mock test bypass user in auth store to satisfy navigation guards
                useAuthStore.setState({
                  user: {
                    uid: 'test-bypass-user',
                    email: 'test@bypass.com',
                    displayName: 'Test Bypass',
                    photoURL: null,
                    provider: 'email',
                  },
                });
                router.replace('/paywall');
              }}
              style={{
                backgroundColor: '#10B98115',
                borderWidth: 1.5,
                borderColor: '#10B981',
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '900' }}>
                Pass to Paywall Screen
              </Text>
              <ArrowRight size={14} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* ── Header: Mascot + Brand ── */}
          <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 12 }}>
            <OrbMascot state="happy" size={100} />
            <Text
              style={{
                color: colors.text,
                fontSize: 28,
                fontWeight: '900',
                letterSpacing: -1,
                marginTop: 16,
              }}
            >
              BiteFix
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                fontWeight: '600',
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              {mode === 'signin' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
            </Text>
          </View>

          {/* ── Social Auth Buttons ── */}
          <View style={{ gap: 12, marginTop: 24 }}>
            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: 16,
                paddingVertical: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
              }}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24">
                <Path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <Path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <Path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <Path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </Svg>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Apple Button (iOS only) */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={handleAppleSignIn}
                disabled={isLoading}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  backgroundColor: isDark ? '#FFFFFF' : '#000000',
                  borderRadius: 16,
                  paddingVertical: 15,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                }}
              >
                <Svg width="16" height="19" viewBox="0 0 17 20" fill={isDark ? "#000000" : "#FFFFFF"}>
                  <Path d="M15.03 16.29c-.73 1.09-1.5 2.15-2.67 2.17-1.17.02-1.55-.69-2.88-.69-1.34 0-1.75.67-2.87.72-1.15.05-2.02-1.16-2.76-2.22C2.35 14.1 1.2 10.1 2.74 7.42c.76-1.33 2.13-2.17 3.61-2.2 1.12-.02 2.19.76 2.88.76.68 0 1.98-.94 3.34-.8 1.02.04 2.16.23 3.19 1.73-.08.05-1.9 1.12-1.88 3.34.03 2.65 2.32 3.53 2.35 3.54-.03.06-.37 1.26-1.2 2.5m-2.4-13.43c.58-.71.97-1.69.87-2.68-.88.04-1.94.59-2.57 1.31-.54.61-1.02 1.61-.89 2.59.98.08 1.99-.5 2.59-1.22" />
                </Svg>
                <Text style={{ color: isDark ? '#000' : '#FFF', fontWeight: '700', fontSize: 15 }}>
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Divider ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontWeight: '700',
                marginHorizontal: 16,
                letterSpacing: 1,
              }}
            >
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* ── Email Form ── */}
          <View style={{ gap: 14 }}>
            {/* Name field (Sign Up only) */}
            {mode === 'signup' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                }}
              >
                <User size={18} color={colors.textMuted} />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                  style={{
                    flex: 1,
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: '500',
                    paddingVertical: 16,
                    paddingLeft: 12,
                  }}
                />
              </View>
            )}

            {/* Email */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: 14,
                paddingHorizontal: 16,
              }}
            >
              <Mail size={18} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
                placeholder="Email Address"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: '500',
                  paddingVertical: 16,
                  paddingLeft: 12,
                }}
              />
            </View>

            {/* Password */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: 14,
                paddingHorizontal: 16,
              }}
            >
              <Lock size={18} color={colors.textMuted} />
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMsg(''); }}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleEmailAuth}
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: '500',
                  paddingVertical: 16,
                  paddingLeft: 12,
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                {showPassword
                  ? <EyeOff size={18} color={colors.textMuted} />
                  : <Eye size={18} color={colors.textMuted} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Error Message ── */}
          {errorMsg ? (
            <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          {/* ── Forgot Password (Sign In only) ── */}
          {mode === 'signin' && (
            <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Submit Button ── */}
          <TouchableOpacity
            onPress={handleEmailAuth}
            disabled={isLoading}
            activeOpacity={0.9}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 16,
              marginTop: 20,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
                <ArrowRight size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          {/* ── Toggle Mode ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '500' }}>
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMsg('');
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
