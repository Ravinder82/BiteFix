import React, { useEffect } from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@/components/Text';
import { Candy } from 'lucide-react-native';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = AnimatedReanimated.createAnimatedComponent(TextInput);

export interface SugarImpactCardProps {
  /** Estimated sugar in teaspoons for one serving */
  sugarTeaspoons?: number;
  /** Sugar grams per serving (falls back to per-100g value) */
  sugarGrams?: number;
  sugarPer100g?: number;
  servingSize?: string;
  /** Percent of the WHO 50 g daily reference intake consumed by this serving */
  whoLimitServingPercent?: number;
  hasHiddenSugars?: boolean;
  hiddenSugars?: string[];
  hiddenSugarCount?: number;
  colors: any;
  isDark: boolean;
}

/**
 * Sugar Impact Card — estimated sugar equivalent in physical teaspoons,
 * WHO 50 g daily reference gauge, and stealth sugar ingredient list.
 */
export function SugarImpactCard({
  sugarTeaspoons = 0,
  sugarGrams,
  sugarPer100g,
  servingSize,
  whoLimitServingPercent,
  hasHiddenSugars,
  hiddenSugars,
  hiddenSugarCount,
  colors,
  isDark,
}: SugarImpactCardProps) {
  const accent = isDark ? '#FBBF24' : '#D97706';

  // Animated teaspoon counter — counts up once after the card slides in
  const animatedSugarVal = useSharedValue(0);

  useEffect(() => {
    animatedSugarVal.value = 0;
    animatedSugarVal.value = withDelay(
      500,
      withTiming(sugarTeaspoons, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugarTeaspoons]);

  const animatedSugarProps = useAnimatedProps<any>(() => ({
    text: animatedSugarVal.value.toFixed(1),
  }));

  const whoPercent =
    whoLimitServingPercent ?? Math.min(500, Math.round((sugarTeaspoons / 12) * 100));
  const gaugeColor =
    whoPercent > 100 ? (isDark ? '#F87171' : '#DC2626')
    : whoPercent > 50 ? accent
    : (isDark ? '#34D399' : '#16A34A');

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(5, 10, 6, 0.96)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(251,191,36,0.22)' : 'rgba(217,119,6,0.15)',
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: isDark ? '#FBBF24' : '#D97706',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.18 : 0.07,
        shadowRadius: 18,
        elevation: 6,
        overflow: 'hidden',
      }}
    >
      {/* Subtle amber aurora */}
      <View
        style={{
          position: 'absolute', top: -50, right: -50,
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(217,119,6,0.05)',
        }}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: isDark ? 'rgba(251,191,36,0.14)' : 'rgba(217,119,6,0.10)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: isDark ? 'rgba(251,191,36,0.25)' : 'rgba(217,119,6,0.18)',
            }}
          >
            <Candy size={18} color={accent} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
              Estimated Sugar Equivalent
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              Serving: {servingSize || '100 g / 100 ml'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Teaspoons & Grams Row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.8 }}>
              ≈
            </Text>
            <AnimatedTextInput
              animatedProps={animatedSugarProps}
              editable={false}
              style={{ color: colors.text, fontSize: 40, fontWeight: '900', letterSpacing: -1.5, padding: 0, margin: 0 }}
            />
            <Text style={{ color: accent, fontSize: 16, fontWeight: '800' }}>
              tsp
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', marginTop: 2 }}>
            sugar equivalent
          </Text>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
          {sugarGrams ?? sugarPer100g ?? 0} g per serving
        </Text>
      </View>

      {/* WHO Limit Gauge */}
      <View
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,248,0.95)',
          padding: 14, borderRadius: 16, borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700' }}>
            Daily Reference Comparison
          </Text>
          <Text style={{ color: gaugeColor, fontSize: 12, fontWeight: '900' }}>
            {whoPercent}% of 50 g reference
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          <View style={{ height: '100%', width: `${Math.min(100, whoPercent)}%`, backgroundColor: gaugeColor, borderRadius: 4 }} />
        </View>
      </View>

      {/* Stealth Sugar List */}
      {hasHiddenSugars && hiddenSugars && hiddenSugars.length > 0 && (
        <View
          style={{
            marginTop: 10,
            backgroundColor: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(239,68,68,0.06)',
            borderColor: isDark ? 'rgba(248,113,113,0.22)' : 'rgba(239,68,68,0.18)',
            borderWidth: 1, borderRadius: 14, padding: 12, gap: 6,
          }}
        >
          <Text style={{ color: isDark ? '#F87171' : '#DC2626', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Sugar-Related Ingredients Found ({hiddenSugarCount || hiddenSugars.length})
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {hiddenSugars.map((s: string, idx: number) => (
              <View
                key={idx}
                style={{
                  backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(239,68,68,0.10)',
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                }}
              >
                <Text style={{ color: isDark ? '#F87171' : '#DC2626', fontSize: 10.5, fontWeight: '700' }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
