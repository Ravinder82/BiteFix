import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, FlatList, Dimensions } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import ProductHeroCardDashboard from '../../components/features/ProductHeroCardDashboard';
import { GutAndAdditivesCard } from '../../components/features/GutAndAdditivesCard';
import { EcoScoreCard } from '../../components/EcoScoreCard';
import { ScanBarcode, Settings, Flame, Candy, ShieldAlert, Globe, Activity, Award, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getBiteFixScoreColor } from '../../utils/format';
import Svg, { Circle } from 'react-native-svg';
import { detectShieldAlerts } from '../../utils/scannerAPI';
import { evaluateGutHealth } from '../../utils/gutShieldEvaluator';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const CAROUSEL_ITEMS = [
  {
    id: 'additive',
    title: 'Additive Detective',
    subtitle: 'Chemical Additives',
    description: 'Find emulsifiers, thickeners, preservatives, and coloring agents hidden in lists.',
    image: require('../../../assets/images/oil_paint/additive_detective_oil.png'),
    icon: ShieldAlert,
    color: '#10B981', // green
  },
  {
    id: 'gut',
    title: 'Gut Shield Pro',
    subtitle: 'Microbiome Safety',
    description: 'Flag artificial sweeteners and gut barrier disruptors that induce inflammation.',
    image: require('../../../assets/images/oil_paint/gut_shield_pro_oil.png'),
    icon: Heart,
    color: '#34D399', // bright green
  },
  {
    id: 'nutri',
    title: 'Nutri-Score scale',
    subtitle: 'Traffic Light Profile',
    description: 'Review overall nutrient density grading from class A (optimal) to class E (dense calorie).',
    image: require('../../../assets/images/oil_paint/nutri_score_oil.png'),
    icon: Activity,
    color: '#FBBF24', // yellow
  },
  {
    id: 'allergen',
    title: 'Allergen Alert',
    subtitle: 'Dietary Shield',
    description: 'Check instantly for gluten, dairy, nuts, or non-vegan ingredients matching your preferences.',
    image: require('../../../assets/images/oil_paint/allergen_alert_oil.png'),
    icon: ShieldAlert,
    color: '#EF4444', // red
  },
  {
    id: 'carbon',
    title: 'Planetary Audit',
    subtitle: 'Eco Carbon Footprint',
    description: 'Track the true environmental footprint of production and packaging. A world-first ecological score.',
    image: require('../../../assets/images/oil_paint/eco_climate_oil.png'),
    icon: Globe,
    color: '#3B82F6', // blue
  },
  {
    id: 'sugar',
    title: 'Metabolic Audit',
    subtitle: 'Sugar Investigator',
    description: 'Visualize hidden sugars converted into equivalent physical teaspoons to manage glycemic load.',
    image: require('../../../assets/images/oil_paint/sugar_audit_oil.png'),
    icon: Candy,
    color: '#F59E0B', // amber
  },
  {
    id: 'burn',
    title: 'Physical Cost',
    subtitle: 'Calorie Burn Down',
    description: 'See the precise minutes of running, cycling, or swimming required to offset the energy intake.',
    image: require('../../../assets/images/oil_paint/calorie_burn_oil.png'),
    icon: Flame,
    color: '#EF4444', // red
  },
  {
    id: 'nova',
    title: 'Whole Health Grade',
    subtitle: 'Nova Classification',
    description: 'Avoid Ultra-Processed Foods (Group 4) and audit overall ingredient safety at a glance.',
    image: require('../../../assets/images/oil_paint/basket_score_impasto.png'),
    icon: Award,
    color: '#8B5CF6', // purple
  },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const {
    dietPreference,
    allergenFilters,
    activeScanResult,
    setActiveScanResult
  } = useAppStore();

  const hasActiveResult = activeScanResult !== null && activeScanResult !== undefined;

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 72;
  const cardHeight = 360;

  const onScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (cardWidth + 12));
    setActiveIndex(index);
  }, [cardWidth]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: cardWidth + 12,
    offset: (cardWidth + 12) * index,
    index,
  }), [cardWidth]);

  const sweepX = useSharedValue(0);

  useEffect(() => {
    if (!hasActiveResult) {
      sweepX.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }
  }, [hasActiveResult]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweepX.value * 90 }],
  }));

  // Auto-play timer for empty state carousel
  useEffect(() => {
    if (hasActiveResult) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % CAROUSEL_ITEMS.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4500);

    return () => clearInterval(interval);
  }, [activeIndex, hasActiveResult]);

  const totalSugarTeaspoons = hasActiveResult ? (activeScanResult.sugarTeaspoons ?? 0) : 0;
  const totalBasketCalories = hasActiveResult ? Math.round(activeScanResult.calories ?? 0) : 0;

  const burnDownActivities = useMemo(() => {
    if (!hasActiveResult || !activeScanResult.calories) return null;
    const calories = activeScanResult.calories;
    const jogMins = Math.round(calories / 8.5);
    const cycleMins = Math.round(calories / 6.5);
    const swimMins = Math.round(calories / 7.5);
    const walkMins = Math.round(calories / 4.2);
    return { jogMins, cycleMins, swimMins, walkMins };
  }, [activeScanResult, hasActiveResult]);

  const formatBurnTime = (mins: number): string => {
    if (!mins || mins <= 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const gutHealthData = useMemo(() => {
    if (!hasActiveResult) return { score: 100, insights: [] };
    return evaluateGutHealth(activeScanResult.additives ?? []);
  }, [activeScanResult, hasActiveResult]);

  const alerts = useMemo(() => {
    if (!hasActiveResult) return [];
    const detected = activeScanResult.ingredientsText && allergenFilters.length > 0
      ? detectShieldAlerts(activeScanResult.ingredientsText, allergenFilters)
      : [];
    const hasVeganAlert = dietPreference === 'vegan' && activeScanResult.isVegan === false;
    const hasVegAlert = dietPreference === 'vegetarian' && activeScanResult.isVegetarian === false;
    return [
      ...detected,
      ...(hasVeganAlert ? [{ id: 'vegan', type: 'allergen' as const, name: 'Non-Vegan Ingredients' }] : []),
      ...(hasVegAlert ? [{ id: 'veg', type: 'allergen' as const, name: 'Non-Vegetarian Ingredients' }] : []),
    ];
  }, [hasActiveResult, activeScanResult, allergenFilters, dietPreference]);

  const renderCarouselItem = useCallback(({ item }: { item: typeof CAROUSEL_ITEMS[0] }) => {
    const IconComponent = item.icon;
    return (
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
          marginHorizontal: 6,
          borderRadius: 24,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1.5,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.2 : 0.03,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <View style={{ height: 200, position: 'relative' }}>
          <Image
            source={item.image}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', isDark ? 'rgba(17, 20, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 }}
          />
          {/* Floating Icon Badge */}
          <View style={{
            position: 'absolute',
            top: 14,
            left: 18,
            backgroundColor: isDark ? 'rgba(17, 20, 23, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: 16,
            padding: 10,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            borderWidth: 1.5,
          }}>
            <IconComponent size={20} color={item.color} />
          </View>
          {/* Module Label */}
          <View style={{
            position: 'absolute',
            top: 14,
            right: 18,
            backgroundColor: isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.96)',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderColor: item.color,
            borderWidth: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}>
            <Text style={{ color: item.color, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>
              {item.title.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, paddingVertical: 18, flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 6 }}>
              {item.subtitle}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14.5, fontWeight: '600', lineHeight: 22.5 }} numberOfLines={4}>
              {item.description}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [cardWidth, cardHeight, isDark, colors]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top App Header */}
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
          <Mascot state="idle" size={36} />
          <View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.6 }}>
              BiteFix
            </Text>
            <Text style={{ color: colors.primary, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6 }}>
              Scan.Audit.Eat Clean
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {!hasActiveResult ? (
          /* Empty / Fresh State */
          <View style={{ gap: 20 }}>
            {/* Expanded Full-Width HUD Status Display */}
            <LinearGradient
              colors={isDark ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={{
                borderRadius: 24,
                padding: 24,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.35 : 0.04,
                shadowRadius: 16,
                elevation: 6,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }} />
                  <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: '900', letterSpacing: 1.5 }}>
                    SYSTEM ONLINE
                  </Text>
                </View>

                <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8, lineHeight: 30 }}>
                  Awaiting Target
                </Text>

                {/* Animated Console Sweep Line */}
                <View style={{ height: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', borderRadius: 1, marginTop: 12, marginBottom: 8, width: 140 }}>
                  <AnimatedReanimated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 50,
                        backgroundColor: colors.primary,
                      },
                      sweepStyle,
                    ]}
                  />
                </View>

                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', lineHeight: 15, marginTop: 2 }}>
                  Scan a barcode to audit ingredients, additives, sugars, and environmental impact.
                </Text>
              </View>

              <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Svg width={100} height={100} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                  <Circle cx="60" cy="60" r="48" fill="none" stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'} strokeWidth="8" />
                  <Circle cx="60" cy="60" r="56" fill="none" stroke="#D1D5DB" strokeWidth="1.5" opacity="0.15" />
                </Svg>
                <Mascot state="idle" size={64} />
              </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 4 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.4 }}>
                BiteFix Capabilities
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '600', marginTop: 2 }}>
                Scan to audit your food in real-time across these vectors:
              </Text>
            </View>

            {/* Horizontal Capabilities Carousel */}
            <View>
              <FlatList
                ref={flatListRef}
                data={CAROUSEL_ITEMS}
                renderItem={renderCarouselItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 12}
                snapToAlignment="center"
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingHorizontal: 14,
                }}
                getItemLayout={getItemLayout}
                onScroll={onScroll}
                scrollEventThrottle={16}
              />

              {/* Dot Indicators */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                {CAROUSEL_ITEMS.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: activeIndex === i ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: activeIndex === i ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* Active Scanned Product Dashboard Layout */
          <View style={{ gap: 16 }}>
            {/* 1. Hero Card (Product Info, Centered Mascot, Horizontal NOVA Bar, Compact Oil Watchlist & Alerts, Sleek Nutri-Score) */}
            <ProductHeroCardDashboard
              scanResult={activeScanResult}
              alerts={alerts}
              colors={colors}
              isDark={isDark}
            />

            {/* 2. Highlighted & Impactful Carbon-Footprint Card */}
            <EcoScoreCard
              grade={activeScanResult.ecoscoreGrade}
              carbonFootprint={activeScanResult.carbonFootprint100g}
              isOrganic={activeScanResult.isOrganic}
              isVegan={activeScanResult.isVegan}
              isVegetarian={activeScanResult.isVegetarian}
            />

            {/* 3. Combined Gut Shield & Additive Detective Card */}
            <GutAndAdditivesCard
              gutScore={gutHealthData.score}
              gutInsights={gutHealthData.insights}
              additives={activeScanResult.additives ?? []}
              colors={colors}
              isDark={isDark}
            />

            {/* 5. Sugar Impact Card */}
            <LinearGradient
              colors={isDark ? ['rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0.02)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 251, 235, 0.95)']}
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1.5,
                borderRadius: 24,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.3 : 0.04,
                shadowRadius: 16,
                elevation: 5,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: 'rgba(251, 191, 36, 0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Candy size={20} color="#F59E0B" strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                      Total Sugar Load
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
                      Serving: {activeScanResult.servingSize || '100 g / 100 ml'}
                    </Text>
                  </View>
                </View>

                <View style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                  borderColor: 'rgba(251, 191, 36, 0.3)',
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}>
                  <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 }}>
                    {totalSugarTeaspoons.toFixed(1)} tsp
                  </Text>
                </View>
              </View>

              {/* Main Teaspoons & Grams Row */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
                  {totalSugarTeaspoons.toFixed(1)}
                </Text>
                <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '800' }}>
                  teaspoons
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', marginLeft: 'auto' }}>
                  {activeScanResult.sugarGrams ?? activeScanResult.sugarPer100g ?? 0}g per serving
                </Text>
              </View>

              {/* WHO Limit Gauge */}
              {(() => {
                const whoPercent = activeScanResult.whoLimitServingPercent ?? Math.min(500, Math.round((totalSugarTeaspoons / 12) * 100));
                const gaugeColor = whoPercent > 100 ? '#EF4444' : whoPercent > 50 ? '#F59E0B' : '#10B981';
                return (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    gap: 8,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700' }}>
                        WHO Daily Limit Impact
                      </Text>
                      <Text style={{ color: gaugeColor, fontSize: 12, fontWeight: '900' }}>
                        {whoPercent}% of 50g max
                      </Text>
                    </View>

                    <View style={{
                      height: 8,
                      width: '100%',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <View style={{
                        height: '100%',
                        width: `${Math.min(100, whoPercent)}%`,
                        backgroundColor: gaugeColor,
                        borderRadius: 4,
                      }} />
                    </View>
                  </View>
                );
              })()}

              {/* Stealth Sugar Tag if any */}
              {activeScanResult.hasHiddenSugars && activeScanResult.hiddenSugars && activeScanResult.hiddenSugars.length > 0 && (
                <View style={{
                  marginTop: 10,
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 12,
                  gap: 6,
                }}>
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    ⚠️ Stealth Sugars Detected ({activeScanResult.hiddenSugarCount || activeScanResult.hiddenSugars.length})
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {activeScanResult.hiddenSugars.map((s: string, idx: number) => (
                      <View key={idx} style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}>
                        <Text style={{ color: '#EF4444', fontSize: 10.5, fontWeight: '700' }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </LinearGradient>

            {/* 6. Burn Down Activity Card */}
            <LinearGradient
              colors={isDark ? ['rgba(249, 115, 22, 0.08)', 'rgba(249, 115, 22, 0.02)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 247, 237, 0.95)']}
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1.5,
                borderRadius: 24,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.3 : 0.04,
                shadowRadius: 16,
                elevation: 5,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: 'rgba(249, 115, 22, 0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Flame size={20} color="#F97316" strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                      Burn Down Energy
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
                      Activity Required to Burn
                    </Text>
                  </View>
                </View>

                <View style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                  borderColor: 'rgba(249, 115, 22, 0.3)',
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}>
                  <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 }}>
                    {totalBasketCalories} kcal
                  </Text>
                </View>
              </View>

              {/* Workout Burn Times Grid */}
              <View style={{ gap: 8 }}>
                {[
                  { key: 'jog', label: 'Jogging (8.5 kcal/min)', mins: burnDownActivities?.jogMins ?? 0, color: '#F97316' },
                  { key: 'cycle', label: 'Cycling (6.5 kcal/min)', mins: burnDownActivities?.cycleMins ?? 0, color: '#06B6D4' },
                  { key: 'swim', label: 'Swimming (7.5 kcal/min)', mins: burnDownActivities?.swimMins ?? 0, color: '#3B82F6' },
                  { key: 'walk', label: 'Brisk Walking (4.2 kcal/min)', mins: burnDownActivities?.walkMins ?? 0, color: '#10B981' },
                ].map((act) => (
                  <View
                    key={act.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '700' }}>
                      {act.label}
                    </Text>
                    <View style={{
                      backgroundColor: `${act.color}15`,
                      borderColor: `${act.color}30`,
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}>
                      <Text style={{ color: act.color, fontSize: 12, fontWeight: '900' }}>
                        {formatBurnTime(act.mins)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

