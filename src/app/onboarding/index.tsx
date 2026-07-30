import React, { useState, useEffect, useMemo, memo } from 'react';
import { Text } from '@/components/Text';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
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
  Image,
  AccessibilityInfo,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Camera, useCameraPermissions } from 'expo-camera';
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
  FadeInRight,
  FadeOutLeft,
  FadeInDown,
  interpolate,
  interpolateColor,
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
  ShoppingCart,
  ArrowRightLeft,
  XCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  ArrowDown,
  Apple,
  CircleAlert,
  Droplets,
  Layers3,
  ScanLine,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Defs, RadialGradient as SvgRadialGradient, Stop, LinearGradient as SvgLinearGradient, Rect, Line, G } from 'react-native-svg';

// ─────────────────────────────────────────────────────────
// Color Palette (Strict Light Mode Mint / Obsidian-V3 translation)
// No purple allowed! Mint #9CFFDD + Deep Mint #00C288 + Gold #F5A623 + Red #EF4444
// ─────────────────────────────────────────────────────────
const MINT = '#9BE55A';
const MINT_DARK = '#76B738';
const MINT_LIGHT = '#F0FCE6';
const MINT_BG = '#F0FCE6';
const GOLD = '#F5A623';
const RED = '#EF4444';
const BLUE = '#00B0FF';
const DARK_TEXT = '#0A1A14';
const SUB_TEXT = '#3D5A4E';

// ─────────────────────────────────────────────────────────
// Custom Claymorphic SVGs & Decorative Elements
// ─────────────────────────────────────────────────────────

// Mascot Shadow Component
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

// Cute Clay Apple Icon SVG
function ClayAppleSvg({ size = 44 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#F0FCE6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#76B738', shadowColor: '#76B738', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 }}>
      <Apple size={size * 0.55} color="#76B738" strokeWidth={2.5} />
    </View>
  );
}

// Cute Clay Shopping Basket SVG
function ClayBasketSvg({ size = 44 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FEF3E4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F5A623', shadowColor: '#F5A623', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 }}>
      <ShoppingCart size={size * 0.55} color="#F5A623" strokeWidth={2.5} />
    </View>
  );
}

// Barcode Scan Reticle SVG
function BarcodeReticleSvg({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Path d="M4 12 V6 A2 2 0 0 1 6 4 H12" stroke="#00C288" strokeWidth="3" strokeLinecap="round" />
      <Path d="M32 4 H38 A2 2 0 0 1 40 6 V12" stroke="#00C288" strokeWidth="3" strokeLinecap="round" />
      <Path d="M4 32 V38 A2 2 0 0 0 6 40 H12" stroke="#00C288" strokeWidth="3" strokeLinecap="round" />
      <Path d="M32 40 H38 A2 2 0 0 0 40 38 V32" stroke="#00C288" strokeWidth="3" strokeLinecap="round" />
      <Line x1="10" y1="14" x2="10" y2="30" stroke="#0A1A14" strokeWidth="2" />
      <Line x1="15" y1="14" x2="15" y2="30" stroke="#0A1A14" strokeWidth="3" />
      <Line x1="21" y1="14" x2="21" y2="30" stroke="#0A1A14" strokeWidth="1.5" />
      <Line x1="26" y1="14" x2="26" y2="30" stroke="#0A1A14" strokeWidth="3.5" />
      <Line x1="32" y1="14" x2="32" y2="30" stroke="#0A1A14" strokeWidth="2" />
      <Line x1="4" y1="22" x2="40" y2="22" stroke="#00C288" strokeWidth="1.5" opacity="0.85" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────
// UI FEATURE COMPONENTS (SPEEDOMETER, NOVA, NUTRI-SCORE, ADDITIVES, GUT SHIELD)
// ─────────────────────────────────────────────────────────

// 1. ANALOG SPEEDOMETER COMPONENT FOR HEALTH SCORE
function AnalogSpeedometer({ score = 92, size = 110 }: { score?: number; size?: number }) {
  // Angle range: -120 deg to +120 deg
  const angle = -120 + (score / 100) * 240;
  const needleAnim = useSharedValue(-120);

  useEffect(() => {
    needleAnim.value = withSpring(angle, { damping: 14, stiffness: 90 });
  }, [score]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needleAnim.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size * 0.75, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgLinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#EF4444" />
            <Stop offset="45%" stopColor="#F5A623" />
            <Stop offset="100%" stopColor="#00C288" />
          </SvgLinearGradient>
        </Defs>
        {/* Gauge Background Track */}
        <Path
          d="M 15 75 A 40 40 0 1 1 85 75"
          fill="none"
          stroke="#E8EDE9"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Active Gradient Arc */}
        <Path
          d="M 15 75 A 40 40 0 1 1 85 75"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Scale Ticks */}
        <Circle cx="50" cy="50" r="3" fill="#0A1A14" />
      </Svg>

      {/* Animated Needle Indicator */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: size * 0.42,
            width: size * 0.36,
            height: 4,
            backgroundColor: '#0A1A14',
            borderRadius: 2,
            transformOrigin: 'left center',
            left: size * 0.5,
          },
          needleStyle,
        ]}
      />

      {/* Score Digital Readout */}
      <View style={{ position: 'absolute', bottom: -2, alignItems: 'center' }}>
        <Text style={{ color: '#0A1A14', fontSize: 16, fontWeight: '900' }}>{score}</Text>
        <Text style={{ color: '#00C288', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>EXCELLENT</Text>
      </View>
    </View>
  );
}

// 2. NOVA SCORE CARD COMPONENT
function NovaScoreCard({ group = 4 }: { group?: number }) {
  const isNova4 = group === 4;
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: isNova4 ? '#EF4444' : '#E8EDE9', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ paddingHorizontal: 10, height: 34, borderRadius: 17, backgroundColor: isNova4 ? '#FEF2F2' : '#E6FFFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: isNova4 ? '#EF4444' : '#00C288' }}>
        <Text numberOfLines={1} style={{ color: isNova4 ? '#EF4444' : '#00C288', fontSize: 13, fontWeight: '900' }}>NOVA {group}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: '#0A1A14', fontSize: 12, fontWeight: '800' }}>
            {isNova4 ? 'Ultra-Processed Food' : 'Unprocessed / Minimal'}
          </Text>
          {isNova4 && <AlertTriangle size={12} color="#EF4444" />}
        </View>
        <Text style={{ color: '#3D5A4E', fontSize: 10, fontWeight: '600', marginTop: 1 }}>
          {isNova4 ? 'Factory formulations with chemical additives' : 'Whole natural food ingredients'}
        </Text>
      </View>
    </View>
  );
}

