import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, PanResponder, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Text';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AnimatedReanimated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import { ScanBarcode, Activity, ArrowRight, Info, Sparkles, Trash2, Clock, X, AlertTriangle, Menu, HelpCircle, Flame, Zap, ArrowUpRight, TrendingUp } from 'lucide-react-native';
import { formatBloodSugarValue, getStatusColor, getStatusLabel } from '../../utils/bloodSugar';
import SettingsScreen from './settings';
import * as Haptics from 'expo-haptics';
import { ScanHistoryItem } from '../../types/app.types';
const formatGroupDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  }
};


export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { logs, scans, deleteScan, clearScans, userName } = useAppStore();
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Animated shine coordinate for the CTA button
  const shineX = useSharedValue(-220);

  useEffect(() => {
    shineX.value = withRepeat(
      withSequence(
        withTiming(450, { duration: 1600, easing: Easing.linear }),
        withDelay(2200, withTiming(-220, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  // Animated value and PanResponder for drag/swipe down to close gesture
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Active gesture only on downward vertical drag
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          // Slide down completely and close modal
          Animated.timing(panY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSelectedScan(null);
            panY.setValue(0);
          });
        } else {
          // Bounce back to top position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;



  const latestLog = logs[0];
  const latestScan = scans[0];

  // --- Bento Grid Logic ---
  const getLatestActiveScans = () => {
    const todayStr = new Date().toDateString();

    if (scans.length === 0) {
      return { dateStr: 'Today', items: [], isEmpty: true };
    }

    // Filter scans to ONLY include today's items. 
    // This prevents the dashboard from falling back to yesterday's data 
    // if the user deletes all of today's history items.
    const activeScans = scans.filter(scan => new Date(scan.timestamp).toDateString() === todayStr);

    if (activeScans.length === 0) {
      return { dateStr: 'Today', items: [], isEmpty: true };
    }

    return { dateStr: 'Today', items: activeScans, isEmpty: false };
  };

  const activeDayInfo = getLatestActiveScans();

  const totalSugar = activeDayInfo.items.reduce((sum, item) => sum + item.sugarGrams, 0);

  // 1. Total Daily Intake (Serving Size)
  const sumTotalPackagesCalories = activeDayInfo.items.reduce((sum, item) => sum + (item.calories ?? 0), 0);
  const tpRunTimeMinutes = Math.round(sumTotalPackagesCalories / 11);
  const tpRunHours = Math.floor(tpRunTimeMinutes / 60);
  const tpRunMins = tpRunTimeMinutes % 60;

  // 2. Latest Scanned Item (Per Serving)
  const latestScanItem = activeDayInfo.items.length > 0 ? activeDayInfo.items[0] : null;
  const lsCalories = latestScanItem ? (latestScanItem.calories ?? latestScanItem.totalCalories ?? 0) : 0;
  const lsRunTimeMinutes = Math.round(lsCalories / 11);
  const lsRunHours = Math.floor(lsRunTimeMinutes / 60);
  const lsRunMins = lsRunTimeMinutes % 60;



  const sortedBySugar = [...activeDayInfo.items].sort((a, b) => {
    const aVal = a.sugarPer100g ?? a.sugarGrams;
    const bVal = b.sugarPer100g ?? b.sugarGrams;
    return aVal - bVal;
  });
  const cleanChoice = sortedBySugar[0];
  const sugarSpiker = sortedBySugar[sortedBySugar.length - 1];

  const totalScansForActiveDay = activeDayInfo.items.length;
  // --- End Bento Grid Logic ---

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Premium Custom Header (Floating Pill) */}
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
        <View className="flex-row items-center gap-3">
          {/* Cute Miniature Mascot Logo */}
          <Mascot state="idle" size={36} />
          <View>
            <Text
              style={{ color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.6 }}
            >
              GoodBye Sugar
            </Text>
            <Text
              style={{ color: colors.primary, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6 }}
            >
              SUGAR SCANNER
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSettingsVisible(true);
          }}
          style={{ backgroundColor: colors.surfaceRaised }}
          className="p-2 active:opacity-80 rounded-full"
        >
          <Menu size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card (Premium Liquid Glass) */}
        <View
          style={{
            borderRadius: 40,
            overflow: 'hidden',
            marginBottom: 24,
            borderWidth: 2,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(253, 252, 252, 0.06)',
          }}
        >
          {/* Base Background for depth */}
          <LinearGradient
            colors={isDark ? ['#000000ff', '#000000ff'] : ['#ffffffff', '#ffffffff']}
            style={StyleSheet.absoluteFill}
          />

          <BlurView
            intensity={isDark ? 30 : 60}
            tint={isDark ? "dark" : "light"}
            style={{
              padding: 24,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Top: Blogpost Style Text & Mascot */}
            <View className="flex-row items-center w-full mb-6">
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text
                  style={{ color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 }}
                >
                  {userName ? `WELCOME, ${userName.toUpperCase()}` : 'WELCOME BACK'}
                </Text>
                <View style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, alignSelf: 'flex-start' }}>
                  <Text style={{ color: colors.text, fontSize: 12, lineHeight: 20, fontWeight: '700' }}>
                    <Text style={{ color: colors.text, fontWeight: '900' }}>WHO Standard:</Text>
                    {'\n'}1 Teaspoon is equal to 4.2 gms of Sugar
                  </Text>
                </View>
              </View>

              <AnimatedReanimated.View
                entering={FadeInDown.duration(600).springify()}
                style={{ alignItems: 'center', zIndex: 10 }}
              >
                <Mascot state={totalSugar > 25 ? 'shocked' : 'happy'} size={120} />
              </AnimatedReanimated.View>
            </View>

            {/* Bottom: Sugar Consumed & Latest Blood Sugar Side-by-Side */}
            {/* Unified Floating Dashboard Layout */}
            <View style={{ width: '100%', marginTop: 8 }}>

              {/* Daily Sugar Tracker Section (Floating) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                {/* Left Side: Circular Ring (Enlarged) */}
                <View className="items-center justify-center relative" style={{ width: 104, height: 104 }}>
                  <View style={{ width: 104, height: 104, borderRadius: 52, borderWidth: 10, borderColor: colors.border, position: 'absolute' }} />
                  <View style={{
                    width: 104,
                    height: 104,
                    borderRadius: 52,
                    borderWidth: 11,
                    borderColor: activeDayInfo.isEmpty ? colors.border : (totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759')),
                    position: 'absolute',
                    borderLeftColor: 'transparent',
                    borderBottomColor: 'transparent',
                    transform: [{ rotate: '45deg' }]
                  }} />

                  <View className="items-center justify-center">
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
                      {activeDayInfo.isEmpty ? '0' : (totalSugar / 4.2).toFixed(1)}<Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>tsp</Text>
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', marginTop: 1 }}>
                      {activeDayInfo.isEmpty ? '0' : totalSugar.toFixed(0)}g total
                    </Text>
                  </View>
                </View>

                {/* Right Side: Details */}
                <View style={{ flex: 1, paddingLeft: 24, justifyContent: 'center' }}>
                  {/* Title Badge */}
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <View style={{
                      backgroundColor: 'rgba(52, 199, 89, 0.12)',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5
                    }}>
                      <TrendingUp size={12} color="#34C759" />
                      <Text style={{ color: '#34C759', fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Daily Sugar Tracker
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
                    Sugar Consumed
                  </Text>

                  {/* WHO Limit Pill */}
                  <View style={{
                    backgroundColor: activeDayInfo.isEmpty ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') : (totalSugar > 25 ? 'rgba(255, 59, 48, 0.12)' : (totalSugar > 15 ? 'rgba(255, 149, 0, 0.12)' : 'rgba(52, 199, 89, 0.12)')),
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    alignSelf: 'flex-start'
                  }}>
                    <ArrowUpRight size={12} color={activeDayInfo.isEmpty ? colors.textSecondary : (totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759'))} />
                    <Text style={{ color: activeDayInfo.isEmpty ? colors.textSecondary : (totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759')), fontSize: 10, fontWeight: '800' }}>
                      WHO Limit: {activeDayInfo.isEmpty ? '0' : Math.round((totalSugar / 25) * 100)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Minimalist Sub-Divider */}
              <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', width: '100%', marginBottom: 20 }} />

              {/* Burn System Section (Floating) */}
              <View style={{ width: '100%' }}>
                {/* Header Area */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <View style={{
                    backgroundColor: 'rgba(255, 140, 0, 0.12)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <Flame size={12} color="#FF8C00" />
                    <Text style={{ color: '#FF8C00', fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Daily Burn System
                    </Text>
                  </View>

                  <View style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Info size={10} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800' }}>
                      Per serving size
                    </Text>
                  </View>
                </View>

                {/* 3-Column Floating Stats Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Energy Stat */}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255, 59, 48, 0.12)', padding: 12, borderRadius: 16, marginBottom: 10 }}>
                      <Zap size={18} color="#FF3B30" />
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
                      Energy
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                      {activeDayInfo.isEmpty ? '0' : sumTotalPackagesCalories} <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>kcal</Text>
                    </Text>
                  </View>

                  {/* Vertical Divider */}
                  <View style={{ width: 1, height: 44, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }} />

                  {/* Scanned Stat */}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(52, 199, 89, 0.12)', padding: 12, borderRadius: 16, marginBottom: 10 }}>
                      <ScanBarcode size={18} color="#34C759" />
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
                      Scanned
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                      {activeDayInfo.isEmpty ? '0' : totalScansForActiveDay} <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>{totalScansForActiveDay === 1 ? 'item' : 'items'}</Text>
                    </Text>
                  </View>

                  {/* Vertical Divider */}
                  <View style={{ width: 1, height: 44, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }} />

                  {/* Jogging Stat */}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(0, 122, 255, 0.12)', padding: 12, borderRadius: 16, marginBottom: 10 }}>
                      <Activity size={18} color="#007AFF" />
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
                      Jogging
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                      {activeDayInfo.isEmpty ? '--' : (tpRunHours > 0 ? `${tpRunHours}h ${tpRunMins}m` : `${tpRunMins}m`)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Premium Call To Action Button with Loop-Reflection Shine */}
        <View style={{ overflow: 'hidden', position: 'relative', borderRadius: 24 }} className="mb-6 shadow-md">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/scanner');
            }}
            style={{ backgroundColor: colors.primary }}
            className="w-full p-5 flex-row items-center justify-between active:opacity-90"
            activeOpacity={0.9}
          >
            <View className="flex-row items-center gap-4">
              <View className="p-3 bg-white/10 rounded-xl">
                <ScanBarcode size={24} color="white" />
              </View>
              <View>
                <Text className="text-white text-base font-black leading-tight">Scan Packaged Food</Text>
                <Text className="text-white/70 text-xs mt-1">Get Sugar amount in teaspoons</Text>
              </View>
            </View>
            <View className="p-2 bg-white/10 rounded-full">
              <ArrowRight size={16} color="white" />
            </View>
          </TouchableOpacity>

          {/* Animated Shine Overlay */}
          <AnimatedReanimated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 140,
                opacity: 0.22,
              },
              useAnimatedStyle(() => ({
                transform: [{ translateX: shineX.value }, { skewX: '-20deg' }],
              })),
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.45)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </AnimatedReanimated.View>
        </View>



        {/* Scan History Section */}
        <View className="mb-12">
          <View className="flex-row items-center justify-between mb-4 px-1">
            <Text style={{ color: colors.text }} className="font-black text-sm">
              Scan History
            </Text>
            {scans.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    'Clear History',
                    'Are you sure you want to clear your scanned food history?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear All', style: 'destructive', onPress: () => clearScans() }
                    ]
                  );
                }}
              >
                <Text style={{ color: colors.primary }} className="text-xs font-black">
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {scans.length === 0 ? (
            <View
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              className="border p-6 rounded-[24px] items-center justify-center shadow-sm"
            >
              <ScanBarcode size={24} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary }} className="text-xs font-bold mt-2">
                No items scanned yet
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-[10px] mt-1 text-center">
                Tap 'Scan Packaged Food' to scan your first product.
              </Text>
            </View>
          ) : (
            (() => {
              const groupedScans = scans.reduce((acc, scan) => {
                const dateStr = formatGroupDate(scan.timestamp);
                const group = acc.find(g => g.title === dateStr);
                if (group) {
                  group.items.push(scan);
                } else {
                  acc.push({ title: dateStr, items: [scan] });
                }
                return acc;
              }, [] as { title: string, items: typeof scans }[]);

              return groupedScans.map((group, groupIndex) => (
                <AnimatedReanimated.View
                  key={`group-${group.title}`}
                  entering={FadeInDown.delay(Math.min(groupIndex * 100, 400)).duration(300)}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1.5,
                    borderRadius: 28,
                    padding: 16,
                    marginBottom: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.15 : 0.04,
                    shadowRadius: 12,
                    elevation: 3
                  }}
                >
                  <Text style={{
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: '900',
                    marginBottom: 16,
                    marginLeft: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 1.0
                  }}>
                    {group.title}
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 2, gap: 12, paddingBottom: 4 }}
                  >
                    {group.items.map((item) => {
                      // Determine Mascot facial state
                      const cardMascotState = item.sugarTeaspoons === 0 
                        ? 'happy' 
                        : (item.sugarTeaspoons <= 2 ? 'idle' : (item.sugarTeaspoons <= 5 ? 'shocked' : 'dizzy'));
                      
                      const sugarColor = getSugarColor(item.sugarTeaspoons, colors);

                      // Calories LED Color: High (>250 kcal) Red, Mid (>100 kcal) Orange, Low Green
                      const calColor = (item.calories || 0) > 250 ? '#FF3B30' : ((item.calories || 0) > 100 ? '#FF9500' : '#34C759');

                      // Sugar Grams LED Color: High (>10g) Red, Mid (>4g) Orange, Low Green
                      const sugColor = item.sugarGrams > 10 ? '#FF3B30' : (item.sugarGrams > 4 ? '#FF9500' : '#34C759');

                      // Jogging Time Calculation
                      const itemRunMinutes = Math.round((item.calories || 0) / 10);

                      // WHO limit percent representation of daily sugar intake limit (25g)
                      const itemWhoPercent = Math.min(100, Math.round((item.sugarGrams / 25) * 100));
                      const whoBarColor = itemWhoPercent > 100 ? '#FF3B30' : (itemWhoPercent > 60 ? '#FF9500' : '#34C759');

                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            panY.setValue(0);
                            setSelectedScan(item);
                          }}
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.background,
                            borderColor: colors.border,
                            borderWidth: 1.5,
                            borderRadius: 24,
                            padding: 10,
                            width: 320,
                            height: 190,
                            flexDirection: 'row',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDark ? 0.15 : 0.04,
                            shadowRadius: 10,
                            elevation: 2
                          }}
                          activeOpacity={0.85}
                        >
                          {/* Left Column: Product Image (Full Height) */}
                          <View style={{
                            width: 95,
                            alignSelf: 'stretch',
                            borderRadius: 16,
                            overflow: 'hidden',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}>
                            {item.imageUrl ? (
                              <Image
                                source={{ uri: item.imageUrl }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                transition={200}
                              />
                            ) : (
                              <View
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <ScanBarcode size={28} color={colors.primary} />
                              </View>
                            )}
                          </View>

                          {/* Right Column: Details stacked vertically */}
                          <View style={{ flex: 1, paddingLeft: 12, height: '100%', justifyContent: 'space-between' }}>
                            {/* Row 1: Title & Mascot */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <View style={{ flex: 1 }}>
                                <Text
                                  numberOfLines={2}
                                  style={{ color: colors.text, fontSize: 13, fontWeight: '800', lineHeight: 17 }}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  style={{ color: sugarColor, fontSize: 14, fontWeight: '900', marginTop: 1 }}
                                >
                                  {item.sugarTeaspoons} <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>tsp</Text>
                                </Text>
                              </View>

                              {/* Mini Mascot Avatar (Fixed sizing & overflow so it doesn't cut out) */}
                              <View style={{
                                width: 42,
                                height: 42,
                                borderRadius: 21,
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.03)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1.5,
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                              }}>
                                <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                                  <Mascot size={36} state={cardMascotState} />
                                </View>
                              </View>
                            </View>

                            {/* Row 2: Telemetry LEDs (Calories & Sugar grams) */}
                            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                              {/* Calories LED Pill */}
                              <View style={{
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.02)',
                                borderColor: colors.border,
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: calColor + '33', alignItems: 'center', justifyContent: 'center' }}>
                                  <View style={{ width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: calColor }} />
                                </View>
                                <Zap size={8} color={colors.textSecondary} />
                                <Text style={{ color: colors.text, fontSize: 8, fontWeight: '700' }}>
                                  {item.calories || 0} kcal
                                </Text>
                              </View>

                              {/* Sugar Grams LED Pill */}
                              <View style={{
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.02)',
                                borderColor: colors.border,
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sugColor + '33', alignItems: 'center', justifyContent: 'center' }}>
                                  <View style={{ width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: sugColor }} />
                                </View>
                                <Text style={{ color: colors.text, fontSize: 8, fontWeight: '700' }}>
                                  {item.sugarGrams}g sugar
                                </Text>
                              </View>
                            </View>

                            {/* Row 3: Jogging & Size details */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Activity size={10} color="#007AFF" />
                                <Text style={{ color: colors.textSecondary, fontSize: 8.5, fontWeight: '700' }}>
                                  {itemRunMinutes}m jogging
                                </Text>
                              </View>

                              {/* Pack / Serving Sizes */}
                              {(item.packageSize || item.servingSize) && (
                                <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '800' }}>
                                  {item.servingSize ? `Serve: ${item.servingSize}` : `Pack: ${item.packageSize}`}
                                </Text>
                              )}
                            </View>

                            {/* Row 4: WHO Limit Progress & Delete Trash button */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 8, fontWeight: '700', marginBottom: 2 }}>
                                  WHO Limit: {itemWhoPercent}%
                                </Text>
                                <View style={{ height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                  <View style={{ height: '100%', width: `${itemWhoPercent}%`, backgroundColor: whoBarColor }} />
                                </View>
                              </View>

                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  deleteScan(item.id);
                                }}
                                style={{
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255, 59, 48, 0.08)',
                                  padding: 7,
                                  borderRadius: 8
                                }}
                                activeOpacity={0.8}
                              >
                                <Trash2 size={11} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </AnimatedReanimated.View>
              ));
            })()
          )}
        </View>
      </ScrollView>

      {/* Scan Details Modal */}
      <Modal
        visible={selectedScan !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedScan(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setSelectedScan(null)}
          />
          <Animated.View
            style={{
              backgroundColor: colors.surface,
              transform: [{ translateY: panY }],
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              maxHeight: '85%',
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 10
            }}
          >
            {/* Drag Handle Area */}
            <View
              {...panResponder.panHandlers}
              style={{ width: '100%', alignItems: 'center', paddingBottom: 12 }}
            >
              {/* Modal Pull Bar */}
              <View style={{ width: 48, height: 5, backgroundColor: isDark ? '#444' : '#ccc', borderRadius: 3, marginBottom: 8 }} />

              {/* Modal Header */}
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                  Product Details
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedScan(null)}
                  style={{ backgroundColor: colors.background, padding: 8, borderRadius: 20 }}
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {selectedScan && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* 1. Hero Section: Product Card & Sugar Impact */}
                <View style={{ backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, padding: 24, borderRadius: 28, alignItems: 'center', marginBottom: 24 }}>
                  {selectedScan.imageUrl ? (
                    <Image
                      source={{ uri: selectedScan.imageUrl }}
                      style={{ width: 112, height: 112, borderRadius: 16, marginBottom: 16 }}
                      contentFit="contain"
                      transition={200}
                    />
                  ) : (
                    <View
                      style={{ backgroundColor: colors.primary + '12' }}
                      className="w-24 h-24 rounded-2xl items-center justify-center mb-4"
                    >
                      <ScanBarcode size={36} color={colors.primary} />
                    </View>
                  )}

                  <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', lineHeight: 26 }}>
                    {selectedScan.name}
                  </Text>
                  <View style={{ backgroundColor: colors.surfaceRaised, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginTop: 6 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {selectedScan.brand || 'Generic Brand'}
                    </Text>
                  </View>
                  {selectedScan.barcode && (
                    <Text style={{ color: colors.textMuted }} className="text-[12px] font-mono mt-1.5">
                      Barcode: {selectedScan.barcode}
                    </Text>
                  )}

                  {/* Reactive Mascot based on full package sugar */}
                  {(() => {
                    const currentTsp = selectedScan.totalSugarTeaspoons !== undefined ? selectedScan.totalSugarTeaspoons : (selectedScan.sugarTeaspoons ?? 0);
                    return (
                      <View style={{ marginTop: 24, marginBottom: 16 }}>
                        <Mascot
                          state={
                            currentTsp > 6
                              ? 'shocked'
                              : currentTsp > 3
                                ? 'dizzy'
                                : 'happy'
                          }
                          size={120}
                        />
                      </View>
                    );
                  })()}

                  {/* Massive Impact Typography for Total Package Sugar */}
                  {(() => {
                    const isUnknown = selectedScan.totalSugarTeaspoons === undefined;
                    const currentTsp = isUnknown ? '--' : selectedScan.totalSugarTeaspoons;
                    const currentColor = isUnknown ? colors.textMuted : getSugarColor(selectedScan.totalSugarTeaspoons!, colors);

                    return (
                      <View style={{ alignItems: 'center', marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={{
                            color: currentColor,
                            fontSize: 54,
                            fontWeight: '900',
                            letterSpacing: -2,
                            lineHeight: 72
                          }}>
                            {currentTsp}
                          </Text>
                          {!isUnknown && (
                            <Text style={{
                              color: currentColor,
                              fontSize: 24,
                              fontWeight: '800',
                              marginLeft: 6
                            }}>
                              tsp
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                          Total Sugars in Full Package
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                          {selectedScan.packageSize ? `(${selectedScan.packageSize})` : '(Package Size Unknown)'}
                        </Text>
                      </View>
                    );
                  })()}

                  {/* Side-by-side summary cards */}
                  <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 28 }}>
                    {/* Per Serving Card */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: colors.surfaceRaised,
                        padding: 16,
                        borderRadius: 20,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.border
                      }}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Per Serving</Text>
                      {selectedScan.servingSize && selectedScan.sugarTeaspoons !== undefined ? (
                        <>
                          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 2 }}>{selectedScan.servingSize}</Text>
                          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 10 }}>
                            {selectedScan.sugarTeaspoons} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>tsp</Text>
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>({selectedScan.sugarGrams}g sugar)</Text>
                        </>
                      ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>No Serving Size found</Text>
                        </View>
                      )}
                    </View>

                    {/* Per 100g Card */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: colors.surfaceRaised,
                        padding: 16,
                        borderRadius: 20,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.border
                      }}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Per 100g / 100ml</Text>
                      <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 2 }}>Standard</Text>

                      {selectedScan.sugarPer100g !== undefined && selectedScan.sugarPer100g > 0 ? (
                        <>
                          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 10 }}>
                            {parseFloat((selectedScan.sugarPer100g / 4.2).toFixed(1))} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>tsp</Text>
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>({selectedScan.sugarPer100g}g sugar)</Text>
                        </>
                      ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                          <Text style={{ color: colors.textMuted, fontSize: 26, fontWeight: '900', textAlign: 'center' }}>--</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* 2. Dynamic Nutrition Facts */}
                <NutritionFacts
                  colors={colors}
                  productName={selectedScan.name}
                  sugarGrams={selectedScan.sugarGrams ?? selectedScan.sugarPer100g ?? 0}
                  calories={selectedScan.calories}
                  servingSize={selectedScan.servingSize ?? '100 g'}
                />

                {/* 3. Extra Nutritional Data */}
                {(() => {
                  const currentCalories = selectedScan.calories;
                  if (currentCalories !== undefined) {
                    return (
                      <View style={{ marginBottom: 24, gap: 12 }}>
                        {/* Burn Down Tagline */}
                        <View style={{ backgroundColor: '#F9731615', borderColor: '#F9731630', borderWidth: 1, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <View style={{ backgroundColor: '#F9731625', padding: 12, borderRadius: 16 }}>
                            <Activity size={24} color="#F97316" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                              The Burn Down
                            </Text>
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
                              You would need to run for <Text style={{ fontWeight: '900', color: '#F97316', fontSize: 15 }}>{Math.round(currentCalories / 10)} mins</Text> straight to burn off this serving.
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* 4. WHO Reference Card */}
                <View style={{ backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, padding: 20, borderRadius: 24, marginBottom: 32, gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ backgroundColor: colors.primary + '12', padding: 8, borderRadius: 12 }}>
                      <HelpCircle size={18} color={colors.primary} />
                    </View>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>WHO daily limits for adults:</Text>
                  </View>

                  {(() => {
                    const currentTsp = selectedScan.sugarTeaspoons;
                    if (currentTsp === undefined) {
                      return (
                        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                          Serving size is unknown, so we can't calculate your total daily limit usage for this serving.
                        </Text>
                      );
                    }
                    return (
                      <View style={{ gap: 12 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 4 }}>
                          This serving contains <Text style={{ fontWeight: '900', color: colors.text }}>{currentTsp} tsp</Text> of sugar.
                        </Text>
                        <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>Recommended Daily Sugar Amount</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>Limit to 6 tsp (25g) for best health benefits.</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Limit Used</Text>
                            <Text style={{ color: currentTsp > 6 ? colors.error : colors.text, fontWeight: '900', fontSize: 16 }}>{((currentTsp / 6) * 100).toFixed(0)}%</Text>
                          </View>
                        </View>

                        <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>Maximum Suggested Daily Sugar Amount</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>Limit to 12 tsp (50g) to reduce health risks.</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Limit Used</Text>
                            <Text style={{ color: currentTsp > 12 ? colors.error : colors.text, fontWeight: '900', fontSize: 16 }}>{((currentTsp / 12) * 100).toFixed(0)}%</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Delete and Close scan option from details */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert(
                        'Delete Scan',
                        'Remove this item from your scan history?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              deleteScan(selectedScan.id);
                              setSelectedScan(null);
                            }
                          }
                        ]
                      );
                    }}
                    style={{ borderColor: colors.error }}
                    className="flex-1 py-3.5 border rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={{ color: colors.error }} className="font-bold text-xs">Delete From History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedScan(null)}
                    style={{ backgroundColor: colors.primary }}
                    className="flex-1 py-3.5 rounded-2xl items-center justify-center active:opacity-95"
                  >
                    <Text className="text-white font-bold text-xs">Close Details</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>



      {/* App Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SettingsScreen onClose={() => setSettingsVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

// Helpers
function getSugarColor(teaspoons: number, colors: any) {
  if (teaspoons > 6) {
    return colors.error || '#ff7d7dff';
  }
  if (teaspoons > 3) {
    return colors.warning || '#ffe072ff';
  }
  return colors.success || '#3dffbeff';
}
