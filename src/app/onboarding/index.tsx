import React, { useState, useEffect } from 'react';
import { Text } from '@/components/Text';
import {
  View,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Camera } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot } from '../../components/features/OrbMascot';
import { MagicalBackground } from '../../components/features/MagicalBackground';
import {
  ArrowRight,
  Check,
  Search,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Sparkles,
  RefreshCw,
  Zap,
  Star,
  Layers,
  Heart,
  Flame,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Defs, RadialGradient as SvgRadialGradient, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

// ─────────────────────────────────────────────────────────
// Premium Custom Luxury Icons (Apple Developer Inspired)
// ─────────────────────────────────────────────────────────
function LuxuryEnergyIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFB300" />
          <Stop offset="100%" stopColor="#FF6D00" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M13 10V3L4 14H11V21L20 10H13Z" fill="url(#energyGrad)" />
    </Svg>
  );
}

function LuxuryGutIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="gutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00E676" />
          <Stop offset="100%" stopColor="#00B0FF" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="url(#gutGrad)" />
    </Svg>
  );
}

function LuxuryWeightIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="weightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E040FB" />
          <Stop offset="100%" stopColor="#651FFF" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z" fill="url(#weightGrad)" />
    </Svg>
  );
}

function LuxurySafetyIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="safetyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF1744" />
          <Stop offset="100%" stopColor="#D500F9" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="url(#safetyGrad)" />
    </Svg>
  );
}

function SymptomSlumpIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="slumpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9E9E9E" />
          <Stop offset="100%" stopColor="#424242" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M17 5H3C1.9 5 1 5.9 1 7V17C1 18.1 1.9 19 3 19H17C18.1 19 19 18.1 19 17V7C19 5.9 18.1 5 17 5ZM17 17H3V7H17V17ZM21 9H23V15H21V9Z" fill="url(#slumpGrad)" />
      <Path d="M5 9H9V15H5V9Z" fill="#EF4444" />
    </Svg>
  );
}

function SymptomBloatIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="bloatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF8A80" />
          <Stop offset="100%" stopColor="#FF5252" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM13 7H11V13H17V11H13V7Z" fill="url(#bloatGrad)" />
    </Svg>
  );
}

function SymptomFogIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="fogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#80DEEA" />
          <Stop offset="100%" stopColor="#00ACC1" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.92L7.13 8.97C8.08 7.14 9.94 6 12 6C14.89 6 17.39 8.01 17.85 10.86L18.06 12.16L19.35 12.25C20.89 12.36 22 13.59 22 15C22 16.65 20.65 18 19 18Z" fill="url(#fogGrad)" />
    </Svg>
  );
}

function SymptomCravingIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="cravingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE082" />
          <Stop offset="100%" stopColor="#FFB300" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2L2 12L12 22L22 12L12 2ZM12 4.83L19.17 12L12 19.17L4.83 12L12 4.83Z" fill="url(#cravingGrad)" />
    </Svg>
  );
}

function SymptomFlareIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="flareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFAB91" />
          <Stop offset="100%" stopColor="#D84315" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="url(#flareGrad)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────
