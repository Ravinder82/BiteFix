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
            borderRadius: 28,
            overflow: 'hidden',
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.06)',
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
            <View className="flex-row w-full gap-3">
              {/* Sugar Consumed Sub Card (Single Ring UI) */}
              <View
                style={{ backgroundColor: isDark ? 'rgba(255, 236, 210, 0.35)' : 'rgba(255, 236, 210, 0.35)', flex: 1 }}
                className="p-4 rounded-[20px] shadow-sm items-center justify-between"
              >
                <View className="items-center justify-center relative" style={{ width: 100, height: 100 }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: colors.border, position: 'absolute' }} />
                  <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: activeDayInfo.isEmpty ? colors.border : (totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759')), position: 'absolute', borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '45deg' }] }} />

                  <View className="items-center justify-center">
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
                      {activeDayInfo.isEmpty ? '0' : (totalSugar / 4.2).toFixed(1)}<Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>tsp</Text>
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                      {activeDayInfo.isEmpty ? '0' : totalSugar.toFixed(0)}g total
                    </Text>
                  </View>
                </View>

                {/* WHO Limit Pill */}
                <View style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)', alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight size={12} color={totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759')} />
                  <Text style={{ color: totalSugar > 25 ? '#FF3B30' : (totalSugar > 15 ? '#FF9500' : '#34C759'), fontSize: 10, fontWeight: '800' }}>
                    WHO Limit: {activeDayInfo.isEmpty ? '0' : Math.round((totalSugar / 25) * 100)}%
                  </Text>
                </View>
              </View>

              {/* Burn Down Jogging Sub Card */}
              <View
                style={{ backgroundColor: isDark ? 'rgba(255, 236, 210, 0.35)' : 'rgba(255, 236, 210, 0.35)', flex: 1 }}
                className="p-4 rounded-[20px] shadow-sm justify-between"
              >
                <View>
                  {/* Info Pill */}
                  <View style={{
                    backgroundColor: isDark ? 'rgba(255, 140, 0, 0.15)' : 'rgba(255, 140, 0, 0.1)',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    borderRadius: 8,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Flame size={12} color="#ff6a00ff" />
                    <Text style={{ color: '#ae7e04ff', fontSize: 8, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Burn Down
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Zap size={10} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Total Daily Intake
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 6 }}>
                    {activeDayInfo.isEmpty ? '0' : sumTotalPackagesCalories} <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary }}>kcal</Text>
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ color: '#FF8C00', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
                    {activeDayInfo.isEmpty ? '--' : (tpRunHours > 0 ? `${tpRunHours}h ${tpRunMins}m` : `${tpRunMins}m`)}
                  </Text>
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
                    borderWidth: 1,
                    borderRadius: 24,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2
                  }}
                >
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    fontWeight: '800',
                    marginBottom: 12,
                    marginLeft: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {group.title}
                  </Text>

                  {group.items.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        panY.setValue(0);
                        setSelectedScan(item);
                      }}
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.background,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: index === group.items.length - 1 ? 0 : 8,
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* Product Image */}
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#ffffff' }}
                            contentFit="contain"
                            transition={200}
                          />
                        ) : (
                          <View
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 12,
                              backgroundColor: colors.primary + '12',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ScanBarcode size={22} color={colors.primary} />
                          </View>
                        )}

                        {/* Product Metadata */}
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text
                            numberOfLines={1}
                            style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}
                          >
                            {item.name}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}
                          >
                            {item.brand || 'Generic Brand'}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Clock size={10} color={colors.textMuted} />
                            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}>
                              {new Date(item.timestamp).toLocaleDateString()} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Right Side: Sugar Teaspoons & Delete Action */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ alignItems: 'flex-end', marginRight: 2 }}>
                          <Text
                            style={{ color: getSugarColor(item.sugarTeaspoons, colors), fontSize: 15, fontWeight: '900', lineHeight: 15 }}
                          >
                            {item.sugarTeaspoons} <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>tsp</Text>
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>
                            ({item.sugarGrams}g)
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            deleteScan(item.id);
                          }}
                          style={{
                            backgroundColor: colors.background,
                            padding: 8,
                            borderRadius: 10
                          }}
                          activeOpacity={0.85}
                        >
                          <Trash2 size={13} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
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
