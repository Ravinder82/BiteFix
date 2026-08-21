// ═══════════════════════════════════════════════════════════
// BiteFix — Paywall Screen
// ═══════════════════════════════════════════════════════════
//
// Displays subscription plans fetched live from App Store
// Connect via expo-iap. Handles the complete purchase,
// restore, and navigation lifecycle.
//
// Flow:
//   1. Mount  → connect to native store + check subscription status
//   2. Fetch  → load live pricing from App Store Connect
//   3. Select → user picks Monthly or Annual plan
//   4. Buy    → requestPurchase → StoreKit sheet → finishTransaction
//   5. Success→ setPremium(true) → navigate to tabs
//   6. Unmount→ disconnect from native store
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/appStore';
import { OrbMascot } from '../components/features/OrbMascot';
import { MagicalBackground } from '../components/features/MagicalBackground';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { PaywallDisclaimerModal } from '../components/PaywallDisclaimerModal';
import { getIapService } from '../services/iapLoader';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  Crown,
  ShieldAlert,
  Zap,
  Activity,
  Globe,
  Brain,
  Flame,
  ScanLine,
  Unlock,
  Leaf,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ── Feature list (Uniform Dimensions & Rich Visuals) ───────
const FEATURES = [
  {
    title: 'BiteFix Intelligence Score™',
    subtitle: 'Instant deterministic 6-factor score and NOVA processing detection.',
    icon: Activity,
    color: '#6EE041',
    rotation: '-10deg',
    footerType: 'nova',
  },
  {
    title: 'Unlimited Scanning',
    subtitle: 'Scan any product with no daily limits or scan restrictions.',
    icon: ScanLine,
    color: '#2DD4BF',
    rotation: '6deg',
    footerType: 'scanRate',
  },
  {
    title: 'Everything Unlocked',
    subtitle: 'Get full access to all features and deep ingredient intelligence.',
    icon: Unlock,
    color: '#8B5CF6',
    rotation: '-6deg',
    badge: 'ALL ACCESS',
    footerType: 'allUnlocked',
  },
] as const;

// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// Animated List Item for Staggered Micro-Animations
// ─────────────────────────────────────────────────────────
function AnimatedListItem({ children, index, style }: { children: React.ReactNode; index: number; style?: any }) {
  const slideIn = useSharedValue(20);
  const fade = useSharedValue(0);
  useEffect(() => {
    slideIn.value = withDelay(index * 80, withSpring(0, { damping: 12, stiffness: 100 }));
    fade.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideIn.value }],
    opacity: fade.value,
  }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

