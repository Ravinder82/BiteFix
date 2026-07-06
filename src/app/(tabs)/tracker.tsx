import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
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
import { formatSugar } from '../../utils/sugar';
import { getSmartServingText, formatWeight } from '../../utils/format';

const getFullProductCalories = (item: any): number => {
  if (item && item.totalCalories !== undefined && item.totalCalories > 0) {
    return item.totalCalories;
  }
  return item?.calories ?? 0;
};

const calculateJoggingMinutes = (calories: number): number => {
  if (!calories || isNaN(calories) || calories <= 0) return 0;
  return Math.round(calories / 10);
};

function getSugarColor(teaspoons: number, colors: any) {
  if (teaspoons > 6) {
    return colors.error || '#ff7d7dff';
  }
  if (teaspoons > 3) {
    return colors.warning || '#ffe072ff';
  }
  return colors.success || '#3dffbeff';
}



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

  // Stats
  const totalSaved = collection.length;
  const totalFavorites = collection.filter((i) => i.isFavorite).length;



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
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>My Collections</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Your curated list of Favorite Products
            </Text>
          </View>
        </View>

        {/* Bento Grid Summary Cards */}
        <View style={styles.bentoGrid}>
          {/* Card 1: Total Saved */}
          <View
            style={[
              styles.bentoCard,
              styles.bentoCardLarge,
              {
                backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.bentoCardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Bookmark size={20} color={colors.primary} />
              </View>
              <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>SAVED ITEMS</Text>
            </View>
            <Text style={[styles.bentoValueLarge, { color: colors.text }]}>{totalSaved}</Text>
            <Text style={[styles.bentoSubtext, { color: colors.textMuted }]}>
              {totalSaved === 1 ? '1 product bookmarked' : `${totalSaved} products bookmarked`}
            </Text>
          </View>

          {/* Right Column: Favorites */}
          <View style={styles.bentoRightCol}>
            {/* Favorites Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterFavoritesOnly(!filterFavoritesOnly);
              }}
              style={[
                styles.bentoCard,
                styles.bentoCardLarge,
                {
                  backgroundColor: filterFavoritesOnly
                    ? `${colors.primary}15`
                    : isDark
                      ? colors.surfaceRaised
                      : colors.surface,
                  borderColor: filterFavoritesOnly ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.bentoCardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: '#FF525215' }]}>
                  <Heart
                    size={20}
                    color="#FF5252"
                    fill={totalFavorites > 0 || filterFavoritesOnly ? '#FF5252' : 'transparent'}
                  />
                </View>
                <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>FAVORITES</Text>
              </View>
              <Text style={[styles.bentoValueLarge, { color: colors.text }]}>{totalFavorites}</Text>
              <Text style={[styles.bentoSubtext, { color: colors.textMuted }]}>
                {filterFavoritesOnly ? 'Showing favorites only' : 'Toggle to show favorites'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>



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
              const cardMascotState = item.sugarTeaspoons === 0 ? 'happy' : (item.sugarTeaspoons <= 2 ? 'idle' : (item.sugarTeaspoons <= 5 ? 'shocked' : 'dizzy'));
              const sugarColor = getSugarColor(item.sugarTeaspoons, colors);
              const itemCal = getFullProductCalories(item);
              const calColor = itemCal > 250 ? '#FF3B30' : (itemCal > 100 ? '#FF9500' : '#34C759');
              const sugColor = item.sugarGrams > 10 ? '#FF3B30' : (item.sugarGrams > 4 ? '#FF9500' : '#34C759');
              const itemWhoPercent = Math.min(100, Math.round((item.sugarGrams / 25) * 100));
              const whoBarColor = itemWhoPercent > 100 ? '#FF3B30' : (itemWhoPercent > 60 ? '#FF9500' : '#34C759');
              const totalSugarTsp = item.totalSugarTeaspoons !== undefined ? item.totalSugarTeaspoons : (item.sugarTeaspoons ?? 0);
              const servingSugarTsp = item.sugarTeaspoons ?? 0;
              const productWeightStr = formatWeight(item.packageSize || item.servingSize, sugarUnit) || 'N/A';
              const servingWeightStr = formatWeight(item.servingSize, sugarUnit) || '1 Serving';
              const servingCal = item.calories ?? 0;

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
                    height: 388,
                    flexDirection: 'row',
                    alignItems: 'center',
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
                    width: 110,
                    alignSelf: 'stretch',
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.06)',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                    ) : (
                      <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <ScanBarcode size={36} color={colors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Right Column */}
                  <View style={{ flex: 1, paddingLeft: 16, height: '100%', justifyContent: 'space-between' }}>
                    {/* Row 1: Title & Mascot Avatar */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', lineHeight: 22 }}>
                          {item.name}
                        </Text>
                      </View>

                      {/* Fixed circular container for mini mascot to prevent cut off */}
                      <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      }}>
                        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                          <Mascot size={44} state={cardMascotState} />
                        </View>
                      </View>
                    </View>

                    {/* Row 2: Separate Containers for Product Weight/Sugar, Serving Weight/Sugar, Energy */}
                    <View style={{ gap: 10, marginVertical: 7 }}>
                      {/* Container 1: Product Weight & Total Sugar (tsp) */}
                      <View style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 185, 56, 0.04)',
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        gap: 4
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Product Weight:</Text>
                          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '900' }}>{productWeightStr}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Total Sugar:</Text>
                          <Text style={{ color: sugColor, fontSize: 11, fontWeight: '900' }}>{totalSugarTsp.toFixed(1).replace(/\.0$/, '')} tsp</Text>
                        </View>
                      </View>

                      {/* Container 2: Per Serving Weight & Sugar (tsp) */}
                      <View style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 185, 56, 0.04)',
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        gap: 4
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Per Serving Weight:</Text>
                          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '900' }}>{servingWeightStr}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Per Serving Sugar:</Text>
                          <Text style={{ color: sugColor, fontSize: 11, fontWeight: '900' }}>{servingSugarTsp.toFixed(1).replace(/\.0$/, '')} tsp</Text>
                        </View>
                      </View>

                      {/* Container 3: Total Energy & Per Serving Energy */}
                      <View style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 185, 56, 0.04)',
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        gap: 4
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Total Energy:</Text>
                          <Text style={{ color: calColor, fontSize: 11, fontWeight: '900' }}>{itemCal} kcal</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Serving Energy:</Text>
                          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '900' }}>{servingCal} kcal</Text>
                        </View>
                      </View>
                    </View>

                    {/* Row 3: WHO Limit Bento & Save / Delete */}
                    <View style={{ flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                      <View style={{
                        flex: 1,
                        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0, 0, 0, 0)',
                        borderColor: colors.border,
                        borderWidth: 2,
                        borderRadius: 12,
                        padding: 10,
                        justifyContent: 'center',
                        minHeight: 70,
                        gap: 6
                      }}>
                        <View>
                          <View style={{ alignSelf: 'flex-start', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4, marginBottom: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 }}>Per serving</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>WHO Limit</Text>
                            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '900' }}>{itemWhoPercent}%</Text>
                          </View>
                          <View style={{ height: 7, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderRadius: 3.5, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${itemWhoPercent}%`, backgroundColor: whoBarColor }} />
                          </View>
                        </View>
                      </View>

                      {/* Actions (Favorite & Delete) */}
                      <View style={{ gap: 6, width: 40, justifyContent: 'space-between' }}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleToggleFavorite(item.id)}
                          style={{
                            flex: 1,
                            backgroundColor: item.isFavorite ? 'rgba(255, 82, 82, 0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: item.isFavorite ? '#FF5252' : colors.border,
                            borderWidth: item.isFavorite ? 1.5 : 1,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 38,
                          }}
                        >
                          <Heart
                            size={18}
                            color={item.isFavorite ? '#FF5252' : colors.textMuted}
                            fill={item.isFavorite ? '#FF5252' : 'transparent'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleRemove(item.id, item.name)}
                          style={{
                            flex: 1,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: colors.border,
                            borderWidth: 1,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 38,
                          }}
                        >
                          <Trash2 size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
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
