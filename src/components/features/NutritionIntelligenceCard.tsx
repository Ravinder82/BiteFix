import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles, Activity, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react-native';
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

  const accent = isDark ? '#38BDF8' : '#0284C7'; // Refined analytical cyan/sky accent
  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(12, 14, 13, 0.97)' : '#FFFFFF',
        borderColor: borderDivider,
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.12 : 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color={accent} strokeWidth={2.2} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={1}>
              Nutrition Intelligence
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', marginTop: 1 }} numberOfLines={2}>
              What the available nutrition data suggests
            </Text>
          </View>
        </View>

        {hasInsights && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(2, 132, 199, 0.22)',
              borderWidth: 1,
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 8,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: accent, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 }}>
              {insights.length} SIGNALS
            </Text>
          </View>
        )}
      </View>

      {/* ── Content Rows ───────────────────────────────────── */}
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
        <View style={{ gap: 7 }}>
          {insights.map((item: NutritionInsightItem) => {
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

            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  gap: 10,
                }}
              >
                {/* Left Label & Contextual Value */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: toneColor,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: -0.1,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {item.value ? (
                    <Text
                      style={{
                        color: colors.textMuted || colors.textSecondary,
                        fontSize: 10.5,
                        fontWeight: '700',
                        opacity: 0.85,
                      }}
                      numberOfLines={1}
                    >
                      ({item.value})
                    </Text>
                  ) : null}
                </View>

                {/* Right Status Badge */}
                <View
                  style={{
                    backgroundColor: badgeBg,
                    borderColor: badgeBorder,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    alignSelf: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: toneColor,
                      fontSize: 9.5,
                      fontWeight: '900',
                      letterSpacing: 0.3,
                    }}
                    numberOfLines={1}
                  >
                    {item.level}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