// 3. NUTRI-SCORE CARD COMPONENT
function NutriScoreCard({ grade = 'A' }: { grade?: 'A' | 'B' | 'C' | 'D' | 'E' }) {
  const grades = [
    { key: 'A', color: '#00C288' },
    { key: 'B', color: '#84CC16' },
    { key: 'C', color: '#F5A623' },
    { key: 'D', color: '#F97316' },
    { key: 'E', color: '#EF4444' },
  ];

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#E8EDE9', gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#0A1A14', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nutri-Score Rating</Text>
        <View style={{ backgroundColor: '#E6FFFA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: '#00C288', fontSize: 9, fontWeight: '900' }}>GRADE {grade}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', height: 22, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        {grades.map((g) => {
          const active = g.key === grade;
          return (
            <View
              key={g.key}
              style={{
                flex: active ? 1.6 : 1,
                backgroundColor: g.color,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: active ? 1 : 0.45,
                transform: active ? [{ scaleY: 1.1 }] : [],
                borderRadius: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: active ? 12 : 10, fontWeight: '900' }}>{g.key}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// 4. ADDITIVES HAZARD CARD COMPONENT
function AdditivesHazardCard({ tags = ['Red 40 (E129)', 'Palm Oil', 'Polysorbate 80'] }: { tags?: string[] }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#E8EDE9', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ShieldAlert size={16} color="#EF4444" />
        <Text style={{ color: '#0A1A14', fontSize: 11.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hazardous Additive Defense</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((t, idx) => (
          <View key={idx} style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444' }} />
            <Text style={{ color: '#EF4444', fontSize: 10.5, fontWeight: '800' }}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// 5. GUT SHIELD CARD COMPONENT
function GutShieldCard({ status = 'ACTIVE' }: { status?: string }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#00C288', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#00C288', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#E6FFFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#9CFFDD' }}>
        <ShieldCheck size={22} color="#00C288" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#0A1A14', fontSize: 13, fontWeight: '900' }}>Personal Gut Shield</Text>
          <View style={{ backgroundColor: '#9CFFDD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: '#0A1A14', fontSize: 8.5, fontWeight: '900' }}>{status}</Text>
          </View>
        </View>
        <Text style={{ color: '#3D5A4E', fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>
          Filters stomach irritants, artificial dyes & inflammatory oils in real-time.
        </Text>
      </View>
    </View>
  );
}

// 6. STICKY NOTE CARD WRAPPER (Claymorphism 3D Style)
function StickyNoteCard({ children, style, tilt = 0 }: { children: React.ReactNode; style?: any; tilt?: number }) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          borderWidth: 1.5,
          borderColor: '#E8EDE9',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.07,
          shadowRadius: 16,
          elevation: 4,
          transform: tilt ? [{ rotate: `${tilt}deg` }] : [],
        },
        style,
      ]}
    >
      {/* Sticky Tape Bar Accent */}
      <View style={{ position: 'absolute', top: -6, alignSelf: 'center', width: 44, height: 8, backgroundColor: '#9CFFDD', borderRadius: 4, opacity: 0.7 }} />
      {children}
    </View>
  );
}

// Animated List Item
function AnimatedListItem({ children, index, style, animate = true }: { children: React.ReactNode; index: number; style?: any; animate?: boolean }) {
  if (!animate) return <View style={style}>{children}</View>;
  return (
    <Animated.View entering={FadeInDown.delay(index * 110).springify().damping(16).stiffness(120)} style={style}>
      {children}
    </Animated.View>
  );
}

// Standard Neomorphic / Claymorphism Helper
const getClayStyle = (active: boolean, C: any) => ({
  backgroundColor: '#FFFFFF',
  borderColor: active ? C.primaryDark : C.cardBorder,
  borderWidth: active ? 2 : 1.5,
  borderRadius: 18,
  shadowColor: active ? C.primaryDark : '#0F172A',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: active ? 0.12 : 0.05,
  shadowRadius: 12,
  elevation: 3,
});

// ─────────────────────────────────────────────────────────
// STEP 1: Name Personalization Card
// ─────────────────────────────────────────────────────────
function NameCard({ cardW, C, value, onChange }: { cardW: number; C: any; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 20 }}>
      <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
        Personal Account Profile
      </Text>
      <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10 }, getClayStyle(value.trim().length > 0, C)]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Enter your first name"
          placeholderTextColor={C.textMuted}
          style={{ flex: 1, color: C.text, fontSize: 16, fontWeight: '700' }}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={20}
        />
      </View>
      <StickyNoteCard tilt={-1}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Sparkles size={20} color={C.primaryDark} />
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 17 }}>
            {value.trim() ? `Welcome, ${value.trim()}! Ready to fix your food?` : 'Type your name above to personalize your scanner!'}
          </Text>
        </View>
      </StickyNoteCard>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2: On-The-Go Eating Frequency
// ─────────────────────────────────────────────────────────
function FoodSourcingCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const options = [
    { label: 'Every single day', desc: 'Lots of packaged snacks, boxed meals, or fast food', val: 'daily' },
    { label: 'A few times a week', desc: 'Some home cooking mixed with store-bought snacks', val: 'weekly' },
    { label: 'Rarely', desc: 'Eat fresh and cook almost everything from scratch', val: 'rarely' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 12 }}>
      {options.map((opt, idx) => {
        const isSelected = value === opt.val;
        return (
          <AnimatedListItem key={opt.val} index={idx}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.val);
              }}
              activeOpacity={0.85}
              style={[{ padding: 16, gap: 4 }, getClayStyle(isSelected, C)]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>{opt.label}</Text>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isSelected ? C.primaryDark : C.textMuted, backgroundColor: isSelected ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected && <Check size={13} color="#FFF" strokeWidth={3} />}
                </View>
              </View>
              <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', lineHeight: 16 }}>{opt.desc}</Text>
            </TouchableOpacity>
          </AnimatedListItem>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 3: Grocery Shopping Frequency
// ─────────────────────────────────────────────────────────
function GrocerySourcingCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const options = [
    { label: 'Daily', desc: 'Pick up fresh items and ingredients every day', val: 'daily' },
    { label: 'A few times a week', desc: 'Regular planned trips to restock the pantry', val: 'weekly' },
    { label: 'Rarely / Monthly bulk', desc: 'Big bulk shopping trips rarely', val: 'rarely' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 12 }}>
      <AnimatedListItem index={0}>
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <ClayBasketSvg size={44} />
        </View>
      </AnimatedListItem>
      {options.map((opt, idx) => {
        const isSelected = value === opt.val;
        return (
          <AnimatedListItem key={opt.val} index={idx + 1}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.val);
              }}
              activeOpacity={0.85}
              style={[{ padding: 16, gap: 4 }, getClayStyle(isSelected, C)]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>{opt.label}</Text>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isSelected ? C.primaryDark : C.textMuted, backgroundColor: isSelected ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected && <Check size={13} color="#FFF" strokeWidth={3} />}
                </View>
              </View>
              <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', lineHeight: 16 }}>{opt.desc}</Text>
            </TouchableOpacity>
          </AnimatedListItem>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 4: Primary Health Goal Card (Multi-Select)
// ─────────────────────────────────────────────────────────
type GoalOption = 'energy' | 'gut_microbiome' | 'weight_management' | 'maintain_health';

function GoalCard({ cardW, C, selected, onSelect }: { cardW: number; C: any; selected: GoalOption[]; onSelect: (vals: GoalOption[]) => void }) {
  const options: { label: string; tag: string; icon: React.ReactNode; value: GoalOption }[] = [
    { label: 'Feel more energized', tag: 'Avoid foods that cause afternoon slumps', icon: <Flame size={20} color="#FF6D00" />, value: 'energy' },
    { label: 'Better digestion', tag: 'Stay away from gut-irritating additives', icon: <Activity size={20} color="#00C288" />, value: 'gut_microbiome' },
    { label: 'Manage weight easily', tag: 'Flag hidden sugars and cheap syrups', icon: <Layers size={20} color="#F5A623" />, value: 'weight_management' },
    { label: 'Maintain Health', tag: 'Keep artificial colors out of your kitchen', icon: <ShieldCheck size={20} color="#EF4444" />, value: 'maintain_health' },
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
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 12 }}>
      <AnimatedListItem index={0}>
        <View style={{ alignSelf: 'center', backgroundColor: '#E6FFFA', borderColor: C.cardBorder, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 4 }}>
          <Text style={{ color: C.primaryDark, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Select as many as you want
          </Text>
        </View>
      </AnimatedListItem>

      {options.map((opt, idx) => {
        const isSelected = selected.includes(opt.value);
        return (
          <AnimatedListItem key={opt.value} index={idx + 1}>
            <TouchableOpacity
              onPress={() => handleToggle(opt.value)}
              activeOpacity={0.85}
              style={[{ paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, getClayStyle(isSelected, C)]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                  {opt.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{opt.label}</Text>
                  <Text style={{ color: C.textMuted, fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>{opt.tag}</Text>
                </View>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isSelected ? C.primaryDark : C.textMuted, backgroundColor: isSelected ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {isSelected && <Check size={13} color="#FFF" strokeWidth={3} />}
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
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 14, alignItems: 'center' }}>
      <AnimatedListItem index={0}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: C.red, fontSize: 48, fontWeight: '900', letterSpacing: -1.5 }}>73%</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: -4 }}>
            OF STORE FOODS ARE NOVA 4
          </Text>
        </View>
      </AnimatedListItem>



      <AnimatedListItem index={2}>
        <StickyNoteCard tilt={1}>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>
            Factory formulations use cheap synthetic ingredients you would never keep in your own home kitchen.
          </Text>
        </StickyNoteCard>
      </AnimatedListItem>

      <View style={{ width: '100%', gap: 8, marginTop: 2 }}>
        {[
          'Harsh emulsifiers that disrupt stomach lining',
          'Synthetic dyes affecting focus & health',
          'Refined sweeteners tricking metabolism',
        ].map((point, idx) => (
          <AnimatedListItem key={idx} index={idx + 3}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder }}>
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
// STEP 6: Category Smart Swap Demo
// ─────────────────────────────────────────────────────────


/**
 * BiteFix Onboarding — Step 06: Category Smart Swap Demo
 *
 * DESIGN INTENT
 * A proof-of-value interaction, not a marketing comparison. The user actively
 * scans/reveals a like-for-like alternative and sees what materially changed.
 * Colour supports meaning but icons + labels carry every status for accessibility.
 *
 * CONTENT ACCURACY
 * - NOVA 1 excludes products with added oil or salt. A simple potato chip is
 *   generally a processed food (NOVA 3), not automatically NOVA 1.
 * - Nutri-Score measures nutrient composition, not processing level. Do not show
 *   a Nutri-Score unless it is calculated from the exact product nutrition label.
 *
 * References:
 * https://nupens.fsp.usp.br/en/food-classification-nova/
 * https://www.santepubliquefrance.fr/media/files/02-determinants-de-sante/
 * nutrition-et-activite-physique/nutri-score/q-a-en
 */

export type SwapDemoTheme = {
  text?: string;
  textSub?: string;
  background?: string;
  card?: string;
  border?: string;
  isDark?: boolean;
};

export type ChipSwapDemoCardProps = {
  cardW: number;
  C?: SwapDemoTheme;
  reduceMotion?: boolean;
  onSwapComplete?: () => void;
};

const T = {
  ink: '#101418',
  inkMuted: '#5F6872',
  porcelain: '#F6F7F8',
  white: '#FFFFFF',
  obsidian: '#0B0D0F',
  obsidianCard: '#14171A',
  obsidianLine: '#2A2E33',
  mint: '#00C98B',
  mintDark: '#087B59',
  mintWash: '#EAFBF5',
  danger: '#D74652',
  dangerWash: '#FFF5F5',
  amber: '#B96C12',
  gold: '#D8B65C',
} as const;

const BEFORE = {
  eyebrow: 'CURRENT PICK',
  title: 'Flavoured potato chips',
  subtitle: 'Longer formula · multiple cosmetic additives',
  processing: 'NOVA 4',
  processingLabel: 'Ultra-processed',
  ingredients: '12 ingredients',
  oil: 'Palm oil',
  flags: ['Added colour', 'Flavour enhancer', 'Emulsifier'],
};

const AFTER = {
  eyebrow: 'SMARTER SWAP',
  title: 'Sea-salt olive oil chips',
  subtitle: 'Same category · simpler ingredient list',
  processing: 'NOVA 3',
  processingLabel: 'Processed',
  ingredients: '3 ingredients',
  oil: 'Olive oil',
  flags: ['No colour found', 'No emulsifier found'],
};

function ChipSwapDemoCardComponent({
  cardW,
  C = {},
  reduceMotion: reduceMotionProp,
  onSwapComplete,
}: ChipSwapDemoCardProps) {
  const [revealed, setRevealed] = useState(true);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const progress = useSharedValue(1);
  const press = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  const reduceMotion = reduceMotionProp ?? systemReduceMotion;
  const dark = Boolean(C.isDark);

  const color = useMemo(() => ({
    page: C.background ?? (dark ? T.obsidian : T.porcelain),
    card: C.card ?? (dark ? T.obsidianCard : T.white),
    text: C.text ?? (dark ? '#F2F5F4' : T.ink),
    sub: C.textSub ?? (dark ? '#9BA3AA' : T.inkMuted),
    line: C.border ?? (dark ? T.obsidianLine : '#E1E5E8'),
    soft: dark ? '#101315' : '#F1F3F4',
    mintWash: dark ? 'rgba(0,201,139,0.08)' : T.mintWash,
    dangerWash: dark ? 'rgba(215,70,82,0.08)' : T.dangerWash,
  }), [C, dark]);

  const revealSwap = () => {
    if (revealed) return;
    setRevealed(true);
    progress.value = withTiming(1, {
      duration: reduceMotion ? 1 : 620,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }, finished => {
      if (finished && onSwapComplete) runOnJS(onSwapComplete)();
    });
  };

  const beforeStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ scale: 1 }],
  }));

  const afterStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [
      { translateY: 0 },
      { scale: 1 },
    ],
    borderColor: T.mint,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.86, 1], [0, 1, 1, 0]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-104, 108]) }],
  }));

  return (
    <View
      style={[styles.root, { width: cardW }]}
      accessibilityLabel="Comparison between ultra-processed chips and simpler olive-oil chips"
    >


      {/* One visual stage: the products feel connected, not like two unrelated cards. */}
      <View style={[styles.stage, { backgroundColor: color.soft, borderColor: color.line }]}>
        <View style={styles.stageRule} />

        <Animated.View
          style={[
            styles.productCard,
            {
              backgroundColor: color.card,
              borderColor: revealed ? color.line : dark ? '#503036' : '#EBC8CB',
            },
            beforeStyle,
          ]}
        >
          <View style={styles.productTopline}>
            <View>
              <Text style={[styles.eyebrow, { color: color.sub }]}>{BEFORE.eyebrow}</Text>
              <Text style={[styles.productTitle, { color: color.text }]}>{BEFORE.title}</Text>
            </View>
            <View style={[styles.novaBadge, { backgroundColor: color.dangerWash, borderColor: dark ? '#5D3238' : '#F0C8CB' }]}>
              <CircleAlert size={13} color={T.danger} strokeWidth={2.2} />
              <View>
                <Text style={[styles.novaValue, { color: T.danger }]}>{BEFORE.processing}</Text>
                <Text style={[styles.novaLabel, { color: color.sub }]}>{BEFORE.processingLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.productSubtitle, { color: color.sub }]}>{BEFORE.subtitle}</Text>

          <View style={styles.productBody}>
            <View style={[styles.imageStage, { backgroundColor: dark ? '#0D0F11' : '#F7F7F5', borderColor: color.line }]}>
              <ExpoImage
                source={require('../../../assets/images/ultra_chips.png')}
                style={styles.productImage}
                contentFit="contain"
                transition={reduceMotion ? 0 : 180}
                priority="high"
                cachePolicy="memory-disk"
                accessibilityLabel="Pack of flavoured potato chips"
              />
            </View>
            <View style={styles.factColumn}>
              <FactRow icon="layers" label="Formula" value={BEFORE.ingredients} color={color} tone="danger" />
              <FactRow icon="oil" label="Cooking oil" value={BEFORE.oil} color={color} />
            </View>
          </View>

          <View style={styles.flagRow}>
            {BEFORE.flags.map(flag => (
              <View key={flag} style={[styles.flag, { borderColor: color.line }]}>
                <X size={10} color={T.danger} strokeWidth={2.7} />
                <Text style={[styles.flagText, { color: color.sub }]}>{flag}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* The connector is a static "Swapped" badge */}
        <View style={styles.actionWrap}>
          <View style={[styles.action, { backgroundColor: '#0F172A', borderColor: T.mint, borderWidth: 1.5 }]}>
            <View style={[styles.actionIcon, { backgroundColor: T.mint }]}>
              <ArrowDown size={14} color="#0F172A" strokeWidth={3} />
            </View>
            <Text style={[styles.actionText, { color: T.mint }]}>Swapped</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.productCard,
            {
              backgroundColor: color.card,
              borderColor: color.line,
            },
            afterStyle,
          ]}
        >
          <View style={styles.productTopline}>
            <View style={styles.flexOne}>
              <Text style={[styles.eyebrow, { color: revealed ? T.mintDark : color.sub }]}>{AFTER.eyebrow}</Text>
              <Text style={[styles.productTitle, { color: color.text }]}>{AFTER.title}</Text>
            </View>
            <View style={[styles.novaBadge, { backgroundColor: color.mintWash, borderColor: revealed ? T.mint : color.line }]}>
              <Check size={13} color={T.mintDark} strokeWidth={2.7} />
              <View>
                <Text style={[styles.novaValue, { color: dark ? '#89E6C5' : T.mintDark }]}>{AFTER.processing}</Text>
                <Text style={[styles.novaLabel, { color: color.sub }]}>{AFTER.processingLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.productSubtitle, { color: color.sub }]}>{AFTER.subtitle}</Text>

          <View style={styles.productBody}>
            <View style={[styles.imageStage, { backgroundColor: dark ? '#0D0F11' : '#F7F7F5', borderColor: color.line }]}>
              <ExpoImage
                source={require('../../../assets/images/artisan_swaps.png')}
                style={styles.productImage}
                contentFit="contain"
                transition={reduceMotion ? 0 : 180}
                priority="high"
                cachePolicy="memory-disk"
                accessibilityLabel="Pack of sea-salt olive-oil potato chips"
              />
              <Animated.View pointerEvents="none" style={[styles.scanBeam, scanStyle]} />
            </View>
            <View style={styles.factColumn}>
              <FactRow icon="layers" label="Formula" value={AFTER.ingredients} color={color} tone="clean" />
              <FactRow icon="oil" label="Cooking oil" value={AFTER.oil} color={color} />
            </View>
          </View>

          <View style={styles.flagRow}>
            {AFTER.flags.map(flag => (
              <View key={flag} style={[styles.flag, { borderColor: revealed ? '#A7DFC9' : color.line }]}>
                <Check size={10} color={T.mintDark} strokeWidth={2.7} />
                <Text style={[styles.flagText, { color: color.sub }]}>{flag}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>



      <Text style={[styles.disclosure, { color: color.sub }]}>Demo comparison. Classification and flags must be calculated from each product’s actual label data.</Text>
    </View>
  );
}

type FactColor = {
  text: string;
  sub: string;
  line: string;
  soft: string;
};

function FactRow({
  icon,
  label,
  value,
  color,
  tone,
}: {
  icon: 'layers' | 'oil';
  label: string;
  value: string;
  color: FactColor;
  tone?: 'clean' | 'danger';
}) {
  const Icon = icon === 'oil' ? Droplets : Layers3;
  const accent = tone === 'clean' ? T.mintDark : tone === 'danger' ? T.danger : color.sub;

  return (
    <View style={styles.factRow}>
      <View style={[styles.factIcon, { backgroundColor: color.soft }]}>
        <Icon size={13} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.flexOne}>
        <Text style={[styles.factLabel, { color: color.sub }]}>{label}</Text>
        <Text style={[styles.factValue, { color: color.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export const ChipSwapDemoCard = memo(ChipSwapDemoCardComponent);
ChipSwapDemoCard.displayName = 'ChipSwapDemoCard';

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    gap: 16,
  },
  header: {
    gap: 8,
    paddingHorizontal: 2,
  },
  kicker: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.15,
  },
  heading: {
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -1.05,
  },
  intro: {
    maxWidth: 350,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  stage: {
    position: 'relative',
    gap: 0,
    borderWidth: 1,
    borderRadius: 28,
    padding: 10,
    overflow: 'hidden',
  },
  stageRule: {
    position: 'absolute',
    top: 26,
    bottom: 26,
    left: 25,
    width: 1,
    backgroundColor: 'rgba(95,104,114,0.14)',
  },
  productCard: {
    width: '100%',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#080A0C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  productTopline: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrow: {
    marginBottom: 3,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.25,
  },
  productTitle: {
    maxWidth: 190,
    fontSize: 16.5,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  productSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  novaBadge: {
    minWidth: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  novaValue: {
    fontSize: 10.5,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 0.35,
  },
  novaLabel: {
    marginTop: 1,
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: '600',
  },
  productBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageStage: {
    width: 96,
    height: 92,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 15,
  },
  productImage: {
    width: 84,
    height: 84,
  },
  scanBeam: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: T.mint,
    shadowColor: T.mint,
    shadowOpacity: 0.75,
    shadowRadius: 7,
    elevation: 4,
  },
  factColumn: {
    flex: 1,
    gap: 9,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factIcon: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  factLabel: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
  },
  factValue: {
    marginTop: 1,
    fontSize: 11.5,
    lineHeight: 14,
    fontWeight: '700',
  },
  flagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  flag: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  flagText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  actionWrap: {
    zIndex: 5,
    alignSelf: 'center',
    marginVertical: -7,
  },
  action: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 7,
  },
  actionIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  actionText: {
    color: '#F4F7F6',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.85,
  },
  payoff: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 13,
  },
  payoffIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  payoffTitle: {
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: -0.18,
  },
  payoffBody: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  disclosure: {
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '500',
  },
  flexOne: {
    flex: 1,
  },
});


// ─────────────────────────────────────────────────────────
// STEP 7: Protecting Loved Ones
// ─────────────────────────────────────────────────────────
function ProtectLovedOnesCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 16 }}>
      <AnimatedListItem index={0}>
        <GutShieldCard status="FAMILY SHIELD" />
      </AnimatedListItem>

      <AnimatedListItem index={1}>
        <StickyNoteCard tilt={1}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <ClayAppleSvg size={42} />
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '900', textAlign: 'center', lineHeight: 22 }}>
              Scan before you buy.
            </Text>
            <Text style={{ color: C.textSub, fontSize: 13.5, fontWeight: '600', textAlign: 'center', lineHeight: 20 }}>
              Protect your loved ones from harmful additives and chemicals by analyzing every product's Barcode in seconds.
            </Text>
          </View>
        </StickyNoteCard>
      </AnimatedListItem>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 8: Symptom Audit
