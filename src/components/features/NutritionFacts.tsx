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

      {/* ─── SECTION 1: PER SERVING BREAKDOWN ─── */}
      <View style={{ backgroundColor: colors.primary + '08', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.primary + '20' }}>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
          1. Per Serving Breakdown
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: rowDividerColor }}>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '700' }}>Serving Size</Text>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '800' }}>{servingSize || '100 g / 100 ml'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: rowDividerColor }}>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '700' }}>Serving Energy</Text>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '800' }}>{displayCalories !== undefined ? `${Math.round(displayCalories)} kcal` : '—'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: rowDividerColor }}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900' }}>Sugar per Serving</Text>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900' }}>{formatSugar(displayServingSugarG, sugarUnit)} ({tspServing} tsp)</Text>
        </View>

        {displayWhoPercent !== undefined && (
          <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: rowDividerColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>WHO Daily Limit (Per Serving)</Text>
            <View style={{ backgroundColor: displayWhoPercent > 100 ? colors.error : colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{displayWhoPercent}% of 12 tsp Max</Text>
            </View>
          </View>
        )}
      </View>

      {/* ─── SECTION 2: FULL PRODUCT SIZE / PACKAGE TOTAL ─── */}
      <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: rowDividerColor }}>
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
          2. Full Product Size / Total Package
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: rowDividerColor }}>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '700' }}>Product Size</Text>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '800' }}>{packageSize || 'Size Not Listed'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: rowDividerColor }}>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '700' }}>Total Energy</Text>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '800' }}>{displayTotalCalories !== undefined ? `${Math.round(displayTotalCalories)} kcal` : '—'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '900' }}>Total Sugar in Package</Text>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '900' }}>
            {displayTotalSugarG !== undefined ? `${formatSugar(displayTotalSugarG, sugarUnit)} (${tspTotal} tsp)` : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}
