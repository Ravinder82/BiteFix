import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Activity, Droplets, Leaf, Package, ShieldCheck, Zap } from 'lucide-react-native';
import { OrbMascot } from '../features/OrbMascot';
import { ProductDataStatusPill } from '../features/ProductDataPills';
import { NutriScoreTrafficLight } from '../features/NutriScoreTrafficLight';
import { OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { EnergyMeter } from '../ui/energy-meter';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing as REasing,
  interpolate,
  Extrapolate,
  cancelAnimation
} from 'react-native-reanimated';

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
// SCREEN 2 — SHOPPING RHYTHM VISUAL
// ══════════════════════════════════════════════════════════════
export function ShoppingRhythmVisual({ colors, isDark, reduceMotion = false, frequency }: VisualProps & { frequency?: ShoppingFrequency }) {
  const pulse = useRef(new Animated.Value(0.85)).current;
  const heights =
    frequency === 'most_trips'
      ? [32, 48, 64, 82, 94, 76, 52]
      : frequency === 'often'
      ? [26, 40, 58, 72, 54, 38, 24]
      : frequency === 'sometimes'
      ? [20, 32, 46, 36, 24, 30, 18]
      : [16, 22, 18, 26, 18, 22, 16];

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 20, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 9, height: 96 }}>
        {heights.map((height, index) => {
          const isPeak = index === 4 || index === 3;
          return (
            <Animated.View
              key={index}
              style={{
                width: 19,
                height,
                borderRadius: 9,
                backgroundColor: isPeak ? GREEN : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                borderWidth: isPeak ? 1 : 0,
                borderColor: `${GREEN}80`,
                opacity: pulse,
                shadowColor: isPeak ? GREEN : 'transparent',
                shadowOpacity: isPeak ? 0.35 : 0,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            />
          );
        })}
      </View>
      <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.3, marginTop: 14, textTransform: 'uppercase' }}>
        Tuning Your Scanning Routine
      </Text>
    </Surface>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5 — FOCUS CONSTELLATION
