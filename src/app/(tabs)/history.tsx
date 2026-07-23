import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, PanResponder, Animated } from 'react-native';
import { Text } from '@/components/Text';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import AnimatedReanimated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import { ScanBarcode, Trash2, X, ArrowUpRight, Clock } from 'lucide-react-native';
import { getConsistentNutritionalMetrics } from '../../utils/sugar';
import ProductHeroCardDashboard from '../../components/features/ProductHeroCardDashboard';
import * as Haptics from 'expo-haptics';
import { ScanHistoryItem } from '../../types/app.types';
import { formatWeight, getNovaColor, getBiteFixScoreColor } from '../../utils/format';

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

function ScanHistoryItemRow({ item, colors, isDark, onPress, onDelete }: any) {
  const { sugarUnit } = useAppStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.imageUrl]);

  const metrics = getConsistentNutritionalMetrics(item);
  const servingTsp = metrics.servingTsp ?? 0;

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

      {/* Center Details */}
      <View style={{ flex: 1, marginLeft: 12, paddingRight: 44 }}>
        <Text
          style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}
          numberOfLines={1}
        >
          {item.brand || 'Generic Brand'}
        </Text>
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

      {/* Right Column: BiteFix Score + NOVA LED */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* BiteFix Score */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: getBiteFixScoreColor(item.biteFixScore), fontSize: 14, fontWeight: '900' }}>
            {item.biteFixScore ?? '--'} <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '700' }}>/100</Text>
          </Text>
        </View>

        {/* Mini LED */}
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

        {/* Delete button (small trash icon) */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete();
          }}
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            padding: 6,
            borderRadius: 8,
            marginLeft: 2,
          }}
        >
          <Trash2 size={12} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ScanHistoryGroup({ group, groupIndex, colors, isDark, panY, setSelectedScan, deleteScan }: any) {
  const firstItemDate = new Date(group.items[0].timestamp);
  const displayTitle = firstItemDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <AnimatedReanimated.View
      entering={FadeInDown.delay(Math.min(groupIndex * 100, 400)).duration(300)}
      style={{
        backgroundColor: isDark ? colors.surface : '#F7F8FA',
        borderColor: isDark ? colors.border : 'rgba(220, 220, 220, 1)',
        borderWidth: isDark ? 1.5 : 1,
        borderRadius: 28,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.15 : 0.12,
        shadowRadius: 28,
        elevation: 10
      }}
    >
      {/* Top Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Text style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: 1.0,
            flexShrink: 1
          }} numberOfLines={1}>
            {displayTitle}
          </Text>

          <View style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.06)',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
              {group.items.length} {group.items.length === 1 ? 'Product' : 'Products'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        {group.items.map((item: any) => {
          return (
            <ScanHistoryItemRow
              key={item.id}
              item={item}
              colors={colors}
              isDark={isDark}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                panY.setValue(0);
                setSelectedScan(item);
              }}
              onDelete={() => {
                deleteScan(item.id);
              }}
            />
          );
        })}
      </View>
    </AnimatedReanimated.View>
  );
}

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const { scans, deleteScan, clearScans, sugarUnit } = useAppStore();
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);

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
            setSelectedScan(null);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Premium Header */}
      <View
        style={{
          borderColor: colors.border,
          borderWidth: 1.5,
          backgroundColor: colors.surface,
          borderRadius: 24,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.04,
          shadowRadius: 12,
          elevation: 4,
        }}
        className="flex-row items-center justify-between px-5 py-4"
      >
        <View className="flex-row items-center gap-3">
          <View style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>
              Scan History
            </Text>
          </View>
        </View>

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
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <Text style={{ color: colors.error, fontSize: 11, fontWeight: '900', letterSpacing: 0.3 }}>
              CLEAR ALL
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {scans.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1.5,
              borderRadius: 28,
              padding: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.2 : 0.04,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <ScanBarcode size={28} color={colors.textMuted} />
            </View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>
              No Scanned Products Yet
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center', lineHeight: 18, maxWidth: 260 }}>
              Use the scanner tab to analyze packaged foods, ingredients, and processing levels.
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
              <ScanHistoryGroup
                key={`group-${group.title}`}
                group={group}
                groupIndex={groupIndex}
                colors={colors}
                isDark={isDark}
                panY={panY}
                setSelectedScan={setSelectedScan}
                deleteScan={deleteScan}
              />
            ));
          })()
        )}
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
                  onPress={() => setSelectedScan(null)}
                  style={{ backgroundColor: colors.background, padding: 8, borderRadius: 20 }}
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {selectedScan && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* 1. Executive Telemetry: Purity & Additives Audit */}
                <View style={{ marginBottom: 4 }}>
                  <ProductHeroCardDashboard
                    scanResult={selectedScan}
                    colors={colors}
                    isDark={isDark}
                  />
                </View>

                {/* 2. Sugar & Energy Telemetry */}
                <NutritionFacts
                  colors={colors}
                  productName={selectedScan.name}
                  sugarGrams={selectedScan.sugarGrams ?? selectedScan.sugarPer100g ?? 0}
                  calories={selectedScan.calories}
                  servingSize={formatWeight(selectedScan.servingSize, sugarUnit) || '100 g / 100 ml'}
                  sugarPer100g={selectedScan.sugarPer100g}
                  whoLimitServingPercent={selectedScan.whoLimitServingPercent ?? (selectedScan.sugarTeaspoons !== undefined ? Math.round((selectedScan.sugarTeaspoons / 12) * 100) : undefined)}
                  isDefaultServing={selectedScan.isDefaultServing}
                  hasHiddenSugars={selectedScan.hasHiddenSugars}
                  hiddenSugars={selectedScan.hiddenSugars}
                  hiddenSugarCount={selectedScan.hiddenSugarCount}
                  nutriScore={selectedScan.nutriScore}
                />

                {/* 3. Action Dock */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
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
                    <Text style={{ color: colors.error, fontWeight: '800', fontSize: 13 }}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedScan(null);
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
