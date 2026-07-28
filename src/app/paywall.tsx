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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { OrbMascot } from '../components/features/OrbMascot';
import { MagicalBackground } from '../components/features/MagicalBackground';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  Sparkles,
  ShieldAlert,
  Zap,
  Activity,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { iapService, PRODUCT_IDS, type IAPProduct, type PlanTier } from '../services/iapService';

// ── Gold accent colour for premium branding ───────────────
const GOLD = '#D4AF37';

// ── Static price fallbacks (shown before store loads) ─────
// These match what you set in App Store Connect.
const FALLBACK_PRICES: Record<PlanTier, { displayPrice: string; subtitle: string }> = {
  monthly: { displayPrice: '$5.99', subtitle: 'Billed monthly · Cancel Anytime' },
  annual: { displayPrice: '$17.99', subtitle: '$1.50 / month · Billed yearly · Cancel Anytime' },
};

// ── Feature list ─────────────────────────────────────────
const FEATURES = [
  {
    icon: Activity,
    color: '#FF9500',
    bg: 'rgba(255,149,0,0.08)',
    title: 'NOVA Processing Audit',
    subtitle: 'Decodes industrial food processing levels.',
  },
  {
    icon: Sparkles,
    color: '#34C759',
    bg: 'rgba(52,199,89,0.08)',
    title: 'Nutri-Score Rating',
    subtitle: 'A–E traffic light food quality grade.',
  },
  {
    icon: ShieldAlert,
    color: '#FF3B30',
    bg: 'rgba(255,59,48,0.08)',
    title: 'Gut Shield Pro',
    subtitle: 'Flags barrier-eroding emulsifiers & gums.',
  },
  {
    icon: Search,
    color: '#AF52DE',
    bg: 'rgba(175,82,222,0.08)',
    title: 'Additive Detective',
    subtitle: 'Audits synthetic food dyes & preservatives.',
  },
  {
    icon: Zap,
    color: '#FFCC00',
    bg: 'rgba(255,204,0,0.08)',
    title: 'Sugar & Hidden Sugar',
    subtitle: 'Unmasks hidden sugar teaspoon counts.',
  },
  {
    icon: RefreshCw,
    color: '#007AFF',
    bg: 'rgba(0,122,255,0.08)',
    title: 'Smart Swaps Engine',
    subtitle: 'Instantly matches unhealthy items with clean options.',
  },
  {
    icon: ShieldCheck,
    color: '#34C759',
    bg: 'rgba(52,199,89,0.08)',
    title: 'Unlimited Scanning',
    subtitle: 'No limits. Scan every product in your pantry.',
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
  const { colors } = useTheme();
  const { isPremium } = useAppStore();
  const { user } = useAuthStore();

  // ── Component State ─────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('annual');
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Track mount state to avoid setting state after unmount
  const mountedRef = useRef(true);

  // ── Helpers ─────────────────────────────────────────────

  const getProduct = (tier: PlanTier): IAPProduct | undefined =>
    products.find(p => p.productId === PRODUCT_IDS[tier === 'monthly' ? 'MONTHLY' : 'ANNUAL']);

  const getDisplayPrice = (tier: PlanTier): string =>
    getProduct(tier)?.displayPrice ?? FALLBACK_PRICES[tier].displayPrice;

  const getSubtitle = (tier: PlanTier): string =>
    FALLBACK_PRICES[tier].subtitle;

  // ── Lifecycle ────────────────────────────────────────────

  const initialise = useCallback(async () => {
    if (!mountedRef.current) return;

    // 1. Connect to the native store
    await iapService.connect();
    // CRITICAL: Commented out to prevent auto-restoring and bypassing the paywall on mount.
    // The user must click the "Restore Purchases" button manually to restore an active subscription.
    // await iapService.checkSubscriptionStatus();

    // 2. Fetch live pricing from App Store Connect
    if (mountedRef.current) {
      setIsFetchingProducts(true);
    }
    const fetched = await iapService.fetchSubscriptions();
    if (mountedRef.current) {
      setProducts(fetched);
      setIsFetchingProducts(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initialise();

    return () => {
      mountedRef.current = false;
      // Disconnect from the store when this screen unmounts
      iapService.disconnect();
    };
  }, [initialise]);

  // If the user is already premium after the status check, redirect immediately
  useEffect(() => {
    if (isPremium) {
      router.replace('/(tabs)');
    }
  }, [isPremium]);

  // ── Handlers ─────────────────────────────────────────────

  const handlePlanSelect = (plan: PlanTier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Require authentication before purchasing
    if (!user) {
      router.push({ pathname: '/auth', params: { redirect: 'paywall' } });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await iapService.purchasePlan(selectedPlan);

      if (!mountedRef.current) return;

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✨ Premium Unlocked!',
          'Welcome to BiteFix Premium. You now have full access to Gut Shield, Smart Swaps, and all premium features.',
          [{ text: 'Start Scanning', onPress: () => router.replace('/(tabs)') }],
        );
      } else if (!result.userCancelled) {
        // Show the error — but not for user cancellations (that's intentional)
        Alert.alert(
          'Purchase Unsuccessful',
          result.error ?? 'Something went wrong. Please try again.',
          [{ text: 'OK' }],
        );
      }
    } catch (unexpectedErr: any) {
      if (!mountedRef.current) return;
      Alert.alert('Purchase Error', unexpectedErr?.message ?? 'An unexpected error occurred.');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    try {
      const result = await iapService.restorePurchases();

      if (!mountedRef.current) return;

      if (result.isEntitled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchase Restored ✅',
          'Your BiteFix Premium subscription has been restored.',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }],
        );
      } else if (result.success) {
        Alert.alert(
          'No Subscription Found',
          'No active subscription was found for your Apple ID. If you believe this is an error, contact support.',
        );
      } else {
        Alert.alert('Restore Failed', result.error ?? 'Could not restore purchases. Please try again.');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      Alert.alert('Restore Error', err?.message ?? 'Failed to restore purchases.');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!user) {
      router.push({ pathname: '/auth', params: { redirect: 'paywall' } });
    } else if (!isPremium) {
      Alert.alert(
        'Subscription Required',
        'BiteFix Premium is required to access the app. Please subscribe to continue, or sign out to switch accounts.',
        [
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await useAuthStore.getState().signOut();
              router.replace('/auth');
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MagicalBackground />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Row ──────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
          {user && !isPremium ? (
            <TouchableOpacity
              onPress={async () => {
                await useAuthStore.getState().signOut();
                router.replace('/auth');
              }}
              accessibilityLabel="Sign out"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: colors.surfaceRaised,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          ) : <View />}

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
            Protect Your Gut. Scan Cleaner.
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 6, maxWidth: 300, lineHeight: 19 }}>
            Instantly audit additives, detect hidden sugars, and swap to unprocessed alternatives.
          </Text>
        </View>

        {/* ── Feature List ─────────────────────────────────── */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 28,
          borderWidth: 2,
          borderColor: colors.success,
          padding: 24,
          gap: 16,
          marginBottom: 24,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 10,
          overflow: 'hidden',
        }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.success, opacity: 0.05 }]} />
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            return (
              <AnimatedListItem key={f.title} index={idx}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={f.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{f.title}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>{f.subtitle}</Text>
                  </View>
                </View>
              </AnimatedListItem>
            );
          })}
        </View>

        {/* ── Plan Selection ───────────────────────────────── */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          {/* Loading placeholder */}
          {isFetchingProducts && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>
                Loading prices from App Store…
              </Text>
            </View>
          )}

          {/* Monthly Plan */}
          <PlanCard
            tier="monthly"
            title="Monthly Pass"
            displayPrice={getDisplayPrice('monthly')}
            subtitle={getSubtitle('monthly')}
            badge={null}
            isSelected={selectedPlan === 'monthly'}
            onPress={() => handlePlanSelect('monthly')}
            colors={colors}
          />

          {/* Annual Plan */}
          <PlanCard
            tier="annual"
            title="Yearly Pass"
            displayPrice={getDisplayPrice('annual')}
            subtitle={getSubtitle('annual')}
            badge="75% DISCOUNT"
            isSelected={selectedPlan === 'annual'}
            onPress={() => handlePlanSelect('annual')}
            colors={colors}
          />
        </View>

        {/* ── Subscribe CTA ─────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={isProcessing}
          activeOpacity={0.88}
          accessibilityLabel="Subscribe to BiteFix Premium"
          style={{
            backgroundColor: isProcessing ? colors.success + 'AA' : colors.success,
            borderRadius: 20,
            paddingVertical: 17,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.success,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
            marginBottom: 8,
          }}
        >
          {isProcessing
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.6 }}>
              SUBSCRIBE NOW
            </Text>
          }
        </TouchableOpacity>

        {/* ── Legal & Policies ──────────────────────────────── */}
        <View style={{ marginTop: 20, gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9.5, textAlign: 'center', lineHeight: 14 }}>
            Payment will be charged to your iTunes Account at confirmation of purchase. Subscription
            automatically renews unless auto-renew is turned off at least 24 hours before the end of
            the current period. Manage or cancel in your iTunes Account Settings.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Privacy Policy', 'We value your privacy. All data is encrypted and never sold.')}
              accessibilityLabel="Privacy Policy"
            >
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Terms of Use', 'Standard Apple EULA governs the use of this application.')}
              accessibilityLabel="Terms of Use"
            >
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' }}>
                Terms of Use
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRestore}
              disabled={isProcessing}
              accessibilityLabel="Restore Purchases"
            >
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' }}>
                Restore Purchases
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Plan Card sub-component ───────────────────────────────

