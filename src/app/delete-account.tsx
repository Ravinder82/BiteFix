import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import { Trash2, ShieldAlert, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const { clearAllData } = useAppStore();
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    if (confirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm account deletion.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Clear all persistent data from store
    clearAllData();

    Alert.alert(
      'Account Deleted',
      'Your account and all associated data have been permanently deleted from this device.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Send back to onboarding
            router.replace('/onboarding');
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
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full mr-4 active:opacity-85"
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text }} className="text-base font-black">Delete Account</Text>
      </View>

      <View className="flex-1 p-6 justify-between">
        <View>
          {/* Warning Card */}
          <View 
            style={{ backgroundColor: colors.error + '10', borderColor: colors.error + '30' }} 
            className="border p-5 rounded-[28px] flex-row gap-4 mb-6"
          >
            <ShieldAlert size={24} color={colors.error} className="self-start mt-0.5" />
            <View className="flex-1">
              <Text style={{ color: colors.error }} className="font-bold text-sm">Permanent Action</Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs mt-1.5 leading-relaxed">
                Deleting your account is permanent. All of your historical logs, scanned foods, custom thresholds, and settings will be permanently erased from this device.
              </Text>
            </View>
          </View>

          <Text style={{ color: colors.textSecondary }} className="text-xs mb-6 leading-relaxed px-1">
            To confirm that you want to delete your account and clear all local databases, please type <Text style={{ color: colors.text }} className="font-black">DELETE</Text> in the input field below.
          </Text>

          <View className="mb-4">
            <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider mb-2 px-1">Confirmation Code</Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type DELETE"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
              className="w-full p-4 rounded-2xl border font-bold text-sm"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={confirmText !== 'DELETE'}
          style={{ backgroundColor: confirmText === 'DELETE' ? colors.error : colors.border }}
          className="w-full py-4 rounded-2xl flex-row items-center justify-center mb-6 active:opacity-90 shadow-sm"
        >
          <Trash2 size={16} color="white" className="mr-2" />
          <Text className="text-white font-bold text-sm">Delete My Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

