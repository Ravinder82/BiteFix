import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, Animated, StyleSheet, Modal, PanResponder, Alert } from 'react-native';
import { Text } from '@/components/Text';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import ProductHeroCardDashboard from '../../components/features/ProductHeroCardDashboard';
import { ScanBarcode, ArrowRight, Settings, Bookmark, ArrowUpRight, Trash2, X, Sparkles, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getBiteFixScoreColor, formatWeight, getNovaColor } from '../../utils/format';
import Svg, { Circle, Path, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, G } from 'react-native-svg';
import { CollectionItem } from '../../types/app.types';
import { mapToBiteFixCategory } from '../../utils/categoryMapper';

function SavedItemRow({ item, colors, isDark, onPress, onDelete }: { item: CollectionItem; colors: any; isDark: boolean; onPress: () => void; onDelete: () => void }) {
  const { sugarUnit } = useAppStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.imageUrl]);

  const cbScore = item.biteFixScore ?? 50;
  const ledColor = getBiteFixScoreColor(cbScore, item.novaClass);

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
        paddingTop: 16,
        marginBottom: 8,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.1 : 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Top-Right "Open" Link */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 }}>
          OPEN
        </Text>
        <ArrowUpRight size={10} color={colors.primary} />
      </View>

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
        {item.imageUrl && !imageError ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <ScanBarcode size={20} color={colors.primary} />
        )}
      </View>

      {/* Center Details - NO DATE OR TIMESTAMP */}
      <View style={{ flex: 1, marginLeft: 12, paddingRight: 44 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 }}>
          <Text
            style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1 }}
            numberOfLines={1}
          >
            {item.brand || 'Generic Brand'}
          </Text>
          {item.isSwapped && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(52, 199, 89, 0.15)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: 'rgba(52, 199, 89, 0.3)',
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34C759' }} />
              <Text style={{ color: '#34C759', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>
                SWAPPED
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}>
            {formatWeight(item.servingSize, sugarUnit) || '1 serving'} per serving
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 8 }}>•</Text>
          <Text style={{
            color: getNovaColor(item.novaClass),
            fontSize: 8,
            fontWeight: '900',
          }}>
            {item.novaClass ? `NOVA ${item.novaClass}` : 'Unclassified'}
          </Text>
          {(item.additiveCount ?? 0) > 0 && (
            <>
              <Text style={{ color: colors.textMuted, fontSize: 8 }}>•</Text>
              <Text style={{
                color: (item.additiveCount ?? 0) > 4 ? '#F5A623' : '#22C55E',
                fontSize: 8,
                fontWeight: '900',
              }}>
                {item.additiveCount} {(item.additiveCount ?? 0) === 1 ? 'additive' : 'additives'}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Right Column: BiteFix Score + NOVA LED + Delete Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: getBiteFixScoreColor(item.biteFixScore), fontSize: 14, fontWeight: '900' }}>
            {item.biteFixScore ?? '--'} <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '700' }}>/100</Text>
          </Text>
        </View>

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

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: 6,
            borderRadius: 10,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <Trash2 size={14} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { scans, collection, removeFromCollection, userName, sugarUnit } = useAppStore();
  const [selectedSavedItem, setSelectedSavedItem] = useState<CollectionItem | null>(null);
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          Animated.timing(panY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSelectedSavedItem(null);
            panY.setValue(0);
          });
        } else {
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

  // Animated shine coordinate for the CTA button
  const shineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const latestScan = scans[0];
  const shineX = useSharedValue(-220);

  // Animated rotation for the Food Alchemist Card orbital ring
  const orbitRotation1 = useSharedValue(0);
  const orbitRotation2 = useSharedValue(0);

  useEffect(() => {
    orbitRotation1.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
    orbitRotation2.value = withRepeat(
      withTiming(-360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const rotateStyle1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation1.value}deg` }],
  }));

  const rotateStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation2.value}deg` }],
  }));

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

  const mostRecentScan = scans.length > 0
    ? [...scans].sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

  const avgBiteFixScore = mostRecentScan ? (mostRecentScan.biteFixScore ?? 50) : 0;
  const latestNovaClass = mostRecentScan ? mostRecentScan.novaClass : undefined;

  const scoreColor = getBiteFixScoreColor(avgBiteFixScore, latestNovaClass);
  const getLighterScoreColor = () => {
    if (avgBiteFixScore >= 76) return '#4ADE80';
    if (avgBiteFixScore >= 51) return '#2DD4BF';
    if (avgBiteFixScore >= 26) return '#FBBF24';
    return '#F87171';
  };
  const lighterScoreColor = getLighterScoreColor();

  const getSmartSwapSuggestion = () => {
    if (scans.length === 0 || collection.length === 0) {
      return null;
    }

    const sortedScans = [...scans].sort((a, b) => b.timestamp - a.timestamp);

    for (const scan of sortedScans) {
      const scanScore = scan.biteFixScore ?? 50;
      if (scanScore < 60) {
        const scanCategory = mapToBiteFixCategory(scan.name, scan.brand, scan.categoryTag);

        const matchingCollectionItem = collection.find(item => {
          const itemCategory = item.biteFixCategory || mapToBiteFixCategory(item.name, item.brand, item.categoryTag);
          return itemCategory === scanCategory && (item.biteFixScore ?? 50) >= 75;
        });

        if (matchingCollectionItem) {
          return {
            unhealthy: scan,
            healthy: matchingCollectionItem,
            type: 'category-match' as const
          };
        }
      }
    }

    const sortedCollection = [...collection].sort((a, b) => (b.biteFixScore ?? 0) - (a.biteFixScore ?? 0));
    if (sortedCollection.length > 0 && (sortedCollection[0].biteFixScore ?? 0) >= 75) {
      return {
        healthy: sortedCollection[0],
        type: 'general-recommendation' as const
      };
    }

    return null;
  };

  const swapSuggestion = getSmartSwapSuggestion();

  const mascotState = avgBiteFixScore >= 76 ? 'happy' : avgBiteFixScore >= 41 ? 'idle' : (avgBiteFixScore > 0 ? 'shocked' : 'idle');

  const getMascotThought = () => {
    if (activeDayInfo.isEmpty) return "Scan any packaged food to see its health score and processing level!";
    if (avgBiteFixScore >= 76) return "Awesome choices today! Mostly clean, whole foods with minimal processing.";
    if (avgBiteFixScore >= 51) return "Good balance today. Swapping a few packaged items for whole foods will boost your score!";
    return "Heavily processed foods detected. Let's look for cleaner, simpler alternatives next time!";
  };
  // --- End BiteFix Aggregate Stats ---

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
              BiteFix
            </Text>
            <Text
              style={{ color: colors.primary, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6 }}
            >
              Food & Swap Scanner
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/settings');
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card A: Daily Clean Score Card */}
        <View
          style={{
            borderRadius: 32,
            overflow: 'hidden',
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.25 : 0.06,
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          {/* Card Ambient Glow Header */}
          <LinearGradient
            colors={
              avgBiteFixScore >= 76
                ? (isDark ? ['#064e3b20', '#022c2240'] : ['#d1fae560', '#f0fdf480'])
                : avgBiteFixScore >= 41
                  ? (isDark ? ['#1e1b4b10', '#0f172a20'] : ['#eff6ff60', '#f8fafc80'])
                  : (isDark ? ['#451a0320', '#1c191740'] : ['#fee2e260', '#fef2f280'])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            {/* Top Row: Title Badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }} numberOfLines={1}>
                  Last Scanned Product
                </Text>
              </View>
              <View style={{
                backgroundColor: colors.primary + '15',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.primary + '30',
              }}>
                <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {activeDayInfo.dateStr === 'Today' ? "Today" : activeDayInfo.dateStr}
                </Text>
              </View>
            </View>

            {/* Center Info Panel */}
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '100%' }}>
              {/* Animated Mascot Orb Container */}
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {/* ── Vertical Nutri-Score Indicator on Left ── */}
                {mostRecentScan && mostRecentScan.nutriScore ? (() => {
                  const activeGrade = mostRecentScan.nutriScore.toLowerCase();
                  const grades: Array<{ key: string; letter: string; color: string }> = [
                    { key: 'a', letter: 'A', color: '#038141' },
                    { key: 'b', letter: 'B', color: '#85BB2F' },
                    { key: 'c', letter: 'C', color: '#FECB02' },
                    { key: 'd', letter: 'D', color: '#EE8100' },
                    { key: 'e', letter: 'E', color: '#E63E11' },
                  ];

                  return (
                    <View
                      style={{
                        position: 'absolute',
                        left: -38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        borderWidth: 1,
                        borderRadius: 16,
                        paddingVertical: 8,
                        paddingHorizontal: 5,
                        gap: 4,
                        zIndex: 10,
                      }}
                    >
                      {grades.map((g) => {
                        const isActive = activeGrade === g.key;
                        return (
                          <View
                            key={g.key}
                            style={{
                              width: isActive ? 22 : 14,
                              height: isActive ? 22 : 14,
                              borderRadius: isActive ? 6 : 4,
                              backgroundColor: isActive ? g.color : g.color + '20',
                              borderColor: isActive ? '#FFFFFF' : g.color + '40',
                              borderWidth: isActive ? 1.5 : 0.5,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: isActive ? g.color : 'transparent',
                              shadowOffset: { width: 0, height: isActive ? 2 : 0 },
                              shadowOpacity: isActive ? 0.5 : 0,
                              shadowRadius: isActive ? 4 : 0,
                              elevation: isActive ? 2 : 0,
                            }}
                          >
                            <Text
                              style={{
                                color: isActive ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                fontSize: isActive ? 11 : 8,
                                fontWeight: '900',
                              }}
                            >
                              {g.letter}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })() : null}

                {/* 1. Static track and progress arc */}
                <Svg width={220} height={220} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                  <Defs>
                    <RadialGradient id="ringGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0%" stopColor={scoreColor} stopOpacity="0.25" />
                      <Stop offset="70%" stopColor={scoreColor} stopOpacity="0.05" />
                      <Stop offset="100%" stopColor={scoreColor} stopOpacity="0" />
                    </RadialGradient>
                    <SvgLinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={scoreColor} />
                      <Stop offset="100%" stopColor={lighterScoreColor} />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Ambient halo glow */}
                  <Circle cx="60" cy="60" r="54" fill="url(#ringGlow)" />
                  {/* Background progress track */}
                  <Circle cx="60" cy="60" r="48" fill="none" stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'} strokeWidth="3.5" />
                  {/* Inner glow progress arc */}
                  <Circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="301.6"
                    strokeDashoffset={301.6 * (1 - Math.max(5, avgBiteFixScore) / 100)}
                    transform="rotate(-90 60 60)"
                    opacity="0.2"
                  />
                  {/* Main progress arc */}
                  <Circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="url(#progressGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="301.6"
                    strokeDashoffset={301.6 * (1 - Math.max(5, avgBiteFixScore) / 100)}
                    transform="rotate(-90 60 60)"
                  />
                </Svg>

                {/* 2. Outer dashed ring rotating counter-clockwise */}
                <AnimatedReanimated.View style={[{ position: 'absolute', width: 220, height: 220 }, rotateStyle2]} pointerEvents="none">
                  <Svg width="100%" height="100%" viewBox="0 0 120 120">
                    <Circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="0.8"
                      strokeDasharray="6, 12"
                      opacity="0.18"
                    />
                  </Svg>
                </AnimatedReanimated.View>

                {/* 3. Inner dashed ring rotating clockwise */}
                <AnimatedReanimated.View style={[{ position: 'absolute', width: 220, height: 220 }, rotateStyle1]} pointerEvents="none">
                  <Svg width="100%" height="100%" viewBox="0 0 120 120">
                    <Circle
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="0.6"
                      strokeDasharray="3, 8"
                      opacity="0.25"
                    />
                  </Svg>
                </AnimatedReanimated.View>

                {/* 4. Glowing orbiting particle trailing system (Clockwise) */}
                <AnimatedReanimated.View style={[{ position: 'absolute', width: 220, height: 220 }, rotateStyle1]} pointerEvents="none">
                  <Svg width="100%" height="100%" viewBox="0 0 120 120">
                    {/* Lead particle */}
                    <Circle cx="60" cy="12" r="3.5" fill={scoreColor} />
                    <Circle cx="60" cy="12" r="7.5" fill={scoreColor} opacity={0.25} />
                    {/* Tail particle 1 */}
                    <Circle cx="55" cy="12.2" r="2.5" fill={scoreColor} opacity={0.65} />
                    {/* Tail particle 2 */}
                    <Circle cx="50.2" cy="13.1" r="1.8" fill={scoreColor} opacity={0.4} />
                    {/* Tail particle 3 */}
                    <Circle cx="45.6" cy="14.8" r="1.2" fill={scoreColor} opacity={0.2} />
                  </Svg>
                </AnimatedReanimated.View>

                {/* 5. Mascot */}
                <Mascot state={mascotState} size={148} />

                {/* 6. Score pill badge */}
                <View style={{
                  position: 'absolute',
                  bottom: -8,
                  backgroundColor: isDark ? 'rgba(31, 41, 55, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  borderWidth: 1.5,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: scoreColor,
                  }} />
                  <Text style={{
                    color: colors.text,
                    fontSize: 10,
                    fontWeight: '900',
                    letterSpacing: 0.4,
                  }}>
                    {activeDayInfo.isEmpty ? 'NO SCANS' : `SCORE: ${avgBiteFixScore}`}
                  </Text>
                </View>
              </View>
            </View>



            {/* Smart Swap Recommendation Widget */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1.5,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              {swapSuggestion ? (
                swapSuggestion.type === 'category-match' ? (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      panY.setValue(0);
                      setSelectedSavedItem(swapSuggestion.healthy);
                    }}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      padding: 14,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.15 : 0.02,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <RefreshCw size={12} color="#34C759" />
                      <Text style={{ color: '#34C759', fontSize: 10, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        Smart Swap Found
                      </Text>
                    </View>

                    {/* Side-by-Side Comparison */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Left: Unhealthy scanned product */}
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>
                          Recent Scan
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }} numberOfLines={1}>
                          {swapSuggestion.unhealthy.brand || 'Generic Brand'}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 10, fontWeight: '800' }}>
                          {swapSuggestion.unhealthy.name}
                        </Text>
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '900', marginTop: 3 }}>
                          Score: {swapSuggestion.unhealthy.biteFixScore ?? '--'}
                        </Text>
                      </View>

                      {/* Middle Arrow */}
                      <View style={{ paddingHorizontal: 10 }}>
                        <ArrowRight size={16} color="#34C759" />
                      </View>

                      {/* Right: Healthy saved product */}
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ color: '#22C55E', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>
                          Saved Upgrade
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }} numberOfLines={1}>
                          {swapSuggestion.healthy.brand || 'Generic Brand'}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 10, fontWeight: '800' }}>
                          {swapSuggestion.healthy.name}
                        </Text>
                        <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '900', marginTop: 3 }}>
                          Score: {swapSuggestion.healthy.biteFixScore ?? '--'}
                        </Text>
                      </View>
                    </View>

                    {/* Footer suggestion caption */}
                    <Text style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '600', marginTop: 10, textAlign: 'center' }}>
                      Tap to view details for your saved clean alternative
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      panY.setValue(0);
                      setSelectedSavedItem(swapSuggestion.healthy);
                    }}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      padding: 14,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.15 : 0.02,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Sparkles size={12} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        Pantry Showcase
                      </Text>
                    </View>

                    {/* Layout for single item */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>
                          {swapSuggestion.healthy.brand || 'Generic Brand'}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>
                          {swapSuggestion.healthy.name}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '600', marginTop: 2 }}>
                          Your highest-rated saved clean product. Keep it stocked!
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.25)' }}>
                        <Text style={{ color: '#22C55E', fontSize: 15, fontWeight: '900' }}>
                          {swapSuggestion.healthy.biteFixScore ?? '--'}
                        </Text>
                        <Text style={{ color: '#22C55E', fontSize: 7, fontWeight: '800', textTransform: 'uppercase', marginTop: 1 }}>
                          Score
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              ) : (
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.02)',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    padding: 14,
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <Bookmark size={11} color={colors.textMuted} />
                    <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Smart Pantry Swaps
                    </Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '600', textAlign: 'center', lineHeight: 14, maxWidth: 260 }}>
                    Save clean products to your list. We'll suggest upgrades here when you scan higher-sugar items in the same category!
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
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
                <Text className="text-white/70 text-xs mt-1">Reveal ingredients & processing level</Text>
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

        {/* Saved Products Section - No dates, matching History cards & modal */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between px-1 mb-3">
            <View className="flex-row items-center gap-2">
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                Saved Products
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
              {collection.length} {collection.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {collection.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 20,
                padding: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Bookmark size={22} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' }}>
                No Saved Products Yet
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center', lineHeight: 16, maxWidth: 240 }}>
                Tap "Save" on any scan result to bookmark clean choices and alternatives to your dashboard.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {collection.map((item) => (
                <SavedItemRow
                  key={item.id}
                  item={item}
                  colors={colors}
                  isDark={isDark}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    panY.setValue(0);
                    setSelectedSavedItem(item);
                  }}
                  onDelete={() => {
                    Alert.alert(
                      'Remove Saved Item',
                      'Remove this product from your saved list?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => removeFromCollection(item.id),
                        },
                      ]
                    );
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Saved Product Details Modal */}
      <Modal
        visible={selectedSavedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSavedItem(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setSelectedSavedItem(null)}
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
              <View style={{ width: 48, height: 5, backgroundColor: isDark ? '#444' : '#ccc', borderRadius: 3, marginBottom: 8 }} />

              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                  Product Details
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedSavedItem(null)}
                  style={{ backgroundColor: colors.background, padding: 8, borderRadius: 20 }}
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {selectedSavedItem && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Swap Telemetry Banner if Saved as Swap */}
                {selectedSavedItem.isSwapped && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.08)',
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(52, 199, 89, 0.3)',
                    gap: 6
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' }} />
                        <Text style={{ color: '#34C759', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
                          SWAPPED
                        </Text>
                      </View>
                    </View>
                    {selectedSavedItem.originalNovaClass && selectedSavedItem.novaClass && (
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                        Processing improved from NOVA {selectedSavedItem.originalNovaClass} to NOVA {selectedSavedItem.novaClass}.
                      </Text>
                    )}
                  </View>
                )}

                {/* 1. Executive Telemetry: Purity & Additives Audit */}
                <View style={{ marginBottom: 4 }}>
                  <ProductHeroCardDashboard
                    scanResult={selectedSavedItem}
                    colors={colors}
                    isDark={isDark}
                  />
                </View>

                {/* 2. Sugar & Energy Telemetry */}
                <NutritionFacts
                  colors={colors}
                  productName={selectedSavedItem.name}
                  sugarGrams={selectedSavedItem.sugarGrams ?? selectedSavedItem.sugarPer100g ?? 0}
                  calories={selectedSavedItem.calories}
                  servingSize={formatWeight(selectedSavedItem.servingSize, sugarUnit) || '100 g / 100 ml'}
                  sugarPer100g={selectedSavedItem.sugarPer100g}
                  whoLimitServingPercent={selectedSavedItem.whoLimitServingPercent ?? (selectedSavedItem.sugarTeaspoons !== undefined ? Math.round((selectedSavedItem.sugarTeaspoons / 12) * 100) : undefined)}
                  isDefaultServing={selectedSavedItem.isDefaultServing}
                  hasHiddenSugars={selectedSavedItem.hasHiddenSugars}
                  hiddenSugars={selectedSavedItem.hiddenSugars}
                  hiddenSugarCount={selectedSavedItem.hiddenSugarCount}
                  nutriScore={selectedSavedItem.nutriScore}
                />

                {/* 3. Action Dock */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert(
                        'Remove Saved Item',
                        'Remove this product from your saved list?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              removeFromCollection(selectedSavedItem.id);
                              setSelectedSavedItem(null);
                            }
                          }
                        ]
                      );
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 15,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={{ color: colors.error, fontWeight: '800', fontSize: 13 }}>Remove</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSavedItem(null);
                    }}
                    style={{
                      flex: 1.3,
                      paddingVertical: 15,
                      borderRadius: 16,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 10,
                      elevation: 4,
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
