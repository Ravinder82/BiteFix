import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Globe, Leaf, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface EcoScoreCardProps {
  grade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown' | string;
  carbonFootprint?: number;
  isOrganic?: boolean;
  isVegan?: boolean;
  isVegetarian?: boolean;
}

export function EcoScoreCard({ grade, carbonFootprint, isOrganic, isVegan, isVegetarian }: EcoScoreCardProps) {
  const { colors, isDark } = useTheme();

  const normalizedGrade = grade?.toLowerCase();

  // Aurora pulse animation
  const auroraScale = useSharedValue(1);
  const auroraOpacity = useSharedValue(0.18);

  useEffect(() => {
    auroraScale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 3800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    auroraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.28, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.10, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const auroraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auroraScale.value }],
    opacity: auroraOpacity.value,
  }));

  const getEcoColor = (g?: string) => {
    switch (g) {
      case 'a': return isDark ? '#34D399' : '#16A34A';
      case 'b': return isDark ? '#86EFAC' : '#22C55E';
      case 'c': return isDark ? '#FBBF24' : '#D97706';
      case 'd': return isDark ? '#FB923C' : '#EA580C';
      case 'e': return isDark ? '#F87171' : '#DC2626';
      default:  return isDark ? '#2DD4BF' : '#0F766E';
    }
  };

  const ecoColor = getEcoColor(normalizedGrade);

  const getImpactText = (co2?: number, g?: string) => {
    if (g === 'a' || (co2 !== undefined && co2 <= 100)) return 'Ultra-Low Climate Footprint';
    if (g === 'b' || (co2 !== undefined && co2 <= 250)) return 'Low Environmental Impact';
    if (g === 'c' || (co2 !== undefined && co2 <= 500)) return 'Moderate Ecological Footprint';
    return 'High Carbon Intensity';
  };

  // Thermometer bar: map CO2 to 0–100% (0g=best, 800g+=worst)
  const thermPercent = carbonFootprint !== undefined
    ? Math.min(100, Math.round((carbonFootprint / 800) * 100))
    : normalizedGrade === 'a' ? 10 : normalizedGrade === 'b' ? 28 : normalizedGrade === 'c' ? 52 : normalizedGrade === 'd' ? 72 : 88;

  const thermColor = thermPercent <= 30
    ? (isDark ? '#34D399' : '#16A34A')
    : thermPercent <= 60
      ? (isDark ? '#FBBF24' : '#D97706')
      : (isDark ? '#F87171' : '#DC2626');

  // Card surface
  const cardBg = isDark ? 'rgba(5, 18, 10, 0.95)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(45, 212, 191, 0.22)' : 'rgba(15, 118, 110, 0.15)';
  const innerBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,248,0.95)';
  const innerBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <View
      style={{
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: cardBorder,
        backgroundColor: cardBg,
        overflow: 'hidden',
        shadowColor: isDark ? '#2DD4BF' : '#0F766E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.22 : 0.08,
        shadowRadius: 20,
        elevation: 8,
        marginBottom: 16,
      }}
    >
      {/* Aurora Radial Pulse (positioned behind content) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: isDark ? '#2DD4BF' : '#1E9E8A',
          },
          auroraStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: isDark ? '#6EE041' : '#4A8A1A',
          },
          auroraStyle,
        ]}
        pointerEvents="none"
      />

      <View style={{ padding: 18, gap: 12 }}>
        {/* ── Header Row ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(45,212,191,0.14)' : 'rgba(15,118,110,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(45,212,191,0.25)' : 'rgba(15,118,110,0.18)',
            }}>
              <Globe size={18} color={isDark ? '#2DD4BF' : '#0F766E'} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.4 }}>
                Carbon Footprint
              </Text>
              <Text style={{ color: isDark ? '#2DD4BF' : '#0F766E', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }}>
                EXCLUSIVE PLANETARY AUDIT
              </Text>
            </View>
          </View>

          {/* World's First Badge */}
          <View style={{
            backgroundColor: isDark ? 'rgba(110,224,65,0.12)' : 'rgba(74,138,26,0.10)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(110,224,65,0.28)' : 'rgba(74,138,26,0.22)',
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 8,
          }}>
            <Text style={{ color: isDark ? '#6EE041' : '#4A8A1A', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }}>
              🌍 WORLD FIRST
            </Text>
          </View>
        </View>

        {/* ── Eco Grade + Thermometer ── */}
        <View style={{
          backgroundColor: innerBg,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: innerBorder,
          gap: 10,
        }}>
          {/* Grade + CO2 value row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>
                {carbonFootprint !== undefined ? `${carbonFootprint.toFixed(1)}` : '—'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                g CO₂ / 100g
              </Text>
            </View>
            {normalizedGrade && normalizedGrade !== 'unknown' && (
              <View style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: `${ecoColor}18`,
                borderWidth: 2,
                borderColor: `${ecoColor}40`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: ecoColor, fontSize: 18, fontWeight: '900' }}>
                  {normalizedGrade.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Planetary Thermometer Gauge */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700' }}>
                Planetary Scale
              </Text>
              <Text style={{ color: thermColor, fontSize: 10.5, fontWeight: '900' }}>
                {getImpactText(carbonFootprint, normalizedGrade)}
              </Text>
            </View>
            {/* Track */}
            <View style={{
              height: 10,
              borderRadius: 5,
              overflow: 'hidden',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }}>
              {/* Gradient fill bar */}
              <View style={{
                height: '100%',
                width: `${thermPercent}%`,
                backgroundColor: thermColor,
                borderRadius: 5,
              }} />
            </View>
            {/* Scale labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {['A', 'B', 'C', 'D', 'E'].map((l, i) => {
                const lColor = i === 0 ? (isDark ? '#34D399' : '#16A34A')
                  : i === 1 ? (isDark ? '#86EFAC' : '#22C55E')
                  : i === 2 ? (isDark ? '#FBBF24' : '#D97706')
                  : i === 3 ? (isDark ? '#FB923C' : '#EA580C')
                  : (isDark ? '#F87171' : '#DC2626');
                return (
                  <Text key={l} style={{
                    color: normalizedGrade === l.toLowerCase() ? lColor : colors.textMuted,
                    fontSize: 9.5,
                    fontWeight: normalizedGrade === l.toLowerCase() ? '900' : '600',
                  }}>{l}</Text>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Sustainable Badges ── */}
        {(isOrganic || isVegan || isVegetarian) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {isOrganic && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: isDark ? 'rgba(52,211,153,0.10)' : 'rgba(34,197,94,0.10)',
                borderColor: isDark ? 'rgba(52,211,153,0.22)' : 'rgba(34,197,94,0.22)',
                borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
              }}>
                <CheckCircle size={11} color={isDark ? '#34D399' : '#16A34A'} />
                <Text style={{ color: isDark ? '#34D399' : '#16A34A', fontSize: 10.5, fontWeight: '800' }}>Organic</Text>
              </View>
            )}
            {isVegan && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: isDark ? 'rgba(45,212,191,0.10)' : 'rgba(20,184,166,0.10)',
                borderColor: isDark ? 'rgba(45,212,191,0.22)' : 'rgba(20,184,166,0.22)',
                borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
              }}>
                <Leaf size={11} color={isDark ? '#2DD4BF' : '#0F766E'} />
                <Text style={{ color: isDark ? '#2DD4BF' : '#0F766E', fontSize: 10.5, fontWeight: '800' }}>Vegan</Text>
              </View>
            )}
            {isVegetarian && !isVegan && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: isDark ? 'rgba(110,224,65,0.10)' : 'rgba(74,138,26,0.10)',
                borderColor: isDark ? 'rgba(110,224,65,0.22)' : 'rgba(74,138,26,0.22)',
                borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
              }}>
                <Leaf size={11} color={isDark ? '#6EE041' : '#4A8A1A'} />
                <Text style={{ color: isDark ? '#6EE041' : '#4A8A1A', fontSize: 10.5, fontWeight: '800' }}>Vegetarian</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
