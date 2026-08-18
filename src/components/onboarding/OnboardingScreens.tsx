import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, Check, Droplets, Leaf, Package, ShieldCheck } from 'lucide-react-native';
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

// ══════════════════════════════════════════════════════════════
// DESIGN TOKENS & TYPOGRAPHY SYSTEM
// ══════════════════════════════════════════════════════════════
const GREEN = '#01922A';
const AMBER = '#D97706';
const TEAL = '#0F766E';

const TYPE = {
  headline: { fontSize: 26, lineHeight: 32, fontWeight: '900' as const, letterSpacing: -0.5 },
  display: { fontSize: 28, lineHeight: 34, fontWeight: '900' as const, letterSpacing: -0.6 },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: '500' as const },
  eyebrow: { fontSize: 10.5, fontWeight: '800' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  label: { fontSize: 12.5, lineHeight: 16, fontWeight: '700' as const },
};

// ══════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════
const ALLERGEN_OPTIONS = [
  { id: 'none', label: 'No known food allergies' },
  { id: 'dairy', label: 'Dairy and milk' },
  { id: 'gluten', label: 'Gluten and wheat' },
  { id: 'nuts', label: 'Tree nuts and peanuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'eggs', label: 'Eggs' },
];

const PRIORITY_OPTIONS: Array<{ id: OnboardingPriority; label: string; icon: React.ComponentType<any>; color: string }> = [
  { id: 'ultra_processed', label: 'Less ultra-processed food', icon: Package, color: GREEN },
  { id: 'nutrition', label: 'Better nutrition profile', icon: Activity, color: TEAL },
  { id: 'ingredients', label: 'Ingredients and allergens', icon: ShieldCheck, color: GREEN },
  { id: 'sugar', label: 'Lower sugar intake', icon: Droplets, color: AMBER },
  { id: 'environment', label: 'Environmental impact', icon: Leaf, color: TEAL },
];

// ══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════
function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 14 }}>
      {children}
    </View>
  );
}

function parseRichText(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return { text: part.slice(2, -2), isBold: true, key: index };
    }
    return { text: part, isBold: false, key: index };
  });
}

