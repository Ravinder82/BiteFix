import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, PanResponder, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AnimatedReanimated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import { ScanBarcode, Activity, ArrowRight, Info, Sparkles, Trash2, Clock, X, AlertTriangle, Menu, HelpCircle } from 'lucide-react-native';
import { formatBloodSugarValue, getStatusColor, getStatusLabel } from '../../utils/bloodSugar';
import SettingsScreen from './settings';
import * as Haptics from 'expo-haptics';
import { ScanHistoryItem } from '../../types/app.types';



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
              style={{ color: colors.text }}
              className="text-lg font-black tracking-tight"
            >
              GoodBye Sugar
            </Text>
            <Text
              style={{ color: colors.textSecondary }}
              className="text-[9px] font-bold uppercase tracking-wider"
            >
              Sugar Scanner
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
        <View style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 24 }}>
          {/* Base Background for depth */}
          <LinearGradient
            colors={isDark ? ['#000000ff', '#000000ff'] : ['#ffffffff', '#ffffffff']}
            style={StyleSheet.absoluteFill}
          />
          {/* Abstract blobs for "liquid" look behind glass */}
          <View style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: isDark ? 'rgba(255, 149, 0, 1)' : 'rgba(255, 255, 255, 0)', transform: [{ scale: 1.5 }] }} />
          <View style={{ position: 'absolute', bottom: -50, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)', transform: [{ scale: 1.5 }] }} />

          <BlurView
            intensity={isDark ? 30 : 60}
            tint={isDark ? "dark" : "light"}
            style={{
              padding: 24,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(239, 239, 239, 0.5)' : 'rgba(239, 239, 239, 1)',
            }}
          >
            <AnimatedReanimated.View
              entering={FadeInDown.duration(600).springify()}
              style={{ alignItems: 'center', zIndex: 10, marginBottom: 20 }}
            >
              <Mascot state={latestScan && (latestScan.totalSugarTeaspoons ?? latestScan.sugarTeaspoons) > 6 ? 'shocked' : 'happy'} size={120} />
            </AnimatedReanimated.View>
            <View className="items-center" style={{ zIndex: 10 }}>
              <Text
                style={{ color: colors.primary }}
                className="text-[10px] font-black uppercase tracking-widest text-center"
              >
                {userName ? `Welcome, ${userName}` : 'Welcome Back'}
              </Text>
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

        {/* Dashboard Grid */}
        <View className="flex-row gap-4 mb-6">
          {/* Latest Scan Card */}
          <TouchableOpacity
            onPress={() => router.push('/scanner')}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            className="flex-1 p-5 border rounded-[24px] shadow-sm justify-between min-h-[135px]"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold uppercase tracking-wider">Latest Scan</Text>
              <ScanBarcode size={14} color={colors.primary} />
            </View>
            {latestScan ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={{ color: colors.text }} className="text-2xl font-black leading-none">
                    {latestScan.totalSugarTeaspoons ?? latestScan.sugarTeaspoons} <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">tsp</Text>
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.text }} className="text-[11px] font-bold mt-2">
                    {latestScan.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-[9px] mt-0.5">
                    {latestScan.totalSugarGrams !== undefined ? `(${latestScan.totalSugarGrams}g total)` : `(${latestScan.sugarGrams}g)`}
                  </Text>
                </View>
                {latestScan.imageUrl ? (
                  <Image
                    source={{ uri: latestScan.imageUrl }}
                    style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border }}
                    contentFit="contain"
                    transition={200}
                  />
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: colors.primary + '12',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ScanBarcode size={18} color={colors.primary} />
                  </View>
                )}
              </View>
            ) : (
              <View className="py-1">
                <Text style={{ color: colors.textMuted }} className="text-xs italic">No items scanned</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Latest Blood Sugar Card */}
          <TouchableOpacity
            onPress={() => router.push('/tracker')}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            className="flex-1 p-5 border rounded-[24px] shadow-sm justify-between min-h-[125px]"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold uppercase tracking-wider">Latest Log</Text>
              <Activity size={14} color={colors.secondary} />
            </View>
            {latestLog ? (
              <View>
                <Text style={{ color: colors.text }} className="text-2xl font-black leading-none">
                  {formatBloodSugarValue(latestLog.value, latestLog.unit)}{' '}
                  <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold">{latestLog.unit}</Text>
                </Text>
                {/* Health Range Pill */}
                <View
                  style={{ backgroundColor: getStatusColor(latestLog.status, colors) + '15' }}
                  className="px-2.5 py-0.5 rounded-full self-start mt-2"
                >
                  <Text
                    style={{ color: getStatusColor(latestLog.status, colors) }}
                    className="text-[8px] font-black uppercase tracking-wider"
                  >
                    {getStatusLabel(latestLog.status)}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="py-1">
                <Text style={{ color: colors.textMuted }} className="text-xs italic">No logs recorded</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Premium Educational Banner */}
        <View
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.secondary, borderLeftWidth: 4 }}
          className="p-5 rounded-r-[24px] rounded-l-[8px] border shadow-sm mb-6 flex-row gap-4"
        >
          <View
            style={{ backgroundColor: colors.secondary + '12' }}
            className="p-2.5 rounded-xl self-start"
          >
            <Info size={18} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.text }} className="font-bold text-sm">Why Teaspoons instead of Grams?</Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mt-2 leading-relaxed">
              Seeing sugar content in teaspoons helps you make healthy choices <Text className="font-bold"> WHO RECOMMENDATIONS:1 teaspoon = 4.2 grams </Text>
            </Text>
          </View>
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
            scans.map((item, index) => (
              <AnimatedReanimated.View
                key={item.id}
                entering={FadeInDown.delay(Math.min(index * 65, 400)).duration(300)}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    panY.setValue(0);
                    setSelectedScan(item);
                  }}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 20,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 1
                  }}
                  activeOpacity={0.95}
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
                        style={{ color: getSugarColor(item.totalSugarTeaspoons ?? item.sugarTeaspoons, colors), fontSize: 15, fontWeight: '900', lineHeight: 15 }}
                      >
                        {item.totalSugarTeaspoons ?? item.sugarTeaspoons} <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>tsp</Text>
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>
                        {item.totalSugarGrams !== undefined ? `(${item.totalSugarGrams}g total)` : `(${item.sugarGrams}g)`}
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
              </AnimatedReanimated.View>
            ))
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
