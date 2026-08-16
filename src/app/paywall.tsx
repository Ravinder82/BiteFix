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
  StyleSheet
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
import {
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  Crown,
  ShieldAlert,
  Zap,
  Activity,
  Globe
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ── Gold accent colour for premium branding ───────────────
const GOLD = '#D4AF37';

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
    icon: Crown,
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
    icon: ShieldCheck,
    color: '#34C759',
    bg: 'rgba(52,199,89,0.08)',
    title: 'Unlimited Scanning',
    subtitle: 'No limits. Scan every product in your pantry.',
  },
  {
    icon: Globe,
    color: '#4D8DE8',
    bg: 'rgba(77,141,232,0.08)',
    title: 'Carbon Footprint',
    subtitle: 'CO₂ impact score for every product you scan.',
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
  const { isPremium, freeScansUsed } = useAppStore();

  const remainingFreeScans = Math.max(0, 5 - (freeScansUsed || 0));
  const hasFreeScansAvailable = !isPremium && remainingFreeScans > 0;

  const [isModalVisible, setIsModalVisible] = useState(!hasFreeScansAvailable);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);

  // If the user is already premium after the status check, redirect immediately
  useEffect(() => {
    if (isPremium) {
      router.replace('/(tabs)');
    }
  }, [isPremium]);

  // ── Handlers ─────────────────────────────────────────────

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
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
            Protect Your Gut. Scan Cleaner.
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 6, maxWidth: 300, lineHeight: 19 }}>
            Instant NOVA classification, Nutri-Score, Gut Shield & additive auditing.
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

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDisclaimerVisible(true);
          }}
          activeOpacity={0.75}
          style={{ alignSelf: 'center', marginTop: 12, paddingVertical: 4, paddingHorizontal: 8 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '800', textDecorationLine: 'underline' }}>
            Disclaimer
          </Text>
        </TouchableOpacity>
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
