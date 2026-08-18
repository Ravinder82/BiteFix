import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Activity, Droplets, Leaf, Package, ShieldCheck, Zap } from 'lucide-react-native';
import { OrbMascot } from '../features/OrbMascot';
import { ProductDataSourcePill, ProductDataStatusPill } from '../features/ProductDataPills';
import { NutriScoreTrafficLight } from '../features/NutriScoreTrafficLight';
import { OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';

type VisualProps = {
  colors: any;
  isDark: boolean;
  reduceMotion?: boolean;
};

const GREEN = '#01922A';
const AMBER = '#D97706';
const TEAL = '#0F766E';

const PRIORITY_META: Record<OnboardingPriority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  ultra_processed: { label: 'Processing', color: GREEN, icon: Package },
  nutrition: { label: 'Nutrition', color: TEAL, icon: Activity },
  sugar: { label: 'Sugar', color: AMBER, icon: Droplets },
  ingredients: { label: 'Ingredients', color: GREEN, icon: ShieldCheck },
  environment: { label: 'Environment', color: TEAL, icon: Leaf },
};

function Surface({ children, colors, isDark, style }: VisualProps & { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.025)',
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
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
  return (
    <View accessible accessibilityLabel="Selected priorities illuminate around the BiteFix scanner" style={{ height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
      <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: isDark ? 'rgba(110,224,65,0.25)' : 'rgba(74,138,26,0.20)' }} />
      <OrbMascot state="thinking" size={76} reduceMotion={reduceMotion} showShadow={false} />
      {selected.map((priority, index) => {
        const meta = PRIORITY_META[priority];
        const angle = (index / Math.max(selected.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + Math.cos(angle) * 38;
        const top = 50 + Math.sin(angle) * 38;
        const Icon = meta.icon;
        return (
          <View key={priority} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: [{ translateX: -34 }, { translateY: -15 }], flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: isDark ? 'rgba(8,16,10,0.94)' : 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: `${meta.color}66` }}>
            <Icon size={12} color={meta.color} strokeWidth={2.3} />
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 9.5, fontWeight: '800' }}>{meta.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function AllergenShieldVisual({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: string[] }) {
  const labels = selected.filter((item) => item !== 'none').slice(0, 4);
  return (
    <View accessible accessibilityLabel={labels.length ? `Watching for ${labels.join(', ')}` : 'No allergen filters selected'} style={{ height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
      <View style={{ position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1.5, borderColor: isDark ? 'rgba(110,224,65,0.34)' : 'rgba(74,138,26,0.26)', backgroundColor: isDark ? 'rgba(110,224,65,0.05)' : 'rgba(74,138,26,0.05)', transform: [{ rotate: '45deg' }] }} />
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
      <View style={{ height: 92, overflow: 'hidden', justifyContent: 'center' }}>
        <Text numberOfLines={3} style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 18, fontWeight: '600', opacity: 0.62 }}>
          glucose syrup, maltodextrin, acidity regulator, emulsifier, natural flavouring, stabiliser, cocoa powder, salt, vitamins, minerals
        </Text>
        <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: AMBER, shadowColor: AMBER, shadowOpacity: 0.8, shadowRadius: 8, transform: [{ translateY: beam.interpolate({ inputRange: [0, 1], outputRange: [0, 78] }) }] }} />
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

export function InsightTransformVisual({ colors, isDark }: VisualProps) {
  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 62, height: 62, borderRadius: 18, backgroundColor: isDark ? 'rgba(110,224,65,0.12)' : 'rgba(74,138,26,0.10)', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={25} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, gap: 7 }}>
          {['Clear overview', 'Signals that matter', 'Ready to compare'].map((label) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
              <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{label}</Text>
            </View>
          ))}
        </View>
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

export function OnboardingInsightStack({ colors, isDark, reduceMotion = false, selected }: VisualProps & { selected: OnboardingPriority[] }) {
  const visiblePriorities = selected.length > 0 ? selected : ['nutrition', 'ingredients', 'sugar'] as OnboardingPriority[];
  return (
    <Surface colors={colors} isDark={isDark} style={{ marginBottom: 18, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Illustrative Scan</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 2 }}>Chocolate Bar</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5, flexShrink: 1 }}>
          <ProductDataStatusPill status="complete" colors={colors} isDark={isDark} />
          <ProductDataSourcePill sources={['open_food_facts']} colors={colors} isDark={isDark} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 25 }}>🍫</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>BITEFIX FOOD SCORE</Text>
          <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: '900' }}>54</Text>
        </View>
        <NutriScoreTrafficLight grade="d" compact isDark={isDark} colors={colors} />
      </View>
      <View style={{ gap: 7 }}>
        {visiblePriorities.slice(0, 4).map((priority) => {
          const meta = PRIORITY_META[priority];
          const value = priority === 'sugar' ? '≈ 3.2 tsp' : priority === 'environment' ? 'Grade B' : priority === 'nutrition' ? 'Profile D' : priority === 'ultra_processed' ? 'NOVA 4' : 'Review';
          return <InsightRow key={priority} label={meta.label} value={value} color={meta.color} colors={colors} isDark={isDark} />;
        })}
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '600', marginTop: 10 }}>Based on available product data.</Text>
    </Surface>
  );
}

