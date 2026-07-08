import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, G, Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Bookmark,
  Heart,
  Trash2,
  ScanBarcode,
  Sparkles,
  Tag,
  Share2,
  ShoppingBag,
  CheckCircle2,
  Package,
  Gauge,
  Award,
  ShieldCheck,
  Flame,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';
import { Text } from '../../components/Text';
import { CleanBiteCategory, CollectionItem } from '../../types/app.types';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { formatSugar, getConsistentNutritionalMetrics } from '../../utils/sugar';
import { getSmartServingText, formatWeight } from '../../utils/format';






export default function TrackerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { collection, removeFromCollection, toggleFavoriteCollectionItem, sugarUnit } = useAppStore();

  // Filtered collection (returns full collection since My Collections only keeps liked items)
  const filteredCollection = collection;

  // Stats Calculations
  const totalSaved = collection.length;

  const totalServingSugarTspAll = collection.reduce((sum, item) => {
    const metrics = getConsistentNutritionalMetrics(item);
    return sum + metrics.servingTsp;
  }, 0);

  const basketHealthScore = useMemo(() => {
    if (collection.length === 0) return 100;
    const avgServing = totalServingSugarTspAll / collection.length;
    // Scale: 12 tsp serving average drops score to 0
    return Math.round(Math.max(0, 100 - (avgServing * (100 / 12))));
  }, [collection, totalServingSugarTspAll]);

  const getScoreInfo = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: '#34C759', desc: 'Highly clean choice basket!' };
    if (score >= 50) return { label: 'Fair', color: '#FF9500', desc: 'Moderate sugar levels.' };
    return { label: 'Poor', color: '#FF3B30', desc: 'High risk of sugar spike!' };
  };

  const scoreInfo = getScoreInfo(basketHealthScore);

  // Pantry Composition & Annual Impact Calculations
  const cleanCount = useMemo(() => collection.filter((item) => getConsistentNutritionalMetrics(item).servingTsp <= 2).length, [collection]);
  const modCount = useMemo(() => collection.filter((item) => {
    const tsp = getConsistentNutritionalMetrics(item).servingTsp;
    return tsp > 2 && tsp <= 9;
  }).length, [collection]);
  const highCount = useMemo(() => collection.filter((item) => getConsistentNutritionalMetrics(item).servingTsp > 9).length, [collection]);
  const avgServingTsp = collection.length > 0 ? totalServingSugarTspAll / collection.length : 0;

  // Estimate Yearly Sugar Avoided (compared to typical supermarket processed products ~3.5 tsp per serving)
  const yearlySavedTsp = Math.round(Math.max(0, 3.5 - avgServingTsp) * 365);
  const yearlySavedKg = ((yearlySavedTsp * 4.2) / 1000).toFixed(1);

  const handleRemove = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove from CleanBite',
      `Are you sure you want to remove "${name}" from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCollection(id),
        },
      ]
    );
  };

  const handleToggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteCollectionItem(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 12,
            paddingBottom: 110, // Avoid overlap with bottom tab bar
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Refined Premium Header */}
        <View style={{ marginBottom: 22, marginTop: 4 }}>
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -1.0 }}>
            My Pantry
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 4, letterSpacing: -0.1 }}>
            Your premium catalog of healthy choices
          </Text>
        </View>

        {/* Sleek Apple Fitness Style Executive Dashboard */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.background,
            borderColor: colors.border,
            borderWidth: 1.2,
            borderRadius: 28,
            padding: 18,
            marginBottom: 24,
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.2 : 0.03,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Top Section: Apple Fitness Ring + Key Bento Stats */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Left Side: Apple Fitness Style Radial Progress Ring */}
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 110,
            }}>
              <View style={{
                width: 110,
                height: 110,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {(() => {
                  const r = 43;
                  const circ = 2 * Math.PI * r;
                  const progress = Math.min(100, basketHealthScore) / 100;
                  const offset = circ - circ * progress;
                  const tipAngle = -Math.PI / 2 + progress * 2 * Math.PI;
                  const tipX = 55 + r * Math.cos(tipAngle);
                  const tipY = 55 + r * Math.sin(tipAngle);

                  return (
                    <Svg width="110" height="110" viewBox="0 0 110 110">
                      <Defs>
                        {/* Ambient glow halo */}
                        <RadialGradient id="ringGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                          <Stop offset="0%" stopColor={scoreInfo.color} stopOpacity="0.28" />
                          <Stop offset="70%" stopColor={scoreInfo.color} stopOpacity="0.05" />
                          <Stop offset="100%" stopColor={scoreInfo.color} stopOpacity="0" />
                        </RadialGradient>

                        {/* Glass center shading */}
                        <RadialGradient id="glassBack" cx="35%" cy="35%" rx="65%" ry="65%">
                          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
                          <Stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
                        </RadialGradient>

                        {/* Apple Fitness style vibrant gradient */}
                        <SvgLinearGradient id="ringGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <Stop offset="0%" stopColor={scoreInfo.color} />
                          <Stop offset="60%" stopColor={basketHealthScore >= 80 ? '#34D399' : basketHealthScore >= 50 ? '#F5A623' : '#EF4444'} />
                          <Stop offset="100%" stopColor={basketHealthScore >= 80 ? '#6EE7B7' : basketHealthScore >= 50 ? '#F8E71C' : '#F87171'} />
                        </SvgLinearGradient>

                        {/* Glass cylinder refraction */}
                        <SvgLinearGradient id="glassRefract" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                          <Stop offset="50%" stopColor={scoreInfo.color} stopOpacity="0.1" />
                          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
                        </SvgLinearGradient>
                      </Defs>

                      {/* Ambient Glow */}
                      <Circle cx="55" cy="55" r="52" fill="url(#ringGlow)" />

                      {/* Glass Cylinder Track Body */}
                      <Circle cx="55" cy="55" r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} strokeWidth="11" />
                      <Circle cx="55" cy="55" r={r - 5.5} fill="none" stroke="url(#glassRefract)" strokeWidth="0.8" />
                      <Circle cx="55" cy="55" r={r + 5.5} fill="none" stroke="url(#glassRefract)" strokeWidth="0.8" />

                      {/* Active Progress Arc */}
                      <Circle
                        cx="55"
                        cy="55"
                        r={r}
                        fill="none"
                        stroke="url(#ringGrad)"
                        strokeWidth="11"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 55 55)"
                      />

                      {/* Inner 3D Specular Highlight */}
                      <Circle
                        cx="55"
                        cy="55"
                        r={r}
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 55 55)"
                        opacity={0.35}
                      />

                      {/* Glowing Droplet Tip Bulb */}
                      {progress > 0.02 && (
                        <G>
                          <Circle cx={tipX} cy={tipY} r="10" fill="url(#ringGrad)" opacity={0.3} />
                          <Circle cx={tipX} cy={tipY} r="7" fill="url(#ringGrad)" />
                          <Circle cx={tipX} cy={tipY} r="2" fill="white" opacity={0.85} />
                        </G>
                      )}
                    </Svg>
                  );
                })()}

                {/* Center Score Display */}
                <View style={{
                  position: 'absolute',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 }}>
                    {basketHealthScore}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '800', marginTop: -3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Grade
                  </Text>
                </View>
              </View>

              {/* Score Label Badge */}
              <View style={{
                backgroundColor: scoreInfo.color + '15',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                marginTop: 6,
                borderWidth: 0.8,
                borderColor: scoreInfo.color + '35',
              }}>
                <Text style={{ color: scoreInfo.color, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {scoreInfo.label}
                </Text>
              </View>
            </View>

            {/* Vertical Divider */}
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: colors.border }} />

            {/* Right Side: Bento Stats Capsules */}
            <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
              {/* Stat 1: Total Items Saved */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? 'rgba(0, 122, 255, 0.08)' : 'rgba(0, 122, 255, 0.05)',
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: 'rgba(0, 122, 255, 0.25)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: 'rgba(0, 122, 255, 0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Package size={14} color="#007AFF" />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={{ color: '#007AFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 }}>Items Saved</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 7.5, fontWeight: '600', marginTop: 0.5 }} numberOfLines={1}>In your pantry</Text>
                  </View>
                </View>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>
                  {totalSaved}
                </Text>
              </View>

              {/* Stat 2: Avg Sugar per Serving */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? 'rgba(255, 149, 0, 0.08)' : 'rgba(255, 149, 0, 0.05)',
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 149, 0, 0.25)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: 'rgba(255, 149, 0, 0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Gauge size={14} color="#FF9500" />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={{ color: '#FF9500', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 }}>Avg Sugar</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 7.5, fontWeight: '600', marginTop: 0.5 }} numberOfLines={1}>Per serving mean</Text>
                  </View>
                </View>
                <Text style={{ color: '#FF9500', fontSize: 15, fontWeight: '900' }}>
                  {avgServingTsp.toFixed(1).replace(/\.0$/, '')}<Text style={{ fontSize: 9, fontWeight: '700' }}> tsp</Text>
                </Text>
              </View>

              {/* Stat 3: Total Sugar Tracked */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? 'rgba(255, 45, 85, 0.08)' : 'rgba(255, 45, 85, 0.05)',
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 45, 85, 0.25)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: 'rgba(255, 45, 85, 0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Flame size={14} color="#FF2D55" />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={{ color: '#FF2D55', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 }}>Total Sugar</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 7.5, fontWeight: '600', marginTop: 0.5 }} numberOfLines={1}>All items sum</Text>
                  </View>
                </View>
                <Text style={{ color: '#FF2D55', fontSize: 15, fontWeight: '900' }}>
                  {totalServingSugarTspAll.toFixed(1).replace(/\.0$/, '')}<Text style={{ fontSize: 9, fontWeight: '700' }}> tsp</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Horizontal Divider */}
          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Bottom Section: Pantry Health Composition & Annual Impact Selling Point */}
          <View style={{ gap: 12 }}>
            {/* Pantry Composition Distribution Bar */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Pantry Composition
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>
                  {collection.length > 0 ? `${Math.round((cleanCount / collection.length) * 100)}% Clean` : '0% Clean'}
                </Text>
              </View>

              {/* Multi-color Horizontal Progress Bar */}
              <View style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                flexDirection: 'row',
                overflow: 'hidden',
                gap: 2,
              }}>
                {cleanCount > 0 && (
                  <View style={{ flex: cleanCount, backgroundColor: '#34C759', borderRadius: 4 }} />
                )}
                {modCount > 0 && (
                  <View style={{ flex: modCount, backgroundColor: '#FF9500', borderRadius: 4 }} />
                )}
                {highCount > 0 && (
                  <View style={{ flex: highCount, backgroundColor: '#FF3B30', borderRadius: 4 }} />
                )}
                {collection.length === 0 && (
                  <View style={{ flex: 1, backgroundColor: colors.border }} />
                )}
              </View>

              {/* Legend Mini Pills */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>Clean ({cleanCount})</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9500' }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>Moderate ({modCount})</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>High ({highCount})</Text>
                </View>
              </View>
            </View>

            {/* Ultimate Selling Point: Annual Health Impact Banner */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(52, 199, 89, 0.08)' : 'rgba(52, 199, 89, 0.06)',
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: 'rgba(52, 199, 89, 0.28)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: 'rgba(52, 199, 89, 0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Award size={18} color="#34C759" />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={{ color: '#34C759', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Annual Health Impact
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 1 }} numberOfLines={1}>
                    ~{yearlySavedKg} kg Sugar Avoided / Year
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '500', marginTop: 1 }} numberOfLines={1}>
                    By replacing typical sugary brands with your collection
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(52, 199, 89, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 10,
                alignItems: 'center',
              }}>
                <Text style={{ color: '#34C759', fontSize: 11, fontWeight: '900' }}>
                  {yearlySavedTsp}
                </Text>
                <Text style={{ color: '#34C759', fontSize: 7, fontWeight: '800', textTransform: 'uppercase' }}>
                  tsp saved
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Collection Grid */}
        <View style={styles.listSection}>
          {filteredCollection.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.emptyIconBadge, { backgroundColor: `${colors.primary}10` }]}>
                <ShoppingBag size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Your Collection is Empty
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Scan groceries and bookmark your favorite cleaner choices to build your personal pantry dashboard.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/scanner');
                }}
                style={styles.scanButton}
              >
                <LinearGradient
                  colors={[colors.primary, '#FF9500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scanButtonGradient}
                >
                  <ScanBarcode size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.scanButtonText}>Scan a Product</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {filteredCollection.map((item) => {
                const metrics = getConsistentNutritionalMetrics(item);
                const servingWeightStr = formatWeight(item.servingSize, sugarUnit) || '1 serving';
                const servingTsp = metrics.servingTsp;

                // LED Safety Dot Calculation
                let ledColor = '#34C759'; // Low sugar
                let safetyLabel = 'Low';
                if (servingTsp > 9) {
                  ledColor = '#FF3B30'; // High sugar danger
                  safetyLabel = 'High';
                } else if (servingTsp > 5) {
                  ledColor = '#FF9500'; // Warning
                  safetyLabel = 'Mod';
                } else if (servingTsp > 2) {
                  ledColor = '#FFCC00'; // Mild Warning
                  safetyLabel = 'Mod';
                }

                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: 1.2,
                      borderRadius: 24,
                      padding: 12,
                      width: '48.2%',
                      marginBottom: 14,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDark ? 0.15 : 0.02,
                      shadowRadius: 10,
                      elevation: 3,
                    }}
                  >
                    {/* Square Image Container with Absolute Overlays */}
                    <View style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: 18,
                      overflow: 'hidden',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F9F9',
                      borderWidth: 1,
                      borderColor: colors.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                    }}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                      ) : (
                        <ScanBarcode size={26} color={colors.primary} />
                      )}



                      {/* Absolute Safety LED Overlay */}
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 8,
                        gap: 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                        zIndex: 10,
                      }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ledColor }} />
                        <Text style={{ fontSize: 8, fontWeight: '900', color: '#1A1008', textTransform: 'uppercase' }}>
                          {safetyLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Brand & Product Name */}
                    <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, paddingHorizontal: 2 }} numberOfLines={1}>
                      {item.brand && item.brand !== 'Generic Brand' ? item.brand : 'Generic Brand'}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 2, height: 34, lineHeight: 17, paddingHorizontal: 2 }} numberOfLines={2}>
                      {item.name}
                    </Text>

                    {/* Teaspoon Highlight Badge (Center Stage) */}
                    <View style={{
                      backgroundColor: colors.primary + '08',
                      borderColor: colors.primary + '18',
                      borderWidth: 1,
                      borderRadius: 14,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      marginTop: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>
                        {servingTsp.toFixed(1).replace(/\.0$/, '')} <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSecondary }}>tsp</Text>
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2, marginTop: 1 }}>
                        {formatSugar(metrics.servingSugarG, sugarUnit)} sugar
                      </Text>
                    </View>

                    {/* Footer Stats: Serving & Delete Button */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingHorizontal: 2,
                      paddingTop: 6,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.border,
                    }}>
                      <View style={{ flex: 1, marginRight: 4 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '700' }} numberOfLines={1}>
                          Serving Size
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800' }} numberOfLines={1}>
                          {servingWeightStr}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemove(item.id, item.name)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        }}
                      >
                        <Trash2 size={12} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  bentoCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  bentoCardLarge: {
    flex: 1.2,
    minHeight: 140,
  },
  bentoRightCol: {
    flex: 1,
    gap: 12,
  },
  bentoCardSmall: {
    flex: 1,
    padding: 12,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bentoCardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bentoValueLarge: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  bentoSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  bentoValueSmall: {
    fontSize: 22,
    fontWeight: '800',
  },
  bentoValueTextSmall: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginLeft: 4,
  },
  bentoLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listSection: {
    gap: 12,
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  scanButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemBrand: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sugarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sugarBadgeText: {
    color: '#FF5252',
    fontSize: 11,
    fontWeight: '800',
  },
  teaspoonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 56,
    paddingLeft: 4,
  },
  actionButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
