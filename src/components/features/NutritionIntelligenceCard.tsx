import React from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { BarChart2, AlertCircle } from 'lucide-react-native';
import { NutritionIntelligenceData, NutritionInsightItem } from '../../types/app.types';

interface NutritionIntelligenceCardProps {
  nutritionIntelligence?: NutritionIntelligenceData;
  colors: any;
  isDark: boolean;
}

export function NutritionIntelligenceCard({
  nutritionIntelligence,
  colors,
  isDark,
}: NutritionIntelligenceCardProps) {
  const insights = nutritionIntelligence?.insights ?? [];
  const hasInsights = insights.length > 0;

  const basisLabel = nutritionIntelligence?.basis === 'per_serving' && nutritionIntelligence.servingSize
    ? `PER SERVING (${nutritionIntelligence.servingSize})`
    : 'PER 100G BASIS';

  const accent = isDark ? '#38BDF8' : '#0284C7';
  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
  const rowDivider = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(12, 14, 13, 0.97)' : '#FFFFFF',
        borderColor: borderDivider,
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.12 : 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* ── Header with Reference Basis Tag ─────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.18)',
            }}
          >
            <BarChart2 size={17} color={accent} strokeWidth={2.2} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={1}>
              Nutrient Intelligence
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600', marginTop: 0.5 }} numberOfLines={1}>
              Granular nutrient analysis & remarks
            </Text>
          </View>
        </View>

        {/* Prominent Calculation Frame / Basis Tag */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.32)' : 'rgba(2, 132, 199, 0.26)',
            borderWidth: 1,
            paddingHorizontal: 8.5,
            paddingVertical: 4.5,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: accent, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {basisLabel}
          </Text>
        </View>
      </View>

      {/* ── 3-Column Table Grid ─────────────────────────────────── */}
      {!hasInsights ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <AlertCircle size={14} color={colors.textMuted || '#71717A'} />
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1 }}>
            Nutritional breakdown data is limited for this product.
          </Text>
        </View>
      ) : (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: borderDivider,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.015)',
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              borderBottomWidth: 1,
              borderBottomColor: borderDivider,
            }}
          >
            <Text style={{ flex: 3, color: colors.textMuted || colors.textSecondary, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 }}>
              NUTRIENT
            </Text>
            <Text style={{ flex: 2, textAlign: 'center', color: colors.textMuted || colors.textSecondary, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 }}>
              VALUE
            </Text>
            <Text style={{ flex: 3.2, textAlign: 'right', color: colors.textMuted || colors.textSecondary, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 }}>
              REMARK
            </Text>
          </View>

          {/* Table Rows */}
          {insights.map((item: NutritionInsightItem, index: number) => {
            const isPositive = item.tone === 'positive';
            const isCaution = item.tone === 'caution';

            const toneColor = isPositive
              ? isDark ? '#34D399' : '#16A34A'
              : isCaution
              ? isDark ? '#F87171' : '#DC2626'
              : isDark ? '#FBBF24' : '#D97706';

            const badgeBg = isPositive
              ? isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(22, 163, 74, 0.08)'
              : isCaution
              ? isDark ? 'rgba(248, 113, 113, 0.12)' : 'rgba(220, 38, 38, 0.08)'
              : isDark ? 'rgba(251, 191, 36, 0.10)' : 'rgba(217, 119, 6, 0.07)';

            const badgeBorder = isPositive
              ? isDark ? 'rgba(52, 211, 153, 0.28)' : 'rgba(22, 163, 74, 0.20)'
              : isCaution
              ? isDark ? 'rgba(248, 113, 113, 0.28)' : 'rgba(220, 38, 38, 0.20)'
              : isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(217, 119, 6, 0.18)';

            const displayRemark = item.remark || item.level;

            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 9.5,
                  paddingHorizontal: 12,
                  borderBottomWidth: index < insights.length - 1 ? 1 : 0,
                  borderBottomColor: rowDivider,
                  backgroundColor: index % 2 === 1 ? (isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)') : 'transparent',
                }}
              >
                {/* Column 1: Nutrient Title */}
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 4 }}>
                  <View
                    style={{
                      width: 5.5,
                      height: 5.5,
                      borderRadius: 3,
                      backgroundColor: toneColor,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 12,
                      fontWeight: '700',
                      letterSpacing: -0.1,
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </View>

                {/* Column 2: Value in Grams / mg */}
                <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 12.5,
                      fontWeight: '800',
                      letterSpacing: -0.2,
                    }}
                    numberOfLines={1}
                  >
                    {item.value || '—'}
                  </Text>
                </View>

                {/* Column 3: Remark & Status Badge */}
                <View style={{ flex: 3.2, alignItems: 'flex-end', justifyContent: 'center' }}>
                  <View
                    style={{
                      backgroundColor: badgeBg,
                      borderColor: badgeBorder,
                      borderWidth: 1,
                      paddingHorizontal: 7.5,
                      paddingVertical: 2.5,
                      borderRadius: 6,
                      maxWidth: '100%',
                    }}
                  >
                    <Text
                      style={{
                        color: toneColor,
                        fontSize: 9.5,
                        fontWeight: '800',
                        letterSpacing: 0.2,
                        textAlign: 'center',
                      }}
                      numberOfLines={1}
                    >
                      {displayRemark}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
