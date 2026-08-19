import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, useWindowDimensions } from 'react-native';
import { Activity, Droplets, Leaf, Package, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OrbMascot } from '../features/OrbMascot';
import { ProductDataStatusPill } from '../features/ProductDataPills';
import { NutriScoreTrafficLight } from '../features/NutriScoreTrafficLight';
import { OnboardingPriority } from '../../types/onboarding.types';
import Svg, { Line } from 'react-native-svg';
import { EnergyMeter } from '../ui/energy-meter';

type VisualProps = {
  colors: any;
  isDark: boolean;
  reduceMotion?: boolean;
};

const GREEN = '#01922A';
const AMBER = '#D97706';
const TEAL = '#0F766E';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const PRIORITY_META: Record<OnboardingPriority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  ultra_processed: { label: 'Processing Level', color: GREEN, icon: Package },
  nutrition: { label: 'Nutrition Intelligence', color: TEAL, icon: Activity },
  sugar: { label: 'Sugar Insights', color: AMBER, icon: Droplets },
  ingredients: { label: 'Ingredient Review', color: GREEN, icon: ShieldCheck },
  environment: { label: 'Eco Impact', color: TEAL, icon: Leaf },
};

function Surface({ children, colors, isDark, style }: VisualProps & { children: React.ReactNode; style?: any }) {
  const { width } = useWindowDimensions();
  const padding = clamp(width * 0.041, 12, 16);

  return (
    <View
      style={[
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.038)' : 'rgba(255,255,255,0.85)',
          borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          borderWidth: 1,
          borderRadius: 22,
          padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.18 : 0.05,
          shadowRadius: 16,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 7 — FOCUS CONSTELLATION
// ══════════════════════════════════════════════════════════════
export function PriorityConstellation({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: OnboardingPriority[] }) {
  const activePriorities = selected.length > 0 ? selected : (['nutrition', 'ingredients'] as OnboardingPriority[]);

  return (
    <View accessible accessibilityLabel="Selected priorities illuminate around the BiteFix scanner" style={{ height: 175, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      {/* Outer Orbit Guide Ring */}
      <View
        style={{
          position: 'absolute',
          width: 165,
          height: 165,
          borderRadius: 82.5,
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(1,146,42,0.22)' : 'rgba(1,146,42,0.18)',
        }}
      />

      {/* SVG Connectors */}
      <Svg width="180" height="180" viewBox="0 0 180 180" style={{ position: 'absolute' }} pointerEvents="none">
        {activePriorities.map((priority, index) => {
          const angle = (index / Math.max(activePriorities.length, 1)) * Math.PI * 2 - Math.PI / 2;
          const r = 62;
          const x = 90 + Math.cos(angle) * r;
          const y = 90 + Math.sin(angle) * r;
          return (
            <Line
              key={`conn-${priority}`}
              x1="90"
              y1="90"
              x2={x}
              y2={y}
              stroke={PRIORITY_META[priority].color}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              strokeDasharray="3 4"
            />
          );
        })}
      </Svg>

      {/* Center Mascot */}
      <OrbMascot state="thinking" size={82} reduceMotion={reduceMotion} showShadow={false} />

      {/* Orbiting Selected Nodes */}
      {activePriorities.map((priority, index) => {
        const meta = PRIORITY_META[priority];
        const angle = (index / Math.max(activePriorities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + Math.cos(angle) * 38;
        const top = 50 + Math.sin(angle) * 38;
        const Icon = meta.icon;

        return (
          <View
            key={priority}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              transform: [{ translateX: -36 }, { translateY: -16 }],
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 9,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: isDark ? 'rgba(10,18,12,0.95)' : 'rgba(255,255,255,0.96)',
              borderWidth: 1.5,
              borderColor: `${meta.color}70`,
              shadowColor: meta.color,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.22,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Icon size={12.5} color={meta.color} strokeWidth={2.3} />
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 10, fontWeight: '800' }}>
              {meta.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5 — LABEL COMPRESSION VISUAL
// ══════════════════════════════════════════════════════════════
export function LabelCompressionVisual({ colors, isDark, reduceMotion = false, isActive = true }: VisualProps & { isActive?: boolean }) {
  const { width } = useWindowDimensions();
  const sweep = useRef(new Animated.Value(0)).current;
  const borderWidth = Math.max(200, Math.min(360, width - 80));
  const borderHeight = Math.max(116, Math.min(136, width * 0.31));
  const labelCardHeight = borderHeight;

  useEffect(() => {
    if (reduceMotion || !isActive) {
      sweep.stopAnimation();
      sweep.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 4, duration: 5200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true, isInteraction: false }),
        Animated.delay(1100),
        Animated.timing(sweep, { toValue: 0, duration: 1, useNativeDriver: true, isInteraction: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, reduceMotion, sweep]);

  return (
    <Surface
      colors={colors}
      isDark={isDark}
      style={{
        marginBottom: 20,
        overflow: 'hidden',
        backgroundColor: isDark ? '#08130D' : '#14251A',
        borderColor: isDark ? 'rgba(150,255,176,0.22)' : 'rgba(90,224,130,0.32)',
        borderWidth: 1.2,
        shadowColor: GREEN,
        shadowOpacity: isDark ? 0.25 : 0.18,
        shadowRadius: 18,
        elevation: 4,
      }}
    >
      <View
        style={{
          height: labelCardHeight,
          overflow: 'hidden',
          justifyContent: 'center',
          borderRadius: 14,
          backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.045)',
          borderWidth: 1.2,
          borderColor: isDark ? 'rgba(150,255,176,0.18)' : 'rgba(150,255,176,0.24)',
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        {/* One restrained glint travels along the card edge; no scanner beam. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 48,
            height: 2,
            opacity: 0.9,
            transform: [
              { translateX: sweep.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: [-48, borderWidth, borderWidth, -48, -48] }) },
              { translateY: sweep.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: [0, 0, borderHeight, borderHeight, 0] }) },
              { rotate: sweep.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: ['0deg', '0deg', '90deg', '180deg', '270deg'] }) },
            ],
          }}
        >
          <LinearGradient
            colors={['rgba(130,255,164,0)', '#B7FFD0', 'rgba(130,255,164,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Text
          style={{
            color: '#AFC4B4',
            fontSize: Math.max(8.5, Math.min(9.5, width * 0.024)),
            lineHeight: Math.max(12, Math.round(width * 0.034)),
            fontWeight: '900',
            letterSpacing: 1.55,
            textTransform: 'uppercase',
            marginBottom: 7,
          }}
        >
          Ingredients Label
        </Text>

        {[
          'glucose syrup, maltodextrin, acidity regulator (E330)',
          'emulsifier (soy lecithin E322), natural flavouring, stabiliser',
          'cocoa mass, palm oil, salt, enriched vitamins, minerals',
          'traces: tree nuts, milk solids, gluten, peanuts',
        ].map((line) => (
          <Text key={line} numberOfLines={1} style={{ color: '#C7D9CB', fontSize: Math.max(9.5, Math.min(10.5, width * 0.027)), lineHeight: Math.max(18, Math.round(width * 0.048)), fontWeight: '700', letterSpacing: 0.15, opacity: 0.78 }}>
            {line}
          </Text>
        ))}
      </View>
    </Surface>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 8 — MOMENT OF TRUTH RESULT CARD
// ══════════════════════════════════════════════════════════════
export function MomentResultCard({ colors, isDark, selected }: VisualProps & { selected: OnboardingPriority[] }) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const visiblePriorities = selected.length > 0 ? selected : ((['nutrition', 'ingredients', 'sugar'] as OnboardingPriority[]));

  return (
    <Surface
      colors={colors}
      isDark={isDark}
      style={{
        marginBottom: 16,
        padding: 16,
        backgroundColor: isDark ? 'rgba(18,22,20,0.98)' : '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.22 : 0.08,
        shadowRadius: 18,
        elevation: 4,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }}
    >
      {/* Product Identity Header */}
      <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 12, gap: compact ? 8 : 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Product Scan
          </Text>
          <Text style={{ color: colors.text, fontSize: compact ? 15 : 16, fontWeight: '900', marginTop: 2 }}>
            Organic Dark Chocolate 72%
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5, flexShrink: 1, alignSelf: compact ? 'flex-start' : 'auto' }}>
          <ProductDataStatusPill status="complete" colors={colors} isDark={isDark} />
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginBottom: 14 }} />

      {/* BiteFix Score + NutriScore hero row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 25 }}>🍫</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>
            BITEFIX INTELLIGENCE SCORE™
          </Text>
          <Text style={{ color: colors.text, fontSize: 32, lineHeight: 36, fontWeight: '900' }}>
            78
          </Text>
        </View>
        <NutriScoreTrafficLight grade="b" compact isDark={isDark} colors={colors} />
      </View>

      <View style={{ marginBottom: 16 }}>
        <EnergyMeter value={78} colors={colors} label="Overall Score Meter" />
      </View>

      {/* Breakdown signal rows */}
      <View style={{ gap: 8 }}>
        {visiblePriorities.slice(0, 4).map((priority) => {
          const meta = PRIORITY_META[priority];
          const value =
            priority === 'sugar'
              ? '≈ 1.8 tsp (Low)'
              : priority === 'environment'
                ? 'Grade A'
                : priority === 'nutrition'
                  ? 'Balanced Profile'
                  : priority === 'ultra_processed'
                    ? 'NOVA 2 (Processed)'
                    : 'No Harmful Additives';

          const isEmphasized = selected.includes(priority);

          return (
            <View
              key={priority}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 13,
                backgroundColor: isEmphasized ? `${meta.color}14` : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderWidth: 1,
                borderColor: isEmphasized ? `${meta.color}38` : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: meta.color }} />
                <Text numberOfLines={1} style={{ color: isEmphasized ? colors.text : colors.textSecondary, fontSize: 12.5, fontWeight: isEmphasized ? '800' : '600', flexShrink: 1 }}>
                  {meta.label}
                </Text>
              </View>
              <Text numberOfLines={1} style={{ color: isEmphasized ? meta.color : colors.text, fontSize: 12.5, fontWeight: '900', marginLeft: 8 }}>
                {value}
              </Text>
            </View>
          );
        })}
      </View>
    </Surface>
  );
}