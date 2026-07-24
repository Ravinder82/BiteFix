import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/appStore';
import { OrbMascot } from '../components/features/OrbMascot';
import { MagicalBackground } from '../components/features/MagicalBackground';
import { ShieldCheck, RefreshCw, Search, ArrowRight, Check, X, Sparkles, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type PlanTier = 'weekly' | 'monthly' | 'annual';

export default function PaywallScreen() {
  const { colors, isDark } = useTheme();
  const { setPremium } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('weekly');

  const handleSubscribe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPremium(true);
    Alert.alert(
      'Premium Unlocked! ✨',
      'Welcome to BiteFix Premium. You now have full access to Gut Shield & Smart Swaps.',
      [{ text: 'Start Scanning', onPress: () => router.replace('/(tabs)') }]
    );
  };

  const handlePassToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  const handleRestore = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Purchase Restored',
      'Your premium subscription status has been successfully restored.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MagicalBackground />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
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

          {/* Pass to Home Screen UI Test button */}
          <TouchableOpacity
            onPress={handlePassToHome}
            style={{
              backgroundColor: colors.success + '15',
              borderWidth: 1.5,
              borderColor: colors.success,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ color: colors.success, fontSize: 12, fontWeight: '900' }}>
              Pass to Home Screen
            </Text>
            <ArrowRight size={14} color={colors.success} />
          </TouchableOpacity>
        </View>

        {/* ── Mascot & Title Banner ── */}
        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
            <OrbMascot state="happy" size={110} />
          </View>

          <View style={{
            backgroundColor: colors.success + '20',
            borderColor: colors.success + '60',
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            marginTop: 12,
            marginBottom: 8,
          }}>
            <Text style={{ color: colors.success, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
              B I T E F I X   P R E M I U M
            </Text>
          </View>

          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
            Your Ultimate Gut Shield
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4, maxWidth: 280 }}>
            Protect your microbiome and swap ultra-processed items for clean upgrades.
          </Text>
        </View>

        {/* ── Feature Highlights Card ── */}
        <View
          style={{
            backgroundColor: colors.surfaceRaised,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: colors.border,
            padding: 18,
            gap: 14,
            marginBottom: 24,
          }}
        >
          {/* Feature 1 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.success + '40' }}>
              <ShieldCheck size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Gut Shield Pro</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 1, lineHeight: 15 }}>
                Protect your mucosal lining. Audit emulsifiers like Carrageenan & Polysorbate 80.
              </Text>
            </View>
          </View>

          {/* Feature 2 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary + '40' }}>
              <RefreshCw size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Smart Swaps Engine</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 1, lineHeight: 15 }}>
                Convert ultra-processed NOVA 4 choices into clean, high-scoring upgrades.
              </Text>
            </View>
          </View>

          {/* Feature 3 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.secondary + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.secondary + '40' }}>
              <Search size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Additive Detective Cards</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 1, lineHeight: 15 }}>
                Automatic alerts for synthetic food dyes (Red 40), artificial sweeteners, & preservatives.
              </Text>
            </View>
          </View>

          {/* Feature 4: Nutri-Score, Sugar and Nova Score */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.success + '40' }}>
              <Sparkles size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Nutri-Score, Sugar & NOVA Grades</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 1, lineHeight: 15 }}>
                Full breakdown of A–E food quality, daily teaspoons limits, and industrial processing level.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Plan Selection Options ── */}
        <View style={{ gap: 10, marginBottom: 24 }}>
          {/* Weekly Pass Plan */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPlan('weekly');
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: selectedPlan === 'weekly' ? colors.success + '15' : colors.surfaceRaised,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: selectedPlan === 'weekly' ? colors.success : colors.border,
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
                  borderColor: selectedPlan === 'weekly' ? colors.success : colors.textMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedPlan === 'weekly' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />}
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Weekly Pass</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 1 }}>Billed weekly • Cancel anytime</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>$2.99</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>/ week</Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Pass Plan */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPlan('monthly');
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: selectedPlan === 'monthly' ? colors.success + '15' : colors.surfaceRaised,
              borderRadius: 18,
              borderWidth: 2,
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
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>$4.99</Text>
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
              backgroundColor: selectedPlan === 'annual' ? colors.success + '15' : colors.surfaceRaised,
              borderRadius: 18,
              borderWidth: 2,
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
              <Text style={{ color: '#FFFFFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 }}>BEST VALUE • SAVE 75%</Text>
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
              <View>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Annual Pass</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 1 }}>$3.33 / month • Billed yearly</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>$39.99</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>/ year</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Subscribe CTA Button ── */}
        <TouchableOpacity
          onPress={handleSubscribe}
          activeOpacity={0.9}
          style={{
            backgroundColor: colors.success,
            borderRadius: 20,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.success,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
            SUBSCRIBE NOW
          </Text>
        </TouchableOpacity>

        {/* ── Apple Guidelines Subscription Disclosures & Policies ── */}
        <View style={{ marginTop: 20, gap: 10, borderTopWidth: 1.5, borderTopColor: colors.border, paddingTop: 16 }}>
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
