import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { OrbMascot } from '../components/features/OrbMascot';
import { MagicalBackground } from '../components/features/MagicalBackground';
import { ShieldCheck, RefreshCw, Search, ArrowRight, Check, X, Sparkles, ShieldAlert, Zap, Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { iapService } from '../services/iapService';

type PlanTier = 'monthly' | 'annual';

export default function PaywallScreen() {
  const { colors, isDark } = useTheme();
  const { setPremium } = useAppStore();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('annual'); // Default to annual (highest value)
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Sync user identity with IAP service if authenticated
    if (user?.uid) {
      iapService.identifyUser(user.uid);
    } else {
      iapService.initialize();
    }
  }, [user?.uid]);

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      // Lazy Auth: redirect to auth screen first, instructing it to come back to paywall
      router.push({ pathname: '/auth', params: { redirect: 'paywall' } });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await iapService.purchasePlan(selectedPlan);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Premium Unlocked! ✨',
          'Welcome to BiteFix Premium. You now have full access to Gut Shield & Smart Swaps.',
          [{ text: 'Start Scanning', onPress: () => router.replace('/(tabs)') }]
        );
      } else if (!result.userCancelled) {
        Alert.alert('Subscription Notice', result.error || 'Unable to process purchase. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Purchase Error', e.message || 'Something went wrong during payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePassToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      // Lazy Auth: redirect to auth screen first, instructing it to go directly to tabs upon login
      router.push({ pathname: '/auth', params: { redirect: 'tabs' } });
      return;
    }

    router.replace('/(tabs)');
  };

  const handleRestore = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(true);
    try {
      const result = await iapService.restorePurchases();
      if (result.isEntitled) {
        Alert.alert(
          'Purchase Restored',
          'Your premium subscription status has been successfully restored.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found for your Apple Account.');
      }
    } catch (e: any) {
      Alert.alert('Restore Error', e.message || 'Failed to restore purchases.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Luxury style definitions
  const gold = '#D4AF37';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MagicalBackground />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header Navigation ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
          {/* Close button */}
          <TouchableOpacity
            onPress={handlePassToHome}
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

        {/* ── Mascot & Title Banner ── */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 100, height: 100 }}>
            <OrbMascot state="happy" size={90} />
          </View>

          <View style={{
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            borderColor: gold + '40',
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            marginTop: 16,
            marginBottom: 8,
          }}>
            <Text style={{ color: gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              ✦ B I T E F I X   P R E M I U M ✦
            </Text>
          </View>

          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
            Protect Your Gut. Scan Cleaner.
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6, maxWidth: 300, lineHeight: 18 }}>
            Instantly audit additives, detect hidden sugars, and swap to unprocessed alternatives.
          </Text>
        </View>

        {/* ── Feature Highlights Grid ── */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: colors.border,
            padding: 16,
            gap: 10,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          {/* Feature 1: NOVA */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255, 149, 0, 0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={15} color="#FF9500" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>NOVA Processing Audit</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '500', marginTop: 0.5 }}>
                Decodes industrial food processing levels.
              </Text>
            </View>
          </View>

          {/* Feature 2: Nutri-Score */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(52, 199, 89, 0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={15} color="#34C759" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Nutri-Score Rating</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '500', marginTop: 0.5 }}>
                Provides A–E traffic light food quality grade.
              </Text>
            </View>
          </View>

          {/* Feature 3: Gut Shield */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255, 59, 48, 0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={15} color="#FF3B30" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Gut Shield Pro</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '500', marginTop: 0.5 }}>
                Flags barrier-eroding emulsifiers & gums.
              </Text>
            </View>
          </View>

          {/* Feature 4: Additive Detective */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(175, 82, 222, 0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={15} color="#AF52DE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Additive Detective</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '500', marginTop: 0.5 }}>
                Audits synthetic food dyes (Red 40) & preservatives.
              </Text>
            </View>
          </View>

          {/* Feature 5: Hidden Sugar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255, 204, 0, 0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="#FFCC00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Sugar & Hidden Sugar</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '500', marginTop: 0.5 }}>
                Unmasks hidden sugar teaspoon counts.
              </Text>
            </View>
          </View>

          {/* Feature 6: Smart Swaps */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(0, 122, 255, 0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={15} color="#007AFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Smart Swaps Engine</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '500', marginTop: 0.5 }}>
                Instantly matches unhealthy items with clean options.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Plan Selection Options ── */}
        <View style={{ gap: 10, marginBottom: 20 }}>
          {/* Monthly Pass Plan */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPlan('monthly');
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: selectedPlan === 'monthly' ? colors.success + '08' : colors.surfaceRaised,
              borderRadius: 18,
              borderWidth: selectedPlan === 'monthly' ? 2 : 1.5,
              borderColor: selectedPlan === 'monthly' ? colors.success : colors.border,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selectedPlan === 'monthly' ? colors.success : colors.textMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedPlan === 'monthly' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />}
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Monthly Pass</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 1 }}>Billed monthly • Flexible</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>$5.99</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>/ month</Text>
            </View>
          </TouchableOpacity>

          {/* Annual Pass Plan */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPlan('annual');
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: selectedPlan === 'annual' ? colors.success + '08' : colors.surfaceRaised,
              borderRadius: 18,
              borderWidth: selectedPlan === 'annual' ? 2 : 1.5,
              borderColor: selectedPlan === 'annual' ? colors.success : colors.border,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <View style={{
              position: 'absolute',
              top: 0,
              right: 16,
              backgroundColor: colors.success,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 }}>75% DISCOUNT</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selectedPlan === 'annual' ? colors.success : colors.textMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedPlan === 'annual' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />}
              </View>
              <View style={{ marginTop: 6 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Yearly Pass</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 1 }}>$1.50 / month • Billed yearly</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>$17.99</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>/ year</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Subscribe CTA Button ── */}
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={isProcessing}
          activeOpacity={0.9}
          style={{
            backgroundColor: isProcessing ? colors.success + 'AA' : colors.success,
            borderRadius: 20,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.success,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
              SUBSCRIBE NOW
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Apple Guidelines Subscription Disclosures & Policies ── */}
        <View style={{ marginTop: 24, gap: 10, borderTopWidth: 1.5, borderTopColor: colors.border, paddingTop: 16 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9.5, textAlign: 'center', lineHeight: 14 }}>
            Payment will be charged to your iTunes Account upon purchase confirmation. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Manage your subscription or turn off auto-renew in your iTunes Account Settings.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 }}>
            <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'We value your privacy. We secure all data and do not sell information.')}>
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Terms of Use (EULA)', 'Standard Apple EULA governs the use of this application.')}>
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' }}>
                Terms of Use (EULA)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRestore}>
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
