import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Switch, Alert, Modal, SafeAreaView, Linking } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ChevronRight, ArrowLeft, ShieldAlert, HeartHandshake, Eye, Moon, Layers, RotateCcw, LogOut, User, ShieldCheck, Sparkles, Filter, CreditCard, Mail, MessageSquare, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getIapService } from '../../services/iapLoader';
import Constants from 'expo-constants';

export default function SettingsScreen({ onClose }: { onClose?: () => void }) {
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const { 
    sugarUnit, setSugarUnit, clearScans, clearAllData, userName, userGoal,
    allergenFilters, toggleAllergenFilter, strictNovaAlert, setStrictNovaAlert, stealthAdditivesAlert, setStealthAdditivesAlert, isPremium 
  } = useAppStore();
  const { user, displayName, providerLabel, signOut, deleteAccount } = useAuth();

  const getGoalLabel = (goal?: string) => {
    switch (goal) {
      case 'energy': return 'Increase Energy';
      case 'weight': return 'Weight Management';
      case 'mental': return 'Focus & Brain Health';
      default: return 'General Wellness';
    }
  };

  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [legalContent, setLegalContent] = useState({ title: '', body: '' });
  const [isRestoring, setIsRestoring] = useState(false);

  const showLegalDoc = (title: string, body: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLegalContent({ title, body });
    setLegalModalVisible(true);
  };

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
        Alert.alert('Restored Successfully ✅', 'Your BiteFix Premium subscription has been restored.');
      } else if (result.success) {
        Alert.alert('No Subscription Found', 'We could not find an active subscription for this Apple ID.');
      } else {
        Alert.alert('Restore Failed', result.error ?? 'Could not restore purchases. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'An error occurred while restoring purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL('https://apps.apple.com/account/subscriptions');
      if (supported) {
        await Linking.openURL('https://apps.apple.com/account/subscriptions');
      } else {
        setSubscriptionModalVisible(true);
      }
    } catch (err) {
      setSubscriptionModalVisible(true);
    }
  };

  const handleClearScans = () => {
    Alert.alert(
      'Clear Scan History',
      'Are you sure you want to clear all your scanned food history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAllData();
            Alert.alert('Scans Cleared', 'Your scan history has been successfully cleared.');
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
        {/* USER PROFILE SECTION */}
        {user && (
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {/* Avatar circle */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.primary + '30',
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '900' }}>
                  {(userName || displayName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, letterSpacing: -0.3 }}>
                  {userName || displayName}
                </Text>
                {user.email ? (
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500' }} numberOfLines={1}>
                    {user.email}
                  </Text>
                ) : null}
                <View className="flex-row items-center gap-1.5 mt-1">
                  <View
                    style={{
                      backgroundColor: colors.primary + '15',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                      {providerLabel.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* SUBSCRIPTION MANAGEMENT SECTION */}
        <SettingsGroup title="Subscription" colors={colors}>
          {!isPremium ? (
            <>
              <SettingsRowItem
                label="Upgrade to BiteFix Premium"
                icon={<Sparkles size={16} color={colors.primary} />}
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
            <>
              <SettingsRowItem
                label="BiteFix Premium Active ✅"
                icon={<ShieldCheck size={16} color="#10B981" />}
                onPress={() => router.push('/paywall')}
                colors={colors}
              />
              <SettingsRowItem
                label="Manage App Store Subscription"
                icon={<CreditCard size={16} color={colors.primary} />}
                onPress={handleManageSubscription}
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

        {/* FOOD QUALITY & INGREDIENT ALERTS SECTION */}
        <SettingsGroup title="Food Quality & Ingredient Alerts" colors={colors}>
          <View
            style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3 flex-1 mr-4">
              <ShieldCheck size={16} color={colors.primary} />
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-bold text-sm">Strict Processing Alerts</Text>
                <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">Flag heavily processed foods instantly</Text>
              </View>
            </View>
            <Switch
              value={strictNovaAlert}
              onValueChange={setStrictNovaAlert}
              trackColor={{ false: '#e2e8f0', true: colors.primary }}
              thumbColor={strictNovaAlert ? '#ffffff' : '#f4f4f5'}
            />
          </View>

          <View style={{ backgroundColor: colors.surface }} className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3 flex-1 mr-4">
              <Sparkles size={16} color="#FF9500" />
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-bold text-sm">Additive & Sweetener Alerts</Text>
                <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">Highlight artificial sweeteners and preservatives</Text>
              </View>
            </View>
            <Switch
              value={stealthAdditivesAlert}
              onValueChange={setStealthAdditivesAlert}
              trackColor={{ false: '#e2e8f0', true: colors.primary }}
              thumbColor={stealthAdditivesAlert ? '#ffffff' : '#f4f4f5'}
            />
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

        {/* SUPPORT & FEEDBACK SECTION */}
        <SettingsGroup title="Support & Feedback" colors={colors}>
          <SettingsRowItem
            label="Contact Support"
            icon={<Mail size={16} color={colors.primary} />}
            onPress={() => Linking.openURL('mailto:support@bitefixapp.com?subject=BiteFix%20Support%20Request')}
            colors={colors}
          />
          <SettingsRowItem
            label="Send App Feedback"
            icon={<MessageSquare size={16} color={colors.primary} />}
            onPress={() => Linking.openURL('mailto:feedback@bitefixapp.com?subject=BiteFix%20App%20Feedback')}
            colors={colors}
            isLast
          />
        </SettingsGroup>

        {/* COMPLIANCE & LEGAL SECTION */}
        <SettingsGroup title="Legal & Compliance" colors={colors}>
          <SettingsRowItem
            label="Privacy Policy"
            icon={<ShieldAlert size={16} color={colors.primary} />}
            onPress={() => showLegalDoc('Privacy Policy', PRIVACY_POLICY_TEXT)}
            colors={colors}
          />
          <SettingsRowItem
            label="Terms of Service"
            icon={<HeartHandshake size={16} color={colors.primary} />}
            onPress={() => showLegalDoc('Terms of Service', TERMS_OF_SERVICE_TEXT)}
            colors={colors}
          />
          <SettingsRowItem
            label="End User License Agreement (EULA)"
            icon={<Eye size={16} color={colors.primary} />}
            onPress={() => showLegalDoc('EULA', EULA_TEXT)}
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

        {/* ACCOUNT COMPLIANCE */}
        <SettingsGroup title="Account Actions" colors={colors}>
          <SettingsRowItem
            label="Delete Account"
            icon={<ShieldAlert size={16} color={colors.error} />}
            onPress={() => router.push('/delete-account')}
            textColor="red"
            colors={colors}
            isLast
          />
        </SettingsGroup>

        {/* LOG OUT */}
        {user && (
          <SettingsGroup title="Session" colors={colors}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Log Out',
                  'Are you sure you want to log out of BiteFix?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Log Out',
                      style: 'destructive',
                      onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        try {
                          await signOut();
                        } catch (e) {
                          Alert.alert('Error', 'Failed to log out. Please try again.');
                        }
                      },
                    },
                  ]
                );
              }}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.error + '30',
              }}
              className="flex-row items-center justify-center gap-2 p-4"
            >
              <LogOut size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontWeight: '800', fontSize: 14 }}>Log Out</Text>
            </TouchableOpacity>
          </SettingsGroup>
        )}

        {/* Version */}
        <View className="mb-16 items-center">
          <Text style={{ color: colors.textMuted }} className="text-[10px] font-black uppercase tracking-wider">
            BiteFix v{Constants.expoConfig?.version ?? '2.0.0'}
          </Text>
        </View>
      </ScrollView>

      {/* LEGAL VIEWER MODAL */}
      <Modal visible={legalModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}
            className="flex-row items-center justify-between px-6 py-4"
          >
            <TouchableOpacity
              onPress={() => setLegalModalVisible(false)}
              style={{ backgroundColor: colors.surfaceRaised }}
              className="p-2 rounded-full"
            >
              <ArrowLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-base font-black">{legalContent.title}</Text>
            <View className="w-8" />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} className="flex-1">
            <Text style={{ color: colors.textSecondary }} className="font-medium text-xs leading-relaxed mb-12">
              {legalContent.body}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* EDIT SUBSCRIPTION MODAL */}
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
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>Edit Subscription</Text>
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
            {/* Main Subscription Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
                gap: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.2 : 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Product Header Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={24} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.3 }}>
                    BiteFix: Food & Swap Scanner
                  </Text>
                </View>
              </View>

              {/* Tier Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                  BiteFix Monthly
                </Text>
                <TouchableOpacity onPress={() => {
                  setSubscriptionModalVisible(false);
                  router.push('/paywall');
                }}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                    {"See All Plans >"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Price Details */}
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    ₹599 per month
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    Renews 28 July
                  </Text>
                </View>
              </View>
            </View>

            {/* Cancel Action Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.1 : 0.02,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Linking.openURL('https://apps.apple.com/account/subscriptions');
                }}
                activeOpacity={0.85}
                style={{
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.error, fontSize: 14, fontWeight: '800' }}>
                  Cancel Subscription
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', padding: 16, borderRadius: 16, marginTop: 4 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 4 }}>Don't want auto-renewal?</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                You can purchase Lifetime Access to pay once and never worry about subscriptions again.
              </Text>
              <TouchableOpacity onPress={() => {
                setSubscriptionModalVisible(false);
                router.push('/paywall');
              }} style={{ marginTop: 12, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
                 <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>Get Lifetime Access</Text>
              </TouchableOpacity>
            </View>

            {/* RESTORE PURCHASES AND ABOUT LINKS CONTAINER */}
            <View style={{ alignItems: 'center', marginTop: 12, gap: 12 }}>
              {/* Restore Purchases Link */}
              <TouchableOpacity
                onPress={async () => {
                  setSubscriptionModalVisible(false);
                  await handleRestorePurchases();
                }}
                style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', borderRadius: 20, width: '100%', alignItems: 'center' }}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>

              {/* About Link */}
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Subscriptions and Privacy',
                    'BiteFix subscriptions are managed safely via App Store Connect. Your personal and billing data remains private.'
                  );
                }}
                style={{ paddingVertical: 4 }}
              >
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' }}>
                  About Subscriptions and Privacy
                </Text>
              </TouchableOpacity>
            </View>
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

