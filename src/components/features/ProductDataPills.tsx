import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { ProductDataSource, ProductDataStatus } from '../../types/app.types';

type PillTone = 'success' | 'neutral';

function HeaderInfoPill({
  label,
  accessibilityLabel,
  colors,
  isDark,
  tone = 'neutral',
}: {
  label: string;
  accessibilityLabel: string;
  colors: any;
  isDark: boolean;
  tone?: PillTone;
}) {
  const successFill = isDark ? 'rgba(34, 197, 94, 0.14)' : 'rgba(34, 197, 94, 0.1)';
  const successBorder = isDark ? 'rgba(34, 197, 94, 0.26)' : 'rgba(34, 197, 94, 0.2)';
  const neutralFill = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)';
  const neutralBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={{
        alignSelf: 'flex-start',
        backgroundColor: tone === 'success' ? successFill : neutralFill,
        borderColor: tone === 'success' ? successBorder : neutralBorder,
        borderWidth: 1,
        borderRadius: 99,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexShrink: 1,
      }}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          color: tone === 'success' ? (isDark ? '#86EFAC' : '#15803D') : colors.textSecondary,
          fontSize: 10.5,
          fontWeight: '800',
          lineHeight: 13,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function ProductDataStatusPill({
  status,
  colors,
  isDark,
}: {
  status?: ProductDataStatus;
  colors: any;
  isDark: boolean;
}) {
  if (!status) return null;

  const isComplete = status === 'complete';
  const label = isComplete ? '✓ Product Data Available' : '◐ Limited Product Data';
  const accessibilityLabel = isComplete
    ? 'Product data available'
    : 'Limited product data';

  return (
    <HeaderInfoPill
      label={label}
      accessibilityLabel={accessibilityLabel}
      colors={colors}
      isDark={isDark}
      tone={isComplete ? 'success' : 'neutral'}
    />
  );
}

export function ProductDataSourcePill({
  sources,
  colors,
  isDark,
}: {
  sources?: ProductDataSource[];
  colors: any;
  isDark: boolean;
}) {
  if (!sources || sources.length === 0) return null;

  const normalizedSources = Array.from(new Set(sources)).sort((a, b) => {
    if (a === 'open_food_facts') return -1;
    if (b === 'open_food_facts') return 1;
    return 0;
  });

  const label = normalizedSources.length === 2
    ? 'Open Food Facts + USDA'
    : normalizedSources[0] === 'usda_fooddata_central'
      ? 'USDA FoodData Central'
      : 'Open Food Facts';

  return (
    <HeaderInfoPill
      label={label}
      accessibilityLabel={`Product data source: ${label}`}
      colors={colors}
      isDark={isDark}
    />
  );
}
