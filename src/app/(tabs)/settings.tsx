import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Switch, Alert, Modal, SafeAreaView } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ChevronRight, ArrowLeft, ShieldAlert, HeartHandshake, Eye, Moon, Layers, RotateCcw, LogOut, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen({ onClose }: { onClose?: () => void }) {
  const { colors, theme, toggleTheme } = useTheme();
  const { unit, setUnit, sugarUnit, setSugarUnit, clearScans, clearAllData, userName, userGoal } = useAppStore();
  const { user, displayName, providerLabel, signOut, deleteAccount } = useAuth();

  const getGoalLabel = (goal?: string) => {
    switch (goal) {
      case 'energy': return 'Increase Energy';
      case 'weight': return 'Weight Management';
      case 'medical': return 'Medical Tracking';
      case 'mental': return 'Focus & Brain Health';
      default: return 'General Wellness';
    }
  };

  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalContent, setLegalContent] = useState({ title: '', body: '' });

  const showLegalDoc = (title: string, body: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLegalContent({ title, body });
    setLegalModalVisible(true);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will erase all your logged blood sugar readings and scanned food history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAllData();
            Alert.alert('Data Reset', 'All local data has been successfully cleared.');
          },
        },
      ]
    );
  };

  const handleClearScans = () => {
    Alert.alert(
      'Clear Scan History',
      'Are you sure you want to clear your scanned foods history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearScans();
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
        {onClose && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
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
                      backgroundColor: colors.primary + '10',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>
                      {getGoalLabel(userGoal)}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.border,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800' }}>
                      {providerLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

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

          <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }} className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3">
              <Layers size={16} color={colors.primary} />
              <Text style={{ color: colors.text }} className="font-bold text-sm">Blood Sugar Unit</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUnit('mg/dL');
                }}
                style={{
                  backgroundColor: unit === 'mg/dL' ? colors.primary + '15' : 'transparent',
                  borderColor: unit === 'mg/dL' ? colors.primary : colors.border,
                  borderWidth: 1
                }}
                className="py-1.5 px-3 rounded-xl active:opacity-85"
              >
                <Text style={{ color: unit === 'mg/dL' ? colors.primary : colors.textSecondary }} className="text-xs font-black">
                  mg/dL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUnit('mmol/L');
                }}
                style={{
                  backgroundColor: unit === 'mmol/L' ? colors.primary + '15' : 'transparent',
                  borderColor: unit === 'mmol/L' ? colors.primary : colors.border,
                  borderWidth: 1
                }}
                className="py-1.5 px-3 rounded-xl active:opacity-85"
              >
                <Text style={{ color: unit === 'mmol/L' ? colors.primary : colors.textSecondary }} className="text-xs font-black">
                  mmol/L
                </Text>
              </TouchableOpacity>
            </View>
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
          />
          <SettingsRowItem
            label="Reset App Data"
            icon={<RotateCcw size={16} color={colors.error} />}
            onPress={handleResetData}
            textColor="red"
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
                  'Are you sure you want to log out of CutSugar?',
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
          <Text style={{ color: colors.textMuted }} className="text-[10px] font-black uppercase tracking-wider">CutSugar v1.0.0</Text>

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
CutSugar collects blood sugar readings that you manually log in the application, along with your scan history. This information is saved locally on your device via AsyncStorage and SecureStore and is never shared, uploaded, or sold to third parties.

2. HEALTH DATA ENCRYPTION
Any logged sensitive data is processed locally on your hardware. We do not maintain remote cloud infrastructure to host your personal biological indexes.

3. YOUR RIGHTS
You have full access to view, edit, and delete your logs and scan records. You can use the "Clear Scan History" or "Reset App Data" actions to wipe all device state instantly.

4. THIRD PARTY SERVICE PROVIDERS
CutSugar uses the Open Food Facts API to query food ingredients. No personal identifiers or location statistics are sent to this database during search queries.

Contact: support@cutsugarapp.com`;

const TERMS_OF_SERVICE_TEXT = `Last Updated: June 2026

1. ACCEPTANCE
By installing and using the CutSugar mobile application, you agree to these Terms of Service.

2. MEDICAL DISCLAIMER
CutSugar is an informational scanner and blood sugar log tracker. It is NOT a medical device, nor does it replace professional diagnostic equipment, clinical consulting, or pharmaceutical advice. Always consult a healthcare specialist before making dietary modifications or acting on blood sugar logs.

3. PAYMENTS & SUBSCRIPTIONS
In-app subscription payments (if applicable) are governed by App Store and Play Store terms. Subscriptions automatically renew unless cancelled 24 hours before expiration.

4. USER REPRESENTATION
You agree to use this application in compliance with local laws and regulations.

Contact: legal@cutsugarapp.com`;

const EULA_TEXT = `Last Updated: June 2026

1. LICENSE GRANT
CutSugar grants you a personal, non-transferable, revocable license to run this mobile application on your personal device.

2. PROHIBITED USES
You may not reverse-engineer, distribute, or compile the source code or binary configurations of CutSugar.

3. WARRANTY AND LIABILITY
The application is provided "as is" without warranties of any kind. CutSugar is not liable for health modifications, inaccurate measurements, or device damage.

4. PLATFORM GOVERNING
This Agreement is fully compliant with Apple's Standard EULA terms and guidelines.

Contact: license@cutsugarapp.com`;