export default function PaywallScreen() {
  const { colors, isDark } = useTheme();
  const { isPremium, freeScansUsed } = useAppStore();

  const [isCheckingEntitlement, setIsCheckingEntitlement] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const remainingFreeScans = Math.max(0, 5 - (freeScansUsed || 0));
  const hasFreeScansAvailable = !isPremium && remainingFreeScans > 0;

  // ── Liquid Glass Concentric Breathing Pulse ──────────────
  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.85);

  useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    breathOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.65, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedOuterRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  const animatedInnerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (breathScale.value - 1) * 0.7 }],
    opacity: 0.85 + (breathOpacity.value - 0.65) * 0.4,
  }));

  // ── Verify RevenueCat Entitlement on Mount ────────────────
  useEffect(() => {
    let isMounted = true;

    const verifyEntitlementOnMount = async () => {
      try {
        const service = await getIapService();
        if (!service) {
          if (isMounted) {
            useAppStore.getState().setPremium(false);
            setIsCheckingEntitlement(false);
            if (!hasFreeScansAvailable) setIsModalVisible(true);
          }
          return;
        }

        const isEntitled = await service.checkSubscriptionStatus();
        if (!isMounted) return;

        if (isEntitled) {
          useAppStore.getState().setPremium(true);
          router.replace('/(tabs)');
        } else {
          useAppStore.getState().setPremium(false);
          setIsCheckingEntitlement(false);
          if (!hasFreeScansAvailable) {
            setIsModalVisible(true);
          }
        }
      } catch (err) {
        console.warn('[Paywall] Entitlement verification error on mount:', err);
        if (isMounted) {
          useAppStore.getState().setPremium(false);
          setIsCheckingEntitlement(false);
          if (!hasFreeScansAvailable) setIsModalVisible(true);
        }
      }
    };

    verifyEntitlementOnMount();

    return () => {
      isMounted = false;
    };
  }, [hasFreeScansAvailable]);

  // ── Handlers ─────────────────────────────────────────────

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRestoring(true);
    try {
      const service = await getIapService();
      if (!service) {
        Alert.alert('Store Unavailable', 'Unable to connect to the App Store. Please check your internet connection and try again.');
        return;
      }

      const result = await service.restorePurchases();
      if (result.isEntitled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        useAppStore.getState().setPremium(true);
        router.replace('/(tabs)');
      } else if (result.success) {
        Alert.alert(
          'No Subscription Found',
          'We could not find an active subscription linked to this Apple ID.\n\nIf you purchased under a different Apple ID, please sign in with that account in your device settings.'
        );
      } else {
        Alert.alert('Restore Failed', result.error ?? 'Could not restore purchases. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Restore Error', e?.message ?? 'An unexpected error occurred while restoring purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  // ── Render Loading State ─────────────────────────────────
  if (isCheckingEntitlement) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <MagicalBackground />
        <OrbMascot state="scanning" size={80} />
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 12, letterSpacing: 0.2 }}>
          Checking subscription status...
        </Text>
      </SafeAreaView>
    );
  }

  // ── Render Paywall ───────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MagicalBackground />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Row ──────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 8, paddingBottom: 2 }}>
          {/* Dismiss button available for premium users or users with free scans left */}
          {isPremium || hasFreeScansAvailable ? (
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityLabel="Close paywall"
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.surfaceRaised,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <X size={17} color={colors.text} />
            </TouchableOpacity>
          ) : <View style={{ width: 34, height: 34 }} />}
        </View>

        {/* ── Hero Orbital Mascot Scene ─────────────────────── */}
        <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
          {/* Orbital Canvas with 2 Concentric Liquid Glass Breathing Rings & Mascot */}
          <View style={{ width: 270, height: 166, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

            {/* Outer Liquid Glass Breathing Ring */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 196,
                  height: 196,
                  borderRadius: 98,
                  backgroundColor: isDark ? 'rgba(21, 125, 83, 0.12)' : 'rgba(2, 197, 112, 0.08)',
                  borderWidth: 2,
                  borderColor: isDark ? 'rgba(30, 217, 136, 0.35)' : 'rgba(2, 197, 112, 0.30)',
                  shadowColor: isDark ? '#157d53' : '#02c539ff',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isDark ? 0.45 : 0.25,
                  shadowRadius: 16,
                  elevation: 3,
                },
                animatedOuterRingStyle,
              ]}
              pointerEvents="none"
            />

            {/* Inner Liquid Glass Breathing Ring */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 164,
                  height: 164,
                  borderRadius: 82,
                  backgroundColor: isDark ? 'rgba(21, 125, 83, 0.18)' : 'rgba(255, 255, 255, 0.44)',
                  borderWidth: 2.5,
                  borderColor: isDark ? 'rgba(30, 217, 136, 0.65)' : 'rgba(2, 197, 112, 0.55)',
                  shadowColor: isDark ? '#1ed988' : '#019153ff',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isDark ? 0.60 : 0.35,
                  shadowRadius: 10,
                  elevation: 5,
                },
                animatedInnerRingStyle,
              ]}
              pointerEvents="none"
            />

            {/* Central Mascot (Size 130) */}
            <OrbMascot state="happy" size={130} />

            {/* Top-Left: Scan Viewfinder Sticker */}
            <View
              style={{
                position: 'absolute',
                top: -4,
                left: 14,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#6EE041',
                borderWidth: 2.5,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#16A34A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.40,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ rotate: '-8deg' }],
                zIndex: 4,
              }}
            >
              <ScanLine size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>

            {/* Top-Right: Safety Shield Guard Sticker */}
            <View
              style={{
                position: 'absolute',
                top: -10,
                right: 24,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#EF4444',
                borderWidth: 2.5,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.40,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ rotate: '7deg' }],
                zIndex: 4,
              }}
            >
              <ShieldAlert size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>

            {/* Bottom-Left: Unlocked Access Sticker */}
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                left: 18,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#8B5CF6',
                borderWidth: 2.5,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.40,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ rotate: '9deg' }],
                zIndex: 4,
              }}
            >
              <Unlock size={22} color="#FFFFFF" strokeWidth={2.5} />
            </View>

            {/* Bottom-Right: Clean Eco Leaf Sticker */}
            <View
              style={{
                position: 'absolute',
                bottom: 6,
                right: 14,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#2DD4BF',
                borderWidth: 2.5,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#2DD4BF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.40,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ rotate: '-6deg' }],
                zIndex: 4,
              }}
            >
              <Leaf size={22} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>

          {/* ✦ BITEFIX PREMIUM Solid Sticker Pill with Tilt ✦ */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FF8A00',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              paddingHorizontal: 15,
              paddingVertical: 5,
              borderRadius: 999,
              marginTop: 10,
              marginBottom: 8,
              shadowColor: '#C45100',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 8,
              elevation: 6,
              transform: [{ rotate: '-3.5deg' }],
            }}
          >
            <Crown size={13} color="#FFFFFF" strokeWidth={2.8} />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: '900',
                letterSpacing: 1.6,
                textTransform: 'uppercase',
              }}
            >
              BITEFIX PREMIUM
            </Text>
          </View>

          {/* Title ("Scan" and "Know" both in gradient color, bolder & bigger) */}
          <Text
            style={{
              textAlign: 'center',
              lineHeight: 38,
              marginTop: 6,
            }}
          >
            <Text style={{ color: isDark ? '#6EE041' : '#129b89ff', fontSize: 34, fontWeight: '900', letterSpacing: -0.8 }}>Scan </Text>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 }}>Once.</Text>
            {'\n'}
            <Text style={{ color: isDark ? '#6EE041' : '#55c628ff', fontSize: 34, fontWeight: '900', letterSpacing: -0.8 }}>Know </Text>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 }}>More.</Text>
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13.5,
              lineHeight: 18,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 20,
              maxWidth: 320,
            }}
          >
            Instant food intelligence with unlimited scans.
          </Text>
        </View>

        {/* ── 3 Elevated Tactile Feature Cards (Uniform Dimensions) ── */}
        <View style={{ gap: 14, marginBottom: 24 }}>
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            const badge = (f as any).badge;
            const footerType = (f as any).footerType;

            return (
              <AnimatedListItem key={f.title} index={idx}>
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.045)' : '#FFFFFF',
                    borderRadius: 18,
                    borderWidth: 1.25,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    paddingVertical: 15,
                    paddingHorizontal: 16,
                    minHeight: 76,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.18 : 0.04,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  {/* Tactile Circular Sticker Icon */}
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: f.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      shadowColor: f.color,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.35,
                      shadowRadius: 6,
                      elevation: 4,
                      transform: [{ rotate: f.rotation }],
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} color="#FFFFFF" strokeWidth={2.4} />
                  </View>

                  {/* Card Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 }}>
                        {f.title}
                      </Text>
                      {badge && (
                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.20)' : 'rgba(139, 92, 246, 0.12)',
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 5,
                            borderWidth: 0.8,
                            borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.25)',
                          }}
                        >
                          <Text style={{ color: isDark ? '#A78BFA' : '#7C3AED', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }}>
                            {badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '500', marginTop: 4, lineHeight: 17 }}>
                      {f.subtitle}
                    </Text>
                  </View>
                </View>
              </AnimatedListItem>
            );
          })}
        </View>

        {/* Bottom Padding for floating actions */}
        <View style={{ height: 170 }} />
      </ScrollView>

      {/* ── Floating Bottom Actions ───────────────────────── */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
        {hasFreeScansAvailable && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              useAppStore.getState().setTrialStarted(true);
              router.replace('/(tabs)');
            }}
            activeOpacity={0.88}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: colors.border,
              paddingVertical: 18,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
              Try For Free (5 Free Scans)
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsModalVisible(true);
          }}
          activeOpacity={0.88}
          style={{
            backgroundColor: colors.success,
            borderRadius: 24,
            paddingVertical: 18,
            alignItems: 'center',
            shadowColor: colors.success,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.6 }}>
            Subscribe to Premium
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 12 }}>
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isRestoring}
            activeOpacity={0.75}
            style={{ paddingVertical: 4, paddingHorizontal: 8 }}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '800', textDecorationLine: 'underline' }}>
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDisclaimerVisible(true);
            }}
            activeOpacity={0.75}
            style={{ paddingVertical: 4, paddingHorizontal: 8 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '800', textDecorationLine: 'underline' }}>
              Disclaimer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Subscription Bottom Sheet Modal ───────────────── */}
      <SubscriptionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        showCloseButton={hasFreeScansAvailable}
      />

      <PaywallDisclaimerModal
        visible={disclaimerVisible}
        onClose={() => setDisclaimerVisible(false)}
      />
    </SafeAreaView>
  );
}