// Animated Mascot Shadow Component
// ─────────────────────────────────────────────────────────
function MascotShadow({ size, scaleStyle }: { size: number; scaleStyle: any }) {
  return (
    <Animated.View style={[{ width: size, height: size * 0.12, alignSelf: 'center' }, scaleStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 15">
        <Defs>
          <SvgRadialGradient id="shadowG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx="50" cy="7.5" r="50" fill="url(#shadowG)" />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 1: Name Personalization Card
// ─────────────────────────────────────────────────────────
function NameCard({ cardW, C, value, onChange }: { cardW: number; C: any; value: string; onChange: (v: string) => void }) {
  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: C.cardBorder,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        gap: 16,
      }}
    >
      <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
        Personal Account Profile
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: value.trim() ? C.amber : C.cardBorder,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === 'ios' ? 14 : 10,
          backgroundColor: C.cardInner,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Enter your first name"
          placeholderTextColor={C.textMuted}
          style={{
            flex: 1,
            color: C.text,
            fontSize: 16,
            fontWeight: '700',
          }}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={20}
        />
      </View>

      <View
        style={{
          backgroundColor: C.amberLight,
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: C.amber + '25',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Sparkles size={16} color={C.amber} />
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 16 }}>
          {value.trim() ? `Welcome, ${value.trim()}! Ready to fix your food?` : 'Type your name above to personalize your scanner!'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2: Primary Health Goal Card (Multi-Select)
// ─────────────────────────────────────────────────────────
type GoalOption = 'energy' | 'gut_microbiome' | 'weight_management' | 'family_safety';

function GoalCard({ cardW, C, selected, onSelect }: { cardW: number; C: any; selected: GoalOption[]; onSelect: (vals: GoalOption[]) => void }) {
  const options: { label: string; tag: string; icon: React.ReactNode; value: GoalOption }[] = [
    { label: 'Increase Daily Energy', tag: 'Reduce Fatigue & Slumps', icon: <LuxuryEnergyIcon />, value: 'energy' },
    { label: 'Improve Gut Microbiome', tag: 'Stop Bloating & Gas', icon: <LuxuryGutIcon />, value: 'gut_microbiome' },
    { label: 'Weight Management', tag: 'Cut Hidden Sugars & Carbs', icon: <LuxuryWeightIcon />, value: 'weight_management' },
    { label: 'Family Food Safety', tag: 'Avoid Chemical Additives', icon: <LuxurySafetyIcon />, value: 'family_safety' },
  ];

  const handleToggle = (val: GoalOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(val)) {
      onSelect(selected.filter((item) => item !== val));
    } else {
      onSelect([...selected, val]);
    }
  };

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: C.cardBorder,
        padding: 18,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
      }}
    >
      {/* Multi-Select Info Pill */}
      <View
        style={{
          alignSelf: 'center',
          backgroundColor: C.amberLight,
          borderColor: C.amber + '30',
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 4,
          marginBottom: 6,
        }}
      >
        <Text style={{ color: C.amber, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          💡 Multiple Selection Enabled
        </Text>
      </View>

      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => handleToggle(opt.value)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isSelected ? C.amberLight : C.cardInner,
              borderColor: isSelected ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isSelected ? 'transparent' : C.card, alignItems: 'center', justifyContent: 'center' }}>
                {opt.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{opt.label}</Text>
                <Text style={{ color: C.textMuted, fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>{opt.tag}</Text>
              </View>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: isSelected ? C.amber : C.textMuted,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? C.amber : 'transparent',
              }}
            >
              {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 3: Food Sourcing Baseline Card
// ─────────────────────────────────────────────────────────
function FoodSourcingCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const options = [
    { label: 'Daily / Multiple times a day', desc: 'Rely heavily on packaged snacks & meals', val: 'daily', color: C.red },
    { label: '3 to 4 times a week', desc: 'Mix of fresh foods and grocery snacks', val: 'weekly', color: C.amber },
    { label: 'Rarely / Whole Foods', desc: 'Cook almost everything fresh from scratch', val: 'rarely', color: C.green },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.cardBorder, padding: 16, gap: 10 }}>
      {options.map((opt) => {
        const isSelected = value === opt.val;
        return (
          <TouchableOpacity
            key={opt.val}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(opt.val);
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: isSelected ? C.amberLight : C.cardInner,
              borderColor: isSelected ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 16,
              padding: 14,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{opt.label}</Text>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: opt.color }} />
            </View>
            <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', lineHeight: 14 }}>{opt.desc}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 4: Symptom & Energy Audit Card (Luxury List)
// ─────────────────────────────────────────────────────────
function SymptomAuditCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (s: string) => void }) {
  const symptoms: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'slumps', label: 'Afternoon energy slumps', icon: <SymptomSlumpIcon /> },
    { id: 'bloating', label: 'Post-meal bloating', icon: <SymptomBloatIcon /> },
    { id: 'brainfog', label: 'Frequent brain fog', icon: <SymptomFogIcon /> },
    { id: 'cravings', label: 'Sugar & snack cravings', icon: <SymptomCravingIcon /> },
    { id: 'skin', label: 'Skin flares & inflammation', icon: <SymptomFlareIcon /> },
  ];

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: C.cardBorder,
        padding: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
      }}
    >
      <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Check symptoms you experience:
      </Text>

      {symptoms.map((s) => {
        const active = selected.includes(s.id);
        return (
          <TouchableOpacity
            key={s.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(s.id);
            }}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: active ? C.redLight : C.cardInner,
              borderColor: active ? C.red : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: active ? 'transparent' : C.card, alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </View>
              <Text style={{ color: active ? C.red : C.text, fontSize: 13.5, fontWeight: '800', flex: 1 }}>
                {s.label}
              </Text>
            </View>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: active ? C.red : C.textMuted,
                backgroundColor: active ? C.red : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {active && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 5: NOVA 4 Wake-Up Call Alert Dashboard
// ─────────────────────────────────────────────────────────
function NovaWakeUpCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: C.red + '40',
        padding: 20,
        gap: 16,
        shadowColor: C.red,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 6,
        alignItems: 'center',
      }}
    >
      {/* Custom Alert Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.redLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.red + '30' }}>
        <AlertTriangle size={14} color={C.red} />
        <Text style={{ color: C.red, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          HIGH SENSITIVITY ALERT
        </Text>
      </View>

      {/* Massive Graphic Callout */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: C.red, fontSize: 42, fontWeight: '900', letterSpacing: -1.5 }}>73%</Text>
        <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: -2 }}>
          OF PACKAGED FOODS
        </Text>
      </View>

      <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800', textAlign: 'center', lineHeight: 18 }}>
        Classified as <Text style={{ color: C.red, fontWeight: '900' }}>NOVA 4 Ultra-Processed</Text> with chemical agents not found in normal diets.
      </Text>

      {/* Core Highlights */}
      <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
        {[
          'Industrial emulsifiers damaging gut barrier',
          'Synthetic dyes triggering attention issues',
          'Artificial sweeteners harming digestion',
        ].map((point, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.cardInner, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }} />
            <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '600', flex: 1 }}>{point}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 6: Additive Priorities Card
