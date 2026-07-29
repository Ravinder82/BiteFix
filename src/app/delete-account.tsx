// ─────────────────────────────────────────────────────────
// Delete Account Screen — BiteFix
// ─────────────────────────────────────────────────────────
// Displays the authenticated user's email & provider,
// handles Firebase re-authentication inline (Google/Apple/Email),
// deletes the account, wipes all local data, and navigates
// back to the auth screen so the user can re-register.
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Trash2, ShieldAlert, ArrowLeft, Mail, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function DeleteAccountScreen() {
  const { colors, isDark } = useTheme();
  const { clearAllData } = useAppStore();
  const { isPremium } = useAppStore();
  const {
    user,
    deleteAccount,
    reauthWithGoogle,
    reauthWithApple,
    reauthWithEmail,
  } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailPassword, setEmailPassword] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);

  // ── Re-authenticate based on provider ──────────────────
  const performReauth = async (): Promise<boolean> => {
    try {
      if (user?.provider === 'google') {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const idToken = response?.data?.idToken;
        if (!idToken) throw new Error('Google sign-in failed — no ID token');
        await reauthWithGoogle(idToken);
        return true;
      }

      if (user?.provider === 'apple') {
        const nonce = Math.random().toString(36).substring(2, 10);
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          nonce
        );
        const appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });
        if (!appleCredential.identityToken) throw new Error('Apple sign-in failed — no identity token');
        await reauthWithApple(appleCredential.identityToken, nonce);
        return true;
      }

      if (user?.provider === 'email') {
        if (!emailPassword.trim()) {
          Alert.alert('Password Required', 'Please enter your password to verify your identity.');
          return false;
        }
        await reauthWithEmail(user.email!, emailPassword);
        return true;
      }

      throw new Error('Unknown auth provider');
    } catch (err: any) {
      console.error('Re-authentication Error:', err);
      const message =
        err.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' :
        err.code === 'auth/invalid-credential' ? 'Invalid credentials. Please try again.' :
        err.code === 'auth/too-many-requests' ? 'Too many attempts. Please wait and try again.' :
        err.message || 'Re-authentication failed. Please try again.';
      Alert.alert('Verification Failed', message);
      return false;
    }
  };

  // ── Main delete handler ────────────────────────────────
  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm account deletion.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsDeleting(true);

    try {
      // 1. Try deleting the account directly
      await deleteAccount();
    } catch (err: any) {
      // 2. If Firebase needs re-auth, do it seamlessly
      if (
        err.code === 'auth/requires-recent-login' ||
        (err.message && err.message.includes('auth/requires-recent-login'))
      ) {
        // Show re-auth UI for email users, auto-trigger for OAuth
        if (user?.provider === 'email' && !emailPassword.trim()) {
          setNeedsReauth(true);
          setIsDeleting(false);
          return;
        }

        const reauthOk = await performReauth();
        if (!reauthOk) {
          setIsDeleting(false);
          return;
        }

        // 3. Retry deletion after successful re-auth
        try {
          await deleteAccount();
        } catch (retryErr: any) {
          console.error('Account Deletion Retry Error:', retryErr);
          Alert.alert('Error', retryErr.message || 'Failed to delete account after re-authentication.');
          setIsDeleting(false);
          return;
        }
      } else {
        console.error('Account Deletion Error:', err);
        Alert.alert('Error', err.message || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
        return;
      }
    }

    // 4. Wipe all local app data
    clearAllData();

    // 5. Navigate to auth screen
    Alert.alert(
      'Account Deleted',
      'Your account and all data have been permanently deleted. You can register again to continue using BiteFix.',
      [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/auth');
          },
        },
      ]
    );
    setIsDeleting(false);
  };

  const providerIcon =
    user?.provider === 'google' ? '🔵' :
    user?.provider === 'apple' ? '🍎' :
    user?.provider === 'email' ? '✉️' : '🔒';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            borderRadius: 20,
            marginRight: 16,
          }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>Delete Account</Text>
      </View>

      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View>
          {/* Account Info Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Mail size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                  {user?.email || 'No email found'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                  {providerIcon} Signed in via {user?.provider === 'google' ? 'Google' : user?.provider === 'apple' ? 'Apple' : user?.provider === 'email' ? 'Email' : 'Unknown'}
                </Text>
              </View>
            </View>

            {/* Subscription Status */}
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Shield size={14} color={isPremium ? '#10B981' : colors.textMuted} />
              <Text style={{ color: isPremium ? '#10B981' : colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {isPremium ? 'Premium Active' : 'Free Plan'}
              </Text>
              {isPremium && (
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '500' }}>
                  · Purchases can be restored after re-registering
                </Text>
              )}
            </View>
          </View>

          {/* Warning Card */}
          <View
            style={{
              backgroundColor: (colors.error || '#EF4444') + '10',
              borderColor: (colors.error || '#EF4444') + '30',
              borderWidth: 1,
              padding: 20,
              borderRadius: 20,
              flexDirection: 'row',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <ShieldAlert size={24} color={colors.error || '#EF4444'} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.error || '#EF4444', fontSize: 14, fontWeight: '700' }}>Permanent Action</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
                This will permanently delete your account, all scanned foods, basket items, and settings from this device.
                {isPremium ? '\n\nYour subscription purchases are linked to your App Store / Play Store account and can be restored via the Paywall screen after re-registering.' : ''}
              </Text>
            </View>
          </View>

          {/* Re-auth password field for email users */}
          {needsReauth && user?.provider === 'email' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 }}>
                Verify Your Password
              </Text>
              <TextInput
                value={emailPassword}
                onChangeText={setEmailPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  width: '100%',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              />
            </View>
          )}

          {/* Confirmation Input */}
          <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 16, paddingHorizontal: 4 }}>
            To confirm deletion, type <Text style={{ color: colors.text, fontWeight: '900' }}>DELETE</Text> below.
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 }}>
              Confirmation Code
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type DELETE"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                width: '100%',
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                fontSize: 14,
                fontWeight: '700',
              }}
            />
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={handleDelete}
          disabled={confirmText !== 'DELETE' || isDeleting}
          style={{
            backgroundColor: confirmText === 'DELETE' && !isDeleting ? (colors.error || '#EF4444') : colors.border,
            width: '100%',
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            opacity: confirmText === 'DELETE' && !isDeleting ? 1 : 0.5,
          }}
        >
          {isDeleting ? (
            <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
          ) : (
            <Trash2 size={16} color="white" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
            {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