// LEGAL DOCUMENTS PLAIN TEXT (For local compliance viewing)
const PRIVACY_POLICY_TEXT = `Last Updated: June 2026

1. INFORMATION WE COLLECT
BiteFix collects your food scan history. This information is saved locally on your device via AsyncStorage and SecureStore and is never shared, uploaded, or sold to third parties.

2. HEALTH DATA ENCRYPTION
Any scanned history data is processed locally on your hardware. We do not maintain remote cloud infrastructure.

3. YOUR RIGHTS
You have full access to view and delete your scan records. You can use the "Clear Scan History" or "Reset App Data" actions to wipe all device state instantly.

4. THIRD PARTY SERVICE PROVIDERS
BiteFix uses the Open Food Facts API to query food ingredients. No personal identifiers or location statistics are sent to this database during search queries.

Contact: support@bitefixapp.com`;

const TERMS_OF_SERVICE_TEXT = `Last Updated: June 2026

1. ACCEPTANCE
By installing and using the BiteFix mobile application, you agree to these Terms of Service.

2. MEDICAL DISCLAIMER
BiteFix is an informational food processing and ingredient transparency scanner. It is NOT a medical device, nor does it replace professional diagnostic equipment, clinical consulting, or pharmaceutical advice. Always consult a healthcare specialist before making dietary modifications.

3. PAYMENTS & SUBSCRIPTIONS
In-app subscription payments (if applicable) are governed by App Store and Play Store terms. Subscriptions automatically renew unless cancelled 24 hours before expiration.

4. USER REPRESENTATION
You agree to use this application in compliance with local laws and regulations.

Contact: legal@bitefixapp.com`;

const EULA_TEXT = `Last Updated: June 2026

1. LICENSE GRANT
BiteFix grants you a personal, non-transferable, revocable license to run this mobile application on your personal device.

2. PROHIBITED USES
You may not reverse-engineer, distribute, or compile the source code or binary configurations of BiteFix.

3. WARRANTY AND LIABILITY
The application is provided "as is" without warranties of any kind. BiteFix is not liable for health modifications, inaccurate measurements, or device damage.

4. PLATFORM GOVERNING
This Agreement is fully compliant with Apple's Standard EULA terms and guidelines.

Contact: license@bitefixapp.com`;
