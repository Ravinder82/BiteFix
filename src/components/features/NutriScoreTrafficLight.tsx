import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../Text';

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
    label: 'Stronger Nutrition Profile',
    desc: 'More favorable nutrition profile based on available data',
  },
  b: {
    letter: 'B',
    color: '#85BB2F', // Light Green
    label: 'Balanced Nutrition Profile',
    desc: 'Balanced nutrition profile based on available data',
  },
  c: {
    letter: 'C',
    color: '#FECB02', // Yellow / Amber
    label: 'Moderate Nutrition Profile',
    desc: 'Mixed nutrition profile based on available data',
  },
  d: {
    letter: 'D',
    color: '#EE8100', // Orange
    label: 'Lower Nutrition Profile',
    desc: 'Higher in sugar, saturated fat, calories, or salt',
  },
  e: {
    letter: 'E',
    color: '#E63E11', // Red
    label: 'Lowest Nutrition Profile',
    desc: 'Less favorable nutrition profile based on available data',
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
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 6,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
        <Text
          style={{
            color: colors.textSecondary || '#A1A1AA',
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            alignSelf: 'center',
          }}
          numberOfLines={1}
        >
          NUTRI-SCORE
        </Text>
        {activeConfig ? (
          <View style={{
            backgroundColor: `${activeConfig.color}15`,
            borderColor: `${activeConfig.color}35`,
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
          }}>
              <Text style={{ color: activeConfig.color, fontSize: 10.5, fontWeight: '900' }} numberOfLines={2}>
                Grade {activeConfig.letter} • {activeConfig.label}
              </Text>
          </View>
        ) : (
          <Text style={{ color: colors.textMuted || '#71717A', fontSize: 10.5, fontWeight: '700' }} numberOfLines={1}>
            Not Evaluated
          </Text>
        )}
      </View>

      {/* 5-Block Traffic Light Row */}
      <View style={{ flexDirection: 'row', gap: 5, height: 34, alignItems: 'center' }}>
        {gradesList.map((itemGrade) => {
          const cfg = NUTRI_SCORE_CONFIG[itemGrade];
          const isActive = normalizedGrade === itemGrade;
          const isKnown = Boolean(normalizedGrade);

          return (
            <View
              key={itemGrade}
              style={[
                {
                  flex: isActive ? 1.35 : 1,
                  height: isActive ? 34 : 28,
                  borderRadius: 8,
                  backgroundColor: isActive
                    ? cfg.color
                    : isKnown
                      ? cfg.color + '20'
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                  borderWidth: isActive ? 1.5 : 0.5,
                  borderColor: isActive
                    ? '#FFFFFF'
                    : isKnown
                      ? cfg.color + '35'
                      : isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: isActive ? cfg.color : 'transparent',
                  shadowOffset: { width: 0, height: isActive ? 3 : 0 },
                  shadowOpacity: isActive ? 0.5 : 0,
                  shadowRadius: isActive ? 6 : 0,
                  elevation: isActive ? 3 : 0,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? '#FFFFFF' : isKnown ? cfg.color : colors.textMuted || '#71717A',
                  fontSize: isActive ? 15 : 12,
                  fontWeight: '900',
                  letterSpacing: -0.3,
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
            fontSize: 11,
            fontWeight: '600',
            marginTop: 8,
            lineHeight: 15,
          }}
          numberOfLines={2}
        >
          {activeConfig.desc}
        </Text>
      ) : null}
    </View>
  );
}
