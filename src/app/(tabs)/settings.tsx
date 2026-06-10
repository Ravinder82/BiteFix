import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { ChevronRight, ArrowLeft, ShieldAlert, HeartHandshake, Eye, Moon, Layers, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { unit, setUnit, clearScans, clearAllData } = useAppStore();

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
      'Are you sure you want to clear your scanned food history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            clearScans();
            Alert.alert('Cleared', 'Scanned food history has been cleared.');
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
        <Text style={{ color: colors.text }} className="text-lg font-black tracking-tight">App Settings</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Version */}
        <View className="mb-16 items-center">
          <Text style={{ color: colors.textMuted }} className="text-[10px] font-black uppercase tracking-wider">GoodBye Sugar v1.0.0</Text>
          <Text style={{ color: colors.textMuted }} className="text-[9px] mt-0.5">First-Attempt App Store Approved</Text>
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
              className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full"
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
  return (
    <View className="mb-6">
      <Text style={{ color: colors.textSecondary }} className="font-black uppercase tracking-wider text-[9px] mb-2 px-1">{title}</Text>
      <View 
        style={{ borderColor: colors.border }} 
        className="rounded-[24px] overflow-hidden border shadow-sm"
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
      onPress={onPress}
      style={{ 
        backgroundColor: colors.surface,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border
      }}
      className="flex-row items-center justify-between p-4 active:bg-stone-50/50"
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
GoodBye Sugar collects blood sugar readings that you manually log in the application, along with your scan history. This information is saved locally on your device via AsyncStorage and SecureStore and is never shared, uploaded, or sold to third parties.

2. HEALTH DATA ENCRYPTION
Any logged sensitive data is processed locally on your hardware. We do not maintain remote cloud infrastructure to host your personal biological indexes.

3. YOUR RIGHTS
You have full access to view, edit, and delete your logs and scan records. You can use the "Clear Scan History" or "Reset App Data" actions to wipe all device state instantly.

4. THIRD PARTY SERVICE PROVIDERS
GoodBye Sugar uses the Open Food Facts API to query food ingredients. No personal identifiers or location statistics are sent to this database during search queries.

Contact: support@goodbyesugarapp.com`;

const TERMS_OF_SERVICE_TEXT = `Last Updated: June 2026

1. ACCEPTANCE
By installing and using the GoodBye Sugar mobile application, you agree to these Terms of Service.

2. MEDICAL DISCLAIMER
GoodBye Sugar is an informational scanner and blood sugar log tracker. It is NOT a medical device, nor does it replace professional diagnostic equipment, clinical consulting, or pharmaceutical advice. Always consult a healthcare specialist before making dietary modifications or acting on blood sugar logs.

3. PAYMENTS & SUBSCRIPTIONS
In-app subscription payments (if applicable) are governed by App Store and Play Store terms. Subscriptions automatically renew unless cancelled 24 hours before expiration.

4. USER REPRESENTATION
You agree to use this application in compliance with local laws and regulations.

Contact: legal@goodbyesugarapp.com`;

const EULA_TEXT = `Last Updated: June 2026

1. LICENSE GRANT
GoodBye Sugar grants you a personal, non-transferable, revocable license to run this mobile application on your personal device.

2. PROHIBITED USES
You may not reverse-engineer, distribute, or compile the source code or binary configurations of GoodBye Sugar.

3. WARRANTY AND LIABILITY
The application is provided "as is" without warranties of any kind. GoodBye Sugar is not liable for health modifications, inaccurate measurements, or device damage.

4. PLATFORM GOVERNING
This Agreement is fully compliant with Apple's Standard EULA terms and guidelines.

Contact: license@goodbyesugarapp.com`;
