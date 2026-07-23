import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type NutriScoreGrade = 'a' | 'b' | 'c' | 'd' | 'e' | string;

export interface NutriScoreTrafficLightProps {
  /** The grade ('a' | 'b' | 'c' | 'd' | 'e') from Open Food Facts or BiteFix */
  grade?: NutriScoreGrade;
  /** Whether dark mode is active */
  isDark?: boolean;
  /** Optional theme colors object */
  colors?: any;
  /** Whether to show a compact badge instead of the full 5-block traffic light */
  compact?: boolean;
}

interface GradeConfig {
  letter: string;
  color: string;
  label: string;
  desc: string;
}

export const NUTRI_SCORE_CONFIG: Record<string, GradeConfig> = {
  a: {
    letter: 'A',
    color: '#038141', // Dark Green
    label: 'Excellent Quality',
    desc: 'Optimal nutrient balance rich in fiber & protein',
  },
  b: {
    letter: 'B',
    color: '#85BB2F', // Light Green
    label: 'Good Quality',
    desc: 'Healthy nutritional profile with low negative factors',
  },
  c: {
    letter: 'C',
    color: '#FECB02', // Yellow / Amber
    label: 'Moderate Quality',
    desc: 'Average balance of sugars, fats, and positive nutrients',
  },
  d: {
    letter: 'D',
    color: '#EE8100', // Orange
    label: 'Poor Quality',
    desc: 'High in sugars, saturated fats, calories, or salt',
  },
  e: {
    letter: 'E',
    color: '#E63E11', // Red
    label: 'Lowest Quality',
    desc: 'Heavy nutritional penalty; consume sparingly',
  },
};

export function NutriScoreTrafficLight({
  grade,
  isDark = true,
  colors = { text: '#FFFFFF', textSecondary: '#A1A1AA', textMuted: '#71717A' },
  compact = false,
}: NutriScoreTrafficLightProps) {
  const normalizedGrade = grade ? grade.toLowerCase() : undefined;
  const activeConfig = normalizedGrade && NUTRI_SCORE_CONFIG[normalizedGrade]
    ? NUTRI_SCORE_CONFIG[normalizedGrade]
    : undefined;

  const gradesList: Array<'a' | 'b' | 'c' | 'd' | 'e'> = ['a', 'b', 'c', 'd', 'e'];
  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const bentoBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

  if (compact) {
    if (!activeConfig) return null;
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: activeConfig.color + '18',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: activeConfig.color + '40',
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            backgroundColor: activeConfig.color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>
            {activeConfig.letter}
          </Text>
        </View>
        <Text style={{ color: colors.text || '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
          Nutri-Score {activeConfig.letter}
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
        marginVertical: 8,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <Text
            style={{
              color: colors.textSecondary || '#A1A1AA',
              fontSize: 10,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
            numberOfLines={1}
          >
            NUTRI-SCORE
          </Text>
        </View>
        {activeConfig ? (
          <Text style={{ color: activeConfig.color, fontSize: 11, fontWeight: '900', flexShrink: 1, textAlign: 'right' }} numberOfLines={1}>
            Grade {activeConfig.letter} • {activeConfig.label}
          </Text>
        ) : (
          <Text style={{ color: colors.textMuted || '#71717A', fontSize: 11, fontWeight: '700', flexShrink: 1, textAlign: 'right' }} numberOfLines={1}>
            Not Evaluated
          </Text>
        )}
      </View>

      {/* 5-Block Traffic Light Row */}
      <View style={{ flexDirection: 'row', gap: 6, height: 42, alignItems: 'center' }}>
        {gradesList.map((itemGrade) => {
          const cfg = NUTRI_SCORE_CONFIG[itemGrade];
          const isActive = normalizedGrade === itemGrade;
          const isKnown = Boolean(normalizedGrade);

          return (
            <View
              key={itemGrade}
              style={[
                {
                  flex: isActive ? 1.4 : 1,
                  height: isActive ? 40 : 32,
                  borderRadius: 10,
                  backgroundColor: isActive
                    ? cfg.color
                    : isKnown
                      ? cfg.color + '25'
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                  borderWidth: isActive ? 2 : 1,
                  borderColor: isActive
                    ? '#FFFFFF'
                    : isKnown
                      ? cfg.color + '40'
                      : isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: isActive ? cfg.color : 'transparent',
                  shadowOffset: { width: 0, height: isActive ? 4 : 0 },
                  shadowOpacity: isActive ? 0.6 : 0,
                  shadowRadius: isActive ? 8 : 0,
                  elevation: isActive ? 4 : 0,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? '#FFFFFF' : isKnown ? cfg.color : colors.textMuted || '#71717A',
                  fontSize: isActive ? 18 : 13,
                  fontWeight: '900',
                  letterSpacing: -0.5,
                }}
              >
                {cfg.letter}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Active Grade Description or Info */}
      {activeConfig ? (
        <Text
          style={{
            color: colors.textSecondary || '#A1A1AA',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 10,
            lineHeight: 16,
          }}
        >
          {activeConfig.desc}
        </Text>
      ) : (
        <Text
          style={{
            color: colors.textMuted || '#71717A',
            fontSize: 11,
            fontWeight: '500',
            marginTop: 10,
            lineHeight: 15,
          }}
        >
          Open Food Facts grade unavailable for this product. Score is estimated from sugar and additives.
        </Text>
      )}
    </View>
  );
}