// ══════════════════════════════════════════════════════════════
export function PriorityConstellation({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: OnboardingPriority[] }) {
  const pulse = useRef(new Animated.Value(0.9)).current;
  const activePriorities = selected.length > 0 ? selected : (['nutrition', 'ingredients'] as OnboardingPriority[]);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <View accessible accessibilityLabel="Selected priorities illuminate around the BiteFix scanner" style={{ height: 175, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      {/* Outer Orbit Guide Ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 165,
          height: 165,
          borderRadius: 82.5,
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(1,146,42,0.22)' : 'rgba(1,146,42,0.18)',
          opacity: pulse,
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
          <Animated.View
            key={priority}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              transform: [{ translateX: -36 }, { translateY: -16 }, { scale: pulse }],
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
          </Animated.View>
        );
      })}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3 — ALLERGEN SHIELD VISUAL
// ══════════════════════════════════════════════════════════════
export function AllergenShieldVisual({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: string[] }) {
  const labels = selected.filter((item) => item !== 'none').slice(0, 4);
  const shieldPulse = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (reduceMotion) {
      shieldPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shieldPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shieldPulse, { toValue: 0.92, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, shieldPulse]);

  return (
    <View accessible accessibilityLabel={labels.length ? `Watching for ${labels.join(', ')}` : 'No allergen filters selected'} style={{ height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      {/* Outer Pulse Shield Ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 148,
          height: 148,
          borderRadius: 74,
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(1,146,42,0.32)' : 'rgba(1,146,42,0.22)',
          backgroundColor: isDark ? 'rgba(1,146,42,0.05)' : 'rgba(1,146,42,0.04)',
          transform: [{ rotate: '45deg' }, { scale: shieldPulse }],
        }}
      />

      <Svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute' }} pointerEvents="none">
        <Circle cx="80" cy="80" r="64" fill="none" stroke={GREEN} strokeOpacity="0.25" strokeWidth="1.2" strokeDasharray="3 6" />
        <Path d="M80 32 L116 45 V76 C116 100 100 117 80 127 C60 117 44 100 44 76 V45 Z" fill="none" stroke={GREEN} strokeOpacity="0.36" strokeWidth="1.5" />
      </Svg>

      <OrbMascot state={labels.length ? 'caution' : 'idle'} size={76} reduceMotion={reduceMotion} showShadow={false} />

      {labels.length === 0 && (
        <Text style={{ position: 'absolute', bottom: 6, color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
          Ready to filter
        </Text>
      )}

      {labels.map((label, index) => (
        <View
          key={label}
          style={{
            position: 'absolute',
            top: index % 2 === 0 ? 8 : undefined,
            bottom: index % 2 === 1 ? 8 : undefined,
            left: index % 2 === 0 ? 14 : undefined,
            right: index % 2 === 1 ? 14 : undefined,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: isDark ? 'rgba(12,20,14,0.92)' : 'rgba(255,255,255,0.94)',
            borderWidth: 1.2,
            borderColor: `${GREEN}60`,
            shadowColor: GREEN,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 10, fontWeight: '800' }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4 — LABEL COMPRESSION VISUAL
// ══════════════════════════════════════════════════════════════
export function LabelCompressionVisual({ colors, isDark, reduceMotion = false }: VisualProps) {
  const beam = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      beam.setValue(1);
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
  }, [beam, reduceMotion]);

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
export function InsightTransformVisual({ colors, isDark, reduceMotion = false }: VisualProps) {
  const reveal = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const stages = [
    { label: 'LABEL', value: 'Raw Data', color: colors.textSecondary },
    { label: 'SCAN', value: 'Instant Read', color: AMBER },
    { label: 'STRUCTURE', value: 'Sort & Clean', color: GREEN },
    { label: 'INSIGHT', value: 'Clear Result', color: TEAL },
  ];

  useEffect(() => {
    if (reduceMotion) {
      reveal.setValue(1);
      return;
    }
    Animated.timing(reveal, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduceMotion, reveal]);

  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 20, paddingVertical: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {stages.map((stage, index) => {
          const start = index / stages.length;
          const end = Math.min(1, start + 0.35);
          const opacity = reveal.interpolate({ inputRange: [start, end], outputRange: [0.35, 1], extrapolate: 'clamp' });
          const translateY = reveal.interpolate({ inputRange: [start, end], outputRange: [8, 0], extrapolate: 'clamp' });
          return (
            <React.Fragment key={stage.label}>
              <Animated.View style={{ alignItems: 'center', gap: 6, opacity, transform: [{ translateY }] }}>
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
              </Animated.View>
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
// SCREEN 7 — PROFILE ASSEMBLY VISUAL
// ══════════════════════════════════════════════════════════════
export function ProfileAssemblyVisual({
  colors,
  isDark,
  reduceMotion = false,
  selected,
  phase,
}: VisualProps & { selected: OnboardingPriority[]; phase: 'building' | 'assembly' | 'ready' }) {
  const visiblePriorities = selected.length > 0 ? selected.slice(0, 5) : ((['nutrition', 'ingredients', 'sugar'] as OnboardingPriority[]));
  
  const assembleAnim = useSharedValue(phase === 'ready' ? 1 : 0);
  const masterAngle = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      assembleAnim.value = phase === 'ready' ? 1 : 0;
      return;
    }

    if (phase === 'building') {
      assembleAnim.value = withTiming(0, { duration: 400 });
      masterAngle.value = withRepeat(
        withTiming(masterAngle.value + Math.PI * 2, { duration: 7000, easing: REasing.linear }),
        -1,
        false
      );
    } else if (phase === 'assembly' || phase === 'ready') {
      assembleAnim.value = withTiming(1, { duration: phase === 'ready' ? 0 : 1200, easing: REasing.inOut(REasing.quad) });
      cancelAnimation(masterAngle); // Stop orbiting, let them settle into their current relative spacing
    }
  }, [phase, reduceMotion, assembleAnim, masterAngle]);

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(assembleAnim.value, [0, 1], [0, -32]) },
      { scale: interpolate(assembleAnim.value, [0, 1], [1, 0.88]) }
    ],
  }));

  const mascotState = phase === 'building' ? 'thinking' : phase === 'assembly' ? 'scanning' : 'happy';

  return (
    <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 16, zIndex: 10 }}>
      {/* 1. Luma-style orbital tracks */}
      {phase === 'building' && !reduceMotion && (
        <Reanimated.View
          style={{
            position: 'absolute',
            width: 220,
            height: 100, // Elliptical 3D track
            borderRadius: 110,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            transform: [{ rotateX: '60deg' }] // Tilt the track into 3D space
          }}
        />
      )}

      {/* 2. Central Mascot / Star */}
      <Reanimated.View style={[sceneStyle, { zIndex: 5 }]}>
        <OrbMascot state={mascotState} size={phase === 'ready' ? 80 : 104} reduceMotion={reduceMotion} showShadow={false} />
      </Reanimated.View>

      {/* 3. Orbiting 3D Parallax Badges */}
      {visiblePriorities.map((priority, index) => {
        const meta = PRIORITY_META[priority];
        const angleOffset = (index / Math.max(visiblePriorities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const Icon = meta.icon;

        const pillStyle = useAnimatedStyle(() => {
          const currentAngle = masterAngle.value + angleOffset;
          
          // Radius: Starts wide elliptical, shrinks to tight circle
          const radiusX = interpolate(assembleAnim.value, [0, 1], [110, 42]);
          const radiusY = interpolate(assembleAnim.value, [0, 1], [50, 42]);
          
          let x = Math.cos(currentAngle) * radiusX;
          let y = Math.sin(currentAngle) * radiusY;

          // Parallax Depth Calculation:
          // Negative Y = back of orbit (smaller). Positive Y = front of orbit (larger).
          const depthScale = interpolate(y, [-50, 50], [0.75, 1.15], Extrapolate.CLAMP);
          const finalScale = interpolate(assembleAnim.value, [0, 1], [depthScale, 0.65]);

          // As it assembles, drop the parallax fade and push Y down slightly (+8) to align with mascot
          const yAdjusted = interpolate(assembleAnim.value, [0, 1], [y, y + 8]);
          
          const opacity = interpolate(assembleAnim.value, [0, 1], [
            interpolate(y, [-50, 50], [0.5, 1], Extrapolate.CLAMP), 
            1
          ]);

          // Z-index based on position (behind vs in front of Mascot)
          const zIndex = y < 0 ? 1 : 10;

          return {
            transform: [
              { translateX: x },
              { translateY: yAdjusted },
              { scale: finalScale }
            ],
            opacity,
            zIndex,
          };
        });

        return (
          <Reanimated.View
            key={priority}
            style={[
              {
                position: 'absolute',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 11,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(10,18,12,0.95)' : 'rgba(255,255,255,0.96)',
                borderWidth: 1.5,
                borderColor: `${meta.color}65`,
                shadowColor: meta.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: phase === 'building' ? 0.22 : 0,
                shadowRadius: 8,
                elevation: phase === 'building' ? 4 : 0,
              },
              pillStyle
            ]}
          >
            <Icon size={14} color={meta.color} strokeWidth={2.3} />
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>
              {meta.label}
            </Text>
          </Reanimated.View>
        );
      })}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 7 — MOMENT OF TRUTH RESULT CARD
// ══════════════════════════════════════════════════════════════
export function MomentResultCard({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: OnboardingPriority[] }) {
  const visiblePriorities = selected.length > 0 ? selected : ((['nutrition', 'ingredients', 'sugar'] as OnboardingPriority[]));
  const fadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(reduceMotion ? 0 : 16)).current;

  useEffect(() => {
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [fadeAnim, slideAnim, reduceMotion]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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
    </Animated.View>
  );
}
