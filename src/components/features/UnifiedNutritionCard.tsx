import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { Activity } from 'lucide-react-native';
import { NutriScoreTrafficLight, NUTRI_SCORE_CONFIG } from '@/components/features/NutriScoreTrafficLight';
import { NutritionIntelligenceCard } from '@/components/features/NutritionIntelligenceCard';
import type { NutritionIntelligenceData } from '@/types/app.types';

export interface UnifiedNutritionCardProps {
  nutriScoreGrade?: string;
  nutritionIntelligence?: NutritionIntelligenceData;
  colors: any;
  isDark: boolean;
}

/**
 * Unified Nutrition & Nutri-Score card — joins the official A–E traffic light
 * grading with the granular macro/micronutrient intelligence breakdown.
 */
export function UnifiedNutritionCard({
  nutriScoreGrade,
  nutritionIntelligence,
  colors,
  isDark,
}: UnifiedNutritionCardProps) {
  const normalizedGrade = nutriScoreGrade ? nutriScoreGrade.toLowerCase() : undefined;
  const activeGrade = normalizedGrade && NUTRI_SCORE_CONFIG[normalizedGrade]
    ? NUTRI_SCORE_CONFIG[normalizedGrade]
    : undefined;
  const accent = activeGrade?.color ?? (isDark ? '#22D3EE' : '#0891B2');

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(5, 10, 6, 0.96)' : '#FFFFFF',
        borderColor: isDark ? `${accent}33` : `${accent}24`,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.16 : 0.06,
        shadowRadius: 18,
        elevation: 6,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: `${accent}1A`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${accent}30`,
          }}
        >
          <Activity size={18} color={accent} strokeWidth={2.2} />
        </View>
        <View>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
            Nutri-Score & Nutrient Breakdown
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
            {activeGrade ? `Official Grade ${activeGrade.letter.toUpperCase()} · ${activeGrade.label}` : 'Grade not yet available in published data'}
          </Text>
        </View>
      </View>

      {/* Grade badge + traffic light scale */}
      <NutriScoreTrafficLight grade={normalizedGrade} colors={colors} isDark={isDark} />

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          marginVertical: 16,
        }}
      />

      {/* Granular macro & micronutrient insights */}
      <NutritionIntelligenceCard nutritionIntelligence={nutritionIntelligence} colors={colors} isDark={isDark} />
    </View>
  );
}
