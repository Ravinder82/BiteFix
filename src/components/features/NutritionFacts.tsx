import React from 'react';
import { View, Text } from 'react-native';

interface NutritionFactsProps {
  colors: any;
  productName?: string;
  calories?: number;
  sugarGrams: number;
  servingSize?: string;
}

export function NutritionFacts({
  colors,
  productName,
  calories,
  sugarGrams,
  servingSize,
}: NutritionFactsProps) {
  // Use a softer border for dark mode so it feels premium and integrated
  const isDarkMode = colors.background === '#000000';
  const labelColor = colors.text;
  const labelBorderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.text;
  const rowDividerColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

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
      {/* Title */}
      <Text style={{ color: labelColor, fontSize: 24, fontWeight: '900', letterSpacing: -0.6, paddingBottom: 4 }}>
        Nutrition Facts
      </Text>
      
      {/* Product Name */}
      {productName && (
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', paddingBottom: 8, lineHeight: 18 }}>
          {productName}
        </Text>
      )}

      {/* Serving Size */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderTopWidth: 3,
          borderTopColor: labelBorderColor,
          borderBottomWidth: 1,
          borderBottomColor: rowDividerColor
        }}
      >
        <Text style={{ color: labelColor, fontSize: 12, fontWeight: '700' }}>
          Serving Size
        </Text>
        <Text style={{ color: labelColor, fontSize: 12, fontWeight: '700' }}>
          {servingSize || '1 serving'}
        </Text>
      </View>

      {/* Primary Bold Divider */}
      <View style={{ height: 6, backgroundColor: labelBorderColor, marginVertical: 6, borderRadius: 2 }} />

      {/* Amount Per Serving */}
      <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Amount Per Serving
      </Text>

      {/* Calories */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottomWidth: 2.5,
          borderBottomColor: labelBorderColor,
          paddingBottom: 4,
          marginTop: 2
        }}
      >
        <Text style={{ color: labelColor, fontSize: 19, fontWeight: '900', letterSpacing: -0.2 }}>
          Calories
        </Text>
        <Text style={{ color: labelColor, fontSize: 26, fontWeight: '900', lineHeight: 28 }}>
          {calories !== undefined ? Math.round(calories) : '—'}
        </Text>
      </View>

      {/* Subtitle Value indicator */}
      <Text style={{ color: colors.textSecondary, fontSize: 8.5, fontWeight: '800', textAlign: 'right', paddingVertical: 5, letterSpacing: 0.5 }}>
        Amount / Serving
      </Text>

      {/* Sugar (Highlighted brand-color row, indented) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 7.5,
          borderBottomWidth: 2,
          borderBottomColor: labelBorderColor,
          paddingLeft: 16,
          backgroundColor: colors.primary + '08',
          marginHorizontal: -6,
          paddingHorizontal: 6,
          borderRadius: 6
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900' }}>
          Total Sugars
        </Text>
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900' }}>
          {sugarGrams.toFixed(1)}g
        </Text>
      </View>
    </View>
  );
}