// ─────────────────────────────────────────────────────────
function AdditivePrioritiesCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const additives = [
    { id: 'dyes', label: 'Synthetic Food Dyes', desc: 'Red 40, Yellow 5, Blue 1' },
    { id: 'hfcs', label: 'High Fructose Corn Syrup', desc: 'Processed sugars & syrups' },
    { id: 'emulsifiers', label: 'Gut Emulsifiers & Gums', desc: 'Polysorbate 80, Xanthan Gum' },
    { id: 'oils', label: 'Refined Seed Oils', desc: 'Canola, Soybean, Palm Oil' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.cardBorder, padding: 16, gap: 10 }}>
      {additives.map((item) => {
        const active = selected.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(item.id);
            }}
            style={{
              backgroundColor: active ? C.amberLight : C.cardInner,
              borderColor: active ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800' }}>{item.label}</Text>
              <Text style={{ color: C.textMuted, fontSize: 10.5, fontWeight: '600' }}>{item.desc}</Text>
            </View>
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: active ? C.amber : C.textMuted, backgroundColor: active ? C.amber : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {active && <Check size={10} color="#FFF" strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 7: Personal Allergen Defense Card
// ─────────────────────────────────────────────────────────
function AllergenDefenseCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const allergens = ['Gluten', 'Dairy', 'Soy', 'Nuts', 'Eggs', 'Palm Oil'];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.cardBorder, padding: 18, gap: 14 }}>
      <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Enable Red Alerts on Scans:
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {allergens.map((item) => {
          const active = selected.includes(item);
          return (
            <TouchableOpacity
              key={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(item);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: active ? C.redLight : C.cardInner,
                borderWidth: 1.5,
                borderColor: active ? C.red : C.cardBorder,
              }}
            >
              <Text style={{ color: active ? C.red : C.text, fontSize: 13, fontWeight: active ? '900' : '700' }}>
                {active ? `🚨 ${item}` : item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 8: Commitment Level Card
// ─────────────────────────────────────────────────────────
function CommitmentLevelCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const levels = [
    { id: 'curious', title: 'Curious & Learning', desc: 'Scan and review nutritional facts' },
    { id: 'moderate', title: 'Moderate Clean Swaps', desc: 'Replace moderate ingredient alerts' },
    { id: 'committed', title: '100% Whole Foods Clean', desc: 'Commit to zero ultra-processed items' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.cardBorder, padding: 16, gap: 10 }}>
      {levels.map((lvl) => {
        const active = value === lvl.id;
        return (
          <TouchableOpacity
            key={lvl.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(lvl.id);
            }}
            style={{
              backgroundColor: active ? C.amberLight : C.cardInner,
              borderColor: active ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 16,
              padding: 14,
            }}
          >
            <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{lvl.title}</Text>
            <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', marginTop: 2, lineHeight: 14 }}>{lvl.desc}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 9: Social Proof Card
// ─────────────────────────────────────────────────────────
function SocialProofCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.cardBorder, padding: 20, gap: 14, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={18} color="#FFCC00" fill="#FFCC00" />
        ))}
      </View>
      <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800', textAlign: 'center', lineHeight: 18 }}>
        "BiteFix unmasked hidden ultra-processed food dyes in my daily protein bar. Found an A-Grade clean swap instantly!"
      </Text>
      <Text style={{ color: C.amber, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        — Sarah M., Verified User
      </Text>
      <View style={{ backgroundColor: C.cardInner, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder }}>
        <Text style={{ color: C.textSub, fontSize: 10.5, fontWeight: '800' }}>Backed by Open Food Facts Science</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 10: Dynamic Health Analysis Engine (Calculation Loader)
// ─────────────────────────────────────────────────────────
function HealthAnalysisCalculationCard({ cardW, C, onComplete }: { cardW: number; C: any; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('Analyzing health goals...');

  useEffect(() => {
    const t1 = setTimeout(() => { setProgress(35); setStepText('Calibrating NOVA 4 sensitivity...'); }, 800);
    const t2 = setTimeout(() => { setProgress(70); setStepText('Setting up Gut Shield alerts...'); }, 1800);
    const t3 = setTimeout(() => { setProgress(100); setStepText('Generating Clean Swap Matrix...'); }, 2800);
    const t4 = setTimeout(() => { onComplete(); }, 3500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.amber, padding: 24, gap: 16, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.amber} />
      <Text style={{ color: C.text, fontSize: 15, fontWeight: '900', textAlign: 'center' }}>{stepText}</Text>
      <View style={{ width: '100%', height: 8, backgroundColor: C.cardInner, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${progress}%`, height: '100%', backgroundColor: C.amber, borderRadius: 4 }} />
      </View>
      <Text style={{ color: C.amber, fontSize: 13, fontWeight: '900' }}>{progress}% Completed</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 11: Instant Result Intelligence Preview (6-Point Matrix)
// ─────────────────────────────────────────────────────────
function InstantResultSummaryCard({ cardW, C, isDark }: { cardW: number; C: any; isDark: boolean }) {
  const features = [
    { title: 'NOVA Class', desc: 'Processing audit', icon: <Activity size={12} color="#FF9500" /> },
    { title: 'Nutri-Score', desc: 'Traffic light grade', icon: <Sparkles size={12} color="#34C759" /> },
    { title: 'Gut Shield', desc: 'Barrier alert', icon: <ShieldAlert size={12} color="#FF3B30" /> },
    { title: 'Dye Detective', desc: 'Synthetic dyes', icon: <Search size={12} color="#AF52DE" /> },
    { title: 'Hidden Sugar', desc: 'Teaspoon converter', icon: <Zap size={12} color="#FFCC00" /> },
    { title: 'Smart Swaps', desc: 'Clean A-Grade match', icon: <RefreshCw size={12} color="#007AFF" /> },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.amber, padding: 14, gap: 10 }}>
      <Text style={{ color: C.amber, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 }}>
        6-Point Instant Scan Matrix
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' }}>
        {features.map((f, i) => (
          <View key={i} style={{ width: '48%', backgroundColor: C.cardInner, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: C.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {f.icon}
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 11, fontWeight: '800' }}>{f.title}</Text>
              <Text style={{ color: C.textMuted, fontSize: 8.5, fontWeight: '600' }}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 12: Paywall Transition Summary Card
// ─────────────────────────────────────────────────────────
function PaywallTransitionCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.amber, padding: 20, gap: 12, alignItems: 'center' }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.amberLight, alignItems: 'center', justifyContent: 'center' }}>
        <Award size={24} color={C.amber} />
      </View>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>
        Your Custom Food Shield is Ready!
      </Text>
      <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 }}>
        Unlock unlimited barcode scanning, full additive alerts, and clean food swaps.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDES DATA CONFIGURATION (12 STEPS)
// ─────────────────────────────────────────────────────────
interface SlideData {
  step: number;
  title: string;
  highlight: string;
  subtitle: string;
  buttonLabel: string;
  isLast: boolean;
  mascotState: 'happy' | 'idle' | 'shocked';
}

const SLIDES: SlideData[] = [
  { step: 1, title: 'Welcome to BiteFix', highlight: 'BiteFix', subtitle: "Let's personalize your food scanner.", buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 2, title: 'Select Primary Goals', highlight: 'Primary Goals', subtitle: 'Tailor your scanner to focus on what matters.', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 3, title: 'Food Sourcing Baseline', highlight: 'Food Sourcing', subtitle: 'How often do you consume pre-packaged foods?', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 4, title: 'Energy & Gut Audit', highlight: 'Energy & Gut', subtitle: 'Select symptoms you experience frequently:', buttonLabel: 'Continue', isLast: false, mascotState: 'shocked' },
  { step: 5, title: 'NOVA 4 Wake-Up Call', highlight: 'NOVA 4', subtitle: 'Most grocery foods are Ultra-Processed.', buttonLabel: 'I Want to Protect Myself', isLast: false, mascotState: 'shocked' },
  { step: 6, title: 'Additive Priorities', highlight: 'Additive Priorities', subtitle: 'Select hidden ingredients to flag instantly:', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 7, title: 'Personal Allergen Defense', highlight: 'Allergen Defense', subtitle: 'Lock ingredients with high-priority RED shields:', buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 8, title: 'Commitment Level', highlight: 'Commitment', subtitle: 'How committed are you to clean eating?', buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 9, title: 'Join 50,000+ Clean Eaters', highlight: '50,000+', subtitle: 'Backed by Open Food Facts Science.', buttonLabel: 'Build My Food Shield', isLast: false, mascotState: 'happy' },
  { step: 10, title: 'Analyzing Health Profile...', highlight: 'Analyzing', subtitle: 'Calibrating custom Gut Shield & Clean Swap Matrix.', buttonLabel: 'Analyzing...', isLast: false, mascotState: 'happy' },
  { step: 11, title: 'Instant Scan Intelligence', highlight: 'Scan Intelligence', subtitle: 'Your personalized 6-point scanner is ready.', buttonLabel: 'Unlock Full Access', isLast: false, mascotState: 'happy' },
  { step: 12, title: 'Your Clean Journey Begins', highlight: 'Clean Journey', subtitle: 'Start your unlimited food scanning experience.', buttonLabel: 'Start My Clean Journey', isLast: true, mascotState: 'happy' },
];

function DotIndicator({ active, C }: { active: boolean; C: any }) {
  const dotAnimStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? 18 : 5, { damping: 15, stiffness: 150 }),
    backgroundColor: withTiming(active ? C.amber : C.cardBorder, { duration: 200 }),
  }), [active, C]);

  return <Animated.View style={[{ height: 5, borderRadius: 3 }, dotAnimStyle]} />;
}

// ─────────────────────────────────────────────────────────
// MAIN ONBOARDING SCREEN COMPONENT
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { setProfile, setOnboardingComplete, toggleAllergenFilter, allergenFilters } = useAppStore();
  const { user } = useAuthStore();

  const C = {
    bg: colors.background,
    card: colors.surface,
    cardInner: isDark ? '#1F2937' : '#F9FAFB',
    cardBorder: colors.border,
    amber: '#FF9500',
    amberLight: isDark ? 'rgba(255, 149, 0, 0.15)' : '#FFFBEB',
    amberMid: '#F59E0B',
    red: '#EF4444',
    redLight: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
    green: '#10B981',
    greenLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    text: colors.text,
    textSub: colors.textSecondary,
    textMuted: colors.textMuted,
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // User State
  const [userName, setUserName] = useState('');
  const [userGoals, setUserGoals] = useState<GoalOption[]>(['energy']);
  const [foodSourcing, setFoodSourcing] = useState('weekly');
  const [symptoms, setSymptoms] = useState<string[]>(['slumps', 'bloating']);
  const [additives, setAdditives] = useState<string[]>(['dyes', 'emulsifiers']);
  const [commitment, setCommitment] = useState('moderate');

  // Mascot Floating Animation
  const mascotFloatY = useSharedValue(0);
  const cardTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const shineProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    mascotFloatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    shineProgress.value = withRepeat(
      withDelay(1200, withTiming(1, { duration: 1600, easing: Easing.linear })),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (currentSlide !== currentCardIndex) {
      cardOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.93, { duration: 150 });
      cardTranslateX.value = withTiming(-35, { duration: 150 }, () => {
        runOnJS(setCurrentCardIndex)(currentSlide);
        cardTranslateX.value = 35;
        cardOpacity.value = withTiming(1, { duration: 250 });
        cardScale.value = withTiming(1, { duration: 250 });
        cardTranslateX.value = withSpring(0, { damping: 13, stiffness: 120 });
      });
    }

    if (currentSlide !== currentTextIndex) {
      textOpacity.value = withTiming(0, { duration: 150 });
      textTranslateY.value = withTiming(15, { duration: 150 }, () => {
        runOnJS(setCurrentTextIndex)(currentSlide);
        textTranslateY.value = -15;
        textOpacity.value = withTiming(1, { duration: 220 });
        textTranslateY.value = withSpring(0, { damping: 13, stiffness: 120 });
      });
    }
  }, [currentSlide]);

  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mascotFloatY.value }],
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslateX.value }, { scale: cardScale.value }],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleNext = async () => {
    if (currentSlide === 0 && !userName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (currentSlide === 3) {
      try {
        await Camera.requestCameraPermissionsAsync();
      } catch (_) {}
    }

    if (currentSlide < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentSlide((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const mappedGoal =
        userGoals[0] === 'energy' || userGoals[0] === 'gut_microbiome' ? 'healthy_habits' :
        userGoals[0] === 'weight_management' ? 'clean_swaps' :
        userGoals[0] === 'family_safety' ? 'ultra_processed' : 'none';

      setProfile({
        userName: userName.trim() || 'Friend',
        userGoal: mappedGoal,
      });
      setOnboardingComplete(true);
      router.replace(user ? '/paywall' : '/auth');
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    return false;
  };

  const slide = SLIDES[currentSlide] || SLIDES[0];
  const isShort = height < 700;
  const orbSize = Math.min(Math.round(width * 0.50), 200);
  const cardW = Math.min(width - 32, 380);

  const renderTitle = () => {
    const textSlide = SLIDES[currentTextIndex] || SLIDES[0];
    const parts = textSlide.title.split(textSlide.highlight);
    return (
      <Text style={{ color: C.text, fontSize: isShort ? 22 : 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
        {parts[0]}
        {textSlide.highlight ? <Text style={{ color: C.amber }}>{textSlide.highlight}</Text> : null}
        {parts[1] || ''}
      </Text>
    );
  };

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAdditive = (id: string) => {
    setAdditives((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MagicalBackground />

      <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, paddingHorizontal: 16 }}>
        {/* Pinned Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40, marginBottom: 8 }}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
            STEP {currentSlide + 1} OF 12
          </Text>

          {currentSlide > 0 && currentSlide !== 9 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentSlide((s) => s - 1);
              }}
              style={{ backgroundColor: C.cardInner, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
            >
              <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Middle Content Section */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 12,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mascot + Title Stacked Block */}
          <View style={{ alignItems: 'center', gap: 6, marginBottom: isShort ? 14 : 20 }}>
            <Animated.View style={mascotAnimStyle}>
              <OrbMascot state={slide.mascotState} size={orbSize} />
            </Animated.View>
            <MascotShadow size={orbSize} scaleStyle={{}} />

            <Animated.View style={[{ alignItems: 'center', gap: 4, marginTop: 4 }, textAnimStyle]}>
              {renderTitle()}
              <Text style={{ color: C.textSub, fontSize: isShort ? 13.5 : 15.5, fontWeight: '600', textAlign: 'center' }}>
                {SLIDES[currentTextIndex].subtitle}
              </Text>
            </Animated.View>
          </View>

          {/* Card Component Slot */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Animated.View style={cardAnimStyle}>
              {currentCardIndex === 0 && <NameCard cardW={cardW} C={C} value={userName} onChange={setUserName} />}
              {currentCardIndex === 1 && <GoalCard cardW={cardW} C={C} selected={userGoals} onSelect={setUserGoals} />}
              {currentCardIndex === 2 && <FoodSourcingCard cardW={cardW} C={C} value={foodSourcing} onSelect={setFoodSourcing} />}
              {currentCardIndex === 3 && <SymptomAuditCard cardW={cardW} C={C} selected={symptoms} onToggle={toggleSymptom} />}
              {currentCardIndex === 4 && <NovaWakeUpCard cardW={cardW} C={C} />}
              {currentCardIndex === 5 && <AdditivePrioritiesCard cardW={cardW} C={C} selected={additives} onToggle={toggleAdditive} />}
              {currentCardIndex === 6 && <AllergenDefenseCard cardW={cardW} C={C} selected={allergenFilters} onToggle={toggleAllergenFilter} />}
              {currentCardIndex === 7 && <CommitmentLevelCard cardW={cardW} C={C} value={commitment} onSelect={setCommitment} />}
              {currentCardIndex === 8 && <SocialProofCard cardW={cardW} C={C} />}
              {currentCardIndex === 9 && <HealthAnalysisCalculationCard cardW={cardW} C={C} onComplete={() => setCurrentSlide(10)} />}
              {currentCardIndex === 10 && <InstantResultSummaryCard cardW={cardW} C={C} isDark={isDark} />}
              {currentCardIndex === 11 && <PaywallTransitionCard cardW={cardW} C={C} />}
            </Animated.View>
          </View>
        </ScrollView>

        {/* Pinned Bottom Bar */}
        {currentCardIndex !== 9 && (
          <View style={{ gap: 12, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              {SLIDES.map((_, idx) => (
                <DotIndicator key={idx} active={currentSlide === idx} C={C} />
              ))}
            </View>

            <Animated.View style={[buttonAnimStyle, { width: '100%', opacity: isNextDisabled() ? 0.5 : 1 }]}>
              <TouchableOpacity
                onPress={handleNext}
                disabled={isNextDisabled()}
                activeOpacity={0.9}
                style={{
                  width: '100%',
                  backgroundColor: C.amber,
                  borderRadius: 18,
                  paddingVertical: isShort ? 13 : 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: C.amber,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                  {slide.buttonLabel}
                </Text>
                {slide.isLast ? <Check size={16} color="#FFF" strokeWidth={3} /> : <ArrowRight size={16} color="#FFF" strokeWidth={2.5} />}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
