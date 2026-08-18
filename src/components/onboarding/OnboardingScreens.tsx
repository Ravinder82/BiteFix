import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, Check, Droplets, Package, ShieldCheck } from 'lucide-react-native';
import { OrbMascot } from '../features/OrbMascot';
import {
  AllergenShieldVisual,
  InsightTransformVisual,
  LabelCompressionVisual,
  MomentResultCard,
  PriorityConstellation,
  ProfileAssemblyVisual,
  ShoppingRhythmVisual,
} from './OnboardingVisuals';
import { IngredientReadingFrequency, OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';

const GREEN = '#01922A';
const GREEN_DIM = '#00C28820';

const TYPE = {
  headline: { fontSize: 28, lineHeight: 34, fontWeight: '900' as const, letterSpacing: -0.6 },
  display: { fontSize: 30, lineHeight: 36, fontWeight: '900' as const, letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: '500' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const },
};

const ALLERGEN_OPTIONS = [
  { id: 'none', label: 'No known food allergies' },
  { id: 'dairy', label: 'Dairy and milk' },
  { id: 'gluten', label: 'Gluten and wheat' },
  { id: 'nuts', label: 'Tree nuts and peanuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'eggs', label: 'Eggs' },
];

const PRIORITY_OPTIONS: Array<{ id: OnboardingPriority; label: string; icon: React.ComponentType<any> }> = [
  { id: 'ultra_processed', label: 'Less ultra-processed', icon: Package },
  { id: 'nutrition', label: 'Nutrition profile', icon: Activity },
  { id: 'ingredients', label: 'Ingredients and allergens', icon: ShieldCheck },
  { id: 'sugar', label: 'Sugar insights', icon: Droplets },
  { id: 'environment', label: 'Environmental impact', icon: Package },
];

function ScreenFrame({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>{children}</View>;
}

function ScreenHeading({ title, subtitle, colors, align = 'left', display = false }: { title: string; subtitle: string; colors: any; align?: 'left' | 'center'; display?: boolean }) {
  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', marginBottom: 18 }}>
      <Text style={[display ? TYPE.display : TYPE.headline, { color: colors.text, textAlign: align, maxWidth: 370 }]}>{title}</Text>
      <Text style={[TYPE.subtitle, { color: colors.textSecondary, textAlign: align, maxWidth: 360, marginTop: 8 }]}>{subtitle}</Text>
    </View>
  );
}

function SelectionRow({ label, selected, onPress, colors, isDark, multi = false, Icon }: { label: string; selected: boolean; onPress: () => void; colors: any; isDark: boolean; multi?: boolean; Icon?: React.ComponentType<any> }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1.012 : 1, damping: 15, stiffness: 220, mass: 0.7, useNativeDriver: true }).start();
  }, [scale, selected]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.84}
        accessibilityRole={multi ? 'checkbox' : 'radio'}
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 54, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: selected ? GREEN : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', backgroundColor: selected ? GREEN_DIM : isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.018)' }}
      >
        <View style={{ width: 22, height: 22, borderRadius: multi ? 7 : 11, borderWidth: 1.5, borderColor: selected ? GREEN : colors.textMuted, backgroundColor: selected ? GREEN : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        {Icon && <Icon size={17} color={selected ? GREEN : colors.textSecondary} strokeWidth={2.1} />}
        <Text style={{ color: selected ? GREEN : colors.text, fontSize: 14, lineHeight: 19, fontWeight: selected ? '800' : '600', flex: 1 }}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function IdentityScreen({ name, onChange, onSkip, colors, isDark }: { name: string; onChange: (name: string) => void; onSkip: () => void; colors: any; isDark: boolean }) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, { toValue: focused ? 1 : 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [focused, focusAnim]);

  return (
    <ScreenFrame>
      <View style={{ alignItems: 'center', marginBottom: 18 }}><OrbMascot state="idle" size={94} accessibilityLabel="Friendly BiteFix scanner mascot" /></View>
      <ScreenHeading title="Let's make BiteFix yours." subtitle="What should we call you?" colors={colors} />
      <Animated.View style={{ borderRadius: 17, borderWidth: 1.5, borderColor: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [name ? GREEN : colors.border, GREEN] }), shadowColor: GREEN, shadowOpacity: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }), shadowRadius: 13, shadowOffset: { width: 0, height: 0 } }}>
        <TextInput value={name} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="First name (optional)" placeholderTextColor={colors.textMuted} maxLength={40} autoCapitalize="words" returnKeyType="done" accessible accessibilityLabel="First name, optional" style={{ color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, fontWeight: '600' }} />
      </Animated.View>
      <TouchableOpacity onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip entering a name" style={{ alignSelf: 'flex-start', paddingVertical: 10 }}><Text style={{ color: colors.textSecondary, ...TYPE.label }}>Skip for now</Text></TouchableOpacity>
    </ScreenFrame>
  );
}