function ScreenHeading({ title, subtitle, colors, align = 'left', display = false }: { title: string; subtitle: string; colors: any; align?: 'left' | 'center'; display?: boolean }) {
  const titleParts = parseRichText(title);
  const subtitleParts = parseRichText(subtitle);

  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', marginBottom: 18 }}>
      <Text style={[display ? TYPE.display : TYPE.headline, { color: colors.text, textAlign: align, maxWidth: 360 }]}>
        {titleParts.map((part) => (
          <Text key={part.key} style={part.isBold ? { color: GREEN } : {}}>
            {part.text}
          </Text>
        ))}
      </Text>
      <Text style={[TYPE.subtitle, { color: colors.textSecondary, textAlign: align, maxWidth: 350, marginTop: 7 }]}>
        {subtitleParts.map((part) => (
          <Text key={part.key} style={part.isBold ? { color: GREEN, fontWeight: '700' } : {}}>
            {part.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}

function SelectionRow({
  label,
  selected,
  onPress,
  colors,
  isDark,
  multi = false,
  Icon,
  accent,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
  multi?: boolean;
  Icon?: React.ComponentType<any>;
  accent?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const accentColor = accent || GREEN;

  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1.015 : 1, damping: 14, stiffness: 220, mass: 0.6, useNativeDriver: true }).start();
  }, [scale, selected]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole={multi ? 'checkbox' : 'radio'}
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          minHeight: 54,
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderRadius: 17,
          borderWidth: 1.5,
          borderColor: selected ? accentColor : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          backgroundColor: selected
            ? `${accentColor}12`
            : isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.012)',
        }}
      >
        {/* Indicator */}
        <View style={{
          width: 23,
          height: 23,
          borderRadius: multi ? 8 : 12,
          borderWidth: selected ? 0 : 1.5,
          borderColor: selected ? 'transparent' : isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
          backgroundColor: selected ? accentColor : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {selected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>

        {/* Optional icon */}
        {Icon && <Icon size={18} color={selected ? accentColor : colors.textSecondary} strokeWidth={2.1} />}

        {/* Label */}
        <Text style={{
          color: selected ? colors.text : colors.textSecondary,
          fontSize: 14.5,
          lineHeight: 20,
          fontWeight: selected ? '700' : '500',
          flex: 1,
        }}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1 — IDENTITY
// ══════════════════════════════════════════════════════════════
export function IdentityScreen({ name, onChange, onSkip, colors, isDark }: { name: string; onChange: (name: string) => void; onSkip: () => void; colors: any; isDark: boolean }) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, { toValue: focused ? 1 : 0, duration: 190, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [focused, focusAnim]);

  return (
    <ScreenFrame>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <OrbMascot state="idle" size={96} accessibilityLabel="Friendly BiteFix scanner mascot" />
      </View>
      <ScreenHeading
        title="Let's make BiteFix **yours**."
        subtitle="What should we call you?"
        colors={colors}
      />
      <Animated.View style={{
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [name ? GREEN : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', GREEN] }),
        shadowColor: GREEN,
        shadowOpacity: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }),
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      }}>
        <TextInput
          value={name}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="First name (optional)"
          placeholderTextColor={colors.textMuted}
          maxLength={40}
          autoCapitalize="words"
          returnKeyType="done"
          accessible
          accessibilityLabel="First name, optional"
          style={{
            color: colors.text,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
            borderRadius: 17,
            paddingHorizontal: 18,
            paddingVertical: 15,
            fontSize: 16.5,
            fontWeight: '600',
          }}
        />
      </Animated.View>
      <TouchableOpacity onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip entering a name" style={{ alignSelf: 'flex-start', paddingVertical: 12 }}>
        <Text style={{ color: colors.textSecondary, ...TYPE.label }}>Skip for now</Text>
      </TouchableOpacity>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2 — CONTEXT
// ══════════════════════════════════════════════════════════════
export function ContextScreen({ selected, onSelect, colors, isDark, reduceMotion }: { selected?: ShoppingFrequency; onSelect: (value: ShoppingFrequency) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const options: Array<{ id: ShoppingFrequency; label: string }> = [
    { id: 'rarely', label: 'Rarely' },
    { id: 'sometimes', label: 'Sometimes' },
    { id: 'often', label: 'Often' },
    { id: 'most_trips', label: 'Most shopping trips' },
  ];

  return (
    <ScreenFrame>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <OrbMascot state="thinking" size={82} reduceMotion={reduceMotion} accessibilityLabel="Curious BiteFix scanner mascot" />
      </View>
      <ScreenHeading
        title="How often do you buy **packaged food**?"
        subtitle="This helps BiteFix **tune the experience** to your routine."
        colors={colors}
      />
      <ShoppingRhythmVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} frequency={selected} />
      <View style={{ gap: 9 }}>
        {options.map((option) => (
          <SelectionRow key={option.id} label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} colors={colors} isDark={isDark} />
        ))}
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3 — ALLERGY
// ══════════════════════════════════════════════════════════════
export function AllergyScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return (
    <ScreenFrame>
      <AllergenShieldVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} />
      <ScreenHeading
        title="Anything we should **watch for**?"
        subtitle="BiteFix can highlight matching information when it appears in **available product data**."
        colors={colors}
      />
      <View style={{ gap: 9 }}>
        {ALLERGEN_OPTIONS.map((option) => (
          <SelectionRow key={option.id} label={option.label} selected={selected.includes(option.id)} onPress={() => onToggle(option.id)} colors={colors} isDark={isDark} multi />
        ))}
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4 — PAIN
// ══════════════════════════════════════════════════════════════
export function PainScreen({ selected, onSelect, colors, isDark, reduceMotion }: { selected?: IngredientReadingFrequency; onSelect: (value: IngredientReadingFrequency) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const options: Array<{ id: IngredientReadingFrequency; label: string }> = [
    { id: 'always', label: 'Always' },
    { id: 'sometimes', label: 'Sometimes' },
    { id: 'when_needed', label: 'Only when something catches my eye' },
    { id: 'rarely', label: 'Rarely or never' },
  ];

  return (
    <ScreenFrame>
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <OrbMascot state="caution" size={78} reduceMotion={reduceMotion} accessibilityLabel="Empathetic BiteFix scanner mascot" />
      </View>
      <LabelCompressionVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} />
      <ScreenHeading
        title="Do you read **every ingredient** before you buy?"
        subtitle="Most people do not have time to **decode every label** in the aisle."
        colors={colors}
      />
      <View style={{ gap: 9 }}>
        {options.map((option) => (
          <SelectionRow key={option.id} label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} colors={colors} isDark={isDark} />
        ))}
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5 — PRIORITIES
// ══════════════════════════════════════════════════════════════
export function PrioritiesScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; onToggle: (id: OnboardingPriority) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return (
    <ScreenFrame>
      <PriorityConstellation colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} />
      <ScreenHeading
        title="What should BiteFix **surface first**?"
        subtitle="Choose anything that **matters to you**."
        colors={colors}
      />
      <View style={{ gap: 9 }}>
        {PRIORITY_OPTIONS.map((option) => (
          <SelectionRow
            key={option.id}
            label={option.label}
            selected={selected.includes(option.id)}
            onPress={() => onToggle(option.id)}
            colors={colors}
            isDark={isDark}
            multi
            Icon={option.icon}
            accent={option.color}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 6 — REVELATION
// ══════════════════════════════════════════════════════════════
export function RevelationScreen({ colors, isDark, reduceMotion }: { colors: any; isDark: boolean; reduceMotion: boolean }) {
  return (
    <ScreenFrame>
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <OrbMascot state="scanning" size={96} reduceMotion={reduceMotion} accessibilityLabel="BiteFix scanner revealing structured product information" />
      </View>
      <ScreenHeading
        title="You do not need to **read everything**."
        subtitle="BiteFix turns available product data into a **clearer snapshot**."
        colors={colors}
        display
      />
      <InsightTransformVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} />
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 7 — MOMENT OF TRUTH
// ══════════════════════════════════════════════════════════════
export function MomentOfTruthScreen({
  selected,
  name,
  colors,
  isDark,
  reduceMotion,
}: {
  selected: OnboardingPriority[];
  name?: string;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
}) {
  const [phase, setPhase] = useState<'building' | 'assembly' | 'ready'>('building');

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    if (reduceMotion) {
      setPhase('ready');
    } else {
      t1 = setTimeout(() => setPhase('assembly'), 750);
      t2 = setTimeout(() => setPhase('ready'), 2100);
    }
    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [reduceMotion]);

  const displayName = name?.trim() || '';
  const priorityLabels = useMemo(() => {
    const META: Record<OnboardingPriority, string> = {
      ultra_processed: 'Processing Level',
      nutrition: 'Nutrition Intelligence',
      sugar: 'Sugar Insights',
      ingredients: 'Ingredient Review',
      environment: 'Eco Impact',
    };
    return (selected.length > 0 ? selected : (['nutrition', 'ingredients', 'sugar'] as OnboardingPriority[])).map((p) => META[p]);
  }, [selected]);

  return (
    <ScreenFrame>
      {phase !== 'ready' ? (
        <>
          <ProfileAssemblyVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} phase={phase} />
          <ScreenHeading
            title="Building your **BiteFix profile**."
            subtitle="Shaping the insights you **see first**."
            colors={colors}
            align="center"
          />
        </>
      ) : (
        <>
          {/* Apple-style liquid glass profile summary card */}
          <View
            style={{
              marginBottom: 16,
              padding: 16,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.16 : 0.05,
              shadowRadius: 14,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <OrbMascot state="happy" size={44} showShadow={false} reduceMotion={reduceMotion} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                  {displayName ? `${displayName}'s Profile` : 'Your BiteFix Profile'}
                </Text>
                <Text style={{ color: GREEN, fontSize: 12, fontWeight: '700', marginTop: 1 }}>
                  Personalized & Ready
                </Text>
              </View>
            </View>
            {/* Selected Priorities badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {priorityLabels.map((label) => (
                <View
                  key={label}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: `${GREEN}12`,
                    borderWidth: 1,
                    borderColor: `${GREEN}35`,
                  }}
                >
                  <Text style={{ color: GREEN, fontSize: 11, fontWeight: '800' }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <ScreenHeading
            title="Your BiteFix view is **ready**."
            subtitle="Here is how your scan results **come together**."
            colors={colors}
            align="center"
          />
          <MomentResultCard colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} />
        </>
      )}
    </ScreenFrame>
  );
}
