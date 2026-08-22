import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, FlatList, Dimensions } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/hooks/useTheme';
import { useMountAnim } from '@/hooks/useMountAnim';
import { OrbMascot as Mascot } from '@/components/features/OrbMascot';
import ProductHeroCardDashboard from '@/components/features/ProductHeroCardDashboard';
import { MainDisclaimerModal } from '@/components/MainDisclaimerModal';
import { AdditivesIntelligenceCard } from '@/components/features/AdditivesIntelligenceCard';
import { NovaProcessingCard } from '@/components/features/NovaProcessingCard';
import { UnifiedNutritionCard } from '@/components/features/UnifiedNutritionCard';
import { SugarImpactCard } from '@/components/features/SugarImpactCard';
import { EcoScoreCard } from '@/components/EcoScoreCard';
import { BurnOutCard } from '@/components/features/BurnOutCard';
import { KnowledgeSectionHeader } from '@/components/features/KnowledgeSectionHeader';
import { Settings, ShieldCheck, Cog, FlaskConical, Activity, Candy, Globe, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { detectShieldAlerts, deriveNutritionIntelligence, type ScanResultData } from '@/utils/scannerAPI';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ─── Knowledge Layer narrative copy matrix ────────────────────────
const KNOWLEDGE_COPY = {
  verdict: {
    step: 1, category: 'Safety & Verdict', icon: ShieldCheck, accent: '#6EE041',
    title: 'Product Overview & Personal Flags',
    subtitle: 'Instant synthesis of your product\'s data profile along with active allergen and oil watchlist checks.',
  },
  processing: {
    step: 2, category: 'Processing', icon: Cog, accent: '#F5A623',
    title: 'Processing Level & Formulation',
    subtitle: 'Evaluates the degree of industrial processing and additive formulation in this food.',
  },
  additives: {
    step: 3, category: 'Additives', icon: FlaskConical, accent: '#8B5CF6',
    title: 'Additive & Ingredient Audit',
    subtitle: 'Categorizes all preservatives, emulsifiers, and other additive ingredients found in published ingredient data.',
  },
  nutrition: {
    step: 4, category: 'Nutrition', icon: Activity, accent: '#FBBF24',
    title: 'Nutrient Density & Balance',
    subtitle: 'Combines Nutri-Score grading with a breakdown of available macros and minerals.',
  },
  sugar: {
    step: 5, category: 'Sugar', icon: Candy, accent: '#F59E0B',
    title: 'Estimated Sugar Equivalent',
    subtitle: 'Provides an approximate estimation of sugar content converted into physical teaspoons and lists sugar-related ingredients.',
  },
  climate: {
    step: 6, category: 'Climate', icon: Globe, accent: '#2DD4BF',
    title: 'Planetary & Eco Impact',
    subtitle: 'Provides an approximate assessment of the product\'s ecological footprint, estimated carbon emissions, and packaging impact.',
  },
  energy: {
    step: 7, category: 'Energy', icon: Flame, accent: '#FB923C',
    title: 'Activity Equivalent',
    subtitle: 'Calculates the approximate physical activity time that matches this product\'s estimated calories per serving.',
  },
} as const;

const CAROUSEL_ITEMS = [
  {
    id: 'additive',
    title: 'Additive Detective',
    subtitle: 'Food Additives',
    description: 'Identify emulsifiers, thickeners, preservatives, and coloring agents in the ingredient list.',
    image: require('../../../assets/images/oil_paint/additive_detective_oil.png'),
    icon: ShieldCheck,
    color: '#10B981', // green
  },
  {
    id: 'gut',
    title: 'Gut Shield Pro',
    subtitle: 'Microbiome Research',
    description: 'Flags ingredients classified as artificial sweeteners and emulsifiers referenced in gut microbiome studies.',
    image: require('../../../assets/images/oil_paint/gut_shield_pro_oil.png'),
    icon: ShieldCheck,
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
    subtitle: 'Dietary Filters',
    description: 'Check instantly for gluten, dairy, nuts, or non-vegan ingredients matching your preferences.',
    image: require('../../../assets/images/oil_paint/allergen_alert_oil.png'),
    icon: ShieldCheck,
    color: '#EF4444', // red
  },
  {
    id: 'carbon',
    title: 'Planetary Audit',
    subtitle: 'Eco Carbon Footprint',
    description: 'Track the estimated environmental footprint of production and packaging with an ecological score.',
    image: require('../../../assets/images/oil_paint/eco_climate_oil.png'),
    icon: Globe,
    color: '#3B82F6', // blue
  },
  {
    id: 'sugar',
    title: 'Metabolic Audit',
    subtitle: 'Sugar Investigator',
    description: 'Visualize total sugars converted into equivalent teaspoons, with WHO intake reference points.',
    image: require('../../../assets/images/oil_paint/sugar_audit_oil.png'),
    icon: Candy,
    color: '#F59E0B', // amber
  },
  {
    id: 'burn',
    title: 'Physical Cost',
    subtitle: 'Calorie Burn Down',
    description: 'See the estimated minutes of running, cycling, or swimming equivalent to this energy intake.',
    image: require('../../../assets/images/oil_paint/calorie_burn_oil.png'),
    icon: Flame,
    color: '#EF4444', // red
  },
  {
    id: 'nova',
    title: 'Whole Health Grade',
    subtitle: 'Nova Classification',
    description: 'See the NOVA group (Group 4 = ultra-processed) and an additive overview at a glance.',
    image: require('../../../assets/images/oil_paint/basket_score_impasto.png'),
    icon: Cog,
    color: '#8B5CF6', // purple
  },
];

interface CarouselCardProps {
  item: typeof CAROUSEL_ITEMS[0];
  cardWidth: number;
  cardHeight: number;
  isDark: boolean;
  colors: any;
}

const CarouselCard = React.memo(({ item, cardWidth, cardHeight, isDark, colors }: CarouselCardProps) => {
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
          priority="high"
          cachePolicy="memory-disk"
          transition={0}
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
});

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const {
    dietPreference,
    allergenFilters,
    oilWatchFilters,
    activeScanResult,
    totalProductsScanned,
    totalProductsNotFound,
  } = useAppStore();

  const hasActiveResult = activeScanResult !== null && activeScanResult !== undefined;

  const [activeIndex, setActiveIndex] = useState(0);
  const [disclaimerModalVisible, setDisclaimerModalVisible] = useState(false);
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

  const alerts = useMemo(() => {
    if (!hasActiveResult) return [];
    const hasText = !!activeScanResult.ingredientsText;
    const detected = hasText && (allergenFilters.length > 0 || oilWatchFilters.length > 0)
      ? detectShieldAlerts(activeScanResult.ingredientsText, allergenFilters, oilWatchFilters)
      : [];
    const hasVeganAlert = dietPreference === 'vegan' && activeScanResult.isVegan === false;
    const hasVegAlert = dietPreference === 'vegetarian' && activeScanResult.isVegetarian === false;
    return [
      ...detected,
      ...(hasVeganAlert ? [{ id: 'vegan', type: 'allergen' as const, name: 'Non-Vegan Ingredients' }] : []),
      ...(hasVegAlert ? [{ id: 'veg', type: 'allergen' as const, name: 'Non-Vegetarian Ingredients' }] : []),
    ];
  }, [hasActiveResult, activeScanResult, allergenFilters, oilWatchFilters, dietPreference]);

  const renderCarouselItem = useCallback(({ item }: { item: typeof CAROUSEL_ITEMS[0] }) => (
    <CarouselCard
      item={item}
      cardWidth={cardWidth}
      cardHeight={cardHeight}
      isDark={isDark}
      colors={colors}
    />
  ), [cardWidth, cardHeight, isDark, colors]);

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
              Scan.Audit.Know Your Food
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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        removeClippedSubviews
        overScrollMode="never"
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

                <View
                  style={{
                    marginTop: 14,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    gap: 8,
                  }}
                  accessible
                  accessibilityLabel={`Products scanned ${totalProductsScanned}. Products not found ${totalProductsNotFound}.`}
                >
                  {[
                    { label: 'PRODUCTS SCANNED', value: totalProductsScanned, color: colors.primary },
                    { label: 'NOT FOUND', value: totalProductsNotFound, color: isDark ? '#FBBF24' : '#D97706' },
                  ].map((item) => (
                    <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: item.color,
                          shadowColor: item.color,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.9,
                          shadowRadius: 4,
                          marginRight: 8,
                        }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }}>
                        {item.label}
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', marginLeft: 'auto', letterSpacing: -0.3 }}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
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
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
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
          /* Active Scanned Product — Knowledge & Intelligence Audit Flow */
          <ScanResultCards
            activeScanResult={activeScanResult}
            alerts={alerts}
            colors={colors}
            isDark={isDark}
            onOpenDisclaimer={() => setDisclaimerModalVisible(true)}
          />
        )}
      </ScrollView>
      <MainDisclaimerModal
        visible={disclaimerModalVisible}
        onClose={() => setDisclaimerModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Extracted result cards — each section gets its own mount anim ──
// Section 1–7 of the Knowledge & Intelligence audit flow, top to bottom.
function ScanResultCards({
  activeScanResult,
  alerts,
  colors,
  isDark,
  onOpenDisclaimer,
}: {
  activeScanResult: ScanResultData;
  alerts: { id: string; type: 'allergen' | 'oil'; name: string }[];
  colors: any;
  isDark: boolean;
  onOpenDisclaimer: () => void;
}) {
  const header1 = useMountAnim(40);
  const card1 = useMountAnim(60);
  const header2 = useMountAnim(90);
  const card2 = useMountAnim(110);
  const header3 = useMountAnim(140);
  const card3 = useMountAnim(160);
  const header4 = useMountAnim(190);
  const card4 = useMountAnim(210);
  const header5 = useMountAnim(240);
  const card5 = useMountAnim(260);
  const header6 = useMountAnim(290);
  const card6 = useMountAnim(310);
  const header7 = useMountAnim(340);
  const card7 = useMountAnim(360);
  const footer = useMountAnim(400);

  const nutritionIntelligence = activeScanResult?.nutritionIntelligence ?? deriveNutritionIntelligence({
    protein100g: activeScanResult?.protein100g ?? activeScanResult?.proteinGrams,
    fibre100g: activeScanResult?.fibre100g,
    satFat100g: activeScanResult?.satFat100g,
    sodiumMg100g: activeScanResult?.sodiumMg100g,
    cholesterolMg100g: activeScanResult?.cholesterolMg100g,
    servingSize: activeScanResult?.servingSize,
    basis: 'per_100g',
  });

  return (
    <View style={{ gap: 10 }}>
      {/* ── Section 1 · Mascot & BiteFix Intelligence Score ── */}
      <AnimatedReanimated.View style={header1}>
        <KnowledgeSectionHeader
          step={KNOWLEDGE_COPY.verdict.step}
          category={KNOWLEDGE_COPY.verdict.category}
          title={KNOWLEDGE_COPY.verdict.title}
          subtitle={KNOWLEDGE_COPY.verdict.subtitle}
          accentColor={isDark ? KNOWLEDGE_COPY.verdict.accent : '#4A8A1A'}
          icon={KNOWLEDGE_COPY.verdict.icon}
          isDark={isDark}
        />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View style={card1}>
        <ProductHeroCardDashboard
          scanResult={activeScanResult}
          alerts={alerts}
          colors={colors}
          isDark={isDark}
        />
      </AnimatedReanimated.View>

      {/* ── Section 2 · Standalone NOVA Processing ── */}
      <AnimatedReanimated.View style={header2}>
        <KnowledgeSectionHeader
          step={KNOWLEDGE_COPY.processing.step}
          category={KNOWLEDGE_COPY.processing.category}
          title={KNOWLEDGE_COPY.processing.title}
          subtitle={KNOWLEDGE_COPY.processing.subtitle}
          accentColor={KNOWLEDGE_COPY.processing.accent}
          icon={KNOWLEDGE_COPY.processing.icon}
          isDark={isDark}
        />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View style={card2}>
        <NovaProcessingCard
          novaClass={activeScanResult.novaClass}
          colors={colors}
          isDark={isDark}
        />
      </AnimatedReanimated.View>

      {/* ── Section 3 · Additives Intelligence ── */}
      <AnimatedReanimated.View style={header3}>
        <KnowledgeSectionHeader
          step={KNOWLEDGE_COPY.additives.step}
          category={KNOWLEDGE_COPY.additives.category}
          title={KNOWLEDGE_COPY.additives.title}
          subtitle={KNOWLEDGE_COPY.additives.subtitle}
          accentColor={KNOWLEDGE_COPY.additives.accent}
          icon={KNOWLEDGE_COPY.additives.icon}
          isDark={isDark}
        />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View style={card3}>
        <AdditivesIntelligenceCard
          additives={activeScanResult.additives ?? []}
          colors={colors}
          isDark={isDark}
        />
      </AnimatedReanimated.View>

      {/* ── Section 4 · Unified Nutrition & Nutri-Score ── */}
      <AnimatedReanimated.View style={header4}>
        <KnowledgeSectionHeader
          step={KNOWLEDGE_COPY.nutrition.step}
          category={KNOWLEDGE_COPY.nutrition.category}
          title={KNOWLEDGE_COPY.nutrition.title}
          subtitle={KNOWLEDGE_COPY.nutrition.subtitle}
          accentColor={KNOWLEDGE_COPY.nutrition.accent}
          icon={KNOWLEDGE_COPY.nutrition.icon}
          isDark={isDark}
        />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View style={card4}>
        <UnifiedNutritionCard
          nutriScoreGrade={activeScanResult.nutriScore}
          nutritionIntelligence={nutritionIntelligence}
          colors={colors}
          isDark={isDark}
        />
      </AnimatedReanimated.View>

      {/* ── Section 5 · Sugar Impact ── */}
      <AnimatedReanimated.View style={header5}>
        <KnowledgeSectionHeader
          step={KNOWLEDGE_COPY.sugar.step}
          category={KNOWLEDGE_COPY.sugar.category}
          title={KNOWLEDGE_COPY.sugar.title}
          subtitle={KNOWLEDGE_COPY.sugar.subtitle}
          accentColor={KNOWLEDGE_COPY.sugar.accent}
          icon={KNOWLEDGE_COPY.sugar.icon}
          isDark={isDark}
        />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View style={card5}>
        <SugarImpactCard
          sugarTeaspoons={activeScanResult.sugarTeaspoons}
          sugarGrams={activeScanResult.sugarGrams}
          sugarPer100g={activeScanResult.sugarPer100g}
          servingSize={activeScanResult.servingSize}
          whoLimitServingPercent={activeScanResult.whoLimitServingPercent}
          hasHiddenSugars={activeScanResult.hasHiddenSugars}
          hiddenSugars={activeScanResult.hiddenSugars}
          hiddenSugarCount={activeScanResult.hiddenSugarCount}
          colors={colors}
          isDark={isDark}
        />
      </AnimatedReanimated.View>

      {/* ── Section 6 · Planetary & Carbon Footprint ── */}
      <AnimatedReanimated.View style={header6}>
        <KnowledgeSectionHeader
          step={KNOWLEDGE_COPY.climate.step}
          category={KNOWLEDGE_COPY.climate.category}
          title={KNOWLEDGE_COPY.climate.title}
          subtitle={KNOWLEDGE_COPY.climate.subtitle}
          accentColor={KNOWLEDGE_COPY.climate.accent}
          icon={KNOWLEDGE_COPY.climate.icon}
          isDark={isDark}
        />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View style={card6}>
        <EcoScoreCard
          grade={activeScanResult.ecoscoreGrade}
          carbonFootprint={activeScanResult.carbonFootprint100g}
          isOrganic={activeScanResult.isOrganic}
          isVegan={activeScanResult.isVegan}
          isVegetarian={activeScanResult.isVegetarian}
        />
      </AnimatedReanimated.View>

      {/* ── Section 7 · Calorie Burn Out / Physical Cost ── */}
      <AnimatedReanimated.View style={header7}>
        <KnowledgeSectionHeader
          step={KNOWLEDGE_COPY.energy.step}
          category={KNOWLEDGE_COPY.energy.category}
          title={KNOWLEDGE_COPY.energy.title}
          subtitle={KNOWLEDGE_COPY.energy.subtitle}
          accentColor={KNOWLEDGE_COPY.energy.accent}
          icon={KNOWLEDGE_COPY.energy.icon}
          isDark={isDark}
        />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View style={card7}>
        <BurnOutCard
          calories={activeScanResult.calories}
          colors={colors}
          isDark={isDark}
        />
      </AnimatedReanimated.View>

      {/* Disclaimer footer */}
      <AnimatedReanimated.View style={footer}>
        <View style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 6 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '600', marginBottom: 6 }}>
            Results are based on available product data.
          </Text>
          <TouchableOpacity onPress={onOpenDisclaimer} activeOpacity={0.75}>
            <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '800', borderBottomWidth: 1, paddingBottom: 1 }}>
              Disclaimer
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedReanimated.View>
    </View>
  );
}