export function ContextScreen({ selected, onSelect, colors, isDark, reduceMotion }: { selected?: ShoppingFrequency; onSelect: (value: ShoppingFrequency) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const options: Array<{ id: ShoppingFrequency; label: string }> = [{ id: 'rarely', label: 'Rarely' }, { id: 'sometimes', label: 'Sometimes' }, { id: 'often', label: 'Often' }, { id: 'most_trips', label: 'Most shopping trips' }];
  return <ScreenFrame><View style={{ alignItems: 'center', marginBottom: 6 }}><OrbMascot state="thinking" size={76} reduceMotion={reduceMotion} accessibilityLabel="Curious BiteFix scanner mascot" /></View><ScreenHeading title="How often do you buy packaged food?" subtitle="This helps BiteFix tune the experience to your routine." colors={colors} /><ShoppingRhythmVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} frequency={selected} /><View style={{ gap: 9 }}>{options.map((option) => <SelectionRow key={option.id} label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} colors={colors} isDark={isDark} />)}</View></ScreenFrame>;
}

export function AllergyScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return <ScreenFrame><AllergenShieldVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} /><ScreenHeading title="Anything we should watch for?" subtitle="BiteFix can highlight matching information when it appears in available product data." colors={colors} /><View style={{ gap: 9 }}>{ALLERGEN_OPTIONS.map((option) => <SelectionRow key={option.id} label={option.label} selected={selected.includes(option.id)} onPress={() => onToggle(option.id)} colors={colors} isDark={isDark} multi />)}</View></ScreenFrame>;
}

export function PainScreen({ selected, onSelect, colors, isDark, reduceMotion }: { selected?: IngredientReadingFrequency; onSelect: (value: IngredientReadingFrequency) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const options: Array<{ id: IngredientReadingFrequency; label: string }> = [{ id: 'always', label: 'Always' }, { id: 'sometimes', label: 'Sometimes' }, { id: 'when_needed', label: 'Only when something catches my eye' }, { id: 'rarely', label: 'Rarely' }];
  return <ScreenFrame><View style={{ alignItems: 'center', marginBottom: 4 }}><OrbMascot state="caution" size={72} reduceMotion={reduceMotion} accessibilityLabel="Empathetic BiteFix scanner mascot" /></View><LabelCompressionVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} /><ScreenHeading title="Do you read every ingredient before you buy?" subtitle="Most people do not have time to decode every label in the aisle." colors={colors} /><View style={{ gap: 9 }}>{options.map((option) => <SelectionRow key={option.id} label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} colors={colors} isDark={isDark} />)}</View></ScreenFrame>;
}

export function PrioritiesScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; onToggle: (id: OnboardingPriority) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return <ScreenFrame><PriorityConstellation colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} /><ScreenHeading title="What should BiteFix surface first?" subtitle="Choose anything that matters to you." colors={colors} /><View style={{ gap: 9 }}>{PRIORITY_OPTIONS.map((option) => <SelectionRow key={option.id} label={option.label} selected={selected.includes(option.id)} onPress={() => onToggle(option.id)} colors={colors} isDark={isDark} multi Icon={option.icon} />)}</View></ScreenFrame>;
}

export function RevelationScreen({ colors, isDark, reduceMotion }: { colors: any; isDark: boolean; reduceMotion: boolean }) {
  return <ScreenFrame><View style={{ alignItems: 'center', marginBottom: 8 }}><OrbMascot state="scanning" size={94} reduceMotion={reduceMotion} accessibilityLabel="BiteFix scanner revealing structured product information" /></View><ScreenHeading title="You do not need to read everything." subtitle="BiteFix turns available product data into a clearer snapshot." colors={colors} display /><InsightTransformVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} /></ScreenFrame>;
}

export function MomentOfTruthScreen({ selected, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const [phase, setPhase] = useState<'building' | 'assembly' | 'ready'>('building');

  useEffect(() => {
    let assemblyTimer: ReturnType<typeof setTimeout> | undefined;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    if (reduceMotion) {
      setPhase('ready');
    } else {
      assemblyTimer = setTimeout(() => setPhase('assembly'), 650);
      readyTimer = setTimeout(() => setPhase('ready'), 1900);
    }
    return () => {
      if (assemblyTimer) clearTimeout(assemblyTimer);
      if (readyTimer) clearTimeout(readyTimer);
    };
  }, [reduceMotion]);

  return <ScreenFrame><ProfileAssemblyVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} phase={phase} />{phase !== 'ready' ? <ScreenHeading title="Building your BiteFix profile." subtitle="Using the choices you made to shape the insights you see first." colors={colors} align="center" /> : <><ScreenHeading title="Your BiteFix view is ready." subtitle="Here's how your scan results can come together." colors={colors} align="center" /><MomentResultCard colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} /></>}</ScreenFrame>;
}

