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

// ── Configure Google Sign-In ─────────────────────────────
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

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
  const parseFirebaseError = (code: string): string => {
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
    };
    return map[code] || 'Something went wrong. Please try again.';
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
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
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
    } catch (error: any) {
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
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      }
    } catch (error: any) {
      setErrorMsg(parseFirebaseError(error.code));
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
      setErrorMsg(parseFirebaseError(error.code));
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
          {/* ── Header: Mascot + Brand ── */}
          <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 12 }}>
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
              CutSugar
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
              <Text style={{ fontSize: 18 }}>🔵</Text>
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
                <Text style={{ fontSize: 18, color: isDark ? '#000' : '#FFF' }}></Text>
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
