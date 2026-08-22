import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { Flame } from 'lucide-react-native';

export interface BurnOutCardProps {
  /** Total calories per serving */
  calories?: number;
  colors: any;
  isDark: boolean;
}

/** Approximate kcal/min burn rates for an average adult */
const BURN_RATES = {
  jog: 8.5,
  cycle: 6.5,
  swim: 7.5,
  walk: 4.2,
} as const;

function formatBurnTime(mins: number): string {
  if (!mins || mins <= 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Calorie Burn Out Card — total caloric content per serving with the
 * approximate physical activity time required to burn it off.
 */
export function BurnOutCard({ calories = 0, colors, isDark }: BurnOutCardProps) {
  const accent = isDark ? '#FB923C' : '#EA580C';

  const activities = useMemo(() => {
    const kcal = Math.round(calories);
    return [
      { key: 'jog', label: 'Jogging', rate: `≈${BURN_RATES.jog} kcal/min avg`, mins: Math.round(kcal / BURN_RATES.jog), color: isDark ? '#FB923C' : '#EA580C' },
      { key: 'cycle', label: 'Cycling', rate: `≈${BURN_RATES.cycle} kcal/min avg`, mins: Math.round(kcal / BURN_RATES.cycle), color: isDark ? '#22D3EE' : '#0891B2' },
      { key: 'swim', label: 'Swimming', rate: `≈${BURN_RATES.swim} kcal/min avg`, mins: Math.round(kcal / BURN_RATES.swim), color: isDark ? '#34D399' : '#16A34A' },
      { key: 'walk', label: 'Brisk Walking', rate: `≈${BURN_RATES.walk} kcal/min avg`, mins: Math.round(kcal / BURN_RATES.walk), color: isDark ? '#2DD4BF' : '#0F766E' },
    ];
  }, [calories, isDark]);

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(5, 10, 6, 0.96)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(251,146,60,0.22)' : 'rgba(234,88,12,0.15)',
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: isDark ? '#FB923C' : '#EA580C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.18 : 0.07,
        shadowRadius: 18,
        elevation: 6,
        overflow: 'hidden',
      }}
    >
      {/* Subtle orange aurora */}
      <View
        style={{
          position: 'absolute', bottom: -50, left: -50,
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: isDark ? 'rgba(251,146,60,0.07)' : 'rgba(234,88,12,0.05)',
        }}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: isDark ? 'rgba(251,146,60,0.14)' : 'rgba(234,88,12,0.10)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: isDark ? 'rgba(251,146,60,0.25)' : 'rgba(234,88,12,0.18)',
            }}
          >
            <Flame size={18} color={accent} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
              Activity Equivalent
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              Approximate Activity Time
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(234,88,12,0.10)',
            borderColor: isDark ? 'rgba(251,146,60,0.28)' : 'rgba(234,88,12,0.22)',
            borderWidth: 1.5,
            paddingHorizontal: 11,
            paddingVertical: 5,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: accent, fontSize: 13, fontWeight: '900', letterSpacing: 0.3 }}>
            {Math.round(calories)} kcal
          </Text>
        </View>
      </View>

      {/* Workout Burn Times Grid */}
      <View style={{ gap: 8 }}>
        {activities.map((act) => (
          <View
            key={act.key}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,248,0.95)',
              paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14,
              borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <View>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{act.label}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>{act.rate}</Text>
            </View>
            <View
              style={{
                backgroundColor: `${act.color}18`,
                borderColor: `${act.color}30`,
                borderWidth: 1,
                paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
              }}
            >
              <Text style={{ color: act.color, fontSize: 13, fontWeight: '900' }}>
                ≈{formatBurnTime(act.mins)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
