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
import { ShieldCheck, RefreshCw, Search, ArrowRight, Check, X } from 'lucide-react-native';
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F19' }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Pass to Home Screen UI Test button */}
          <TouchableOpacity
            onPress={handlePassToHome}
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
              Pass to Home Screen
            </Text>
            <ArrowRight size={14} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* ── Mascot & Title Banner ── */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 140, height: 140 }}>
            <OrbMascot state="happy" size={120} />
          </View>

          <View style={{
            backgroundColor: '#10B98120',
            borderColor: '#10B98160',
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            marginTop: 12,
            marginBottom: 8,
          }}>
            <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
              B I T E F I X   P R E M I U M
            </Text>
          </View>

          <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
            Your Ultimate Gut Shield
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4, maxWidth: 280 }}>
            Protect your microbiome and swap ultra-processed items for clean upgrades.
          </Text>
        </View>

        {/* ── Feature Highlights Card ── */}
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            padding: 20,
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Feature 1 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#10B98120', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#10B98150' }}>
              <ShieldCheck size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>Gut Shield Pro</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 15 }}>
                Protect your mucosal lining. Audit emulsifiers like Carrageenan & Polysorbate 80.
              </Text>
            </View>
          </View>

          {/* Feature 2 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#6366F120', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6366F150' }}>
              <RefreshCw size={20} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>Smart Swaps Engine</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 15 }}>
                Convert ultra-processed NOVA 4 choices into clean, high-scoring upgrades.
              </Text>
            </View>
          </View>

          {/* Feature 3 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F59E0B20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F59E0B50' }}>
              <Search size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>Additive Detective Cards</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 15 }}>
                Automatic alerts for synthetic food dyes (Red 40), artificial sweeteners, & preservatives.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Plan Selection Options ── */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          {/* Weekly Pass Plan */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPlan('weekly');
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: selectedPlan === 'weekly' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: 20,
              borderWidth: 2,
              borderColor: selectedPlan === 'weekly' ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selectedPlan === 'weekly' ? '#10B981' : 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedPlan === 'weekly' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />}
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Weekly Pass</Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: '600', marginTop: 2 }}>Billed weekly • Cancel anytime</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>$2.99</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: '700' }}>/ week</Text>
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
              backgroundColor: selectedPlan === 'monthly' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: 20,
              borderWidth: 2,
              borderColor: selectedPlan === 'monthly' ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selectedPlan === 'monthly' ? '#10B981' : 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedPlan === 'monthly' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />}
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Monthly Pass</Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: '600', marginTop: 2 }}>Billed monthly • Flexible</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>$4.99</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: '700' }}>/ month</Text>
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
              backgroundColor: selectedPlan === 'annual' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: 20,
              borderWidth: 2,
              borderColor: selectedPlan === 'annual' ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
              padding: 16,
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
              backgroundColor: '#10B981',
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
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selectedPlan === 'annual' ? '#10B981' : 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedPlan === 'annual' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />}
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Annual Pass</Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: '600', marginTop: 2 }}>$3.33 / month • Billed yearly</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>$39.99</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: '700' }}>/ year</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Subscribe CTA Button ── */}
        <TouchableOpacity
          onPress={handleSubscribe}
          activeOpacity={0.9}
          style={{
            backgroundColor: '#10B981',
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 }}>
            SUBSCRIBE NOW
          </Text>
        </TouchableOpacity>

        {/* ── Terms & Privacy Footer ── */}
        <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, textAlign: 'center', marginTop: 16, lineHeight: 14 }}>
          No free trial. Recurring billing. Cancel anytime in App Store settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
