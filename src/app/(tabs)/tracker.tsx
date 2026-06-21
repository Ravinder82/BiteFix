import React, { useState, useEffect } from 'react';
import { View,  ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert } from 'react-native';
import { Text } from '@/components/Text';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { BloodSugarLog } from '../../types/app.types';
import { useTheme } from '../../hooks/useTheme';
import { BloodSugarChart } from '../../components/features/BloodSugarChart';
import { formatBloodSugarValue, getStatusColor, getStatusLabel } from '../../utils/bloodSugar';
import { Plus, Trash2, Tag, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function TrackerScreen() {
  const { colors, isDark } = useTheme();
  const { logs, addLog, deleteLog, unit } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [valueStr, setValueStr] = useState('');
  const [type, setType] = useState<'fasting' | 'post-meal'>('fasting');
  const [notes, setNotes] = useState('');

  // Animated shared value for collapsible form progress
  const formProgress = useSharedValue(0);

  useEffect(() => {
    formProgress.value = withTiming(showAddForm ? 1 : 0, {
      duration: 350,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [showAddForm]);

  const formAnimatedStyle = useAnimatedStyle(() => {
    // Form max height is roughly 390px.
    // Margin bottom animates up to 24px.
    return {
      height: formProgress.value * 390,
      opacity: formProgress.value,
      marginBottom: formProgress.value * 24,
      transform: [
        { translateY: (formProgress.value - 1) * 20 }
      ],
    };
  });

  const handleAddReading = () => {
    const readingValue = parseFloat(valueStr);
    if (isNaN(readingValue) || readingValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid blood sugar reading.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addLog(readingValue, type, notes.trim());

    // Clear inputs and toggle form
    setValueStr('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleDeleteLog = (id: string, value: number) => {
    Alert.alert(
      'Delete Log',
      `Are you sure you want to delete the reading of ${value} ${unit}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteLog(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header (Floating Pill) */}
      <View 
        style={{ 
          borderColor: colors.border, 
          borderWidth: 1.5,
          backgroundColor: colors.surface,
          borderRadius: 24,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.04,
          shadowRadius: 12,
          elevation: 4,
        }} 
        className="flex-row items-center justify-between px-5 py-3.5"
      >
        <View>
          <Text style={{ color: colors.text }} className="text-lg font-black tracking-tight">Blood Sugar Tracker</Text>
          <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold uppercase tracking-wider">Clinical Trends</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddForm(!showAddForm);
          }}
          style={{ backgroundColor: colors.primary }}
          className="flex-row items-center gap-1.5 py-2 px-4 rounded-full active:opacity-90 shadow-sm"
        >
          {showAddForm ? <ChevronUp size={14} color="white" /> : <Plus size={14} color="white" />}
          <Text className="text-white font-bold text-xs">{showAddForm ? 'Close' : 'Log'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Slide-down Input Form */}
        <AnimatedReanimated.View 
          style={[{ overflow: 'hidden' }, formAnimatedStyle]}
          pointerEvents={showAddForm ? 'auto' : 'none'}
        >
          <View 
            style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
            className="p-5 rounded-[28px] border shadow-sm"
          >
            <Text style={{ color: colors.text }} className="text-base font-black mb-4">New Sugar Reading</Text>
            
            {/* Input Value */}
            <View className="mb-4">
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider mb-2 px-1">Reading ({unit})</Text>
              <TextInput
                value={valueStr}
                onChangeText={setValueStr}
                keyboardType="numeric"
                placeholder={unit === 'mg/dL' ? 'e.g. 95' : 'e.g. 5.3'}
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                className="w-full p-4 rounded-2xl border font-black text-base"
              />
            </View>

            {/* Reading Type selector */}
            <View className="mb-4">
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider mb-2 px-1">State / Timing</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setType('fasting')}
                  style={{
                    backgroundColor: type === 'fasting' ? colors.primary : colors.background,
                    borderColor: type === 'fasting' ? colors.primary : colors.border,
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl border items-center active:opacity-95"
                >
                  <Text className={`font-bold text-xs ${type === 'fasting' ? 'text-white' : 'text-stone-700 dark:text-stone-300'}`}>
                    Fasting
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setType('post-meal')}
                  style={{
                    backgroundColor: type === 'post-meal' ? colors.primary : colors.background,
                    borderColor: type === 'post-meal' ? colors.primary : colors.border,
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl border items-center active:opacity-95"
                >
                  <Text className={`font-bold text-xs ${type === 'post-meal' ? 'text-white' : 'text-stone-700 dark:text-stone-300'}`}>
                    Post-Meal (2h)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Notes */}
            <View className="mb-6">
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider mb-2 px-1">Notes (Optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Morning wakeup, 2 hrs after lunch"
                placeholderTextColor={colors.textMuted}
                style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                className="w-full p-3.5 rounded-2xl border font-medium text-xs"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleAddReading}
              style={{ backgroundColor: colors.primary }}
              className="w-full py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-sm"
            >
              <Text className="text-white font-bold text-sm">Save Reading</Text>
            </TouchableOpacity>
          </View>
        </AnimatedReanimated.View>

        {/* SVG Analytics Chart */}
        <View className="mb-6">
          <BloodSugarChart logs={logs} />
        </View>

        {/* Medical ranges info helper */}
        <View 
          style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
          className="border p-5 rounded-[28px] shadow-sm mb-6 flex-row items-start gap-4"
        >
          <View style={{ backgroundColor: colors.secondary + '12' }} className="p-2.5 rounded-xl self-start">
            <Tag size={18} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.text }} className="font-bold text-sm">ADA Diagnostic Thresholds ({unit})</Text>
            <View className="flex-row justify-between mt-3 pr-2">
              <View>
                <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold uppercase">Fasting Target</Text>
                <Text style={{ color: colors.text }} className="text-xs mt-1">Normal: Under {unit === 'mg/dL' ? '100' : '5.6'}</Text>
                <Text style={{ color: colors.text }} className="text-xs">Pre-Diab: {unit === 'mg/dL' ? '100 - 125' : '5.6 - 6.9'}</Text>
                <Text style={{ color: colors.text }} className="text-xs">Diabetes: {unit === 'mg/dL' ? '126+' : '7.0+'}</Text>
              </View>
              <View>
                <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold uppercase">Post-Meal Target</Text>
                <Text style={{ color: colors.text }} className="text-xs mt-1">Normal: Under {unit === 'mg/dL' ? '140' : '7.8'}</Text>
                <Text style={{ color: colors.text }} className="text-xs">Pre-Diab: {unit === 'mg/dL' ? '140 - 199' : '7.8 - 11.0'}</Text>
                <Text style={{ color: colors.text }} className="text-xs">Diabetes: {unit === 'mg/dL' ? '200+' : '11.1+'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* History List */}
        <View className="mb-12">
          <Text style={{ color: colors.textSecondary }} className="font-black uppercase tracking-wider text-[10px] mb-3 px-1">Logs History</Text>
          {logs.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text style={{ color: colors.textMuted }} className="italic text-xs">No logs recorded yet</Text>
            </View>
          ) : (
            logs.map((log) => (
              <View
                key={log.id}
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                className="flex-row items-center justify-between border p-4 rounded-2xl mb-3 shadow-sm"
              >
                <View className="flex-row items-center gap-3">
                  {/* Status Circle indicator */}
                  <View style={{ backgroundColor: getPointColor(log.status) }} className="w-3 h-3 rounded-full" />
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text style={{ color: colors.text }} className="font-black text-base">
                        {formatBloodSugarValue(log.value, log.unit)}{' '}
                        <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">{log.unit}</Text>
                      </Text>
                      <View className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800">
                        <Text style={{ color: colors.textSecondary }} className="text-[8px] font-black uppercase">
                          {log.type === 'fasting' ? 'Fasting' : 'Post-Meal'}
                        </Text>
                      </View>
                    </View>
                    {log.notes ? (
                      <Text style={{ color: colors.textSecondary }} className="text-xs mt-1 font-medium">{log.notes}</Text>
                    ) : null}
                    <Text style={{ color: colors.textMuted }} className="text-[9px] mt-1">
                      {new Date(log.timestamp).toLocaleDateString()} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteLog(log.id, log.value)}
                  className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl active:opacity-85"
                >
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helpers
function getPointColor(status: BloodSugarLog['status']) {
  switch (status) {
    case 'low':
      return '#f97316';
    case 'normal':
      return '#10b981';
    case 'pre-diabetes':
      return '#eab308';
    case 'diabetes':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
}
