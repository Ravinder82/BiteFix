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
import { SugarProgressRing } from '../../components/features/SugarProgressRing';
import { ScanBarcode, Activity, ArrowRight, Info, Sparkles, Trash2, Clock, X, AlertTriangle, Menu, HelpCircle, Flame, Zap, ArrowUpRight, TrendingUp, ChevronLeft, ChevronRight, LogOut } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { formatBloodSugarValue, getStatusColor, getStatusLabel } from '../../utils/bloodSugar';
import { formatSugar } from '../../utils/sugar';
import SettingsScreen from './settings';
import * as Haptics from 'expo-haptics';
import { ScanHistoryItem } from '../../types/app.types';
import { getSmartServingText } from '../../utils/format';
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


function ScanHistoryGroup({ group, groupIndex, colors, isDark, panY, setSelectedScan, deleteScan }: any) {
  const { sugarUnit } = useAppStore();
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);

  const cardWidth = 320;
  const gap = 12;
  const snapInterval = cardWidth + gap;

  const firstItemDate = new Date(group.items[0].timestamp);
  const displayTitle = firstItemDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <AnimatedReanimated.View
      entering={FadeInDown.delay(Math.min(groupIndex * 100, 400)).duration(300)}
      style={{
        backgroundColor: isDark ? colors.surface : '#F7F8FA',
        borderColor: isDark ? colors.border : 'rgba(220, 220, 220, 1)',
        borderWidth: isDark ? 1.5 : 1,
        borderRadius: 28,
        padding: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.15 : 0.12,
        shadowRadius: 28,
        elevation: 10
      }}
    >
      {/* Top Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Text style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: 1.0,
            flexShrink: 1
          }} numberOfLines={1}>
            {displayTitle}
          </Text>

          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.06)',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
              {group.items.length} {group.items.length === 1 ? 'Product' : 'Products'}
            </Text>
          </View>
        </View>

        {/* Swipe Arrows */}
        {group.items.length > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <TouchableOpacity
              onPress={() => scrollRef.current?.scrollTo({ x: Math.max(0, scrollX - snapInterval), animated: true })}
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.06)', padding: 8, borderRadius: 12 }}
            >
              <ChevronLeft size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => scrollRef.current?.scrollTo({ x: scrollX + snapInterval, animated: true })}
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', padding: 8, borderRadius: 12 }}
            >
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 2, gap, paddingBottom: 4 }}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        {group.items.map((item: any) => {
          const cardMascotState = item.sugarTeaspoons === 0 ? 'happy' : (item.sugarTeaspoons <= 2 ? 'idle' : (item.sugarTeaspoons <= 5 ? 'shocked' : 'dizzy'));
          const sugarColor = getSugarColor(item.sugarTeaspoons, colors);
          const calColor = (item.calories || 0) > 250 ? '#FF3B30' : ((item.calories || 0) > 100 ? '#FF9500' : '#34C759');
          const sugColor = item.sugarGrams > 10 ? '#FF3B30' : (item.sugarGrams > 4 ? '#FF9500' : '#34C759');
          const itemRunMinutes = Math.round((item.calories || 0) / 10);
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
                padding: 12,
                width: cardWidth,
                height: 240,
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
              {/* Left Column: Product Image Full Height */}
              <View style={{
                width: 110,
                alignSelf: 'stretch',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.06)',
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                ) : (
                  <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <ScanBarcode size={36} color={colors.primary} />
                  </View>
                )}
              </View>

              {/* Right Column */}
              <View style={{ flex: 1, paddingLeft: 16, height: '100%', justifyContent: 'space-between' }}>

                {/* Row 1: Title & Mascot Avatar */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={{ color: colors.text, fontSize: 16, fontWeight: '900', lineHeight: 22 }}>
                      {item.name}
                    </Text>
                  </View>

                  {/* Fixed circular container for mini mascot to prevent cut off */}
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  }}>
                    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      <Mascot size={44} state={cardMascotState} />
                    </View>
                  </View>
                </View>

                {/* Row 2: Metrics Grid (Bento style) */}
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {/* Calories LED Pill */}
                  <View style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.06)',
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: calColor + '33', alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 4.5, height: 4.5, borderRadius: 2.25, backgroundColor: calColor }} />
                    </View>

                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>
                      Energy: {item.calories || 0} kcal
                    </Text>
                  </View>

                  {/* Sugar Grams LED Pill */}
                  <View style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.06)',
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sugColor + '33', alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 4.5, height: 4.5, borderRadius: 2.25, backgroundColor: sugColor }} />
                    </View>
                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>
                      Sugar: {formatSugar(item.sugarGrams, sugarUnit)}
                    </Text>
                  </View>

                  {/* Jogging Pill */}
                  <View style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.06)',
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sugColor + '33', alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 4.5, height: 4.5, borderRadius: 2.25, backgroundColor: sugColor }} />
                    </View>

                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>
                      Jog: {itemRunMinutes} m
                    </Text>
                  </View>
                </View>

                {/* Row 3: WHO Limit Bento & Delete */}
                <View style={{ flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0,0,0,0.06)',
                    borderColor: colors.border,
                    borderWidth: 2,
                    borderRadius: 12,
                    padding: 8,
                    justifyContent: 'center',
                    gap: 6
                  }}>
                    {(item.packageSize || item.servingSize) && (
                      <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800' }}>
                        {getSmartServingText(item.servingSize, item.packageSize)}
                      </Text>
                    )}
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>WHO Limit</Text>
                        <Text style={{ color: colors.text, fontSize: 10, fontWeight: '900' }}>{itemWhoPercent}%</Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${itemWhoPercent}%`, backgroundColor: whoBarColor }} />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={(e) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      deleteScan(item.id);
                    }}
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255, 205, 202, 0.54)',
                      padding: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>

              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </AnimatedReanimated.View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { logs, scans, deleteScan, clearScans, userName, sugarUnit } = useAppStore();
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { signOut } = useAuth();

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
              CutSugar
            </Text>
            <Text
              style={{ color: colors.primary, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6 }}
            >
              Sugar Teaspoons Scanner
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {/* Quick Logout Button */}
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
                        Alert.alert('Error', 'Failed to log out.');
                      }
                    },
                  },
                ]
              );
            }}
            style={{ backgroundColor: colors.surfaceRaised }}
            className="p-2 active:opacity-80 rounded-full"
          >
            <LogOut size={18} color={colors.error} />
          </TouchableOpacity>

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
            colors={isDark ? ['#000000ff', '#000000ff'] : ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.06)']}
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
            {/* Top: Welcome Text & Mascot */}
            <View className="flex-row w-full mb-4">
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text
                  style={{ color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 }}
                >
                  {userName ? `WELCOME, ${userName.toUpperCase()}` : 'WELCOME BACK'}
                </Text>

                {/* Info Display Card */}
                <View style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>Why teaspoons?</Text> Teaspoons provides a clear, visual way to understand Daily Sugar Intake.
                  </Text>
                </View>
              </View>
              <AnimatedReanimated.View
                entering={FadeInDown.duration(600).springify()}
                style={{ alignItems: 'center', zIndex: 10, paddingTop: 4 }}
              >
                <Mascot state={totalSugar > 25 ? 'shocked' : 'happy'} size={100} />
              </AnimatedReanimated.View>
            </View>

            {/* Central Visual: Mascot-styled Sugar Ring */}
            <View style={{ width: '100%', alignItems: 'center', marginVertical: 16 }}>
              <SugarProgressRing totalSugar={totalSugar} size={260} isDark={isDark} colors={colors} />
            </View>

            {/* Bottom: WHO Info & Limit Pill */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              {/* WHO Standard Text */}
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginRight: 12 }}>
                <Text style={{ color: colors.text, fontSize: 11, lineHeight: 16, fontWeight: '700' }}>
                  <Text style={{ color: colors.text, fontWeight: '900' }}>WHO Standard:</Text>
                  {'\n'}1 tsp = {formatSugar(4.2, sugarUnit)} of Sugar
                </Text>
              </View>

              {/* WHO Limit Pill */}
              <View style={{
                backgroundColor: activeDayInfo.isEmpty ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') : (totalSugar > 25 ? 'rgba(255, 59, 48, 0.12)' : (totalSugar > 15 ? 'rgba(255, 149, 0, 0.12)' : 'rgba(52, 199, 89, 0.12)')),
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <ArrowUpRight size={14} color={activeDayInfo.isEmpty ? colors.textSecondary : (totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759'))} />
                  <Text style={{ color: activeDayInfo.isEmpty ? colors.textSecondary : (totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759')), fontSize: 14, fontWeight: '900' }}>
                    {activeDayInfo.isEmpty ? '0' : Math.round((totalSugar / 25) * 100)}%
                  </Text>
                </View>
                <Text style={{ color: activeDayInfo.isEmpty ? colors.textSecondary : (totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759')), fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>
                  WHO Limit
                </Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Burn System Section (Extracted) */}
        <View style={{
          backgroundColor: isDark ? colors.surface : '#F7F8FA',
          borderColor: isDark ? colors.border : 'rgba(220, 220, 220, 1)',
          borderWidth: isDark ? 1.5 : 1,
          borderRadius: 28,
          padding: 20,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.15 : 0.08,
          shadowRadius: 20,
          elevation: 5
        }}>
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
              <View style={{ backgroundColor: 'rgba(212, 255, 0, 1)', padding: 12, borderRadius: 16, marginBottom: 10 }}>
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
              <View style={{ backgroundColor: 'rgba(251, 255, 0, 1)', padding: 12, borderRadius: 16, marginBottom: 10 }}>
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
              <View style={{ backgroundColor: 'rgba(0, 191, 255, 1)', padding: 12, borderRadius: 16, marginBottom: 10 }}>
                <Activity size={18} color="#000000ff" />
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
                <ScanHistoryGroup
                  key={`group-${group.title}`}
                  group={group}
                  groupIndex={groupIndex}
                  colors={colors}
                  isDark={isDark}
                  panY={panY}
                  setSelectedScan={setSelectedScan}
                  deleteScan={deleteScan}
                />
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
              padding: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 32,
              elevation: 16
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
                          <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>({formatSugar(selectedScan.sugarGrams, sugarUnit)} sugar)</Text>
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
                          <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>({formatSugar(selectedScan.sugarPer100g, sugarUnit)} sugar)</Text>
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
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>Limit to 6 tsp ({formatSugar(25, sugarUnit)}) for best health benefits.</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Limit Used</Text>
                            <Text style={{ color: currentTsp > 6 ? colors.error : colors.text, fontWeight: '900', fontSize: 16 }}>{((currentTsp / 6) * 100).toFixed(0)}%</Text>
                          </View>
                        </View>

                        <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>Maximum Suggested Daily Sugar Amount</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>Limit to 12 tsp ({formatSugar(50, sugarUnit)}) to reduce health risks.</Text>
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
