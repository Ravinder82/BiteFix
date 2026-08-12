import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Switch, Alert, Modal, SafeAreaView, Linking, Platform } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { ChevronRight, ArrowLeft, ShieldAlert, HeartHandshake, Eye, Moon, Layers, RotateCcw, LogOut, ShieldCheck, Crown, CreditCard, Mail, MessageSquare, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getIapService } from '../../services/iapLoader';
import Constants from 'expo-constants';

export default function SettingsScreen({ onClose }: { onClose?: () => void }) {
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const { 
    sugarUnit, setSugarUnit, clearCollection, clearAllData,
    allergenFilters, toggleAllergenFilter, strictNovaAlert, setStrictNovaAlert, stealthAdditivesAlert, setStealthAdditivesAlert, isPremium 
  } = useAppStore();

  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [subDetails, setSubDetails] = useState<{ planType: string; purchaseDate: string; autoRenew: boolean } | null>(null);

  useEffect(() => {
    if (isPremium) {
      getIapService().then(async (service) => {
        if (service) {
          const details = await service.getActiveSubscriptionDetails();
          setSubDetails(details);
        }
      });
    }
  }, [isPremium]);

  const handleRestorePurchases = async () => {
    if (isRestoring) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRestoring(true);
    try {
      const service = await getIapService();
      if (!service) {
        Alert.alert('Store Unavailable', 'Unable to load the App Store purchase system. Please restart the app and try again.');
        return;
      }

      const result = await service.restorePurchases();
      if (result.isEntitled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Restored Successfully ✅',
          'Your BiteFix Premium subscription has been restored.',
          [{
            text: 'Continue',
            onPress: () => {
              // If user was gated on paywall, navigate them into the app
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            },
          }]
        );
      } else if (result.success) {
        Alert.alert(
          'No Subscription Found',
          'We could not find an active subscription linked to this Apple ID.\n\nIf you purchased on a different Apple ID, sign in to that account in App Store settings and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Restore Failed', result.error ?? 'Could not restore purchases. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'An error occurred while restoring purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Opens the App Store subscription management page directly.
  // Falls back to the in-app info modal only when the deep-link is truly
  // not openable (very rare edge case on locked-down enterprise devices).
  const handleManageSubscription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = 'https://apps.apple.com/account/subscriptions';
    try {
      await Linking.openURL(url);
    } catch {
      // Deep-link failed — show the informational fallback modal
      setSubscriptionModalVisible(true);
    }
  };

  const handleClearScans = () => {
    Alert.alert(
      'Clear Scan History & Home Data',
      'Are you sure you want to clear all your scanned food history and saved home tab items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearCollection();
            Alert.alert('Data Cleared', 'Your home screen data has been successfully cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}
        className="flex-row items-center px-6 py-4"
      >
        {(onClose || router.canGoBack()) && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onClose) {
                onClose();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            style={{ backgroundColor: colors.surfaceRaised }}
            className="mr-3 p-2 rounded-full"
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={{ color: colors.text }} className="text-lg font-black tracking-tight">App Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* USER PROFILE SECTION REMOVED */}

        {/* SUBSCRIPTION MANAGEMENT SECTION */}
        <SettingsGroup title="Subscription" colors={colors}>
          {!isPremium ? (
            <>
              <SettingsRowItem
                label="Upgrade to BiteFix Premium"
                icon={<Crown size={16} color={colors.primary} />}
                onPress={() => router.push('/paywall')}
                colors={colors}
              />
              <SettingsRowItem
                label="Restore Purchases"
                icon={<RotateCcw size={16} color={colors.textSecondary} />}
                onPress={handleRestorePurchases}
                colors={colors}
                isLast
              />
            </>
          ) : (
            <View style={{ backgroundColor: colors.surface, padding: 18 }} className="gap-3">
              <View className="flex-row items-center justify-between pb-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View className="flex-row items-center gap-2">
                  <ShieldCheck size={20} color="#10B981" />
                  <Text style={{ color: colors.text }} className="font-extrabold text-base">BiteFix Premium</Text>
                </View>
                <View style={{ backgroundColor: '#10B98115', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#10B981' }} className="text-[10px] font-black uppercase tracking-wide">Active</Text>
                </View>
              </View>

              <View className="gap-2.5 my-1">
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">Plan Tier</Text>
                  <Text style={{ color: colors.text }} className="text-xs font-bold">{subDetails?.planType ?? 'Yearly'} Access</Text>
                </View>
                
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">Purchase Date</Text>
                  <Text style={{ color: colors.text }} className="text-xs font-bold">{subDetails?.purchaseDate ?? '-'}</Text>
                </View>

                <View className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">Auto-Renewal</Text>
                  <Text style={{ color: '#10B981' }} className="text-xs font-bold">Active</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleManageSubscription}
                activeOpacity={0.88}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <Text style={{ color: '#FFF' }} className="text-xs font-extrabold">Manage Subscription</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleRestorePurchases}
                activeOpacity={0.7}
                style={{
                  alignItems: 'center',
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">Sync & Restore Purchases</Text>
              </TouchableOpacity>
            </View>
          )}
        </SettingsGroup>

        {/* PREFERENCES SECTION */}
        <SettingsGroup title="Preferences" colors={colors}>
          <View
            style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <Moon size={16} color={colors.primary} />
              <Text style={{ color: colors.text }} className="font-bold text-sm">Dark Theme</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e2e8f0', true: colors.primary }}
              thumbColor={theme === 'dark' ? '#ffffff' : '#f4f4f5'}
            />
          </View>

          <View style={{ backgroundColor: colors.surface }} className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3">
              <Layers size={16} color={colors.primary} />
              <Text style={{ color: colors.text }} className="font-bold text-sm">Product Sugar Unit</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSugarUnit('g');
                }}
                style={{
                  backgroundColor: sugarUnit === 'g' ? colors.primary + '15' : 'transparent',
                  borderColor: sugarUnit === 'g' ? colors.primary : colors.border,
                  borderWidth: 1
                }}
                className="py-1.5 px-3 rounded-xl active:opacity-85"
              >
                <Text style={{ color: sugarUnit === 'g' ? colors.primary : colors.textSecondary }} className="text-xs font-black">
                  g
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSugarUnit('oz');
                }}
                style={{
                  backgroundColor: sugarUnit === 'oz' ? colors.primary + '15' : 'transparent',
                  borderColor: sugarUnit === 'oz' ? colors.primary : colors.border,
                  borderWidth: 1
                }}
                className="py-1.5 px-3 rounded-xl active:opacity-85"
              >
                <Text style={{ color: sugarUnit === 'oz' ? colors.primary : colors.textSecondary }} className="text-xs font-black">
                  oz
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SettingsGroup>


        {/* PERSONAL ALLERGEN ALERTS SECTION */}
        <SettingsGroup title="Personal Allergen Alerts" colors={colors}>
          <View style={{ backgroundColor: colors.surface, padding: 16 }}>
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold mb-3">
              Select ingredients to trigger high-priority red shields when scanned:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {['Gluten', 'Dairy', 'Soy', 'Nuts', 'Eggs', 'Artificial Sweeteners', 'Palm Oil'].map((allergen) => {
                const isSelected = allergenFilters.includes(allergen);
                return (
                  <TouchableOpacity
                    key={allergen}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleAllergenFilter(allergen);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 14,
                      backgroundColor: isSelected ? colors.error + '18' : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                      borderWidth: 1,
                      borderColor: isSelected ? colors.error : colors.border,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? colors.error : colors.text,
                      fontSize: 12,
                      fontWeight: isSelected ? '900' : '700',
                    }}>
                      {isSelected ? `🚨 ${allergen}` : allergen}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SettingsGroup>

        {/* SUPPORT & LEGAL SECTION */}
        <SettingsGroup title="Support & Legal" colors={colors}>
          <SettingsRowItem
            label="Support"
            icon={<Mail size={16} color={colors.primary} />}
            onPress={() => setSupportModalVisible(true)}
            colors={colors}
          />
          <SettingsRowItem
            label="Privacy Policy"
            icon={<ShieldAlert size={16} color={colors.primary} />}
            onPress={() => setPrivacyModalVisible(true)}
            colors={colors}
          />
          <SettingsRowItem
            label="Data Attribution & Licenses"
            icon={<Info size={16} color={colors.primary} />}
            onPress={() => {
              Alert.alert(
                'Open Food Facts Attribution',
                'Product and nutrition data is powered by Open Food Facts, made available under the Open Database License (ODbL) at openfoodfacts.org.\n\nThank you to the contributors who support open public databases!',
                [{ text: 'OK' }, { text: 'Visit Website', onPress: () => Linking.openURL('https://openfoodfacts.org') }]
              );
            }}
            colors={colors}
          />
          <SettingsRowItem
            label="Terms of Service"
            icon={<Eye size={16} color={colors.primary} />}
            onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
            colors={colors}
            isLast
          />
        </SettingsGroup>

        {/* DATA MANAGEMENT */}
        <SettingsGroup title="Data Management" colors={colors}>
          <SettingsRowItem
            label="Clear Scan History"
            icon={<RotateCcw size={16} color={colors.secondary} />}
            onPress={handleClearScans}
            colors={colors}
            isLast
          />
        </SettingsGroup>

        {/* ACCOUNT COMPLIANCE REMOVED */}
        {/* Version */}
        <View className="mb-16 items-center">
          <Text style={{ color: colors.textMuted }} className="text-[10px] font-black uppercase tracking-wider">
            BiteFix v{Constants.expoConfig?.version ?? '2.0.0'}
          </Text>
        </View>
      </ScrollView>



      {/* SUBSCRIPTION INFO MODAL — shown only when the App Store deep-link fails */}
      {/* Primary action is always "Open App Store Subscriptions" */}
      <Modal visible={subscriptionModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSubscriptionModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingVertical: 16,
            }}
          >
            <View style={{ width: 64 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>Manage Subscription</Text>
            <TouchableOpacity
              onPress={() => setSubscriptionModalVisible(false)}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} style={{ flex: 1 }}>

            {/* ── Info Banner ────────────────────────────────── */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F0FDF4',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#BBF7D0',
                padding: 20,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Crown size={20} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.3 }}>
                    BiteFix Premium Active ✅
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
                    Subscription managed by Apple
                  </Text>
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#D1FAE5', paddingTop: 10 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 17 }}>
                  Your subscription billing, renewal dates, and pricing are managed directly by Apple through your App Store account.
                  To view exact renewal dates or pricing, open App Store Subscriptions.
                </Text>
              </View>
            </View>

            {/* ── Primary Action: Open App Store ──────────────── */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSubscriptionModalVisible(false);
                Linking.openURL('https://apps.apple.com/account/subscriptions');
              }}
              activeOpacity={0.88}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 18,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 }}>
                Open App Store Subscriptions
              </Text>
            </TouchableOpacity>

            {/* ── Cancel Subscription guidance ────────────────── */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#FFF5F5',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FCA5A5',
                padding: 16,
                gap: 6,
              }}
            >
              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '800' }}>Want to cancel auto-renewal?</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 17 }}>
                Tap "Open App Store Subscriptions" above → select BiteFix → tap "Cancel Subscription".
                You will keep access until the end of your current billing period.
              </Text>
            </View>

            {/* ── Auto-renewal notice (Apple required) ─────────── */}
            <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', padding: 14, borderRadius: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Info size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 }}>Auto-Renewal</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 17 }}>
                Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
                Manage or turn off auto-renewal in your App Store account settings at any time.
              </Text>
            </View>

            {/* ── Restore Purchases ───────────────────────────── */}
            <TouchableOpacity
              onPress={async () => {
                setSubscriptionModalVisible(false);
                await handleRestorePurchases();
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                borderRadius: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                Restore Purchases
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Support & Feedback Modal ───────────────────────── */}
      <Modal visible={supportModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between p-4 border-b" style={{ borderBottomColor: colors.border, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.text }} className="font-extrabold text-lg">Support</Text>
            <TouchableOpacity onPress={() => setSupportModalVisible(false)} className="p-2 rounded-full" style={{ backgroundColor: colors.surfaceRaised }}>
              <Text style={{ color: colors.textMuted }} className="font-bold text-xs">CLOSE</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <View className="items-center mb-4">
              <Mail size={48} color={colors.primary} />
              <Text style={{ color: colors.text }} className="font-extrabold text-xl mt-4 text-center">BiteFix Support</Text>
              <Text style={{ color: colors.textSecondary }} className="text-center mt-2 leading-relaxed">
                Need assistance with subscriptions, barcode scans, or account options?
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-center mt-2 leading-relaxed">
                Have an idea for NOVA classification, additive detection, or allergen filters?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const version = Constants.expoConfig?.version || '1.0.0';
                const os = Platform.OS;
                const subject = encodeURIComponent('BiteFix Support Request');
                const body = encodeURIComponent(`Please describe your issue or question below:\n\n\n\n---\nApp Version: ${version}\nPlatform: ${os}`);
                Linking.openURL(`mailto:bitefixapp@gmail.com?subject=${subject}&body=${body}`);
              }}
              style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
            >
              <HeartHandshake size={20} color="#FFF" />
              <Text style={{ color: '#FFF' }} className="font-extrabold text-sm">Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const subject = encodeURIComponent('BiteFix App Feedback');
                const body = encodeURIComponent('Share your thoughts, feature requests, or additive detective ideas below:\n\n');
                Linking.openURL(`mailto:bitefixapp@gmail.com?subject=${subject}&body=${body}`);
              }}
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
            >
              <MessageSquare size={20} color={colors.text} />
              <Text style={{ color: colors.text }} className="font-bold text-sm">Send App Feedback</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Privacy Policy Modal ───────────────────────────── */}
      <Modal visible={privacyModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between p-4 border-b" style={{ borderBottomColor: colors.border, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.text }} className="font-extrabold text-lg">Privacy Policy</Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)} className="p-2 rounded-full" style={{ backgroundColor: colors.surfaceRaised }}>
              <Text style={{ color: colors.textMuted }} className="font-bold text-xs">CLOSE</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>Privacy Policy for BiteFix</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>Effective Date: June 1, 2026 | Last Updated: July 28, 2026</Text>
            
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              BiteFix ("we," "our," or "us") operates the BiteFix mobile application. This Privacy Policy explains how we handle your information when you use our application.
            </Text>

            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 }}>1. Privacy-First Architecture</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              BiteFix is built with privacy at its core. Your scan history, custom allergen choices, and food goals are stored locally on your device using encrypted storage and are never sold or shared with third parties.
            </Text>

            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 }}>2. Third-Party API Queries</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              When you scan a product barcode, the application sends only the numeric barcode string (e.g., 0123456789) to the Open Food Facts public database to retrieve ingredient and nutrition labels. No personal data, location coordinates, or account information are transmitted.
            </Text>

            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 }}>3. In-App Purchases</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              Subscriptions are processed through Apple's native StoreKit billing system. We do not store or process your financial payment details.
            </Text>

            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 }}>4. Data Retention and Deletion</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              BiteFix operates purely locally and does not utilize online user accounts. You can instantly erase all your saved data at any time directly inside the app via Settings &gt; Clear All Data.
            </Text>

            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12 }}>5. Contact Us</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }}>
              If you have any questions regarding this policy, contact us at bitefixapp@gmail.com.
            </Text>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://ravinder82.github.io/BiteFix/privacy.html')}
              style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 }}
            >
              <Eye size={20} color="#FFF" />
              <Text style={{ color: '#FFF' }} className="font-extrabold text-sm">View Policy Online</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Internal Settings Helpers
function SettingsGroup({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  const isDarkMode = colors.background === '#000000';
  return (
    <View className="mb-6">
      <Text style={{ color: colors.textSecondary }} className="font-black uppercase tracking-wider text-[9px] mb-2 px-1">{title}</Text>
      <View
        style={{
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.35 : 0.03,
          shadowRadius: 8,
          elevation: 1,
        }}
        className="rounded-[24px] overflow-hidden border"
      >
        {children}
      </View>
    </View>
  );
}

interface RowProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  textColor?: 'normal' | 'red';
  colors: any;
  isLast?: boolean;
}

function SettingsRowItem({ label, icon, onPress, textColor = 'normal', colors, isLast = false }: RowProps) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border
      }}
      className="flex-row items-center justify-between p-4 active:opacity-75"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text style={{ color: textColor === 'red' ? colors.error : colors.text }} className="font-bold text-sm">
          {label}
        </Text>
      </View>
      <ChevronRight size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

