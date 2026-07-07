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
import { ScanBarcode, Activity, ArrowRight, Info, Sparkles, Trash2, Clock, X, AlertTriangle, Menu, HelpCircle, Flame, Zap, ArrowUpRight, TrendingUp, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react-native';
import { formatSugar, getConsistentNutritionalMetrics } from '../../utils/sugar';
import ProductHeroCardDashboard from '../../components/features/ProductHeroCardDashboard';
import SettingsScreen from './settings';
import * as Haptics from 'expo-haptics';
import { ScanHistoryItem } from '../../types/app.types';
import { getSmartServingText, formatWeight } from '../../utils/format';
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



const calculateJoggingMinutes = (calories: number): number => {
  if (!calories || isNaN(calories) || calories <= 0) return 0;
  // Standard rule: ~10 kcal burned per minute of jogging
  return Math.round(calories / 10);
};

const formatJogTime = (totalMinutes: number): string => {
  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};


function ScanHistoryItemRow({ item, colors, isDark, onPress, onDelete }: any) {
  const { sugarUnit } = useAppStore();
  const metrics = getConsistentNutritionalMetrics(item);
  const servingTsp = metrics.servingTsp ?? 0;

  let ledColor = '#8E8E93';
  if (servingTsp > 6) {
    ledColor = '#FF3B30';
  } else if (servingTsp > 3) {
    ledColor = '#FF9500';
  } else if (servingTsp > 0) {
    ledColor = '#34C759';
  }

  const isUnknown = servingTsp === undefined || item.sugarGrams === undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.1 : 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Product Image Thumbnail */}
      <View style={{
        width: 46,
        height: 46,
        borderRadius: 10,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <ScanBarcode size={20} color={colors.primary} />
        )}
      </View>

      {/* Center Details */}
      <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
        <Text
          style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}
          numberOfLines={1}
        >
          {item.brand || 'Generic Brand'}
        </Text>
        <Text
          style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '600', marginTop: 2 }}>
          {formatWeight(item.servingSize, sugarUnit) || '1 serving'} per serving
        </Text>
      </View>

      {/* Right Column: Mini LED + Teaspoons */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Teaspoon highlight */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900' }}>
            {isUnknown ? '--' : servingTsp.toFixed(1).replace(/\.0$/, '')} <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '700' }}>tsp</Text>
          </Text>
        </View>

        {/* Mini LED */}
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: ledColor,
            shadowColor: ledColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 2,
          }}
        />

        {/* Delete button (small trash icon) */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete();
          }}
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            padding: 6,
            borderRadius: 8,
            marginLeft: 2,
          }}
        >
          <Trash2 size={12} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ScanHistoryGroup({ group, groupIndex, colors, isDark, panY, setSelectedScan, deleteScan }: any) {
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
        padding: 16,
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
      </View>

      <View style={{ gap: 4 }}>
        {group.items.map((item: any) => {
          return (
            <ScanHistoryItemRow
              key={item.id}
              item={item}
              colors={colors}
              isDark={isDark}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                panY.setValue(0);
                setSelectedScan(item);
              }}
              onDelete={() => {
                deleteScan(item.id);
              }}
            />
          );
        })}
      </View>
    </AnimatedReanimated.View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { scans, deleteScan, clearScans, userName, sugarUnit, addToCollection, collection } = useAppStore();
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Animated shine coordinate for the CTA button
  const shineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const latestScan = scans[0];
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



  // --- Bento Grid Logic ---
  const getLatestActiveScans = () => {
    if (scans.length === 0) {
      return { dateStr: 'Today', items: [], isEmpty: true };
    }

    const todayStr = new Date().toDateString();
    const todayScans = scans.filter(scan => new Date(scan.timestamp).toDateString() === todayStr);

    if (todayScans.length > 0) {
      return { dateStr: 'Today', items: todayScans, isEmpty: false };
    }

    // Fallback: Find the most recent date in history that has scans
    const sortedScansByTime = [...scans].sort((a, b) => b.timestamp - a.timestamp);
    const latestScanDateStr = new Date(sortedScansByTime[0].timestamp).toDateString();
    const latestScans = scans.filter(scan => new Date(scan.timestamp).toDateString() === latestScanDateStr);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateFormatted = new Date(sortedScansByTime[0].timestamp).toLocaleDateString(undefined, options);

    return { dateStr: dateFormatted, items: latestScans, isEmpty: false };
  };

  const activeDayInfo = getLatestActiveScans();

  const totalSugar = activeDayInfo.items.reduce((sum, item) => {
    const metrics = getConsistentNutritionalMetrics(item);
    return sum + metrics.servingSugarG;
  }, 0);

  // 1. Daily Intake (Per Serving basis)
  const sumServingCalories = activeDayInfo.items.reduce((sum, item) => {
    const metrics = getConsistentNutritionalMetrics(item);
    return sum + (metrics.servingCalories ?? 0);
  }, 0);
  const totalJoggingMinutesToday = activeDayInfo.items.reduce((sum, item) => {
    const metrics = getConsistentNutritionalMetrics(item);
    return sum + calculateJoggingMinutes(metrics.servingCalories ?? 0);
  }, 0);



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

              {/* Scan Date Pill just above Progress Ring */}
              <View style={{
                backgroundColor: colors.primary + '15',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.primary + '30',
                marginBottom: 16,
                alignSelf: 'center',
              }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {activeDayInfo.dateStr === 'Today' ? "Today's Scans" : `Last Scan on ${activeDayInfo.dateStr}`}
                </Text>
              </View>

              <SugarProgressRing totalSugar={totalSugar} size={260} isDark={isDark} colors={colors} />
            </View>

            {/* Sleek WHO Standard Pill */}
            <View style={{ width: '100%', alignItems: 'center', marginTop: 10, marginBottom: 14 }}>
              <View style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                  WHO Standard
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                  1 Teaspoon = {formatSugar(4.2, sugarUnit)} of Sugar
                </Text>
              </View>
            </View>

            {/* Total Days to Consume Container */}
            <View style={{
              width: '100%',
              backgroundColor: isDark ? 'rgba(251, 248, 248, 0.06)' : 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}>
              {/* Title & Date Pill */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Sugar Consumption
                </Text>
                <View style={{
                  backgroundColor: colors.primary + '15',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary + '30',
                }}>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>
                    {activeDayInfo.dateStr === 'Today' ? "Today's Scans" : `Scans on ${activeDayInfo.dateStr}`}
                  </Text>
                </View>
              </View>

              {/* Cute Floating Mini Info Container */}
              <View style={{
                backgroundColor: isDark ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.08)',
                borderColor: isDark ? 'rgba(255, 149, 0, 0.25)' : 'rgba(255, 149, 0, 0.3)',
                borderWidth: 1,
                borderRadius: 14,
                padding: 10,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>

                <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '600', flex: 1, lineHeight: 15 }}>
                  Do you know How many Days it will take to consume today's sugar intake as per WHO guidelines?
                </Text>
              </View>

              {/* Consumption Pace Rows */}
              <View style={{ gap: 10 }}>
                {/* 6 tsp Pace */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>Recommended</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '500' }}>WHO: Safe 6 teaspoons/day</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.success || '#22C55E', fontSize: 18, fontWeight: '900' }}>
                      {activeDayInfo.isEmpty ? '0.0' : (totalSugar / 4.2 / 6.0).toFixed(1)} <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>Days</Text>
                    </Text>
                  </View>
                </View>

                {/* Separator line */}
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 2 }} />

                {/* 12 tsp Pace */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>Maximum</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '500' }}>WHO: Max 12 teaspoons/day</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>
                      {activeDayInfo.isEmpty ? '0.0' : (totalSugar / 4.2 / 12.0).toFixed(1)} <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>Days</Text>
                    </Text>
                  </View>
                </View>
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
                Calories Counter
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
                Energy Intake
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
                {activeDayInfo.isEmpty ? '0' : sumServingCalories} <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>kcal</Text>
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
                {activeDayInfo.isEmpty ? '0m' : formatJogTime(totalJoggingMinutesToday)}
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
                {/* 1. Hero Section: Product Card & Sugar Impact */}
                <View style={{ marginBottom: 24 }}>
                  <ProductHeroCardDashboard
                    scanResult={selectedScan}
                    colors={colors}
                    isDark={isDark}
                  />
                </View>



                {/* 3. Extra Nutritional Data */}
                {(() => {
                  const currentCalories = selectedScan.calories ?? 0;
                  if (currentCalories > 0) {
                    const runMins = calculateJoggingMinutes(currentCalories);
                    return (
                      <View style={{ marginBottom: 24, gap: 12 }}>
                        {/* Burn Down Tagline */}
                        <LinearGradient
                          colors={['#F97316', '#ef4444db']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            borderRadius: 24,
                            padding: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 16,
                            shadowColor: '#EF4444',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.2,
                            shadowRadius: 16,
                            elevation: 5,
                          }}
                        >
                          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.22)', padding: 12, borderRadius: 16 }}>
                            <Flame size={24} color="#FFFFFF" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                The Burn Down
                              </Text>
                              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{Math.round(currentCalories)} kcal</Text>
                              </View>
                            </View>
                            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 18 }}>
                              You need to jog for <Text style={{ fontWeight: '900', fontSize: 16, textDecorationLine: 'underline' }}>{formatJogTime(runMins)}</Text> straight to torch this serving! Stay motivated!
                            </Text>
                          </View>
                        </LinearGradient>
                      </View>
                    );
                  }
                  return null;
                })()}


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
