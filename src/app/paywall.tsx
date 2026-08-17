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
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
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
  Sparkles,
  Flame,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ── Gold accent colour for premium branding ───────────────
const GOLD = '#D4AF37';

// ── Feature list ─────────────────────────────────────────
const FEATURES = [
  {
    icon: Zap,
    color: '#34C759',
    bg: 'rgba(52,199,89,0.12)',
    title: 'Unlimited Scans',
    subtitle: 'Scan any product with no daily limits or scan restrictions.',
    badge: 'TOP FEATURE',
  },
  {
    icon: Sparkles,
    color: '#00C288',
    bg: 'rgba(0,194,136,0.12)',
    title: 'Nutrition Intelligence',
    subtitle: 'Dynamic protein, fibre, sodium, and micronutrient profile insights.',
  },
  {
    icon: Activity,
    color: '#FF9500',
    bg: 'rgba(255,149,0,0.10)',
    title: 'BiteFix Intelligence Score™',
    subtitle: 'Deterministic 6-factor score and NOVA processing detection.',
  },
  {
    icon: ShieldAlert,
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.10)',
    title: 'Ingredient & Additive Review',
    subtitle: 'Identifies emulsifiers, sweeteners, and flagged additives.',
  },
  {
    icon: Flame,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.10)',
    title: 'Sugar & Energy Impact',
    subtitle: 'Estimated sugar equivalent teaspoons and jogging burn time.',
  },
  {
    icon: Globe,
    color: '#4D8DE8',
    bg: 'rgba(77,141,232,0.10)',
    title: 'Eco-Score & Carbon Footprint',
    subtitle: 'Available CO₂ estimates and sustainable sourcing signals.',
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
        Alert.alert(
          'Purchase Restored ✅',
          'Your BiteFix Premium subscription has been restored.',
          [{
            text: 'Continue',
            onPress: () => {
              router.replace('/(tabs)');
            }
          }]
        );
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
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 16 }}>
          {/* Dismiss button available for premium users or users with free scans left */}
          {isPremium || hasFreeScansAvailable ? (
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityLabel="Close paywall"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surfaceRaised,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          ) : <View />}
        </View>


        {/* ── Hero Banner ──────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 24 }}>
          <OrbMascot state="happy" size={90} />

          <View style={{
            backgroundColor: 'rgba(212,175,55,0.1)',
            borderColor: GOLD + '50',
            borderWidth: 1,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 14,
            marginTop: 18,
            marginBottom: 10,
          }}>
            <Text style={{ color: GOLD, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase' }}>
              ✦  B I T E F I X   P R E M I U M  ✦
            </Text>
          </View>

          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
            Scan Once. Know More.
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 6, maxWidth: 300, lineHeight: 19 }}>
            Full access to all features, nutrition intelligence, and unlimited scans.
          </Text>
        </View>

        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          paddingVertical: 6,
          marginBottom: 24,
          overflow: 'hidden',
        }}>
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            const isLast = idx === FEATURES.length - 1;
            const badge = (f as any).badge;
            return (
              <AnimatedListItem key={f.title} index={idx}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 10,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color={f.color} strokeWidth={2.1} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: -0.1 }}>{f.title}</Text>
                      {badge && (
                        <View style={{
                          backgroundColor: isDark ? 'rgba(52,199,89,0.20)' : 'rgba(52,199,89,0.15)',
                          paddingHorizontal: 6,
                          paddingVertical: 1.5,
                          borderRadius: 4,
                        }}>
                          <Text style={{ color: '#34C759', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 }}>
                            {badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 15 }}>{f.subtitle}</Text>
                  </View>
                </View>
              </AnimatedListItem>
            );
          })}
        </View>

        {/* Bottom Padding for floating actions */}
        <View style={{ height: 160 }} />
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
