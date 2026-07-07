import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';
import { Text } from '../../components/Text';
import { CleanBiteCategory, CollectionItem } from '../../types/app.types';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { formatSugar, getConsistentNutritionalMetrics } from '../../utils/sugar';
import { getSmartServingText, formatWeight } from '../../utils/format';

const getFullProductCalories = (item: any): number => {
  const metrics = getConsistentNutritionalMetrics(item);
  if (metrics && metrics.totalCalories !== undefined && metrics.totalCalories > 0) {
    return metrics.totalCalories;
  }
  return metrics?.servingCalories ?? (item?.calories ?? 0);
};

const calculateJoggingMinutes = (calories: number): number => {
  if (!calories || isNaN(calories) || calories <= 0) return 0;
  return Math.round(calories / 10);
};




export default function TrackerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { collection, removeFromCollection, toggleFavoriteCollectionItem, sugarUnit } = useAppStore();

  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);

  // Filtered collection
  const filteredCollection = useMemo(() => {
    return collection.filter((item) => {
      if (filterFavoritesOnly && !item.isFavorite) return false;
      return true;
    });
  }, [collection, filterFavoritesOnly]);

  // Stats Calculations
  const totalSaved = collection.length;
  
  const totalSugarTspAll = collection.reduce((sum, item) => {
    const metrics = getConsistentNutritionalMetrics(item);
    const tsp = metrics.totalTsp !== undefined ? metrics.totalTsp : metrics.servingTsp;
    return sum + tsp;
  }, 0);

  const totalServingSugarTspAll = collection.reduce((sum, item) => {
    const metrics = getConsistentNutritionalMetrics(item);
    return sum + metrics.servingTsp;
  }, 0);

  const basketHealthScore = useMemo(() => {
    if (collection.length === 0) return 100;
    const avgServing = totalServingSugarTspAll / collection.length;
    const avgTotal = totalSugarTspAll / collection.length;
    
    // Scale: 6 tsp serving average drops servingScore to 28%
    const servingScore = Math.max(0, 100 - (avgServing * 12));
    // Scale: 12 tsp package average drops totalScore to 52%
    const totalScore = Math.max(0, 100 - (avgTotal * 4));
    
    return Math.round((servingScore * 0.7) + (totalScore * 0.3));
  }, [collection, totalSugarTspAll, totalServingSugarTspAll]);

  const getScoreInfo = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: '#34C759', desc: 'Highly clean choice basket!' };
    if (score >= 50) return { label: 'Fair', color: '#FF9500', desc: 'Moderate sugar levels.' };
    return { label: 'Poor', color: '#FF3B30', desc: 'High risk of sugar spike!' };
  };

  const scoreInfo = getScoreInfo(basketHealthScore);

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
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.title, { color: colors.text }]}>My Collections</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Your curated list of Favorite Products
              </Text>
            </View>
            
            {/* Filter Favorites Toggle */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterFavoritesOnly(!filterFavoritesOnly);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: filterFavoritesOnly ? 'rgba(255, 82, 82, 0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: filterFavoritesOnly ? '#FF5252' : colors.border,
              }}
            >
              <Heart size={14} color={filterFavoritesOnly ? '#FF5252' : colors.textMuted} fill={filterFavoritesOnly ? '#FF5252' : 'transparent'} />
              <Text style={{ color: filterFavoritesOnly ? '#FF5252' : colors.text, fontSize: 11, fontWeight: '700' }}>
                {filterFavoritesOnly ? 'Favorites' : 'All Items'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleek and Clean Single Dashboard */}
        <LinearGradient
          colors={isDark ? ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.01)'] : ['#FFFDF9', '#FAF5EC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderColor: colors.border,
            borderWidth: 1.5,
            borderRadius: 28,
            padding: 16,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.15 : 0.05,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Left Side: Giant Circular Basket Health Score using Svg Circular Progress */}
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 110,
          }}>
            <View style={{
              width: 84,
              height: 84,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <Svg width="84" height="84" viewBox="0 0 84 84">
                {/* Background Track Circle */}
                <Circle
                  cx="42"
                  cy="42"
                  r="34"
                  stroke={scoreInfo.color + '20'}
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Active Progress Circle */}
                <Circle
                  cx="42"
                  cy="42"
                  r="34"
                  stroke={scoreInfo.color}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * basketHealthScore) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 42 42)"
                />
              </Svg>
              
              {/* Score Value Overlay */}
              <View style={{
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
                  {basketHealthScore}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '800', marginTop: -2, textTransform: 'uppercase' }}>
                  Score
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: scoreInfo.color + '15',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              marginTop: 10,
              borderWidth: 0.5,
              borderColor: scoreInfo.color + '30',
            }}>
              <Text style={{ color: scoreInfo.color, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
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
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 14,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Bookmark size={14} color={colors.primary} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Items Saved</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '500' }} numberOfLines={1}>In your pantry</Text>
                </View>
              </View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>
                {totalSaved}
              </Text>
            </View>

            {/* Stat 2: Total Sugar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 14,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 149, 0, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={14} color="#FF9500" />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Total Sugar</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '500' }} numberOfLines={1}>Across all items</Text>
                </View>
              </View>
              <Text style={{ color: '#FF9500', fontSize: 14, fontWeight: '900' }}>
                {totalSugarTspAll.toFixed(1).replace(/\.0$/, '')}<Text style={{ fontSize: 10, fontWeight: '700' }}> tsp</Text>
              </Text>
            </View>

            {/* Stat 3: Servings Sugar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 14,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 59, 48, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Tag size={14} color="#FF3B30" />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Servings Sugar</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '500' }} numberOfLines={1}>Per serving sum</Text>
                </View>
              </View>
              <Text style={{ color: '#FF3B30', fontSize: 14, fontWeight: '900' }}>
                {totalServingSugarTspAll.toFixed(1).replace(/\.0$/, '')}<Text style={{ fontSize: 10, fontWeight: '700' }}> tsp</Text>
              </Text>
            </View>
          </View>
        </LinearGradient>



        {/* Collection Grid / List */}
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
                {filterFavoritesOnly
                  ? 'No Favorites Yet'
                  : 'Your Collection is Empty'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {filterFavoritesOnly
                  ? 'Tap the heart icon on any saved item to add it to your favorites.'
                  : 'Scan groceries and bookmark your favorite cleaner choices to build your personal pantry dashboard.'}
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
            filteredCollection.map((item) => {
              const metrics = getConsistentNutritionalMetrics(item);
              const cardMascotState = metrics.servingTsp === 0 ? 'happy' : (metrics.servingTsp <= 2 ? 'idle' : (metrics.servingTsp <= 5 ? 'shocked' : 'dizzy'));
              const productWeightStr = formatWeight(item.packageSize || item.servingSize, sugarUnit) || 'N/A';
              const servingWeightStr = formatWeight(item.servingSize, sugarUnit) || '1 Serving';


              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1.5,
                    borderRadius: 24,
                    padding: 12,
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.15 : 0.04,
                    shadowRadius: 10,
                    elevation: 2,
                    marginBottom: 12,
                  }}
                >
                  {/* Left Column: Product Image Full Height */}
                  <View style={{
                    width: 95,
                    alignSelf: 'stretch',
                    minHeight: 230,
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.06)',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
                    ) : (
                      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
                        <ScanBarcode size={36} color={colors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Right Column */}
                  <View style={{ flex: 1, paddingLeft: 12, justifyContent: 'flex-start' }}>
                    {/* Header Row: Title & Badge */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', letterSpacing: -0.3, lineHeight: 18 }} numberOfLines={2}>
                          {item.brand && item.brand !== 'Generic Brand' ? `${item.brand} - ${item.name}` : item.name}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Mascot size={20} state={cardMascotState} />
                        </View>
                        <View style={{
                          backgroundColor: item.isDefaultServing ? (isDark ? '#3b2d00' : '#fef3c7') : (isDark ? '#063f24' : '#d1fae5'),
                          paddingHorizontal: 6,
                          paddingVertical: 2.5,
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: item.isDefaultServing ? (isDark ? '#78350f' : '#f59e0b') : (isDark ? '#047857' : '#10b981')
                        }}>
                          <Text style={{
                            color: item.isDefaultServing ? (isDark ? '#fde68a' : '#b45309') : (isDark ? '#a7f3d0' : '#047857'),
                            fontSize: 7,
                            fontWeight: '800',
                            letterSpacing: 0.2
                          }}>
                            {item.isDefaultServing ? '100G/ML' : 'SERVING'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ─── SECTION 1: PER SERVING BREAKDOWN ─── */}
                    <View style={{
                      backgroundColor: colors.primary + '08',
                      padding: 8,
                      borderRadius: 10,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: colors.primary + '20'
                    }}>
                      <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        1. Per Serving Breakdown
                      </Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>Serving Size</Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{servingWeightStr}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>Serving Energy</Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{metrics.servingCalories !== undefined ? `${Math.round(metrics.servingCalories)} kcal` : '—'}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Sugar per Serving</Text>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{formatSugar(metrics.servingSugarG, sugarUnit)} ({metrics.servingTsp} tsp)</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>WHO Daily Limit</Text>
                        <View style={{ backgroundColor: metrics.whoLimitPercent > 100 ? colors.error : colors.primary, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>{metrics.whoLimitPercent}% of 12 tsp Max</Text>
                        </View>
                      </View>
                    </View>

                    {/* ─── SECTION 2: FULL PRODUCT SIZE / PACKAGE TOTAL ─── */}
                    <View style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                      padding: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      marginBottom: 8
                    }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        2. Full Product Size / Total Package
                      </Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>Product Size</Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{productWeightStr}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>Total Energy</Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{metrics.totalCalories !== undefined ? `${Math.round(metrics.totalCalories)} kcal` : '—'}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>Total Sugar in Package</Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>
                          {metrics.totalSugarG !== undefined ? `${formatSugar(metrics.totalSugarG, sugarUnit)} (${metrics.totalTsp} tsp)` : '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Actions Row (Favorite & Delete side-by-side) */}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleToggleFavorite(item.id)}
                        style={{
                          width: 44,
                          height: 36,
                          backgroundColor: item.isFavorite ? 'rgba(255, 82, 82, 0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: item.isFavorite ? '#FF5252' : colors.border,
                          borderWidth: item.isFavorite ? 1.5 : 1,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Heart
                          size={16}
                          color={item.isFavorite ? '#FF5252' : colors.textMuted}
                          fill={item.isFavorite ? '#FF5252' : 'transparent'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemove(item.id, item.name)}
                        style={{
                          width: 44,
                          height: 36,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: colors.border,
                          borderWidth: 1,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
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
