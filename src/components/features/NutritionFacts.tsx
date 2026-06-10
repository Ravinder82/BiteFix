import React from 'react';
import { View, Text } from 'react-native';

interface NutritionFactsProps {
  colors: any;
  calories?: number;
  sugarGrams: number;
  carbsGrams?: number;
  fatGrams?: number;
  proteinGrams?: number;
  servingSize?: string;
}

export function NutritionFacts({
  colors,
  calories,
  sugarGrams,
  carbsGrams,
  fatGrams,
  proteinGrams,
  servingSize,
}: NutritionFactsProps) {
  return (
    <View 
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.text, 
        borderWidth: 2, 
        padding: 16, 
        borderRadius: 12,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      {/* Title */}
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, paddingBottom: 6 }}>
        Nutrition Facts
      </Text>

      {/* Serving Size */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 4, borderTopColor: colors.text, borderBottomWidth: 1, borderBottomColor: colors.textSecondary + '40' }}>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
          Serving Size
        </Text>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
          {servingSize || '1 serving'}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 6, backgroundColor: colors.text, marginVertical: 4 }} />

      {/* Amount Per Serving & Calories */}
      <Text style={{ color: colors.text, fontSize: 9, fontWeight: '800' }}>
        Amount Per Serving
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 3, borderBottomColor: colors.text, paddingBottom: 2 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
          Calories
        </Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', lineHeight: 24 }}>
          {calories !== undefined ? Math.round(calories) : '—'}
        </Text>
      </View>

      {/* Daily Value Indicator */}
      <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800', textAlign: 'right', paddingVertical: 4 }}>
        Amount / Serving
      </Text>

      {/* Carbs */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.textSecondary + '30' }}>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
          Total Carbohydrate
        </Text>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
          {carbsGrams !== undefined ? `${carbsGrams.toFixed(1)}g` : '—'}
        </Text>
      </View>

      {/* Sugar (Sub-item of Carbs, indented) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.textSecondary + '30', paddingLeft: 16 }}>
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>
          Total Sugars
        </Text>
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900' }}>
          {sugarGrams.toFixed(1)}g
        </Text>
      </View>

      {/* Fats */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.textSecondary + '30' }}>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
          Total Fat
        </Text>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
          {fatGrams !== undefined ? `${fatGrams.toFixed(1)}g` : '—'}
        </Text>
      </View>

      {/* Proteins */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: colors.text }}>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
          Protein
        </Text>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
          {proteinGrams !== undefined ? `${proteinGrams.toFixed(1)}g` : '—'}
        </Text>
      </View>
    </View>
  );
}