// ─────────────────────────────────────────────────────────
function SymptomAuditCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (s: string) => void }) {
  const symptoms = [
    { id: 'slumps', label: 'Afternoon energy crashes', icon: <Zap size={18} color="#F5A623" /> },
    { id: 'bloating', label: 'Bloating & tummy pain', icon: <AlertTriangle size={18} color="#EF4444" /> },
    { id: 'brainfog', label: 'Hard to focus / brain fog', icon: <Search size={18} color="#00C288" /> },
    { id: 'cravings', label: 'Can\'t stop craving sugar', icon: <Heart size={18} color="#00B0FF" /> },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 12 }}>
      {symptoms.map((s, idx) => {
        const active = selected.includes(s.id);
        return (
          <AnimatedListItem key={s.id} index={idx}>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(s.id); }} activeOpacity={0.85} style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }, getClayStyle(active, C)]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </View>
                <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800', flex: 1 }}>{s.label}</Text>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: active ? C.primaryDark : C.textMuted, backgroundColor: active ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {active && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          </AnimatedListItem>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 9: Additive Priorities Card
// ─────────────────────────────────────────────────────────
function AdditivePrioritiesCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const additives = [
    { id: 'dyes', label: 'Fake Colors & Dyes', desc: 'Red 40, Yellow 5, Blue 1' },
    { id: 'hfcs', label: 'Cheap Sugars', desc: 'Fake sweeteners & corn syrups' },
    { id: 'emulsifiers', label: 'Stomach Upsetters', desc: 'Thickeners that cause bloating' },
    { id: 'oils', label: 'Greasy Factory Oils', desc: 'Canola, palm, and soybean oils' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 12 }}>
      <AnimatedListItem index={0}>
        <AdditivesHazardCard tags={['Red 40 (E129)', 'E466 Emulsifiers', 'Palm Oil']} />
      </AnimatedListItem>

      {additives.map((item, idx) => {
        const active = selected.includes(item.id);
        return (
          <AnimatedListItem key={item.id} index={idx + 1}>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(item.id); }} style={[{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, getClayStyle(active, C)]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800' }}>{item.label}</Text>
                <Text style={{ color: C.textMuted, fontSize: 10.5, fontWeight: '600' }}>{item.desc}</Text>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: active ? C.primaryDark : C.textMuted, backgroundColor: active ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {active && <Check size={13} color="#FFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          </AnimatedListItem>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 10: Personal Allergen Defense Card
// ─────────────────────────────────────────────────────────
function AllergenDefenseCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const allergens = ['Gluten', 'Dairy', 'Soy', 'Nuts', 'Eggs', 'Palm Oil'];

  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 16 }}>
      <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Choose what you must stay away from:
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {allergens.map((item, idx) => {
          const active = selected.includes(item);
          return (
            <AnimatedListItem key={item} index={idx}>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(item); }} style={[{ paddingHorizontal: 18, paddingVertical: 12 }, getClayStyle(active, C)]}>
                <Text style={{ color: C.text, fontSize: 13.5, fontWeight: active ? '900' : '700' }}>
                  {item}
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
// STEP 11: Healthy Basket Intro Card
// ─────────────────────────────────────────────────────────
function HealthyBasketIntroCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 16 }}>
      <AnimatedListItem index={0}>
        <StickyNoteCard tilt={-1}>
          <View style={{ alignItems: 'center', gap: 14, paddingVertical: 8 }}>
            <ClayBasketSvg size={54} />
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
              Build Your Personal Healthy Basket
            </Text>
            <Text style={{ color: C.textSub, fontSize: 13.5, fontWeight: '600', textAlign: 'center', lineHeight: 21 }}>
              Save scanned and swapped food products to build your Personal Healthy Basket. Your Grocery Cart becomes a Healthy Cart with each clean choice!
            </Text>
          </View>
        </StickyNoteCard>
      </AnimatedListItem>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 12: Dynamic Health Analysis Engine (Calculation Loader)
// ─────────────────────────────────────────────────────────
function HealthAnalysisCalculationCard({ cardW, C, onComplete }: { cardW: number; C: any; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState([
    { label: 'Mapping Additive Defense & Shield...', status: 'loading' },
    { label: 'Indexing Category Swap Database...', status: 'pending' },
    { label: 'Building Personal Healthy Basket Engine...', status: 'pending' },
  ]);

  useEffect(() => {
    // 6-second minimum timer
    const t1 = setTimeout(() => {
      setProgress(35);
      setPhases([
        { label: 'Mapping Additive Defense & Shield...', status: 'done' },
        { label: 'Indexing Category Swap Database...', status: 'loading' },
        { label: 'Building Personal Healthy Basket Engine...', status: 'pending' },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 2000);

    const t2 = setTimeout(() => {
      setProgress(70);
      setPhases([
        { label: 'Mapping Additive Defense & Shield...', status: 'done' },
        { label: 'Indexing Category Swap Database...', status: 'done' },
        { label: 'Building Personal Healthy Basket Engine...', status: 'loading' },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 4000);

    const t3 = setTimeout(() => {
      setProgress(100);
      setPhases([
        { label: 'Mapping Additive Defense & Shield...', status: 'done' },
        { label: 'Indexing Category Swap Database...', status: 'done' },
        { label: 'Building Personal Healthy Basket Engine...', status: 'done' },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 5500);

    const t4 = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 22, alignItems: 'center' }}>
      <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: MINT, opacity: 0.25, transform: [{ scale: 1.15 }] }} />
        <Svg width="120" height="120" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="44" stroke="#E8EDE9" strokeWidth="6" fill="transparent" />
          <Circle cx="50" cy="50" r="44" stroke={MINT_DARK} strokeWidth="6" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} strokeLinecap="round" transform="rotate(-90 50 50)" />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>{progress}%</Text>
          <Text style={{ color: C.textSub, fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>Analyzing</Text>
        </View>
      </View>

      <View style={{ width: '100%', gap: 10 }}>
        {phases.map((p, i) => {
          const isDone = p.status === 'done';
          const isLoading = p.status === 'loading';
          return (
            <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, opacity: p.status === 'pending' ? 0.4 : 1 }, getClayStyle(isDone, C)]}>
              {isDone ? (
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: MINT_DARK, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={13} color="#FFF" strokeWidth={3.5} />
                </View>
              ) : isLoading ? (
                <ActivityIndicator size="small" color={MINT_DARK} />
              ) : (
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.textMuted }} />
              )}
              <Text style={{ color: isDone ? C.text : C.textSub, fontSize: 12.5, fontWeight: '700', flex: 1, lineHeight: 16 }}>
                {p.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 13: Instant Result Intelligence Preview (6 Feature Sticky Notes Matrix)
// ─────────────────────────────────────────────────────────
function InstantResultSummaryCard({ cardW, C }: { cardW: number; C: any }) {
  const features = [
    { id: '1', title: 'Health Score', desc: 'Analog speedometer for instant rating', icon: <Activity size={22} color={MINT_DARK} />, bg: MINT_LIGHT, border: MINT },
    { id: '2', title: 'NOVA Scale', desc: 'Processing level detection (1 to 4)', icon: <Layers size={22} color="#F5A623" />, bg: '#FEF3E4', border: '#FDE68A' },
    { id: '3', title: 'Nutri-Score', desc: 'European nutrition grades (A to E)', icon: <Heart size={22} color="#00C288" />, bg: '#E6FFFA', border: '#99F6E4' },
    { id: '4', title: 'Additive Alerts', desc: 'Detects harmful dyes & emulsifiers', icon: <AlertTriangle size={22} color="#EF4444" />, bg: '#FEF2F2', border: '#FECACA' },
    { id: '5', title: 'Gut Shield', desc: 'Checks for bloating & microbiome damage', icon: <ShieldCheck size={22} color="#8B5CF6" />, bg: '#F3E8FF', border: '#DDD6FE' },
    { id: '6', title: 'Smart Swaps', desc: 'Recommends cleaner alternatives instantly', icon: <ArrowRightLeft size={22} color="#3B82F6" />, bg: '#EFF6FF', border: '#BFDBFE' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: 'transparent', padding: 0, gap: 14 }}>
      <Text style={{ color: MINT_DARK, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 }}>
        6 Unlocked Features Per Scan
      </Text>

      <View style={{ gap: 10 }}>
        {features.map((f, i) => (
          <AnimatedListItem key={f.id} index={i}>
            <View style={[{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }, getClayStyle(false, C)]}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.bg, borderWidth: 1, borderColor: f.border, alignItems: 'center', justifyContent: 'center' }}>
                {f.icon}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: '900' }}>{f.title}</Text>
                <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600' }}>{f.desc}</Text>
              </View>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} color={C.textMuted} strokeWidth={3} />
              </View>
            </View>
          </AnimatedListItem>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 14: Paywall Transition Summary Card
// ─────────────────────────────────────────────────────────
function PaywallTransitionCard({ cardW, C }: { cardW: number; C: any }) {
  const { allergenFilters } = useAppStore();

  return (
    <View style={[{ width: cardW, padding: 20, gap: 18, alignItems: 'center' }, getClayStyle(true, C)]}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E6FFFA', borderWidth: 2, borderColor: MINT_DARK, alignItems: 'center', justifyContent: 'center' }}>
        <ShieldCheck size={44} color={MINT_DARK} strokeWidth={2.5} />
      </View>
      <View style={{ gap: 4, alignItems: 'center' }}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
          Your Food Shield is Configured!
        </Text>
        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 }}>
          BiteFix has generated your personal food scanner:
        </Text>
      </View>
      <View style={{ width: '100%', backgroundColor: C.surfaceRaised, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 12, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: MINT_DARK }} />
          <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '800' }}>NOVA 4 & Additive Filters Active</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: MINT_DARK }} />
          <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '800' }}>{allergenFilters.length > 0 ? `${allergenFilters.length} Allergen Shields Configured` : 'Allergen Defense Enabled'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: MINT_DARK }} />
          <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '800' }}>Analog Speedometer & Nutri-Score Matrix Ready</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDES DATA CONFIGURATION (14 STEPS)
// ─────────────────────────────────────────────────────────
interface SlideData {
  step: number;
  title: string;
  highlight: string;
  subtitle: string;
  buttonLabel: string;
  isLast: boolean;
}

const SLIDES: SlideData[] = [
  { step: 1, title: 'Welcome to BiteFix', highlight: 'BiteFix', subtitle: "Let's set up your custom food scanner.", buttonLabel: 'Continue', isLast: false },
  { step: 2, title: 'On-The-Go Habits', highlight: 'On-The-Go', subtitle: 'How often do you eat packaged food outdoors / on the go?', buttonLabel: 'Continue', isLast: false },
  { step: 3, title: 'Grocery Shopping', highlight: 'Grocery Shopping', subtitle: 'How often do you go grocery shopping?', buttonLabel: 'Continue', isLast: false },
  { step: 4, title: 'What is your main goal?', highlight: 'main goal?', subtitle: 'We will customize the scanner just for you.', buttonLabel: 'Continue', isLast: false },
  { step: 5, title: 'The Grocery Truth', highlight: 'Grocery Truth', subtitle: 'Most store-bought food is highly factory-made.', buttonLabel: 'I Want to Protect Myself', isLast: false },
  { step: 6, title: 'Smart', highlight: 'Healthy Alternatives.', subtitle: 'A simple swap can find you Healthy Options.', buttonLabel: 'Show Me More', isLast: false },
  { step: 7, title: 'Protect Loved Ones', highlight: 'Loved Ones', subtitle: 'Safeguard your family from harmful ingredients.', buttonLabel: 'Continue', isLast: false },
  { step: 8, title: 'Any daily struggles?', highlight: 'daily struggles?', subtitle: 'Select any options that you want to fix:', buttonLabel: 'Continue', isLast: false },
  { step: 9, title: 'Things to Avoid', highlight: 'Things to Avoid', subtitle: 'Choose what you want the app to warn you about:', buttonLabel: 'Continue', isLast: false },
  { step: 10, title: 'Personal Food Alerts', highlight: 'Food Alerts', subtitle: 'Select any ingredients you must stay away from:', buttonLabel: 'Continue', isLast: false },
  { step: 11, title: 'Your Healthy Basket', highlight: 'Healthy Basket', subtitle: 'Turn every grocery trip into a clean shopping cart.', buttonLabel: 'Build My Basket', isLast: false },
  { step: 12, title: 'Creating Your Profile...', highlight: 'Creating', subtitle: 'Customizing your gut safety and swap options.', buttonLabel: 'Analyzing...', isLast: false },
  { step: 13, title: 'Your Scanner is Ready!', highlight: 'Scanner is Ready!', subtitle: 'Here is what we will show you on every scan:', buttonLabel: 'Unlock Full Access', isLast: false },
  { step: 14, title: 'Start Eating Cleaner', highlight: 'Eating Cleaner', subtitle: 'Say goodbye to chemical junk and hidden ingredients.', buttonLabel: 'Start My Clean Journey', isLast: true },
];

function DotIndicator({ active, C }: { active: boolean; C: any }) {
  const dotAnimStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? 18 : 6, { damping: 15, stiffness: 150 }),
    backgroundColor: withTiming(active ? C.primaryDark : C.cardBorder, { duration: 200 }),
  }), [active, C]);

  return <Animated.View style={[{ height: 6, borderRadius: 3 }, dotAnimStyle]} />;
}

