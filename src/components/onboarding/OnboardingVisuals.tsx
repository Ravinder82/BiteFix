import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Activity, Droplets, Leaf, Package, ShieldCheck, Zap } from 'lucide-react-native';
import { OrbMascot } from '../features/OrbMascot';
import { ProductDataSourcePill, ProductDataStatusPill } from '../features/ProductDataPills';
import { NutriScoreTrafficLight } from '../features/NutriScoreTrafficLight';
import { OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';
import Svg, { Circle, Line, Path } from 'react-native-svg';

type VisualProps = {
  colors: any;
  isDark: boolean;
  reduceMotion?: boolean;
};

const GREEN = '#01922A';
const AMBER = '#D97706';
const TEAL = '#0F766E';

const PRIORITY_META: Record<OnboardingPriority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  ultra_processed: { label: 'Processing Level', color: GREEN, icon: Package },
  nutrition: { label: 'Nutrition Intelligence', color: TEAL, icon: Activity },
  sugar: { label: 'Sugar Insights', color: AMBER, icon: Droplets },
  ingredients: { label: 'Ingredient Review', color: GREEN, icon: ShieldCheck },
  environment: { label: 'Eco Impact', color: TEAL, icon: Leaf },
};

function Surface({ children, colors, isDark, style }: VisualProps & { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.025)',
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.16 : 0.045,
      shadowRadius: 14,
      elevation: 2,
    }, style]}
    >
      {children}
    </View>
  );
}

export function ShoppingRhythmVisual({ colors, isDark, reduceMotion = false, frequency }: VisualProps & { frequency?: ShoppingFrequency }) {
  const pulse = useRef(new Animated.Value(0.72)).current;
  const heights = frequency === 'most_trips' ? [28, 42, 56, 70, 84, 68, 48] : frequency === 'often' ? [24, 36, 52, 64, 48, 32, 22] : frequency === 'sometimes' ? [18, 28, 42, 30, 20, 26, 16] : [14, 20, 17, 24, 16, 20, 14];

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.72, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 22, paddingBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 88 }}>
        {heights.map((height, index) => (
          <Animated.View key={index} style={{ width: 17, height, borderRadius: 8, backgroundColor: index > 4 ? colors.primary : colors.secondary, opacity: pulse, transform: [{ scaleY: index % 2 === 0 ? 1 : 0.92 }] }} />
        ))}
      </View>
      <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 12, textTransform: 'uppercase' }}>
        Your shopping rhythm
      </Text>
    </Surface>
  );
}

