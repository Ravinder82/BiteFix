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
import { Camera, useCameraPermissions } from 'expo-camera';
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

// Mascot Shadow Component (Animation Removed)
// ─────────────────────────────────────────────────────────
function MascotShadow({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size * 0.12, alignSelf: 'center' }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 15">
        <Defs>
          <SvgRadialGradient id="shadowG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx="50" cy="7.5" r="50" fill="url(#shadowG)" />
      </Svg>
    </View>
  );
}


// ─────────────────────────────────────────────────────────
// Animated List Item for Staggered Micro-Animations (Animation Removed)
// ─────────────────────────────────────────────────────────
function AnimatedListItem({ children, index, style }: { children: React.ReactNode; index: number; style?: any }) {
  return <View style={style}>{children}</View>;
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
        borderRadius: 28,
        borderWidth: 2,
        borderColor: C.primary,
        padding: 24,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
        overflow: 'hidden',
        gap: 16,
      }}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
        Personal Account Profile
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: value.trim() ? C.primary : C.cardBorder,
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
          backgroundColor: C.primaryLight,
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: C.primary + '25',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Sparkles size={16} color={C.primary} />
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
    { label: 'Feel more energized', tag: 'Avoid foods that cause afternoon slumps', icon: <LuxuryEnergyIcon />, value: 'energy' },
    { label: 'Better digestion', tag: 'Stay away from gut-irritating additives', icon: <LuxuryGutIcon />, value: 'gut_microbiome' },
    { label: 'Manage weight easily', tag: 'Flag hidden sugars and cheap syrups', icon: <LuxuryWeightIcon />, value: 'weight_management' },
    { label: 'Protect family health', tag: 'Keep artificial colors out of your kitchen', icon: <LuxurySafetyIcon />, value: 'family_safety' },
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
        borderRadius: 28,
        borderWidth: 2,
        borderColor: C.primary,
        padding: 20,
        gap: 12,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
        overflow: 'hidden',
      }}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      {/* Multi-Select Info Pill */}
      <View
        style={{
          alignSelf: 'center',
          backgroundColor: C.primaryLight,
          borderColor: C.primary + '30',
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 4,
          marginBottom: 6,
        }}
      >
        <Text style={{ color: C.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          💡 Select as many as you want
        </Text>
      </View>

      {options.map((opt, idx) => {
        const isSelected = selected.includes(opt.value);
        return (
          <AnimatedListItem key={opt.value} index={idx}>
          <TouchableOpacity
            key={opt.value}
            onPress={() => handleToggle(opt.value)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isSelected ? C.primaryLight : C.cardInner,
              borderColor: isSelected ? C.primary : C.cardBorder,
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
                borderColor: isSelected ? C.primary : C.textMuted,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? C.primary : 'transparent',
              }}
            >
              {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
            </View>
          </TouchableOpacity>
          </AnimatedListItem>
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
    { label: 'Every single day', desc: 'Lots of packaged snacks, boxed meals, or canned foods', val: 'daily', color: C.red },
    { label: 'A few times a week', desc: 'Some home cooking mixed with store-bought snacks', val: 'weekly', color: C.primary },
    { label: 'Rarely / Whole foods only', desc: 'Eat fresh and cook almost everything from scratch', val: 'rarely', color: C.green },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 28, borderWidth: 2, borderColor: C.primary, padding: 20, gap: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10, overflow: 'hidden' }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      {options.map((opt, idx) => {
        const isSelected = value === opt.val;
        return (
          <AnimatedListItem key={opt.val} index={idx}>
          <TouchableOpacity
            key={opt.val}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(opt.val);
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: isSelected ? C.primaryLight : C.cardInner,
              borderColor: isSelected ? C.primary : C.cardBorder,
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
          </AnimatedListItem>
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
    { id: 'slumps', label: 'Afternoon energy crashes', icon: <SymptomSlumpIcon /> },
    { id: 'bloating', label: 'Bloating & tummy pain', icon: <SymptomBloatIcon /> },
    { id: 'brainfog', label: 'Hard to focus / brain fog', icon: <SymptomFogIcon /> },
    { id: 'cravings', label: 'Can\'t stop craving sugar', icon: <SymptomCravingIcon /> },
    { id: 'skin', label: 'Skin breakouts or redness', icon: <SymptomFlareIcon /> },
  ];

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: C.primary,
        padding: 20,
        gap: 12,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
        overflow: 'hidden',
      }}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Check the things you want to fix:
      </Text>

      {symptoms.map((s, idx) => {
        const active = selected.includes(s.id);
        return (
          <AnimatedListItem key={s.id} index={idx}>
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
          </AnimatedListItem>
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
        borderRadius: 28,
        borderWidth: 2,
        borderColor: C.red,
        padding: 24,
        gap: 18,
        shadowColor: C.red,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.red, opacity: 0.04 }]} />
      {/* Custom Alert Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.redLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.red + '30' }}>
        <AlertTriangle size={14} color={C.red} />
        <Text style={{ color: C.red, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          WARNING
        </Text>
      </View>

      {/* Massive Graphic Callout */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: C.red, fontSize: 42, fontWeight: '900', letterSpacing: -1.5 }}>73%</Text>
        <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: -2 }}>
          OF STORE FOODS
        </Text>
      </View>

      <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800', textAlign: 'center', lineHeight: 18 }}>
        Are made in factories using cheap ingredients you would never keep in your own kitchen.
      </Text>

      {/* Core Highlights */}
      <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
        {[
          'Harsh ingredients that upset your stomach',
          'Artificial colors that affect kids\' focus & behavior',
          'Fake sugars that confuse your body\'s metabolism',
        ].map((point, idx) => (
          <AnimatedListItem key={idx} index={idx}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.cardInner, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }} />
            <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '600', flex: 1 }}>{point}</Text>
          </View>
          </AnimatedListItem>
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
    { id: 'dyes', label: 'Fake Colors & Dyes', desc: 'Red 40, Yellow 5, Blue 1' },
    { id: 'hfcs', label: 'Cheap Sugars', desc: 'Fake sweeteners & corn syrups' },
    { id: 'emulsifiers', label: 'Stomach Upsetters', desc: 'Thickeners that cause bloating' },
    { id: 'oils', label: 'Greasy Factory Oils', desc: 'Canola, palm, and soybean oils' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 28, borderWidth: 2, borderColor: C.primary, padding: 20, gap: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10, overflow: 'hidden' }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      {additives.map((item, idx) => {
        const active = selected.includes(item.id);
        return (
          <AnimatedListItem key={item.id} index={idx}>
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(item.id);
            }}
            style={{
              backgroundColor: active ? C.primaryLight : C.cardInner,
              borderColor: active ? C.primary : C.cardBorder,
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
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: active ? C.primary : C.textMuted, backgroundColor: active ? C.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {active && <Check size={10} color="#FFF" strokeWidth={3} />}
            </View>
          </TouchableOpacity>
          </AnimatedListItem>
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
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 28, borderWidth: 2, borderColor: C.primary, padding: 22, gap: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10, overflow: 'hidden' }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Choose what you must stay away from:
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {allergens.map((item, idx) => {
          const active = selected.includes(item);
          return (
            <AnimatedListItem key={item} index={idx}>
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
            </AnimatedListItem>
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
    { id: 'curious', title: 'Just curious', desc: 'I want to scan and learn what is inside my food' },
    { id: 'moderate', title: 'Ready for easy swaps', desc: 'I want to replace bad foods with better options' },
    { id: 'committed', title: '100% committed', desc: 'I want to completely cut out processed junk food' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 28, borderWidth: 2, borderColor: C.primary, padding: 20, gap: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10, overflow: 'hidden' }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      {levels.map((lvl, idx) => {
        const active = value === lvl.id;
        return (
          <AnimatedListItem key={lvl.id} index={idx}>
          <TouchableOpacity
            key={lvl.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(lvl.id);
            }}
            style={{
              backgroundColor: active ? C.primaryLight : C.cardInner,
              borderColor: active ? C.primary : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 16,
              padding: 14,
            }}
          >
            <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{lvl.title}</Text>
            <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', marginTop: 2, lineHeight: 14 }}>{lvl.desc}</Text>
          </TouchableOpacity>
          </AnimatedListItem>
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
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 28, borderWidth: 2, borderColor: C.primary, padding: 24, gap: 16, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10, overflow: 'hidden' }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={18} color="#FFCC00" fill="#FFCC00" />
        ))}
      </View>
      <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800', textAlign: 'center', lineHeight: 18 }}>
        "BiteFix warned me about hidden factory chemicals in my favorite protein bar. I found a clean alternative in one second!"
      </Text>
      <Text style={{ color: C.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        — Sarah M., Verified User
      </Text>
      <View style={{ backgroundColor: C.cardInner, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder }}>
        <Text style={{ color: C.textSub, fontSize: 10.5, fontWeight: '800' }}>Powered by the world's largest open food database</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 10: Dynamic Health Analysis Engine (Calculation Loader)
// ─────────────────────────────────────────────────────────
function HealthAnalysisCalculationCard({ cardW, C, onComplete }: { cardW: number; C: any; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('Building your profile...');

  useEffect(() => {
    const t1 = setTimeout(() => { setProgress(35); setStepText('Loading custom ingredient alerts...'); }, 800);
    const t2 = setTimeout(() => { setProgress(70); setStepText('Preparing your clean food swaps...'); }, 1800);
    const t3 = setTimeout(() => { setProgress(100); setStepText('Profile complete. Ready to scan!'); }, 2800);
    const t4 = setTimeout(() => { onComplete(); }, 3500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.primary, padding: 32, gap: 24, alignItems: 'center' }}>
      <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15 }}>
          <Activity size={32} color="#FFF" />
        </View>
      </View>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 0.2 }}>{stepText}</Text>
      <View style={{ width: '100%', height: 6, backgroundColor: C.cardInner, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: `${progress}%`, height: '100%', backgroundColor: C.primary, borderRadius: 3 }} />
      </View>
      <Text style={{ color: C.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{progress}% Loading</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 11: Instant Result Intelligence Preview (6-Point Matrix)
// ─────────────────────────────────────────────────────────
function InstantResultSummaryCard({ cardW, C, isDark }: { cardW: number; C: any; isDark: boolean }) {
  const features = [
    { title: 'Processing Level', desc: 'Is it natural or factory-made?', icon: <Activity size={16} color="#FF9500" /> },
    { title: 'Health Grade', desc: 'Easy A to E safety rating', icon: <Sparkles size={16} color="#34C759" /> },
    { title: 'Gut Shield', desc: 'Warns about stomach irritants', icon: <ShieldAlert size={16} color="#FF3B30" /> },
    { title: 'Color Finder', desc: 'Flags chemicals like Red 40', icon: <Search size={16} color="#AF52DE" /> },
    { title: 'Sugar Alert', desc: 'Tells you sugar in teaspoons', icon: <Zap size={16} color="#FFCC00" /> },
    { title: 'Healthy Swaps', desc: 'Better alternatives in 1 tap', icon: <RefreshCw size={16} color="#007AFF" /> },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 28, borderWidth: 2, borderColor: C.primary, padding: 18, gap: 14, overflow: 'hidden', shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 }}>
      {/* Dynamic Background Glow */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.05 }]} />
      
      <Text style={{ color: C.primary, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 }}>
        Unlocked Scanner Features
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        {features.map((f, i) => {
          return (
            <View key={i} style={[{ width: '48%', backgroundColor: C.cardInner, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.cardBorder, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ padding: 6, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder }}>
                  {f.icon}
                </View>
                <Text style={{ color: C.text, fontSize: 12, fontWeight: '900', flex: 1, lineHeight: 14 }}>{f.title}</Text>
              </View>
              <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '700', lineHeight: 12 }}>{f.desc}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 12: Paywall Transition Summary Card
// ─────────────────────────────────────────────────────────
function PaywallTransitionCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 32, borderWidth: 2, borderColor: C.primary, padding: 24, gap: 16, alignItems: 'center', overflow: 'hidden', shadowColor: C.primary, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 }}>
      {/* Background ambient gradient */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.4 }]} />
      
      <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 }}>
        <ShieldCheck size={50} color={C.primary} strokeWidth={2.5} />
      </View>

      <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, marginTop: 4 }}>
        Your Custom Food Shield is Ready!
      </Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>
        Get unlimited barcode scans, instant chemical warnings, and personalized healthy swaps.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Premium App Store Rating Modal Overlay
// ─────────────────────────────────────────────────────────
interface RatingModalProps {
  C: any;
  isDark: boolean;
  rating: number;
  setRating: (r: number) => void;
  onSubmit: () => void;
  onLater: () => void;
  width: number;
}

function RatingModal({ C, isDark, rating, setRating, onSubmit, onLater, width }: RatingModalProps) {
  const handleStarPress = (r: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRating(r);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 999, paddingHorizontal: 20 }]}>
      <View
        style={[
          {
            width: Math.min(width - 40, 360),
            backgroundColor: C.card,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: C.cardBorder,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 10,
            gap: 16,
          },
        ]}
      >
        {/* Mascot Header */}
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.primary + '40', marginBottom: 4 }}>
          <OrbMascot state="happy" size={80} />
        </View>

        <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
          Enjoying BiteFix?
        </Text>

        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 }}>
          If you love clean food swaps & additive alerts, please take a moment to rate us on the App Store!
        </Text>

        {/* 5-Star Rating Indicators */}
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= rating;
            return (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                style={{
                  width: 42,
                  height: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Star
                  size={36}
                  color={active ? '#FFC107' : C.cardBorder}
                  fill={active ? '#FFC107' : 'transparent'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
          <TouchableOpacity
            onPress={onSubmit}
            activeOpacity={0.88}
            style={{
              width: '100%',
              backgroundColor: C.primary,
              borderRadius: 18,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Submit Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLater}
            activeOpacity={0.7}
            style={{
              width: '100%',
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.textMuted, fontSize: 13, fontWeight: '700' }}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  { step: 1, title: 'Welcome to BiteFix', highlight: 'BiteFix', subtitle: "Let's set up your custom food scanner.", buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 2, title: 'What is your main goal?', highlight: 'main goal?', subtitle: 'We will customize the scanner just for you.', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 3, title: 'Eating Habits Check', highlight: 'Eating Habits', subtitle: 'How often do you eat out or buy packaged food?', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 4, title: 'Any daily struggles?', highlight: 'daily struggles?', subtitle: 'Select any options that you want to fix:', buttonLabel: 'Continue', isLast: false, mascotState: 'shocked' },
  { step: 5, title: 'The Grocery Truth', highlight: 'Grocery Truth', subtitle: 'Most store-bought food is highly factory-made.', buttonLabel: 'I Want to Protect Myself', isLast: false, mascotState: 'shocked' },
  { step: 6, title: 'Things to Avoid', highlight: 'Things to Avoid', subtitle: 'Choose what you want the app to warn you about:', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 7, title: 'Personal Food Alerts', highlight: 'Food Alerts', subtitle: 'Select any ingredients you must stay away from:', buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 8, title: 'How ready are you?', highlight: 'ready are you?', subtitle: 'Choose the pace that feels right for you:', buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 9, title: 'Join 50,000+ Clean Eaters', highlight: '50,000+', subtitle: 'Start scanning groceries with confidence.', buttonLabel: 'Build My Food Shield', isLast: false, mascotState: 'happy' },
  { step: 10, title: 'Creating Your Profile...', highlight: 'Creating', subtitle: 'Customizing your gut safety and swap options.', buttonLabel: 'Analyzing...', isLast: false, mascotState: 'happy' },
  { step: 11, title: 'Your Scanner is Ready!', highlight: 'Scanner is Ready!', subtitle: 'Here is what we will show you on every scan:', buttonLabel: 'Unlock Full Access', isLast: false, mascotState: 'happy' },
  { step: 12, title: 'Start Eating Cleaner', highlight: 'Eating Cleaner', subtitle: 'Say goodbye to chemical junk and hidden ingredients.', buttonLabel: 'Start My Clean Journey', isLast: true, mascotState: 'happy' },
];

function DotIndicator({ active, C }: { active: boolean; C: any }) {
  return (
    <View
      style={{
        height: 5,
        borderRadius: 3,
        width: active ? 18 : 5,
        backgroundColor: active ? C.primary : C.cardBorder,
      }}
    />
  );
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
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const C = {
    bg: colors.background,
    card: colors.surface,
    cardInner: isDark ? '#1F2937' : '#F9FAFB',
    cardBorder: colors.border,
    primary: colors.primary,
    primaryLight: isDark ? 'rgba(52, 211, 153, 0.15)' : colors.primaryLight,
    primaryMid: colors.primaryDark,
    red: '#FB7185',
    redLight: isDark ? 'rgba(251, 113, 133, 0.15)' : '#FFF1F2',
    green: '#10B981',
    greenLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    text: colors.text,
    textSub: colors.textSecondary,
    textMuted: colors.textMuted,
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);

  const hasRequestedCamera = React.useRef(false);

  useEffect(() => {
    if ((currentSlide === 10 || currentSlide === 11) && !hasRequestedCamera.current) {
      if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
        hasRequestedCamera.current = true;
        requestCameraPermission().catch(() => {});
      }
    }
  }, [currentSlide, cameraPermission]);

  // User State
  const [userName, setUserName] = useState('');
  const [userGoals, setUserGoals] = useState<GoalOption[]>([]);
  const [foodSourcing, setFoodSourcing] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [additives, setAdditives] = useState<string[]>([]);
  const [commitment, setCommitment] = useState('');

  const handleNext = async () => {
    if (currentSlide === 0 && !userName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
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
      setShowRatingModal(true);
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    if (currentSlide === 1 && userGoals.length === 0) return true;
    if (currentSlide === 2 && !foodSourcing) return true;
    if (currentSlide === 3 && symptoms.length === 0) return true;
    if (currentSlide === 5 && additives.length === 0) return true;
    if (currentSlide === 6 && allergenFilters.length === 0) return true;
    if (currentSlide === 7 && !commitment) return true;
    return false;
  };

  const slide = SLIDES[currentSlide] || SLIDES[0];
  const isShort = height < 700;
  const orbSize = Math.min(Math.round(width * 0.38), 150);
  const cardW = Math.min(width - 32, 380);

  const renderTitle = () => {
    const textSlide = SLIDES[currentSlide] || SLIDES[0];
    const parts = textSlide.title.split(textSlide.highlight);
    return (
      <Text style={{ color: C.text, fontSize: isShort ? 22 : 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
        {parts[0]}
        {textSlide.highlight ? <Text style={{ color: C.primary }}>{textSlide.highlight}</Text> : null}
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
            <View>
              <OrbMascot state={slide.mascotState} size={orbSize} />
            </View>
            <MascotShadow size={orbSize} />

            <View style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
              {renderTitle()}
              <Text style={{ color: C.textSub, fontSize: isShort ? 13.5 : 15.5, fontWeight: '600', textAlign: 'center' }}>
                {SLIDES[currentSlide].subtitle}
              </Text>
            </View>
          </View>

          {/* Card Component Slot */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={{ width: '100%', alignItems: 'center' }}>
              {currentSlide === 0 && <NameCard cardW={cardW} C={C} value={userName} onChange={setUserName} />}
              {currentSlide === 1 && <GoalCard cardW={cardW} C={C} selected={userGoals} onSelect={setUserGoals} />}
              {currentSlide === 2 && <FoodSourcingCard cardW={cardW} C={C} value={foodSourcing} onSelect={setFoodSourcing} />}
              {currentSlide === 3 && <SymptomAuditCard cardW={cardW} C={C} selected={symptoms} onToggle={toggleSymptom} />}
              {currentSlide === 4 && <NovaWakeUpCard cardW={cardW} C={C} />}
              {currentSlide === 5 && <AdditivePrioritiesCard cardW={cardW} C={C} selected={additives} onToggle={toggleAdditive} />}
              {currentSlide === 6 && <AllergenDefenseCard cardW={cardW} C={C} selected={allergenFilters} onToggle={toggleAllergenFilter} />}
              {currentSlide === 7 && <CommitmentLevelCard cardW={cardW} C={C} value={commitment} onSelect={setCommitment} />}
              {currentSlide === 8 && <SocialProofCard cardW={cardW} C={C} />}
              {currentSlide === 9 && <HealthAnalysisCalculationCard cardW={cardW} C={C} onComplete={() => setCurrentSlide(10)} />}
              {currentSlide === 10 && <InstantResultSummaryCard cardW={cardW} C={C} isDark={isDark} />}
              {currentSlide === 11 && <PaywallTransitionCard cardW={cardW} C={C} />}
            </View>
          </View>
        </ScrollView>

        {/* Pinned Bottom Bar */}
        {currentSlide !== 9 && (
          <View style={{ gap: 12, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              {SLIDES.map((_, idx) => (
                <DotIndicator key={idx} active={currentSlide === idx} C={C} />
              ))}
            </View>

            <View style={{ width: '100%', opacity: isNextDisabled() ? 0.5 : 1 }}>
              <TouchableOpacity
                onPress={handleNext}
                disabled={isNextDisabled()}
                activeOpacity={0.9}
                style={{
                  width: '100%',
                  backgroundColor: C.primary,
                  borderRadius: 22,
                  paddingVertical: isShort ? 15 : 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  elevation: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 }}>
                  {slide.buttonLabel}
                </Text>
                {slide.isLast ? <Check size={18} color="#FFF" strokeWidth={3} /> : <ArrowRight size={18} color="#FFF" strokeWidth={3} />}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* App Store Rating Modal Overlay */}
      {showRatingModal && (
        <RatingModal
          C={C}
          isDark={isDark}
          rating={rating}
          setRating={setRating}
          onSubmit={() => {
            setShowRatingModal(false);
            router.replace(user ? '/paywall' : '/auth');
          }}
          onLater={() => {
            setShowRatingModal(false);
            router.replace(user ? '/paywall' : '/auth');
          }}
          width={width}
        />
      )}
    </KeyboardAvoidingView>
  );
}