// ─────────────────────────────────────────────────────────
// MAIN ONBOARDING SCREEN COMPONENT
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  // Preload key image assets for instant rendering
  useEffect(() => {
    try {
      Asset.loadAsync([
        require('../../../assets/images/ultra_chips.png'),
        require('../../../assets/images/artisan_swaps.png'),
      ]);
    } catch (e) { }
  }, []);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { setProfile, setOnboardingComplete, toggleAllergenFilter, allergenFilters } = useAppStore();
  const { user } = useAuthStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const C = {
    bg: colors.background,
    card: '#FFFFFF',
    cardInner: '#FFFFFF',
    surfaceRaised: '#F1F3F5',
    cardBorder: '#E8EDE9',
    primary: MINT,
    primaryDark: MINT_DARK,
    red: RED,
    text: DARK_TEXT,
    textSub: SUB_TEXT,
    textMuted: '#6E8A7E',
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  const hasRequestedCamera = React.useRef(false);

  useEffect(() => {
    if ((currentSlide === 11 || currentSlide === 12) && !hasRequestedCamera.current) {
      if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
        hasRequestedCamera.current = true;
        requestCameraPermission().catch(() => { });
      }
    }
  }, [currentSlide, cameraPermission]);

  // User State
  const [userName, setUserName] = useState('');
  const [foodSourcingOnTheGo, setFoodSourcingOnTheGo] = useState('');
  const [foodSourcingGrocery, setFoodSourcingGrocery] = useState('');
  const [userGoals, setUserGoals] = useState<GoalOption[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [additives, setAdditives] = useState<string[]>([]);

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
            userGoals[0] === 'maintain_health' ? 'ultra_processed' : 'none';

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
    if (currentSlide === 1 && !foodSourcingOnTheGo) return true;
    if (currentSlide === 2 && !foodSourcingGrocery) return true;
    if (currentSlide === 3 && userGoals.length === 0) return true;
    if (currentSlide === 7 && symptoms.length === 0) return true;
    if (currentSlide === 8 && additives.length === 0) return true;
    if (currentSlide === 9 && allergenFilters.length === 0) return true;
    return false;
  };

  const slide = SLIDES[currentSlide] || SLIDES[0];
  const isShort = height < 700;
  const orbSize = Math.min(Math.round(width * 0.36), 140);
  const cardW = Math.min(width - 32, 380);

  const renderTitle = () => {
    const textSlide = SLIDES[currentSlide] || SLIDES[0];
    const parts = textSlide.title.split(textSlide.highlight);
    return (
      <Text style={{ color: C.text, fontSize: isShort ? 22 : 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
        {parts[0]}
        {textSlide.highlight ? <Text style={{ color: C.primaryDark }}>{textSlide.highlight}</Text> : null}
        {parts[1] || ''}
      </Text>
    );
  };

  const toggleSymptom = (id: string) => setSymptoms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAdditive = (id: string) => setAdditives((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MagicalBackground />
      <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, paddingHorizontal: 16 }}>
        {/* Pinned Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40, marginBottom: 4 }}>
          <View />
          {currentSlide > 0 && currentSlide !== 11 && (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentSlide((s) => s - 1); }} style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder }}>
              <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '800' }}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Middle Content Section */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={{ alignItems: 'center', gap: 2, marginBottom: isShort ? 8 : 16 }}>
            {/* Show Mascot ONLY on slide 0 */}
            {currentSlide === 0 && (
              <Animated.View entering={FadeInDown}>
                <OrbMascot state="happy" size={orbSize} />
                <MascotShadow size={orbSize} />
              </Animated.View>
            )}

            <Animated.View key={`text-${currentSlide}`} entering={FadeInRight.duration(250)} style={{ alignItems: 'center', gap: 4, marginTop: currentSlide === 0 ? 8 : 0 }}>
              {renderTitle()}
              <Text style={{ color: C.textSub, fontSize: isShort ? 13 : 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 10 }}>
                {SLIDES[currentSlide].subtitle}
              </Text>
            </Animated.View>
          </View>

          {/* Card Component Slot */}
          <View style={{ width: '100%', alignItems: 'center', marginTop: isShort ? 6 : 14 }}>
            <Animated.View key={`card-${currentSlide}`} entering={FadeInRight.duration(250)} style={{ width: '100%', alignItems: 'center' }}>
              {currentSlide === 0 && <NameCard cardW={cardW} C={C} value={userName} onChange={setUserName} />}
              {currentSlide === 1 && <FoodSourcingCard cardW={cardW} C={C} value={foodSourcingOnTheGo} onSelect={setFoodSourcingOnTheGo} />}
              {currentSlide === 2 && <GrocerySourcingCard cardW={cardW} C={C} value={foodSourcingGrocery} onSelect={setFoodSourcingGrocery} />}
              {currentSlide === 3 && <GoalCard cardW={cardW} C={C} selected={userGoals} onSelect={setUserGoals} />}
              {currentSlide === 4 && <NovaWakeUpCard cardW={cardW} C={C} />}
              {currentSlide === 5 && <ChipSwapDemoCard cardW={cardW} C={C} />}
              {currentSlide === 6 && <ProtectLovedOnesCard cardW={cardW} C={C} />}
              {currentSlide === 7 && <SymptomAuditCard cardW={cardW} C={C} selected={symptoms} onToggle={toggleSymptom} />}
              {currentSlide === 8 && <AdditivePrioritiesCard cardW={cardW} C={C} selected={additives} onToggle={toggleAdditive} />}
              {currentSlide === 9 && <AllergenDefenseCard cardW={cardW} C={C} selected={allergenFilters} onToggle={toggleAllergenFilter} />}
              {currentSlide === 10 && <HealthyBasketIntroCard cardW={cardW} C={C} />}
              {currentSlide === 11 && <HealthAnalysisCalculationCard cardW={cardW} C={C} onComplete={() => setCurrentSlide(12)} />}
              {currentSlide === 12 && <InstantResultSummaryCard cardW={cardW} C={C} />}
              {currentSlide === 13 && <PaywallTransitionCard cardW={cardW} C={C} />}
            </Animated.View>
          </View>
        </ScrollView>

        {/* Pinned Bottom Bar */}
        {currentSlide !== 11 && (
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
                  backgroundColor: MINT_DARK,
                  borderRadius: 22,
                  paddingVertical: isShort ? 15 : 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  shadowColor: MINT_DARK,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
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
    </KeyboardAvoidingView>
  );
}
