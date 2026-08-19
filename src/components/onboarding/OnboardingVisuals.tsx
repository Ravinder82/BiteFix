import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Activity, Droplets, Leaf, Package, ShieldCheck, Zap } from 'lucide-react-native';
import { OrbMascot } from '../features/OrbMascot';
import { ProductDataStatusPill } from '../features/ProductDataPills';
import { NutriScoreTrafficLight } from '../features/NutriScoreTrafficLight';
import { OnboardingPriority } from '../../types/onboarding.types';
import Svg, { Line, Path } from 'react-native-svg';
import { EnergyMeter } from '../ui/energy-meter';

type VisualProps = {
  colors: any;
  isDark: boolean;
  reduceMotion?: boolean;
};

const GREEN = '#01922A';
const AMBER = '#D97706';
const TEAL = '#0F766E';

export const PRIORITY_META: Record<OnboardingPriority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  ultra_processed: { label: 'Processing Level', color: GREEN, icon: Package },
  nutrition: { label: 'Nutrition Intelligence', color: TEAL, icon: Activity },
  sugar: { label: 'Sugar Insights', color: AMBER, icon: Droplets },
  ingredients: { label: 'Ingredient Review', color: GREEN, icon: ShieldCheck },
  environment: { label: 'Eco Impact', color: TEAL, icon: Leaf },
};

function Surface({ children, colors, isDark, style }: VisualProps & { children: React.ReactNode; style?: any }) {
  return (
    <View
      style={[
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.038)' : 'rgba(255,255,255,0.85)',
          borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          borderWidth: 1,
          borderRadius: 22,
          padding: 16,
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
// SCREEN 5 — FOCUS CONSTELLATION
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
// SCREEN 4 — LABEL COMPRESSION VISUAL
// ══════════════════════════════════════════════════════════════
export function LabelCompressionVisual({ colors, isDark, reduceMotion = false, isActive = true }: VisualProps & { isActive?: boolean }) {
  const beam = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion || !isActive) {
      beam.stopAnimation();
      beam.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beam, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(beam, { toValue: 0, duration: 1, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [beam, isActive, reduceMotion]);

  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 20, overflow: 'hidden' }}>
      <View
        style={{
          height: 108,
          overflow: 'hidden',
          justifyContent: 'center',
          borderRadius: 14,
          backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.02)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          paddingHorizontal: 14,
        }}
      >
        {[
          'glucose syrup, maltodextrin, acidity regulator (E330)',
          'emulsifier (soy lecithin E322), natural flavouring, stabiliser',
          'cocoa mass, palm oil, salt, enriched vitamins, minerals',
          'traces: tree nuts, milk solids, gluten, peanuts',
        ].map((line) => (
          <Text key={line} numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 10.5, lineHeight: 19, fontWeight: '700', letterSpacing: 0.15, opacity: 0.55 }}>
            {line}
          </Text>
        ))}

        {/* Laser Beam */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 2,
            backgroundColor: GREEN,
            shadowColor: GREEN,
            shadowOpacity: 0.9,
            shadowRadius: 8,
            transform: [{ translateY: beam.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }],
          }}
        />

        {/* Scanner corner brackets */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 8, top: 8, width: 14, height: 14, borderTopWidth: 2, borderLeftWidth: 2, borderColor: `${GREEN}90`, borderTopLeftRadius: 4 }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 8, top: 8, width: 14, height: 14, borderTopWidth: 2, borderRightWidth: 2, borderColor: `${GREEN}90`, borderTopRightRadius: 4 }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 8, bottom: 8, width: 14, height: 14, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: `${GREEN}90`, borderBottomLeftRadius: 4 }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 8, bottom: 8, width: 14, height: 14, borderBottomWidth: 2, borderRightWidth: 2, borderColor: `${GREEN}90`, borderBottomRightRadius: 4 }} />
      </View>

      {/* Extracted signals row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
        {[
          { label: 'Processing Level', color: GREEN },
          { label: 'Ingredient Review', color: GREEN },
          { label: 'Sugar Insights', color: AMBER },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: `${item.color}14`,
              borderWidth: 1,
              borderColor: `${item.color}35`,
            }}
          >
            <Text style={{ color: item.color, fontSize: 10, fontWeight: '800' }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Surface>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 6 — INSIGHT TRANSFORM VISUAL
// ══════════════════════════════════════════════════════════════
export function InsightTransformVisual({ colors, isDark }: VisualProps) {
  const stages = [
    { label: 'LABEL', value: 'Raw Data', color: colors.textSecondary },
    { label: 'SCAN', value: 'Instant Read', color: AMBER },
    { label: 'STRUCTURE', value: 'Sort & Clean', color: GREEN },
    { label: 'INSIGHT', value: 'Clear Result', color: TEAL },
  ];

  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 20, paddingVertical: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {stages.map((stage, index) => {
          return (
            <React.Fragment key={stage.label}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: `${stage.color}14`,
                    borderWidth: 1.2,
                    borderColor: `${stage.color}45`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {index === stages.length - 1 ? (
                    <Zap size={20} color={stage.color} strokeWidth={2.5} />
                  ) : (
                    <Text style={{ color: stage.color, fontSize: 10, fontWeight: '900' }}>0{index + 1}</Text>
                  )}
                </View>
                <Text style={{ color: stage.color, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.7 }}>{stage.label}</Text>
              </View>
              {index < stages.length - 1 && (
                <Svg width="20" height="14" viewBox="0 0 20 14">
                  <Path d="M1 7 H16 M11 2 L17 7 L11 12" fill="none" stroke={colors.textMuted} strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </Surface>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 7 — MOMENT OF TRUTH RESULT CARD
// ══════════════════════════════════════════════════════════════
export function MomentResultCard({ colors, isDark, selected }: VisualProps & { selected: OnboardingPriority[] }) {
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Product Scan
          </Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
            Organic Dark Chocolate 72%
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5, flexShrink: 1 }}>
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
