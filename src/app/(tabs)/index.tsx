import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, Animated, Modal, PanResponder, Alert } from 'react-native';
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
import { ScanBarcode, ArrowRight, Settings, Bookmark, ArrowUpRight, Trash2, X, ShieldCheck, Leaf, ShieldAlert, CheckCircle, CloudRain, Globe, Flame, Activity, Bike, Waves, Footprints } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getBiteFixScoreColor, formatWeight, getNovaColor } from '../../utils/format';
import Svg, { Circle, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, G } from 'react-native-svg';
import { CollectionItem, AdditiveDetail } from '../../types/app.types';
import { mapToBiteFixCategory } from '../../utils/categoryMapper';
import { ShieldPillCard } from '../../components/ShieldPillCard';
import { EcoScoreCard } from '../../components/EcoScoreCard';
import { GutShieldCard } from '../../components/features/GutShieldCard';
import { AdditiveDetectiveCard } from '../../components/features/AdditiveDetectiveCard';
import { detectShieldAlerts } from '../../utils/scannerAPI';
import { evaluateGutHealth } from '../../utils/gutShieldEvaluator';

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
          <Mascot state="idle" size={36} />
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
          {item.nutriScore && (
            <>
              <Text style={{ color: colors.textMuted, fontSize: 8 }}>•</Text>
              <Text style={{
                color: item.nutriScore === 'a' ? '#038141' : item.nutriScore === 'b' ? '#85BB2F' : item.nutriScore === 'c' ? '#FECB02' : item.nutriScore === 'd' ? '#EE8100' : '#E63E11',
                fontSize: 8,
                fontWeight: '900',
                textTransform: 'uppercase'
              }}>
                NUTRI-SCORE {item.nutriScore}
              </Text>
            </>
          )}
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
  const { collection, removeFromCollection, userName, sugarUnit, dietPreference, trackEcoScore, trackOrganic, allergenFilters } = useAppStore();
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



  // Helper function to calculate Gut Health Score for an item (0-100 scale) using evaluateGutHealth
  const getGutHealthScore = (item: any): number => {
    return evaluateGutHealth(item.additives ?? []).score;
  };

  const basketItemCount = collection.length;

  // Algorithmic Overall Average for Your Basket
  const avgBiteFixScore = basketItemCount > 0
    ? Math.round(collection.reduce((sum, item) => sum + (item.biteFixScore ?? 50), 0) / basketItemCount)
    : 0;

  const avgGutHealthScore = basketItemCount > 0
    ? Math.round(collection.reduce((sum, item) => sum + getGutHealthScore(item), 0) / basketItemCount)
    : 100;

  const latestNovaClass = basketItemCount > 0
    ? collection[0].novaClass
    : undefined;

  const getAvgNutriScore = (): 'a' | 'b' | 'c' | 'd' | 'e' | undefined => {
    if (basketItemCount === 0) {
      return undefined;
    }
    const scoreMap = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const revMap = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' } as const;
    let sum = 0;
    let count = 0;
    collection.forEach((item) => {
      if (item.nutriScore) {
        sum += scoreMap[item.nutriScore.toLowerCase() as keyof typeof scoreMap] || 3;
        count++;
      }
    });
    if (count === 0) return undefined;
    const avg = Math.round(sum / count);
    return revMap[Math.min(5, Math.max(1, avg)) as keyof typeof revMap];
  };

  const avgNutriScore = getAvgNutriScore();

  // --- BASKET DIET & ECO METRICS ---
  const organicCount = useMemo(() => collection.filter(i => i.isOrganic).length, [collection]);
  const organicRatio = basketItemCount > 0 ? (organicCount / basketItemCount) * 100 : 0;
  
  const veganCount = useMemo(() => collection.filter(i => i.isVegan).length, [collection]);
  const vegetarianCount = useMemo(() => collection.filter(i => (i.isVegetarian || i.isVegan) && !i.isVegan).length, [collection]);
  const nonVegCount = useMemo(() => collection.filter(i => i.isVegetarian === false && i.isVegan === false).length, [collection]);
  
  const getEcoScoreCounts = () => {
    const counts = { a: 0, b: 0, c: 0, d: 0, e: 0, unknown: 0 };
    collection.forEach(item => {
      const g = item.ecoscoreGrade?.toLowerCase() || 'unknown';
      if (counts[g as keyof typeof counts] !== undefined) {
        counts[g as keyof typeof counts]++;
      }
    });
    return counts;
  };
  const ecoScoreCounts = useMemo(getEcoScoreCounts, [collection]);

  const getAvgEcoScore = () => {
    if (basketItemCount === 0) return undefined;
    const scoreMap = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const revMap = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' } as const;
    let sum = 0;
    let count = 0;
    collection.forEach((item) => {
      if (item.ecoscoreGrade && item.ecoscoreGrade !== 'unknown') {
        sum += scoreMap[item.ecoscoreGrade.toLowerCase() as keyof typeof scoreMap] || 3;
        count++;
      }
    });
    if (count === 0) return undefined;
    const avg = Math.round(sum / count);
    return revMap[Math.min(5, Math.max(1, avg)) as keyof typeof revMap];
  };

  const avgEcoScore = useMemo(getAvgEcoScore, [collection, basketItemCount]);

  const totalCarbonFootprintGrams = useMemo(() => {
    if (basketItemCount === 0) return 0;
    return collection.reduce((acc, item) => acc + (item.carbonFootprint100g || 0), 0);
  }, [collection, basketItemCount]);

  const totalCarbonFootprintKg = (totalCarbonFootprintGrams / 1000).toFixed(2);
  const milesDrivenEquivalent = (parseFloat(totalCarbonFootprintKg) * 4.0).toFixed(1);
  // --------------------------

  const totalSugarTeaspoons = useMemo(() => {
    if (basketItemCount === 0) return 0;
    return collection.reduce((acc, item) => acc + (item.sugarTeaspoons || 0), 0);
  }, [collection, basketItemCount]);

  const totalBasketCalories = useMemo(() => {
    if (basketItemCount === 0) return 0;
    return Math.round(collection.reduce((acc, item) => acc + (item.calories || 0), 0));
  }, [collection, basketItemCount]);

  const burnDownActivities = useMemo(() => {
    if (totalBasketCalories === 0) return null;
    const jogMins = Math.round(totalBasketCalories / 8.5);
    const cycleMins = Math.round(totalBasketCalories / 6.5);
    const swimMins = Math.round(totalBasketCalories / 7.5);
    const walkMins = Math.round(totalBasketCalories / 4.2);
    return { jogMins, cycleMins, swimMins, walkMins };
  }, [totalBasketCalories]);

  const formatBurnTime = (mins: number): string => {
    if (!mins || mins <= 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const scoreColor = basketItemCount === 0
    ? '#D1D5DB'
    : getBiteFixScoreColor(avgBiteFixScore, latestNovaClass);
  const getLighterScoreColor = () => {
    if (basketItemCount === 0) return '#E5E7EB';
    if (avgBiteFixScore >= 76) return '#4ADE80';
    if (avgBiteFixScore >= 51) return '#2DD4BF';
    if (avgBiteFixScore >= 26) return '#FBBF24';
    return '#F87171';
  };
  const lighterScoreColor = getLighterScoreColor();



  const mascotState = basketItemCount === 0
    ? 'idle'
    : avgBiteFixScore >= 76
      ? 'happy'
      : avgBiteFixScore >= 41
        ? 'idle'
        : 'shocked';

  const getMascotThought = () => {
    if (basketItemCount === 0) return "Add clean products to Your Basket to calculate your overall Health & Gut scores!";
    if (avgBiteFixScore >= 76) return `Your Basket score is ${avgBiteFixScore}! Exceptionally clean & gut-friendly overall.`;
    if (avgBiteFixScore >= 51) return `Your Basket score is ${avgBiteFixScore}. Swapping a few items will boost your scores!`;
    return `Your Basket score is ${avgBiteFixScore}. Highly processed products detected. Check Smart Swaps!`;
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
              Scan.Save.Eat Clean
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
            marginBottom: 20,
            backgroundColor: 'transparent',
          }}
        >
          {/* Card Ambient Glow Header */}
          <LinearGradient
            colors={['transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 0 }}
          >
            {/* Top Row: Title Badge */}
            <View style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginBottom: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
                  BiteFix Basket Scoreboard
                </Text>
              </View>
            </View>

            {/* Center Info Panel (Mascot Ring) */}
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '100%' }}>
              {/* Animated Mascot Orb Container */}
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

                {/* 1. Static track and premium progress arc */}
                <Svg width={220} height={220} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                  <Defs>
                    <RadialGradient id="ringGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0%" stopColor={scoreColor} stopOpacity="0.4" />
                      <Stop offset="70%" stopColor={scoreColor} stopOpacity="0.1" />
                      <Stop offset="100%" stopColor={scoreColor} stopOpacity="0" />
                    </RadialGradient>
                    <SvgLinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={scoreColor} />
                      <Stop offset="100%" stopColor={lighterScoreColor} />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Ambient halo glow */}
                  <Circle cx="60" cy="60" r="54" fill="url(#ringGlow)" />
                  {/* Background thick progress track */}
                  <Circle cx="60" cy="60" r="48" fill="none" stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'} strokeWidth="12" />
                  {/* Outer premium glass border */}
                  <Circle cx="60" cy="60" r="56" fill="none" stroke={scoreColor} strokeWidth="1.5" opacity="0.25" />
                  <Circle cx="60" cy="60" r="40" fill="none" stroke={scoreColor} strokeWidth="1.5" opacity="0.15" />

                  {/* Main thick progress arc */}
                  <Circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="url(#progressGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="301.6"
                    strokeDashoffset={
                      basketItemCount === 0
                        ? 301.6
                        : 301.6 * (1 - Math.max(5, avgBiteFixScore) / 100)
                    }
                    transform="rotate(-90 60 60)"
                  />
                </Svg>



                {/* 5. Mascot */}
                <View style={{ marginTop: 24 }}>
                  <Mascot state={mascotState} size={115} />
                </View>

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
                    {basketItemCount === 0 ? 'BASKET EMPTY' : `BASKET SCORE: ${avgBiteFixScore}`}
                  </Text>
                </View>
              </View>

            </View>



            {/* Basket Processing Composition Section (NOVA Distribution Street Lights) */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1.5,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 4 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Basket NOVA Profile (Processing Levels)
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                {[
                  { level: 1, color: '#10B981', label: 'Whole' },
                  { level: 2, color: '#14B8A6', label: 'Culinary' },
                  { level: 3, color: '#F59E0B', label: 'Processed' },
                  { level: 4, color: '#EF4444', label: 'Ultra-Proc' },
                ].map(({ level, color, label }) => {
                  const count = collection.filter(item => item.novaClass === level).length;
                  const isLightActive = count > 0;

                  return (
                    <View key={level} style={{ flex: 1 }}>
                      <View
                        style={{
                          paddingVertical: 10,
                          borderRadius: 16,
                          backgroundColor: isLightActive
                            ? (isDark ? `${color}15` : `${color}08`)
                            : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                          borderWidth: 1.5,
                          borderColor: isLightActive ? color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: isLightActive ? colors.text : colors.textMuted,
                            fontSize: 9.5,
                            fontWeight: '900',
                            marginTop: 1
                          }}
                        >
                          NOVA {level}
                        </Text>
                        <View
                          style={{
                            backgroundColor: isLightActive ? color : 'transparent',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            marginTop: 2,
                          }}
                        >
                          <Text
                            style={{
                              color: isLightActive ? '#FFFFFF' : colors.textMuted,
                              fontSize: 10,
                              fontWeight: '900'
                            }}
                          >
                            {count}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Basket Nutri-Score Distribution Section */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1.5,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Basket Nutri-Score
                </Text>
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}>
                  <Text style={{ color: colors.text, fontSize: 10, fontWeight: '900' }}>
                    AVERAGE: {avgNutriScore ? `GRADE ${avgNutriScore.toUpperCase()}` : '--'}
                  </Text>
                </View>
              </View>

              {/* Horizontal Progress Bar Facade (Traffic Lights) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 40,
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 20,
                  paddingHorizontal: 6,
                  position: 'relative',
                }}
              >
                {[
                  { key: 'a', letter: 'A', color: '#038141' },
                  { key: 'b', letter: 'B', color: '#85BB2F' },
                  { key: 'c', letter: 'C', color: '#FECB02' },
                  { key: 'd', letter: 'D', color: '#EE8100' },
                  { key: 'e', letter: 'E', color: '#E63E11' },
                ].map((g, index, arr) => {
                  const isActive = avgNutriScore ? avgNutriScore.toLowerCase() === g.key : false;
                  const isFirst = index === 0;
                  const isLast = index === arr.length - 1;

                  return (
                    <View
                      key={g.key}
                      style={{
                        flex: 1,
                        height: isActive ? 30 : 26,
                        backgroundColor: isActive ? g.color : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                        borderColor: isActive ? '#FFFFFF' : (isDark ? g.color + '60' : g.color + '35'),
                        borderWidth: isActive ? 1.5 : 1,
                        borderTopLeftRadius: isFirst ? 16 : (isActive ? 8 : 6),
                        borderBottomLeftRadius: isFirst ? 16 : (isActive ? 8 : 6),
                        borderTopRightRadius: isLast ? 16 : (isActive ? 8 : 6),
                        borderBottomRightRadius: isLast ? 16 : (isActive ? 8 : 6),
                        marginHorizontal: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: isActive ? g.color : 'transparent',
                        shadowOffset: { width: 0, height: isActive ? 4 : 0 },
                        shadowOpacity: isActive ? 0.6 : 0,
                        shadowRadius: 8,
                        elevation: isActive ? 4 : 0,
                        zIndex: isActive ? 10 : 1,
                      }}
                    >
                      {isActive ? (
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                          {g.letter}
                        </Text>
                      ) : (
                        <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: '900' }}>
                          {g.letter}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── CARD B1: Basket Eco-Score & Climate Telemetry Card (Apple Liquid Glass) ── */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1.5,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Leaf size={14} color="#10B981" />
                  <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Basket Climate Telemetry
                  </Text>
                </View>
                <View style={{
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                }}>
                  <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '900' }}>
                    {avgEcoScore ? `GRADE ${avgEcoScore.toUpperCase()}` : 'NO DATA'}
                  </Text>
                </View>
              </View>

              {/* Eco-Score Traffic Bar */}
              <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { key: 'a', letter: 'A', color: '#1E8F4E' },
                    { key: 'b', letter: 'B', color: '#2ECC71' },
                    { key: 'c', letter: 'C', color: '#F1C40F' },
                    { key: 'd', letter: 'D', color: '#E67E22' },
                    { key: 'e', letter: 'E', color: '#E74C3C' }
                  ].map(g => {
                    const count = ecoScoreCounts[g.key as keyof typeof ecoScoreCounts] || 0;
                    const isActive = avgEcoScore === g.key;
                    return (
                      <View key={g.key} style={{ flex: 1, alignItems: 'center' }}>
                        <View style={{
                          height: isActive ? 6 : 4,
                          width: '100%',
                          backgroundColor: g.color,
                          borderRadius: 3,
                          marginBottom: 6,
                          opacity: count > 0 ? 1 : 0.2,
                          shadowColor: isActive ? g.color : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isActive ? 0.5 : 0,
                          shadowRadius: 4,
                        }} />
                        <Text style={{ color: count > 0 ? colors.text : colors.textMuted, fontSize: 10, fontWeight: '900' }}>
                          {g.letter} <Text style={{ color: count > 0 ? colors.primary : colors.textMuted, fontWeight: '700' }}>({count})</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Total CO2 Footprint & Real-World Offset Metric */}
              <LinearGradient
                colors={isDark ? ['rgba(16, 185, 129, 0.12)', 'rgba(6, 182, 212, 0.04)'] : ['#ECFDF5', '#F0FDFA']}
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.25)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ backgroundColor: '#10B981', padding: 8, borderRadius: 12 }}>
                    <CloudRain size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Total Carbon Mass</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 1 }}>
                      {basketItemCount > 0 ? `🚗 ~${milesDrivenEquivalent} mi driven equiv.` : '0.0 mi driven'}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>
                    {totalCarbonFootprintGrams >= 1000 ? `${totalCarbonFootprintKg} kg` : `${totalCarbonFootprintGrams.toFixed(0)} g`} CO₂
                  </Text>
                </View>
              </LinearGradient>
            </View>



            {/* Sleek Shimmering Pill Bar: Total Sugar */}
            <LinearGradient
              colors={isDark ? ['rgba(255,255,255,0.15)', 'rgba(240, 255, 231, 0.02)'] : ['#FFFFFF', '#F0FDF4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 16,
                paddingTop: 12,
                paddingBottom: 12,
                width: '100%',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                paddingHorizontal: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'column' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Sugar</Text>
                <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '500', marginTop: 2 }}>1 tsp = 4.2g (WHO)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{totalSugarTeaspoons.toFixed(1)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>tsp / serving</Text>
              </View>
            </LinearGradient>

            {/* Active Calorie Burn Down Section (Concept 2 - Apple Liquid Glass Slider) */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1.5, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Flame size={14} color="#F97316" />
                  <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Active Calorie Burn Down
                  </Text>
                </View>
                <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
                  <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '900' }}>
                    {totalBasketCalories} kcal
                  </Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                {/* Card 1: Jogging */}
                <LinearGradient
                  colors={isDark ? ['rgba(249, 115, 22, 0.15)', 'rgba(249, 115, 22, 0.04)'] : ['#FFF7ED', '#FFEDD5']}
                  style={{
                    width: 110,
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(249, 115, 22, 0.3)',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: '#F97316', padding: 6, borderRadius: 10 }}>
                      <Activity size={14} color="#FFFFFF" />
                    </View>
                    <Text style={{ color: '#F97316', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>HIGH</Text>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Jogging</Text>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
                      {formatBurnTime(burnDownActivities?.jogMins ?? 0)}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Card 2: Cycling */}
                <LinearGradient
                  colors={isDark ? ['rgba(6, 182, 212, 0.15)', 'rgba(6, 182, 212, 0.04)'] : ['#ECFEFF', '#CFFAFE']}
                  style={{
                    width: 110,
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(6, 182, 212, 0.3)',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: '#06B6D4', padding: 6, borderRadius: 10 }}>
                      <Bike size={14} color="#FFFFFF" />
                    </View>
                    <Text style={{ color: '#06B6D4', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>MOD</Text>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Cycling</Text>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
                      {formatBurnTime(burnDownActivities?.cycleMins ?? 0)}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Card 3: Swimming */}
                <LinearGradient
                  colors={isDark ? ['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.04)'] : ['#EFF6FF', '#DBEAFE']}
                  style={{
                    width: 110,
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: '#3B82F6', padding: 6, borderRadius: 10 }}>
                      <Waves size={14} color="#FFFFFF" />
                    </View>
                    <Text style={{ color: '#3B82F6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>MOD</Text>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Swimming</Text>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
                      {formatBurnTime(burnDownActivities?.swimMins ?? 0)}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Card 4: Brisk Walk */}
                <LinearGradient
                  colors={isDark ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.04)'] : ['#ECFDF5', '#D1FAE5']}
                  style={{
                    width: 110,
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: '#10B981', padding: 6, borderRadius: 10 }}>
                      <Footprints size={14} color="#FFFFFF" />
                    </View>
                    <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>LOW</Text>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Brisk Walk</Text>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
                      {formatBurnTime(burnDownActivities?.walkMins ?? 0)}
                    </Text>
                  </View>
                </LinearGradient>
              </ScrollView>
            </View>
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1.5,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Basket Gut Health
                </Text>
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <ShieldCheck size={11} color={avgGutHealthScore >= 75 ? '#A855F7' : avgGutHealthScore >= 50 ? '#D946EF' : '#F43F5E'} />
                  <Text style={{ color: colors.text, fontSize: 10, fontWeight: '900' }}>
                    SCORE: {avgGutHealthScore}%
                  </Text>
                </View>
              </View>

              {/* Horizontal Progress Bar Track */}
              <View
                style={{
                  height: 26,
                  width: '100%',
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Progress Fill Wrapper (determines width based on score) */}
                <View
                  style={{
                    height: '100%',
                    width: `${Math.max(10, avgGutHealthScore)}%`,
                    borderRadius: 13,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Glowing core instead of animated waves */}
                  <LinearGradient
                    colors={
                      avgGutHealthScore >= 75
                        ? ['rgba(168, 85, 247, 0.4)', '#A855F7']
                        : avgGutHealthScore >= 50
                          ? ['rgba(217, 70, 239, 0.4)', '#D946EF']
                          : ['rgba(244, 63, 94, 0.4)', '#F43F5E']
                    }
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                    }}
                  />

                  {/* Outer glassy shine */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: '50%',
                      left: 0,
                      right: 0,
                    }}
                  />

                  {avgGutHealthScore < 100 && (
                    <View
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        backgroundColor: '#FFFFFF',
                        shadowColor: avgGutHealthScore >= 75 ? '#A855F7' : avgGutHealthScore >= 50 ? '#D946EF' : '#F43F5E',
                        shadowOffset: { width: -2, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 4,
                        elevation: 3,
                        zIndex: 20,
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Info Label Below Progress Bar */}
              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <Text
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.5)',
                    fontSize: 9,
                    fontWeight: '900',
                    letterSpacing: 0.5,
                    textAlign: 'center',
                  }}
                >
                  {avgGutHealthScore >= 75
                    ? '🟢 EXCELLENT MICROBIOME STANDING'
                    : avgGutHealthScore >= 50
                      ? '🟡 MODERATE GUT INTEGRITY'
                      : '🔴 CRITICAL GUT DISRUPTORS DETECTED'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>



        {/* Your Basket Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between px-1 mb-3">
            <View className="flex-row items-center gap-2">
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                Your Basket
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
                Your Basket is Empty
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center', lineHeight: 16, maxWidth: 240 }}>
                Tap "Save" on any scan result or swap result to add products to your basket and calculate your aggregate scores.
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
                      'Remove from Your Basket',
                      'Remove this product from your basket?',
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
                {/* 0. Proactive Shield Pill Cards (Allergens, Palm Oil, Diet Warnings) */}
                <View style={{ marginBottom: 12 }}>
                  {selectedSavedItem.ingredientsText && allergenFilters.length > 0 && detectShieldAlerts(selectedSavedItem.ingredientsText, allergenFilters).map((alert, idx) => (
                    <ShieldPillCard key={`${alert.id}-${idx}`} alert={alert} index={idx} />
                  ))}
                  
                  {dietPreference === 'vegan' && selectedSavedItem.isVegan === false && (
                    <ShieldPillCard key="diet-vegan" alert={{ id: 'vegan', type: 'allergen', name: 'Non-Vegan Ingredients' }} index={5} />
                  )}
                  {dietPreference === 'vegetarian' && selectedSavedItem.isVegetarian === false && (
                    <ShieldPillCard key="diet-veg" alert={{ id: 'veg', type: 'allergen', name: 'Non-Vegetarian Ingredients' }} index={5} />
                  )}
                </View>

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

                {/* 2. Eco-Score & Carbon Footprint Telemetry Card */}
                <EcoScoreCard 
                  grade={selectedSavedItem.ecoscoreGrade}
                  carbonFootprint={selectedSavedItem.carbonFootprint100g}
                  isOrganic={selectedSavedItem.isOrganic}
                  isVegan={selectedSavedItem.isVegan}
                  isVegetarian={selectedSavedItem.isVegetarian}
                  delayIndex={3}
                />

                {/* 3. Gut Shield Pro Audit Card */}
                {(() => {
                  const additives: AdditiveDetail[] = selectedSavedItem.additives ?? [];
                  const gut = evaluateGutHealth(additives);
                  return (
                    <GutShieldCard
                      score={gut.score}
                      insights={gut.insights}
                      colors={colors}
                      isDark={isDark}
                    />
                  );
                })()}

                {/* 4. Additive Detective Audit Card */}
                <AdditiveDetectiveCard
                  additives={selectedSavedItem.additives ?? []}
                  colors={colors}
                  isDark={isDark}
                />

                {/* 5. Sugar & Energy Telemetry */}
                <NutritionFacts
                  colors={colors}
                  productName={selectedSavedItem.name}
                  sugarGrams={selectedSavedItem.sugarGrams ?? selectedSavedItem.sugarPer100g ?? 0}
                  calories={selectedSavedItem.calories}
                  servingSize={formatWeight(selectedSavedItem.servingSize, sugarUnit) || '100 g / 100 ml'}
                  totalWeightGrams={selectedSavedItem.totalWeightGrams}
                  totalSugarGrams={selectedSavedItem.totalSugarGrams}
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