interface PlanCardProps {
  tier: PlanTier;
  title: string;
  displayPrice: string;
  subtitle: string;
  badge: string | null;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}

function PlanCard({ title, displayPrice, subtitle, badge, isSelected, onPress, colors }: PlanCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: isSelected ? colors.success + '0A' : colors.surfaceRaised,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: isSelected ? colors.success : colors.border,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: isSelected ? colors.success : '#000',
        shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
        shadowOpacity: isSelected ? 0.15 : 0.05,
        shadowRadius: isSelected ? 16 : 8,
        elevation: isSelected ? 6 : 2,
      }}
    >
      {isSelected && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.success, opacity: 0.05 }]} />}
      {/* Discount badge */}
      {badge && (
        <View style={{
          position: 'absolute',
          top: 0,
          right: 14,
          backgroundColor: colors.success,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}>
          <Text style={{ color: '#FFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 }}>
            {badge}
          </Text>
        </View>
      )}

      {/* Left: radio + label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 20, height: 20, borderRadius: 10,
          borderWidth: 2,
          borderColor: isSelected ? colors.success : colors.textMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />}
        </View>

        <View style={{ marginTop: badge ? 6 : 0 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 1 }}>{subtitle}</Text>
        </View>
      </View>

      {/* Right: price */}
      <View style={{ alignItems: 'flex-end', marginTop: badge ? 8 : 0 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{displayPrice}</Text>
      </View>
    </TouchableOpacity>
  );
}
