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
import { ScanBarcode, Activity, ArrowRight, Info, Sparkles, Trash2, Clock, X, AlertTriangle, Menu, ShieldAlert, FlaskConical } from 'lucide-react-native';
import { formatBloodSugarValue, getStatusColor, getStatusLabel } from '../../utils/bloodSugar';
import SettingsScreen from './settings';
import * as Haptics from 'expo-haptics';
import { ScanHistoryItem } from '../../types/app.types';



const getNovaInfo = (group?: number) => {
  switch (group) {
    case 1: return {
      color: '#22C55E',
      glowColor: 'rgba(34, 197, 94, 0.4)',
      label: 'Unprocessed',
      description: 'Unprocessed or minimally processed foods. These are natural foods altered only by removal of inedible parts, drying, crushing, grinding, pasteurization, or fermentation. No added substances.',
    };
    case 2: return {
      color: '#84CC16',
      glowColor: 'rgba(132, 204, 22, 0.4)',
      label: 'Processed Ingredient',
      description: 'Processed culinary ingredients obtained from Group 1 foods by pressing, refining, grinding, or milling. Oils, butter, sugar, salt, flour.',
    };
    case 3: return {
      color: '#F59E0B',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      label: 'Processed',
      description: 'Processed foods made by adding salt, oil, sugar, or other substances to Group 1 foods. Canned vegetables, cheeses, freshly made bread.',
    };
    case 4: return {
      color: '#EF4444',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      label: 'Ultra-Processed',
      description: 'Ultra-processed food products made mostly from substances derived from foods and additives. Studies in The BMJ (2019) and JAMA (2022) link high intake to increased risk of obesity, type 2 diabetes, cardiovascular disease, and all-cause mortality.',
    };
    default: return {
      color: '#9CA3AF',
      glowColor: 'rgba(156, 163, 175, 0.3)',
      label: 'Unknown',
      description: 'Processing level data not available for this product.',
    };
  }
};

const formatAdditive = (tag: string) => {
  const parts = tag.split(':');
  const code = parts[parts.length - 1];
  return code.toUpperCase().replace('-', ' ');
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
              Teaspoon Scanner
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
            colors={isDark ? ['#1A1A1A', '#0D0D0D'] : ['#F9FAFB', '#F3F4F6']}
            style={StyleSheet.absoluteFill}
          />
          {/* Abstract blobs for "liquid" look behind glass */}
          <View style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: isDark ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.15)', transform: [{ scale: 1.5 }] }} />
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
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
            }}
          >
            <AnimatedReanimated.View 
              entering={FadeInDown.duration(600).springify()}
              style={{ alignItems: 'center', zIndex: 10, marginBottom: 20 }}
            >
              <Mascot state={latestScan && latestScan.sugarTeaspoons > 6 ? 'shocked' : 'happy'} size={120} />
            </AnimatedReanimated.View>
            <View className="items-center" style={{ zIndex: 10 }}>
              <Text 
                style={{ color: colors.primary }} 
                className="text-[10px] font-black uppercase tracking-widest text-center"
              >
                {userName ? `Welcome, ${userName}` : 'Welcome Back'}
              </Text>
              <Text 
                style={{ color: colors.text }} 
                className="text-3xl font-black mt-2 leading-tight text-center"
              >
                {userName ? `Ready to see the sugar, ${userName}?` : 'Ready to see the sugar?'}
              </Text>
              <Text 
                style={{ color: colors.textSecondary }} 
                className="text-sm mt-3 leading-relaxed font-medium text-center px-4"
              >
                Let's scan barcodes to reveal hidden sugars and track your glucose log.
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
                <Text className="text-white/70 text-xs mt-1">Converts grams of sugar to teaspoons</Text>
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
                    {latestScan.sugarTeaspoons} <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">tsp</Text>
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.text }} className="text-[11px] font-bold mt-2">
                    {latestScan.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-[9px] mt-0.5">
                    ({latestScan.sugarGrams}g sugar)
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
              Grams are abstract, but teaspoons are tangible. We convert sugar content using the standard conversion of <Text className="font-bold">1 teaspoon = 4.2 grams</Text>. Seeing sugar content in teaspoons helps you make quick, intuitive healthy choices.
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
                    <Text style={{ color: colors.textMuted }} className="text-[9px] font-mono mt-1.5">
                      Barcode: {selectedScan.barcode}
                    </Text>
                  )}

                  {/* Reactive Mascot */}
                  <View style={{ marginTop: 24, marginBottom: 16 }}>
                    <Mascot 
                      state={
                        selectedScan.sugarTeaspoons > 6 
                          ? 'shocked' 
                          : selectedScan.sugarTeaspoons > 3 
                            ? 'dizzy' 
                            : 'happy'
                      }
                      size={120}
                    />
                  </View>

                  {/* Massive Impact Typography for Sugar */}
                  <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={{
                        color: getSugarColor(selectedScan.sugarTeaspoons, colors),
                        fontSize: 72,
                        fontWeight: '900',
                        letterSpacing: -2,
                        lineHeight: 72
                      }}>
                        {selectedScan.sugarTeaspoons}
                      </Text>
                      <Text style={{
                        color: getSugarColor(selectedScan.sugarTeaspoons, colors),
                        fontSize: 24,
                        fontWeight: '800',
                        marginLeft: 6
                      }}>
                        tsp
                      </Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Total Sugar
                    </Text>
                  </View>
                </View>

                {/* 2. Unified Health Insights Card (NOVA + Additives + Better Choices) */}
                {(() => {
                  const nova = getNovaInfo(selectedScan.novaGroup);
                  if (!selectedScan.novaGroup && (!selectedScan.additivesTags || selectedScan.additivesTags.length === 0)) return null;

                  return (
                    <View style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 28,
                      padding: 24,
                      marginBottom: 24,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <ShieldAlert size={18} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Health Insights</Text>
                      </View>

                      {/* NOVA Pill & Studies Pill Row */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {selectedScan.novaGroup && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: nova.color + '15',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 99,
                            borderWidth: 1,
                            borderColor: nova.color + '30',
                            gap: 6
                          }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: nova.color }} />
                            <Text style={{ color: nova.color, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              NOVA {selectedScan.novaGroup} — {nova.label}
                            </Text>
                          </View>
                        )}

                      </View>

                      {/* Additives Mini Card */}
                      {selectedScan.additivesTags && selectedScan.additivesTags.length > 0 && (
                        <View style={{
                          backgroundColor: colors.surfaceRaised,
                          padding: 16,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: colors.border,
                          marginBottom: selectedScan.categoryTag ? 20 : 0
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <FlaskConical size={14} color={colors.textSecondary} />
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                              {selectedScan.additivesTags.length} Additive{selectedScan.additivesTags.length > 1 ? 's' : ''} Detected
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {selectedScan.additivesTags.slice(0, 12).map((tag, i) => (
                              <View key={i} style={{
                                backgroundColor: colors.background,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: colors.border
                              }}>
                                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>
                                  {formatAdditive(tag)}
                                </Text>
                              </View>
                            ))}
                            {selectedScan.additivesTags.length > 12 && (
                              <View style={{
                                backgroundColor: colors.background,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: colors.border
                              }}>
                                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>
                                  +{selectedScan.additivesTags.length - 12} more
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {/* Better Choices Button (Inside the Card) */}
                    </View>
                  );
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
    return colors.error || '#ef4444';
  }
  if (teaspoons > 3) {
    return colors.warning || '#eab308';
  }
  return colors.success || '#10b981';
}