export function PriorityConstellation({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: OnboardingPriority[] }) {
  const pulse = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.88, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <View accessible accessibilityLabel="Selected priorities illuminate around the BiteFix scanner" style={{ height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
      <Animated.View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: isDark ? 'rgba(110,224,65,0.25)' : 'rgba(74,138,26,0.20)', opacity: pulse }} />
      {selected.map((priority, index) => {
        const angle = (index / Math.max(selected.length, 1)) * Math.PI * 2 - Math.PI / 2;
        return <View key={`connection-${priority}`} pointerEvents="none" style={{ position: 'absolute', left: 80, top: 80, width: 57, height: 1, backgroundColor: `${PRIORITY_META[priority].color}70`, transform: [{ rotate: `${angle * 180 / Math.PI}deg` }, { translateX: 28.5 }] }} />;
      })}
      <OrbMascot state="thinking" size={76} reduceMotion={reduceMotion} showShadow={false} />
      {selected.map((priority, index) => {
        const meta = PRIORITY_META[priority];
        const angle = (index / Math.max(selected.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + Math.cos(angle) * 38;
        const top = 50 + Math.sin(angle) * 38;
        const Icon = meta.icon;
        return (
          <Animated.View key={priority} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: [{ translateX: -34 }, { translateY: -15 }, { scale: pulse }], flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: isDark ? 'rgba(8,16,10,0.94)' : 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: `${meta.color}66`, shadowColor: meta.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 2 }}>
            <Icon size={12} color={meta.color} strokeWidth={2.3} />
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 9.5, fontWeight: '800' }}>{meta.label}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

export function AllergenShieldVisual({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: string[] }) {
  const labels = selected.filter((item) => item !== 'none').slice(0, 4);
  const shieldPulse = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (reduceMotion) {
      shieldPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shieldPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(shieldPulse, { toValue: 0.92, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, shieldPulse]);

  return (
    <View accessible accessibilityLabel={labels.length ? `Watching for ${labels.join(', ')}` : 'No allergen filters selected'} style={{ height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
      <Animated.View style={{ position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1.5, borderColor: isDark ? 'rgba(110,224,65,0.34)' : 'rgba(74,138,26,0.26)', backgroundColor: isDark ? 'rgba(110,224,65,0.05)' : 'rgba(74,138,26,0.05)', transform: [{ rotate: '45deg' }, { scale: shieldPulse }] }} />
      <Svg width="154" height="154" viewBox="0 0 154 154" style={{ position: 'absolute' }} pointerEvents="none">
        <Circle cx="77" cy="77" r="61" fill="none" stroke={isDark ? '#6EE041' : '#4A8A1A'} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="2 8" />
        <Path d="M77 31 L111 43 V72 C111 95 96 111 77 121 C58 111 43 95 43 72 V43 Z" fill="none" stroke={isDark ? '#6EE041' : '#4A8A1A'} strokeOpacity="0.32" strokeWidth="1.2" />
      </Svg>
      <OrbMascot state={labels.length ? 'caution' : 'idle'} size={72} reduceMotion={reduceMotion} showShadow={false} />
      {labels.length === 0 && <Text style={{ position: 'absolute', bottom: 3, color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>Ready to scan</Text>}
      {labels.map((label, index) => (
        <View key={label} style={{ position: 'absolute', top: index % 2 === 0 ? 6 : undefined, bottom: index % 2 === 1 ? 5 : undefined, left: index % 2 === 0 ? 12 : undefined, right: index % 2 === 1 ? 12 : undefined, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: `${GREEN}55` }}>
          <Text style={{ color: colors.text, fontSize: 9.5, fontWeight: '800' }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export function LabelCompressionVisual({ colors, isDark, reduceMotion = false }: VisualProps) {
  const beam = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      beam.setValue(1);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(beam, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(450),
      Animated.timing(beam, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [beam, reduceMotion]);

  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 22, overflow: 'hidden' }}>
      <View style={{ height: 108, overflow: 'hidden', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 12 }}>
        {[
          'glucose syrup, maltodextrin, acidity regulator',
          'emulsifier, natural flavouring, stabiliser',
          'cocoa powder, salt, vitamins, minerals',
          'may contain traces of nuts and milk',
        ].map((line) => <Text key={line} numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 10.5, lineHeight: 19, fontWeight: '700', letterSpacing: 0.15, opacity: 0.62 }}>{line}</Text>)}
        <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: AMBER, shadowColor: AMBER, shadowOpacity: 0.85, shadowRadius: 8, transform: [{ translateY: beam.interpolate({ inputRange: [0, 1], outputRange: [0, 98] }) }] }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 8, top: 8, width: 16, height: 16, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: `${AMBER}80` }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 8, bottom: 8, width: 16, height: 16, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: `${AMBER}80` }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
        {['Processing', 'Ingredients', 'Sugar'].map((label, index) => (
          <View key={label} style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: index === 2 ? `${AMBER}16` : `${GREEN}16`, borderWidth: 1, borderColor: index === 2 ? `${AMBER}35` : `${GREEN}35` }}>
            <Text style={{ color: index === 2 ? AMBER : colors.primary, fontSize: 9.5, fontWeight: '800' }}>{label}</Text>
          </View>
        ))}
      </View>
    </Surface>
  );
}

export function InsightTransformVisual({ colors, isDark, reduceMotion = false }: VisualProps) {
  const reveal = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const stages = [
    { label: 'LABEL', value: 'Dense', color: colors.textSecondary },
    { label: 'SCAN', value: 'Read', color: AMBER },
    { label: 'STRUCTURE', value: 'Sort', color: colors.primary },
    { label: 'INSIGHT', value: 'See', color: TEAL },
  ];

  useEffect(() => {
    if (reduceMotion) {
      reveal.setValue(1);
      return;
    }
    Animated.timing(reveal, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduceMotion, reveal]);

  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 22, paddingVertical: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {stages.map((stage, index) => {
          const start = index / stages.length;
          const end = Math.min(1, start + 0.35);
          const opacity = reveal.interpolate({ inputRange: [start, end], outputRange: [0.35, 1], extrapolate: 'clamp' });
          const translateY = reveal.interpolate({ inputRange: [start, end], outputRange: [8, 0], extrapolate: 'clamp' });
          return (
            <React.Fragment key={stage.label}>
              <Animated.View style={{ alignItems: 'center', gap: 6, opacity, transform: [{ translateY }] }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${stage.color}16`, borderWidth: 1, borderColor: `${stage.color}45`, alignItems: 'center', justifyContent: 'center' }}>
                  {index === stages.length - 1 ? <Zap size={19} color={stage.color} strokeWidth={2.4} /> : <Text style={{ color: stage.color, fontSize: 10, fontWeight: '900' }}>{stage.value}</Text>}
                </View>
                <Text style={{ color: stage.color, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }}>{stage.label}</Text>
              </Animated.View>
              {index < stages.length - 1 && <Svg width="22" height="14" viewBox="0 0 22 14"><Path d="M1 7 H18 M13 2 L19 7 L13 12" fill="none" stroke={colors.textMuted} strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></Svg>}
            </React.Fragment>
          );
        })}
      </View>
    </Surface>
  );
}

function InsightRow({ label, value, color, colors, isDark }: { label: string; value: string; color: string; colors: any; isDark: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 10, borderRadius: 11, backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
        <Text numberOfLines={1} style={{ color: colors.text, fontSize: 11.5, fontWeight: '800', flexShrink: 1 }}>{label}</Text>
      </View>
      <Text numberOfLines={1} style={{ color, fontSize: 10.5, fontWeight: '800', marginLeft: 8 }}>{value}</Text>
    </View>
  );
}

export function ProfileAssemblyVisual({ colors, isDark, reduceMotion = false, selected, phase }: VisualProps & { selected: OnboardingPriority[], phase: 'building' | 'assembly' | 'ready' }) {
  const visiblePriorities = selected.length > 0 ? selected.slice(0, 5) : (['nutrition', 'ingredients', 'sugar'] as OnboardingPriority[]);

  const assembleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 'assembly' || phase === 'ready') {
      Animated.timing(assembleAnim, {
        toValue: 1,
        duration: phase === 'ready' ? 0 : (reduceMotion ? 0 : 1200),
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      assembleAnim.setValue(0);
    }
  }, [phase, assembleAnim, reduceMotion]);

  const translateY = assembleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35]
  });

  const scale = assembleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85]
  });

  const opacity = assembleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });

  const mascotState = phase === 'building' ? 'thinking' : phase === 'assembly' ? 'scanning' : 'happy';

  return (
    <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <OrbMascot state={mascotState} size={phase === 'ready' ? 76 : 100} reduceMotion={reduceMotion} showShadow={false} />
      </Animated.View>

      {/* Connection Lines during Assembly */}
      {phase === 'assembly' && !reduceMotion && visiblePriorities.map((priority, index) => {
        const meta = PRIORITY_META[priority];
        const angle = (index / Math.max(visiblePriorities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const length = 75;
        const x = Math.cos(angle) * length;
        const y = Math.sin(angle) * length;
        return (
          <Animated.View key={`line-${priority}`} style={{
            position: 'absolute',
            width: length,
            height: 1.5,
            backgroundColor: meta.color,
            opacity: assembleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 0] }),
            transform: [
              { translateY: -35 },
              { rotate: `${(angle * 180) / Math.PI}deg` },
              { translateX: length / 2 },
              { scaleX: assembleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }) }
            ]
          }} />
        );
      })}

      {/* Floating Pills */}
      {visiblePriorities.map((priority, index) => {
        const meta = PRIORITY_META[priority];
        const angle = (index / Math.max(visiblePriorities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const radiusBuilding = 80;
        const radiusReady = 40;

        const translateX = assembleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Math.cos(angle) * radiusBuilding, Math.cos(angle) * radiusReady]
        });

        const translateYAnim = assembleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Math.sin(angle) * radiusBuilding, Math.sin(angle) * radiusReady + 35]
        });

        const pillScale = assembleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.6]
        });

        const Icon = meta.icon;

        return (
          <Animated.View key={priority} style={{
            position: 'absolute',
            transform: [{ translateX }, { translateY: translateYAnim }, { scale: pillScale }],
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: isDark ? 'rgba(8,16,10,0.94)' : 'rgba(255,255,255,0.94)',
            borderWidth: 1.5,
            borderColor: `${meta.color}55`,
            shadowColor: meta.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: phase === 'building' ? 0.2 : 0,
            shadowRadius: 8,
            elevation: phase === 'building' ? 4 : 0,
          }}>
            <Icon size={14} color={meta.color} strokeWidth={2.3} />
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>{meta.label}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

export function MomentResultCard({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: OnboardingPriority[] }) {
  const visiblePriorities = selected.length > 0 ? selected : (['nutrition', 'ingredients', 'sugar'] as OnboardingPriority[]);
  const fadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;

  useEffect(() => {
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();
    }
  }, [fadeAnim, slideAnim, reduceMotion]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Surface colors={colors} isDark={isDark} style={{ marginBottom: 18, padding: 16, backgroundColor: isDark ? 'rgba(18,18,18,0.98)' : '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 16, elevation: 5, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Illustrative Result</Text>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 }}>Chocolate Bar</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 5, flexShrink: 1 }}>
            <ProductDataStatusPill status="complete" colors={colors} isDark={isDark} />
            <ProductDataSourcePill sources={['open_food_facts']} colors={colors} isDark={isDark} />
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginBottom: 14 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>🍫</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>BITEFIX FOOD SCORE</Text>
            <Text style={{ color: colors.text, fontSize: 32, lineHeight: 36, fontWeight: '900' }}>54</Text>
          </View>
          <NutriScoreTrafficLight grade="d" compact isDark={isDark} colors={colors} />
        </View>

        <View style={{ gap: 8 }}>
          {visiblePriorities.slice(0, 4).map((priority) => {
            const meta = PRIORITY_META[priority];
            const value = priority === 'sugar' ? '≈ 3.2 tsp' : priority === 'environment' ? 'Grade B' : priority === 'nutrition' ? 'Profile D' : priority === 'ultra_processed' ? 'NOVA 4' : 'No Flags';
            // Add visual emphasis to selected priorities
            const isEmphasized = selected.includes(priority);

            return (
              <View key={priority} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: isEmphasized ? `${meta.color}15` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'), borderWidth: 1, borderColor: isEmphasized ? `${meta.color}35` : 'transparent' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: meta.color }} />
                  <Text numberOfLines={1} style={{ color: isEmphasized ? colors.text : colors.textSecondary, fontSize: 12, fontWeight: isEmphasized ? '800' : '700', flexShrink: 1 }}>{meta.label}</Text>
                </View>
                <Text numberOfLines={1} style={{ color: isEmphasized ? meta.color : colors.text, fontSize: 12, fontWeight: '900', marginLeft: 8 }}>{value}</Text>
              </View>
            );
          })}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>Based on available product data.</Text>
      </Surface>
    </Animated.View>
  );
}
