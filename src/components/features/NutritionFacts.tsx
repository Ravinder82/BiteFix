import React from 'react';
import { View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { useAppStore } from '../../stores/appStore';
import { formatSugar, getConsistentNutritionalMetrics } from '../../utils/sugar';
import { calculateJoggingMinutes, formatJogTime } from '../../utils/format';

interface NutritionFactsProps {
  colors: any;
  productName?: string;
  calories?: number;
  sugarGrams: number;
  servingSize?: string;
  sugarPer100g?: number;
  whoLimitServingPercent?: number;
  isDefaultServing?: boolean;
  hasHiddenSugars?: boolean;
  hiddenSugars?: string[];
  hiddenSugarCount?: number;
}

export function NutritionFacts({
  colors,
  productName,
  calories,
  sugarGrams,
  servingSize,
  sugarPer100g,
  whoLimitServingPercent,
  isDefaultServing,
  hasHiddenSugars,
  hiddenSugars,
  hiddenSugarCount,
}: NutritionFactsProps) {
  const { sugarUnit } = useAppStore();
  const isDarkMode = colors.background === '#000000' || colors.isDark;
  const borderDivider = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const bentoBg = isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

  const metrics = getConsistentNutritionalMetrics({
    sugarPer100g,
    sugarGrams,
    servingSize,
    calories,
  });

  const displayServingSugarG = metrics.servingSugarG;
  const tspServing = metrics.servingTsp;
  const displayCalories = metrics.servingCalories;
  const displayWhoPercent = whoLimitServingPercent ?? metrics.whoLimitPercent;
  const joggingMins = calculateJoggingMinutes(displayCalories ?? 0);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: borderDivider,
        borderWidth: 1,
        padding: 20,
        borderRadius: 24,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDarkMode ? 0.35 : 0.04,
        shadowRadius: 18,
        elevation: 5,
      }}
    >
      {/* Title & Serving Standard Tag */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
            Sugar & Energy
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
            Serving: {servingSize || '100 g / 100 ml'}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: borderDivider, marginBottom: 16 }} />

      {/* ── Bento Telemetry Grid (Sugar Load & Activity Burn) ── */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        {/* Cell 1: Sugar Content & WHO Limit */}
        <View
          style={{
            flex: 1.2,
            backgroundColor: bentoBg,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: borderDivider,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              SUGAR LOAD
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
                {formatSugar(displayServingSugarG, sugarUnit)}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>
                ({tspServing} tsp)
              </Text>
            </View>
          </View>

          {displayWhoPercent !== undefined && (
            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderDivider }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>WHO Limit</Text>
                <Text style={{ color: displayWhoPercent > 100 ? '#EF4444' : colors.primary, fontSize: 11, fontWeight: '900' }}>
                  {displayWhoPercent}%
                </Text>
              </View>
              {/* Mini Gauge bar */}
              <View style={{ height: 4, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.min(100, displayWhoPercent)}%`,
                    height: '100%',
                    backgroundColor: displayWhoPercent > 100 ? '#EF4444' : displayWhoPercent > 60 ? '#F5A623' : '#22C55E',
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Cell 2: Energy & Burn Down Activity */}
        <View
          style={{
            flex: 1,
            backgroundColor: bentoBg,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: borderDivider,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              ENERGY
            </Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
              {displayCalories !== undefined ? `${Math.round(displayCalories)}` : '—'} <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>kcal</Text>
            </Text>
          </View>

          {displayCalories !== undefined && displayCalories > 0 && (
            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderDivider, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', padding: 4, borderRadius: 6 }}>
                <Flame size={13} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Burn Down</Text>
                <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '900' }}>
                  {formatJogTime(joggingMins)} Jogging
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Disguised / Hidden Sugars Audit Box (No coloured cards, only LED lights & tidy names) ── */}
      {(() => {
        const hasHidden = hasHiddenSugars === true && hiddenSugars && hiddenSugars.length > 0;

        if (!hasHidden) {
          return (
            <View
              style={{
                backgroundColor: bentoBg,
                borderColor: borderDivider,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#22C55E',
                    shadowColor: '#22C55E',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  PURE SWEETNESS PROFILE
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, paddingLeft: 18 }}>
                Zero disguised artificial sweeteners, high-fructose syrups, or sneaky sugar derivatives identified.
              </Text>
            </View>
          );
        }

        return (
          <View
            style={{
              backgroundColor: bentoBg,
              borderColor: borderDivider,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Other SUGARS
              </Text>
              <Text style={{ color: '#FF9500', fontSize: 11, fontWeight: '800' }}>
                {hiddenSugarCount || hiddenSugars.length} Found
              </Text>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 16, marginBottom: 12 }}>
              Manufacturers use over 60 chemical names for added sugars.
            </Text>

            <View style={{ gap: 8 }}>
              {hiddenSugars.map((sugar, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#FF9500',
                      shadowColor: '#FF9500',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                    }}
                  />
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                    {sugar}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })()}
    </View>
  );
}
