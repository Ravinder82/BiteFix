import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, Droplets, Package, ShieldCheck } from 'lucide-react-native';
import { OrbMascot } from '../features/OrbMascot';
import {
  AllergenShieldVisual,
  InsightTransformVisual,
  LabelCompressionVisual,
  OnboardingInsightStack,
  PriorityConstellation,
  ShoppingRhythmVisual,
} from './OnboardingVisuals';
import { IngredientReadingFrequency, OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';

const GREEN = '#01922A';
const GREEN_DIM = '#00C28820';

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

function ScreenFrame({ children, colors }: { children: React.ReactNode; colors: any }) {
  return <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 18 }}>{children}</View>;
}

function ChoiceButton({ label, selected, onPress, colors, isDark, multi = false }: { label: string; selected: boolean; onPress: () => void; colors: any; isDark: boolean; multi?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ selected }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: selected ? GREEN : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', backgroundColor: selected ? GREEN_DIM : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
    >
      <View style={{ width: 20, height: 20, borderRadius: multi ? 6 : 10, borderWidth: 1.5, borderColor: selected ? GREEN : colors.textMuted, backgroundColor: selected ? GREEN : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>✓</Text>}
      </View>
      <Text style={{ color: selected ? GREEN : colors.text, fontSize: 14, fontWeight: selected ? '800' : '600', flex: 1 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function IdentityScreen({ name, onChange, onSkip, colors, isDark }: { name: string; onChange: (name: string) => void; onSkip: () => void; colors: any; isDark: boolean }) {
  return <ScreenFrame colors={colors}><View style={{ alignItems: 'center', marginBottom: 20 }}><OrbMascot state="thinking" size={82} /></View><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginBottom: 8 }}>Let's make BiteFix yours.</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 20 }}>What should we call you?</Text><TextInput value={name} onChangeText={onChange} placeholder="First name (optional)" placeholderTextColor={colors.textMuted} maxLength={40} autoCapitalize="words" returnKeyType="done" accessible accessibilityLabel="First name, optional" style={{ color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: name ? GREEN : colors.border, borderWidth: 1.5, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, fontWeight: '600', marginBottom: 12 }} /><TouchableOpacity onPress={onSkip} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 8 }}><Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Skip for now</Text></TouchableOpacity></ScreenFrame>;
}

export function ContextScreen({ selected, onSelect, colors, isDark, reduceMotion }: { selected?: ShoppingFrequency; onSelect: (value: ShoppingFrequency) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const options: Array<{ id: ShoppingFrequency; label: string }> = [{ id: 'rarely', label: 'Rarely' }, { id: 'sometimes', label: 'Sometimes' }, { id: 'often', label: 'Often' }, { id: 'most_trips', label: 'Most shopping trips' }];
  return <ScreenFrame colors={colors}><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginBottom: 8 }}>How often do you buy packaged food?</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 20 }}>This helps BiteFix tune the experience to your routine.</Text><ShoppingRhythmVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} frequency={selected} /><View style={{ gap: 9 }}>{options.map((option) => <ChoiceButton key={option.id} label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} colors={colors} isDark={isDark} />)}</View></ScreenFrame>;
}

export function PrioritiesScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; onToggle: (id: OnboardingPriority) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return <ScreenFrame colors={colors}><PriorityConstellation colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} /><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginBottom: 8 }}>What should BiteFix surface first?</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 18 }}>Choose anything that matters to you.</Text><View style={{ gap: 9 }}>{PRIORITY_OPTIONS.map((option) => <ChoiceButton key={option.id} label={option.label} selected={selected.includes(option.id)} onPress={() => onToggle(option.id)} colors={colors} isDark={isDark} multi />)}</View></ScreenFrame>;
}

export function AllergyScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return <ScreenFrame colors={colors}><AllergenShieldVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} /><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginBottom: 8 }}>Anything we should watch for?</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 18 }}>BiteFix can highlight matching information when it appears in available product data.</Text><View style={{ gap: 9 }}>{ALLERGEN_OPTIONS.map((option) => <ChoiceButton key={option.id} label={option.label} selected={selected.includes(option.id)} onPress={() => onToggle(option.id)} colors={colors} isDark={isDark} multi />)}</View></ScreenFrame>;
}

export function PainScreen({ selected, onSelect, colors, isDark }: { selected?: IngredientReadingFrequency; onSelect: (value: IngredientReadingFrequency) => void; colors: any; isDark: boolean }) {
  const options: Array<{ id: IngredientReadingFrequency; label: string }> = [{ id: 'always', label: 'Always' }, { id: 'sometimes', label: 'Sometimes' }, { id: 'when_needed', label: 'Only when something catches my eye' }, { id: 'rarely', label: 'Rarely' }];
  return <ScreenFrame colors={colors}><LabelCompressionVisual colors={colors} isDark={isDark} /><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginBottom: 8 }}>Do you read every ingredient before you buy?</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 18 }}>Most people do not have time to decode every label in the aisle.</Text><View style={{ gap: 9 }}>{options.map((option) => <ChoiceButton key={option.id} label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} colors={colors} isDark={isDark} />)}</View></ScreenFrame>;
}

export function RevelationScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  return <ScreenFrame colors={colors}><View style={{ alignItems: 'center', marginBottom: 12 }}><OrbMascot state="scanning" size={84} /></View><Text style={{ color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.7, marginBottom: 8 }}>You do not need to read everything.</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 20 }}>BiteFix turns available product data into a clearer snapshot.</Text><InsightTransformVisual colors={colors} isDark={isDark} /></ScreenFrame>;
}

export function ProductProofScreen({ selected, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return <ScreenFrame colors={colors}><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginBottom: 8 }}>One scan. The details that matter.</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 18 }}>An illustrative result using available product information.</Text><OnboardingInsightStack colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} /></ScreenFrame>;
}

export function PersonalizationScreen({ selected, name, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; name: string; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return <ScreenFrame colors={colors}><View style={{ alignItems: 'center', marginBottom: 12 }}><OrbMascot state="idle" size={80} reduceMotion={reduceMotion} /></View><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginBottom: 8 }}>{name.trim() ? `${name.trim()}, BiteFix will focus on what matters to you.` : 'BiteFix will focus on what matters to you.'}</Text><Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 18 }}>Your priorities will guide the insights you see first.</Text><OnboardingInsightStack colors={colors} isDark={isDark} reduceMotion={reduceMotion} selected={selected} /></ScreenFrame>;
}

