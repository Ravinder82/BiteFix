import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { useAppStore } from '../../stores/appStore';
import { formatSugar, getConsistentNutritionalMetrics } from '../../utils/sugar';

interface NutritionFactsProps {
  colors: any;
  productName?: string;
  calories?: number;
  sugarGrams: number;
  servingSize?: string;
  sugarPer100g?: number;
  packageSize?: string;
  totalSugarGrams?: number;
  totalCalories?: number;
  whoLimitServingPercent?: number;
  isDefaultServing?: boolean;
}

export function NutritionFacts({
  colors,
  productName,
  calories,
  sugarGrams,
  servingSize,
  sugarPer100g,
  packageSize,
  totalSugarGrams,
  totalCalories,
  whoLimitServingPercent,
  isDefaultServing,
}: NutritionFactsProps) {
  const { sugarUnit } = useAppStore();
  const isDarkMode = colors.background === '#000000';
  const labelColor = colors.text;
  const labelBorderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.text;
  const rowDividerColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const metrics = getConsistentNutritionalMetrics({
    sugarPer100g,
    sugarGrams,
    totalSugarGrams,
    packageSize,
    servingSize,
    calories,
    totalCalories,
  });

  const displayServingSugarG = metrics.servingSugarG;
  const displayTotalSugarG = metrics.totalSugarG;
  const tspServing = metrics.servingTsp;
  const tspTotal = metrics.totalTsp;
  const displayCalories = metrics.servingCalories;
  const displayTotalCalories = metrics.totalCalories;
  const displayWhoPercent = whoLimitServingPercent ?? metrics.whoLimitPercent;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: labelBorderColor,
        borderWidth: 1.5,
        padding: 18,
        borderRadius: 20,
        marginVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDarkMode ? 0.4 : 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Title & Badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
        <Text style={{ color: labelColor, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
          Sugar Facts
        </Text>
        <View style={{
          backgroundColor: isDefaultServing ? (isDarkMode ? '#3b2d00' : '#fef3c7') : (isDarkMode ? '#063f24' : '#d1fae5'),
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: isDefaultServing ? (isDarkMode ? '#78350f' : '#f59e0b') : (isDarkMode ? '#047857' : '#10b981')
        }}>
          <Text style={{
            color: isDefaultServing ? (isDarkMode ? '#fde68a' : '#b45309') : (isDarkMode ? '#a7f3d0' : '#047857'),
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 0.3
          }}>
            {isDefaultServing ? '100G/ML STANDARD' : 'EXPLICIT SERVING'}
          </Text>
        </View>
      </View>

      {/* Product Name */}
      {productName && (
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', paddingBottom: 10, lineHeight: 18 }}>
          {productName}
        </Text>
      )}

      {/* ─── 2 VERTICALLY STACKED PREMIUM CARDS ─── */}
      <View style={{ flexDirection: 'column', gap: 14 }}>
        {/* CARD 1: PER SERVING BREAKDOWN */}
        <View
          style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
            borderRadius: 18,
            padding: 16,
            borderWidth: 1.5,
            borderColor: colors.primary + (isDarkMode ? '35' : '25'),
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.15 : 0.05,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                1. Per Serving Breakdown
              </Text>
            </View>
            <View style={{ backgroundColor: colors.primary + (isDarkMode ? '25' : '15'), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '30' }}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>
                {servingSize || '100 g / 100 ml'}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: rowDividerColor, marginBottom: 12 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: displayWhoPercent !== undefined ? 12 : 0 }}>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Sugar Content
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: labelColor, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
                  {formatSugar(displayServingSugarG, sugarUnit)}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '800' }}>
                  ({tspServing} tsp)
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Energy
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 17, fontWeight: '800' }}>
                {displayCalories !== undefined ? `${Math.round(displayCalories)} kcal` : '— kcal'}
              </Text>
            </View>
          </View>

          {displayWhoPercent !== undefined && (
            <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: rowDividerColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>WHO Daily Limit (Per Serving)</Text>
              <View style={{ backgroundColor: displayWhoPercent > 100 ? colors.error : colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{displayWhoPercent}% of 12 tsp Max</Text>
              </View>
            </View>
          )}
        </View>

        {/* CARD 2: FULL PRODUCT SIZE / PACKAGE TOTAL */}
        <View
          style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
            borderRadius: 18,
            padding: 16,
            borderWidth: 1.5,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.2 : 0.03,
            shadowRadius: 10,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textSecondary }} />
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                2. Full Package Total
              </Text>
            </View>
            <View style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }}>
              <Text style={{ color: labelColor, fontSize: 11, fontWeight: '800' }}>
                {packageSize || 'Size Not Listed'}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: rowDividerColor, marginBottom: 12 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Total Sugar
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: labelColor, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
                  {displayTotalSugarG !== undefined ? formatSugar(displayTotalSugarG, sugarUnit) : '—'}
                </Text>
                {displayTotalSugarG !== undefined && (
                  <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '800' }}>
                    ({tspTotal} tsp)
                  </Text>
                )}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Total Energy
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 17, fontWeight: '800' }}>
                {displayTotalCalories !== undefined ? `${Math.round(displayTotalCalories)} kcal` : '— kcal'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
