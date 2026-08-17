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
  AccessibilityInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot, MascotState } from '../../components/features/OrbMascot';
import {
  ArrowRight,
  Check,
  Search,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Layers,
  Heart,
  Flame,
  ShoppingCart,
  ArrowDown,
  Apple,
  CircleAlert,
  Droplets,
  Layers3,
  X,
  Award,
  Shield,
  CheckCircle,
  Info,
  Globe,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, {
  Circle,
  Path,
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
  Rect,
  Line,
} from 'react-native-svg';

// ─────────────────────────────────────────────────────────
// Color Palette (Luxury Mint / Gold / Obsidian)
// ─────────────────────────────────────────────────────────
const MINT = '#00E5A0';
const MINT_DARK = '#008F67';
const GOLD = '#D8B65C';
const RED = '#D84C5B';
const DARK_TEXT = '#101418';
const SUB_TEXT = '#626B74';

// ─────────────────────────────────────────────────────────
// Custom Drawing Board & Luxury Decor Elements
// ─────────────────────────────────────────────────────────

function DrawingBoardTape() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -9,
        alignSelf: 'center',
        width: 68,
        height: 16,
        backgroundColor: 'rgba(216, 182, 92, 0.42)',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: 'rgba(216, 182, 92, 0.65)',
        transform: [{ rotate: '-1.8deg' }],
        zIndex: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      }}
    />
  );
}

function LuxuryBackdrop({ C }: { C: any }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgRadialGradient id="ambientMint" cx="88%" cy="5%" rx="75%" ry="50%">
            <Stop offset="0%" stopColor={MINT} stopOpacity={C.isDark ? 0.12 : 0.08} />
            <Stop offset="60%" stopColor={MINT} stopOpacity="0.015" />
            <Stop offset="100%" stopColor={MINT} stopOpacity="0" />
          </SvgRadialGradient>
          <SvgRadialGradient id="ambientGold" cx="5%" cy="95%" rx="60%" ry="45%">
            <Stop offset="0%" stopColor={GOLD} stopOpacity={C.isDark ? 0.08 : 0.05} />
            <Stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={C.bg} />
        <Rect width="100%" height="100%" fill="url(#ambientMint)" />
        <Rect width="100%" height="100%" fill="url(#ambientGold)" />
      </Svg>
    </View>
  );
}

function FullWidthPillCTA({
  label,
  disabled,
  isLast,
  compact,
  onPress,
}: {
  label: string;
  disabled: boolean;
  isLast: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const sweep = useSharedValue(-1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    cancelAnimation(sweep);
    sweep.value = -1;
    if (disabled || reduceMotion) return;
    sweep.value = withRepeat(
      withSequence(
        withDelay(1200, withTiming(1, { duration: 1300, easing: Easing.bezier(0.4, 0, 0.6, 1) })),
        withTiming(-1, { duration: 1 }),
        withDelay(1800, withTiming(-1, { duration: 1 }))
      ),
      -1,
      false
    );
    return () => cancelAnimation(sweep);
  }, [disabled, reduceMotion]);

  const shellStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweep.value, [-1, 1], [-180, 420]) }, { skewX: '-18deg' }],
  }));

  const bgBtn = disabled
    ? '#2D3748'
    : isLast
      ? '#D8B65C'
      : '#0A361F';

  const textBtn = disabled
    ? '#A0AEC0'
    : '#FFFFFF';

  const iconBg = disabled
    ? 'rgba(160, 174, 192, 0.15)'
    : 'rgba(255, 255, 255, 0.22)';

  const iconColor = disabled
    ? '#A0AEC0'
    : '#FFFFFF';

  const borderColor = disabled
    ? '#4A5568'
    : isLast
      ? '#EAD084'
      : '#0A361F';

  return (
    <Animated.View style={[{ width: '100%', alignSelf: 'stretch' }, shellStyle]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={() => {
          if (disabled) return;
          scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
        }}
        onPressOut={() => {
          if (disabled) return;
          scale.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        style={{
          width: '100%',
          height: compact ? 52 : 56,
          borderRadius: 28,
          overflow: 'hidden' as const,
          backgroundColor: bgBtn,
          borderWidth: 1.5,
          borderColor: borderColor,
          shadowColor: bgBtn,
          shadowOffset: { width: 0, height: disabled ? 2 : 8 },
          shadowOpacity: disabled ? 0.05 : 0.35,
          shadowRadius: disabled ? 4 : 16,
          elevation: disabled ? 1 : 7,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          paddingHorizontal: 22,
          gap: 12,
        }}
      >
        {!disabled && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 2, right: 2, top: 1, height: 1.5, backgroundColor: '#FFFFFF', opacity: 0.3 }} />
        )}
        {!disabled && (
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -16, bottom: -16, width: 64, backgroundColor: '#FFFFFF', opacity: 0.2 }, sweepStyle]} />
        )}
        <Text style={{ color: textBtn, fontSize: 16, fontWeight: '900', letterSpacing: -0.2 }}>{label}</Text>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
          {isLast ? <Check size={16} color={iconColor} strokeWidth={3} /> : <ArrowRight size={16} color={iconColor} strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function HeadlineHighlight({ title, highlight, C }: { title: string; highlight: string; C: any }) {
  if (!highlight) {
    return (
      <Text style={{ color: C.text, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.8 }}>
        {title}
      </Text>
    );
  }
  const parts = title.split(highlight);
  return (
    <Text style={{ color: C.text, fontSize: 25, lineHeight: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -0.7 }}>
      {parts[0]}
      <Text style={{ color: C.text, fontWeight: '900', fontStyle: 'italic' }}>
        {highlight}
      </Text>
      {parts[1] || ''}
    </Text>
  );
}

function MascotDrawingBoardHeader({
  state = 'idle',
  speech = 'Scanning for cleaner options...',
  C,
  isDark,
}: {
  state?: MascotState;
  speech?: string;
  C: any;
  isDark: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', marginVertical: 10, width: '100%' }}>
      <View
        style={{
          width: '100%',
          maxWidth: 380,
          backgroundColor: C.card,
          borderWidth: 1.5,
          borderColor: C.cardBorder,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 14,
          alignItems: 'center',
          flexDirection: 'row',
          gap: 14,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          elevation: 4,
        }}
      >
        <DrawingBoardTape />
        <View style={{ width: 130, height: 130, justifyContent: 'center', alignItems: 'center' }}>
          <OrbMascot
            state={state}
            size={110}
            theme={isDark ? 'obsidian' : 'porcelain'}
            showShadow={false}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: C.primaryDark, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase' }}>
              BiteFix Mascot
            </Text>
          </View>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18 }}>
            {speech}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Clay Accessories
function ClayAppleSvg({ size = 44 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Defs>
          {/* Background Gradient */}
          <SvgLinearGradient id="appleBgGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#EAFBF5" />
            <Stop offset="100%" stopColor="#C8F3E4" />
          </SvgLinearGradient>
          {/* Apple Body Gradient (Premium Shiny Green) */}
          <SvgLinearGradient id="appleBodyGrad" x1="0.2" y1="0" x2="0.8" y2="1">
            <Stop offset="0%" stopColor="#00E5A0" />
            <Stop offset="100%" stopColor="#008F67" />
          </SvgLinearGradient>
          {/* Leaf Gradient (Luxury Gold Accent) */}
          <SvgLinearGradient id="appleLeafGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#D8B65C" />
            <Stop offset="100%" stopColor="#A6842A" />
          </SvgLinearGradient>
        </Defs>

        {/* Glossy Outer Ring and Glow */}
        <Circle cx="22" cy="22" r="20" fill="url(#appleBgGrad)" stroke="#00C98B" strokeWidth={1.5} />

        {/* Custom High-end Apple Logo */}
        <Path
          d="M16.5 14.5c-2.5 0-4.5 1.8-4.5 4.8 0 4.8 4.2 10.2 7.6 10.2.8 0 1.2-.4 2.1-.4s1.3.4 2.1.4c3.4 0 7.6-5.4 7.6-10.2 0-3-2-4.8-4.5-4.8-2.5 0-3.8 1.8-4.9 1.8-1.1 0-2.5-1.8-5.4-1.8z"
          fill="url(#appleBodyGrad)"
        />
        <Path
          d="M22.5 13.5c1.8-2.5 5.2-3.7 5.2-3.7s-.8 3.3-3.3 5c-1.3 1-2.5.8-2.5.8s.2-1.2.6-2.1z"
          fill="url(#appleLeafGrad)"
        />
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// UI FEATURE COMPONENTS
// ─────────────────────────────────────────────────────────

function AdditivesHazardCard({ tags = ['Red 40 (E129)', 'Palm Oil', 'Polysorbate 80'] }: { tags?: string[] }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E1E5E8', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ShieldAlert size={16} color="#EF4444" />
        <Text style={{ color: '#101418', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Additive Watchlist
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((t, idx) => (
          <View key={idx} style={{ backgroundColor: '#FFF5F5', borderColor: '#EFC9CD', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D84C5B' }} />
            <Text style={{ color: '#D84C5B', fontSize: 10.5, fontWeight: '800' }}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GutShieldCard({ status = 'ACTIVE' }: { status?: string }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#00C288', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#00C288', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAFBF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A1F3D5' }}>
        <ShieldCheck size={24} color="#00C288" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#101418', fontSize: 15.5, fontWeight: '900' }}>Personal Ingredient Watch</Text>
          <View style={{ backgroundColor: '#A1F3D5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: '#101418', fontSize: 9.5, fontWeight: '900' }}>{status}</Text>
          </View>
        </View>
        <Text style={{ color: '#626B74', fontSize: 12.5, lineHeight: 16, fontWeight: '600', marginTop: 3 }}>
          Checks selected additives, colours and oils against your personal watchlist.
        </Text>
      </View>
    </View>
  );
}

function HouseholdCoverageCard() {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#00C288', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#00C288', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAFBF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A1F3D5' }}>
        <ClayAppleSvg size={30} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#101418', fontSize: 15.5, fontWeight: '900' }}>Household Coverage</Text>
          <View style={{ backgroundColor: '#A1F3D5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: '#101418', fontSize: 9.5, fontWeight: '900' }}>ACTIVE</Text>
          </View>
        </View>
        <Text style={{ color: '#626B74', fontSize: 12.5, lineHeight: 16, fontWeight: '600', marginTop: 3 }}>
          Filters out food colorings, artificial preservatives, and harsh emulsifiers before they enter your kitchen.
        </Text>
      </View>
    </View>
  );
}

function StickyNoteCard({ children, style, tilt = 0 }: { children: React.ReactNode; style?: any; tilt?: number }) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: 16,
          borderWidth: 1.5,
          borderColor: '#DDE2E5',
          shadowColor: '#080A0C',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
          transform: tilt ? [{ rotate: `${tilt * 0.35}deg` }] : [],
        },
        style,
      ]}
    >
      <DrawingBoardTape />
      {children}
    </View>
  );
}

function AnimatedListItem({ children, index, style }: { children: React.ReactNode; index: number; style?: any }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380).easing(Easing.bezier(0.16, 1, 0.3, 1))} style={style}>
      {children}
    </Animated.View>
  );
}

const getClayStyle = (active: boolean, C: any) => ({
  backgroundColor: C.card,
  borderColor: active ? C.primaryDark : C.cardBorder,
  borderWidth: 1.5,
  borderRadius: 20,
  shadowColor: active ? C.primaryDark : '#080A0C',
  shadowOffset: { width: 0, height: active ? 8 : 5 },
  shadowOpacity: active ? 0.16 : 0.06,
  shadowRadius: active ? 16 : 12,
  elevation: active ? 5 : 2,
});

// ─────────────────────────────────────────────────────────
// STEP 1: Name Personalization Card
// ─────────────────────────────────────────────────────────
function NameCard({ cardW, C, value, onChange }: { cardW: number; C: any; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ width: cardW, gap: 16 }}>
      <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
        Personalize Your BiteFix
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Info size={22} color={C.primaryDark} />
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 18 }}>
            {value.trim() ? `Welcome, ${value.trim()}! Let’s personalize how BiteFix works for you.` : 'Tell us your name to personalize your BiteFix experience.'}
          </Text>
        </View>
      </StickyNoteCard>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 3: Store Label Inspection Routine
// ─────────────────────────────────────────────────────────
function LabelInspectionRoutineCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const options = [
    { label: 'Always — I read the full label', desc: 'I check the ingredient list before buying', val: 'always' },
    { label: 'Sometimes — I scan the important parts', desc: 'I check labels when something catches my attention', val: 'sometimes' },
    { label: 'Rarely — I want a faster way', desc: 'Ingredient lists take too much time to decode', val: 'rarely' },
    { label: 'Never — I usually decide quickly', desc: 'I prefer a quick overview instead of reading every line', val: 'never' },
  ];

  return (
    <View style={{ width: cardW, gap: 10 }}>
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
              style={[{ padding: 14, gap: 3 }, getClayStyle(isSelected, C)]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: C.text, fontSize: 14.5, fontWeight: '800' }}>{opt.label}</Text>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isSelected ? C.primaryDark : C.textMuted, backgroundColor: isSelected ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected && <Check size={13} color="#FFF" strokeWidth={3} />}
                </View>
              </View>
              <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '600', lineHeight: 15 }}>{opt.desc}</Text>
            </TouchableOpacity>
          </AnimatedListItem>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 4: Primary Health Goal Card
// ─────────────────────────────────────────────────────────
type GoalOption = 'energy' | 'gut_microbiome' | 'weight_management' | 'maintain_health';

function GoalCard({ cardW, C, selected, onSelect }: { cardW: number; C: any; selected: GoalOption[]; onSelect: (vals: GoalOption[]) => void }) {
  const options: { label: string; tag: string; icon: React.ReactNode; value: GoalOption }[] = [
    { label: 'Energy', tag: 'Highlight nutrition factors linked to your energy goals', icon: <Flame size={20} color="#FF6D00" />, value: 'energy' },
    { label: 'Digestion', tag: 'Keep an eye on ingredients you choose to limit', icon: <Activity size={20} color="#00C288" />, value: 'gut_microbiome' },
    { label: 'Weight management', tag: 'Highlight sugar and sweetening ingredients', icon: <Layers size={20} color="#F5A623" />, value: 'weight_management' },
    { label: 'Everyday nutrition', tag: 'Spot ingredients you prefer to avoid', icon: <ShieldCheck size={20} color="#EF4444" />, value: 'maintain_health' },
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
    <View style={{ width: cardW, gap: 10 }}>
      {options.map((opt, idx) => {
        const isSelected = selected.includes(opt.value);
        return (
          <AnimatedListItem key={opt.value} index={idx}>
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
                  <Text style={{ color: C.textMuted, fontSize: 10.5, fontWeight: '600', marginTop: 1 }}>{opt.tag}</Text>
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
// STEP 4: Processing Level Wake-Up
// ─────────────────────────────────────────────────────────
function NovaWakeUpCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, gap: 12, alignItems: 'center' }}>
      <AnimatedListItem index={0}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: C.red, fontSize: 34, fontWeight: '900', letterSpacing: -1.2 }}>NOVA 1–4</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: -2 }}>
            PROCESSING LEVEL
          </Text>
        </View>
      </AnimatedListItem>

      <AnimatedListItem index={1}>
        <StickyNoteCard tilt={1}>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>
            Packaged foods can contain processing and ingredient details that are easy to miss when you’re short on time.
          </Text>
        </StickyNoteCard>
      </AnimatedListItem>

      <View style={{ width: '100%', gap: 8 }}>
        {[
          'Emulsifiers',
          'Colours',
          'Sweeteners and syrups',
        ].map((point, idx) => (
          <AnimatedListItem key={idx} index={idx + 2}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }} />
              <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', flex: 1 }}>{point}</Text>
            </View>
          </AnimatedListItem>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SUPPORT: Category Smart Swap Demo Component
// ─────────────────────────────────────────────────────────
export type SwapDemoTheme = {
  text?: string;
  textSub?: string;
  background?: string;
  card?: string;
  border?: string;
  isDark?: boolean;
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
} as const;

function ChipSwapDemoCardComponent({ cardW, C = {} }: { cardW: number; C?: SwapDemoTheme }) {
  const dark = Boolean(C.isDark);
  const color = useMemo(
    () => ({
      page: C.background ?? (dark ? T.obsidian : T.porcelain),
      card: C.card ?? (dark ? T.obsidianCard : T.white),
      text: C.text ?? (dark ? '#F2F5F4' : T.ink),
      sub: C.textSub ?? (dark ? '#9BA3AA' : T.inkMuted),
      line: C.border ?? (dark ? T.obsidianLine : '#E1E5E8'),
      soft: dark ? '#101315' : '#F1F3F4',
      mintWash: dark ? 'rgba(0,201,139,0.08)' : T.mintWash,
      dangerWash: dark ? 'rgba(215,70,82,0.08)' : T.dangerWash,
    }),
    [C, dark]
  );

  return (
    <View style={{ width: cardW, gap: 12 }}>
      <View style={[styles.stage, { backgroundColor: color.soft, borderColor: color.line }]}>
        {/* Before Item */}
        <View style={[styles.productCard, { backgroundColor: color.card, borderColor: dark ? '#5D3238' : '#F0C8CB' }]}>
          <View style={styles.productTopline}>
            <View>
              <Text style={[styles.eyebrow, { color: color.sub }]}>CURRENT PICK</Text>
              <Text style={[styles.productTitle, { color: color.text }]}>Flavoured potato chips</Text>
            </View>
            <View style={[styles.novaBadge, { backgroundColor: color.dangerWash, borderColor: '#F0C8CB' }]}>
              <CircleAlert size={13} color={T.danger} strokeWidth={2.2} />
              <View>
                <Text style={[styles.novaValue, { color: T.danger }]}>NOVA 4</Text>
                <Text style={[styles.novaLabel, { color: color.sub }]}>Ultra-processed</Text>
              </View>
            </View>
          </View>
          <View style={styles.productBody}>
            <View style={[styles.imageStage, { backgroundColor: dark ? '#0D0F11' : '#F7F7F5', borderColor: color.line }]}>
              <ExpoImage source={require('../../../assets/images/ultra_chips.png')} style={styles.productImage} contentFit="contain" priority="high" cachePolicy="memory-disk" />
            </View>
            <View style={styles.factColumn}>
              <FactRow icon="layers" label="Formula" value="12 ingredients" color={color} tone="danger" />
              <FactRow icon="oil" label="Cooking oil" value="Palm oil" color={color} />
            </View>
          </View>
        </View>

        {/* Swap Action Badge */}
        <View style={styles.actionWrap}>
          <View style={[styles.action, { backgroundColor: '#0F172A', borderColor: T.mint, borderWidth: 1.5 }]}>
            <View style={[styles.actionIcon, { backgroundColor: T.mint }]}>
              <ArrowDown size={14} color="#0F172A" strokeWidth={3} />
            </View>
            <Text style={[styles.actionText, { color: T.mint }]}>BiteFix Clean Swap</Text>
          </View>
        </View>

        {/* After Item */}
        <View style={[styles.productCard, { backgroundColor: color.card, borderColor: T.mint }]}>
          <View style={styles.productTopline}>
            <View>
              <Text style={[styles.eyebrow, { color: T.mintDark }]}>SMARTER SWAP</Text>
              <Text style={[styles.productTitle, { color: color.text }]}>Sea-salt olive oil chips</Text>
            </View>
            <View style={[styles.novaBadge, { backgroundColor: color.mintWash, borderColor: T.mint }]}>
              <Check size={13} color={T.mintDark} strokeWidth={2.7} />
              <View>
                <Text style={[styles.novaValue, { color: dark ? '#89E6C5' : T.mintDark }]}>NOVA 3</Text>
                <Text style={[styles.novaLabel, { color: color.sub }]}>Processed</Text>
              </View>
            </View>
          </View>
          <View style={styles.productBody}>
            <View style={[styles.imageStage, { backgroundColor: dark ? '#0D0F11' : '#F7F7F5', borderColor: color.line }]}>
              <ExpoImage source={require('../../../assets/images/artisan_swaps.png')} style={styles.productImage} contentFit="contain" priority="high" cachePolicy="memory-disk" />
            </View>
            <View style={styles.factColumn}>
              <FactRow icon="layers" label="Formula" value="3 ingredients" color={color} tone="clean" />
              <FactRow icon="oil" label="Cooking oil" value="Olive oil" color={color} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function FactRow({ icon, label, value, color, tone }: { icon: 'layers' | 'oil'; label: string; value: string; color: any; tone?: 'clean' | 'danger' }) {
  const Icon = icon === 'oil' ? Droplets : Layers3;
  const accent = tone === 'clean' ? T.mintDark : tone === 'danger' ? T.danger : color.sub;
  return (
    <View style={styles.factRow}>
      <View style={[styles.factIcon, { backgroundColor: color.soft }]}>
        <Icon size={13} color={accent} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.factLabel, { color: color.sub }]}>{label}</Text>
        <Text style={[styles.factValue, { color: color.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export const ChipSwapDemoCard = memo(ChipSwapDemoCardComponent);

// ─────────────────────────────────────────────────────────
// STEP 7: Protecting Loved Ones (REDESIGNED)
// ─────────────────────────────────────────────────────────
function ProtectLovedOnesCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, gap: 14 }}>
      <AnimatedListItem index={0}>
        <GutShieldCard status="FAMILY SHIELD" />
      </AnimatedListItem>

      <AnimatedListItem index={1}>
        <HouseholdCoverageCard />
      </AnimatedListItem>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 5: Ingredient Watchlist
// ─────────────────────────────────────────────────────────
function AdditivePrioritiesCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const additives = [
    { id: 'dyes', label: 'Colours', desc: 'Red 40, Yellow 5, Blue 1' },
    { id: 'hfcs', label: 'Added sugars & sweeteners', desc: 'Sweeteners and syrups' },
    { id: 'emulsifiers', label: 'Emulsifiers', desc: 'Ingredients such as Polysorbate 80' },
    { id: 'oils', label: 'Oils you choose to watch', desc: 'Selected cooking and processing oils' },
  ];

  return (
    <View style={{ width: cardW, gap: 10 }}>
      <AnimatedListItem index={0}>
        <AdditivesHazardCard tags={['Red 40 (E129)', 'E466 Emulsifiers', 'Palm Oil']} />
      </AnimatedListItem>

      {additives.map((item, idx) => {
        const active = selected.includes(item.id);
        return (
          <AnimatedListItem key={item.id} index={idx + 1}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(item.id);
              }}
              style={[{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, getClayStyle(active, C)]}
            >
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
// STEP 6: Personal Ingredient Preferences
// ─────────────────────────────────────────────────────────
function AllergenDefenseCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const items = [
    { id: 'None', label: 'No allergies to flag', icon: <Shield size={18} color="#00C288" /> },
    { id: 'Gluten', label: 'Gluten & Wheat', icon: <Layers size={18} color="#D8B65C" /> },
    { id: 'Dairy', label: 'Dairy & Milk', icon: <Droplets size={18} color="#4D8DE8" /> },
    { id: 'Soy', label: 'Soy', icon: <Layers3 size={18} color="#00C288" /> },
    { id: 'Nuts', label: 'Tree Nuts & Peanuts', icon: <Shield size={18} color="#FF6D00" /> },
    { id: 'Eggs', label: 'Eggs', icon: <CircleAlert size={18} color="#F5A623" /> },
    { id: 'Palm Oil', label: 'Oils', icon: <Droplets size={18} color="#EF4444" /> },
  ];

  return (
    <View style={{ width: cardW, gap: 12 }}>
      <StickyNoteCard tilt={-1}>
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={18} color={MINT_DARK} />
            <Text style={{ color: C.text, fontSize: 14, fontWeight: '900' }}>Ingredient & Allergen Shield</Text>
          </View>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600' }}>
            BiteFix can flag selected allergens and ingredients when they appear in available product data.
          </Text>
        </View>
      </StickyNoteCard>

      <View style={{ gap: 8 }}>
        {items.map((item, idx) => {
          const active = selected.includes(item.id);
          return (
            <AnimatedListItem key={item.id} index={idx}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggle(item.id);
                }}
                activeOpacity={0.85}
                style={[
                  {
                    padding: 10,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  },
                  getClayStyle(active, C),
                ]}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </View>
                <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', flex: 1 }}>{item.label}</Text>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: active ? C.primaryDark : C.textMuted, backgroundColor: active ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {active && <Check size={12} color="#FFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </AnimatedListItem>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 7: Environmental Impact
// ─────────────────────────────────────────────────────────
function EcoQualityFocusCard({ cardW, C }: { cardW: number; C: any }) {
  const points = [
    {
      label: 'CO₂ Impact Tracking',
      desc: 'Shows available carbon-impact information for the product.',
      icon: <Globe size={18} color="#4D8DE8" />,
      tag: 'CARBON'
    },
    {
      label: 'Sourcing Signals',
      desc: 'Highlights available sourcing and certification information.',
      icon: <CheckCircle size={18} color="#00C288" />,
      tag: 'SOURCING'
    },
    {
      label: 'Eco-Packaging Detection',
      desc: 'Highlights available packaging information and recyclability signals.',
      icon: <Layers size={18} color="#D8B65C" />,
      tag: 'PACKAGING'
    },
  ];

  return (
    <View style={{ width: cardW, gap: 12 }}>
      {/* Carbon Footprint & Clean Source mock scanner */}
      <StickyNoteCard tilt={-1}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Environmental Impact
            </Text>
          </View>

          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600' }}>
            Review available carbon, sourcing, and packaging signals when they are provided.
          </Text>

          {/* Liquid Glass Scanner status */}
          <View style={{
            backgroundColor: C.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 16,
            padding: 12,
            borderWidth: 1.5,
            borderColor: C.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)',
            gap: 10
          }}>
            {/* Product Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View>
                  <Text style={{ color: C.text, fontSize: 12.5, fontWeight: '800' }}>Organic Almond Milk</Text>
                  <Text style={{ color: C.textSub, fontSize: 9.5, fontWeight: '500' }}>USDA Certified Organic</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(0, 201, 139, 0.12)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ color: MINT_DARK, fontSize: 9, fontWeight: '900' }}>ECO ESTIMATE</Text>
              </View>
            </View>

            {/* Liquid Glass Score tube */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '700' }}>Carbon Footprint</Text>
                <Text style={{ color: MINT_DARK, fontSize: 10, fontWeight: '900' }}>LOWER CO₂ ESTIMATE</Text>
              </View>

              {/* Glass progress bar */}
              <View style={{
                height: 10,
                borderRadius: 5,
                backgroundColor: C.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                borderColor: C.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Svg width="100%" height="8" style={{ position: 'absolute' }}>
                  <Defs>
                    <SvgLinearGradient id="liquidGrad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0%" stopColor="#00C98B" />
                      <Stop offset="100%" stopColor="#00E5A0" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="37%" height="8" rx="4" fill="url(#liquidGrad)" />
                </Svg>
                <View style={{
                  position: 'absolute',
                  top: 0.5,
                  left: '2%',
                  width: '35%',
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.35)'
                }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 }}>
                <Text style={{ color: C.textMuted, fontSize: 9, fontWeight: '600' }}>0.2kg CO₂e per liter</Text>
                <Text style={{ color: C.textMuted, fontSize: 9, fontWeight: '600' }}>Carbon estimate</Text>
              </View>
            </View>
          </View>
        </View>
      </StickyNoteCard>

      {/* Points list */}
      <View style={{ gap: 8 }}>
        {points.map((pt, idx) => (
          <AnimatedListItem key={pt.label} index={idx}>
            <View
              style={[
                { padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
                getClayStyle(true, C)
              ]}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                {pt.icon}
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '800' }}>{pt.label}</Text>
                  <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                    <Text style={{ color: C.textSub, fontSize: 8, fontWeight: '800' }}>{pt.tag}</Text>
                  </View>
                </View>
                <Text style={{ color: C.textSub, fontSize: 10.5, fontWeight: '500', lineHeight: 14 }}>{pt.desc}</Text>
              </View>
            </View>
          </AnimatedListItem>
        ))}
      </View>
    </View>
  );
}


// ─────────────────────────────────────────────────────────
// STEP 8: Profile Preparation
// ─────────────────────────────────────────────────────────
function HealthAnalysisCalculationCard({ cardW, C, onComplete }: { cardW: number; C: any; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState([
    { label: 'Preparing ingredient and product analysis...', status: 'loading' },
    { label: 'Reviewing available product data...', status: 'pending' },
    { label: 'Preparing your personalized scan view...', status: 'pending' },
  ]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(38);
      setPhases([
        { label: 'Preparing ingredient and product analysis...', status: 'done' },
        { label: 'Reviewing available product data...', status: 'loading' },
        { label: 'Preparing your personalized scan view...', status: 'pending' },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1800);

    const t2 = setTimeout(() => {
      setProgress(74);
      setPhases([
        { label: 'Preparing ingredient and product analysis...', status: 'done' },
        { label: 'Reviewing available product data...', status: 'done' },
        { label: 'Preparing your personalized scan view...', status: 'loading' },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 3600);

    const t3 = setTimeout(() => {
      setProgress(100);
      setPhases([
        { label: 'Preparing ingredient and product analysis...', status: 'done' },
        { label: 'Reviewing available product data...', status: 'done' },
        { label: 'Preparing your personalized scan view...', status: 'done' },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 5000);

    const t4 = setTimeout(() => {
      onComplete();
    }, 5600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <View style={{ width: cardW, gap: 20, alignItems: 'center' }}>
      {/* High End App Logo Header */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#0B0D0F" />
          </View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>BiteFix</Text>
        </View>
        <Text style={{ color: MINT_DARK, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
          Food Data, Decoded
        </Text>
      </View>

      {/* Liquid Glass Loader */}
      <View style={{
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: MINT,
        shadowOpacity: C.isDark ? 0.3 : 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6
      }}>
        {/* Glow behind glass */}
        <View style={{
          position: 'absolute',
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: MINT,
          opacity: 0.15,
          transform: [{ scale: 1.1 + (progress * 0.001) }]
        }} />

        {/* Glass sphere outline/shimmer */}
        <View style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: C.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1.5,
          borderColor: C.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)',
        }} />

        <Svg width="124" height="124" viewBox="0 0 100 100" style={{ position: 'absolute' }}>
          {/* Base Track */}
          <Circle cx="50" cy="50" r="44" stroke={C.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'} strokeWidth="5" fill="transparent" />
          {/* Progress liquid track */}
          <Circle cx="50" cy="50" r="44" stroke={MINT} strokeWidth="5.5" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} strokeLinecap="round" transform="rotate(-90 50 50)" />
        </Svg>

        {/* Liquid highlight / glass reflection */}
        <View style={{
          position: 'absolute',
          top: 18,
          width: 60,
          height: 30,
          borderRadius: 15,
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          transform: [{ scaleX: 1.2 }],
          opacity: C.isDark ? 0.4 : 0.8
        }} />

        {/* Info inside the glass bubble */}
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>{progress}%</Text>
          <Text style={{ color: C.textSub, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>CONFIGURING</Text>
        </View>
      </View>

      <View style={{ width: '100%', gap: 8 }}>
        {phases.map((p, i) => {
          const isDone = p.status === 'done';
          const isLoading = p.status === 'loading';
          return (
            <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10, opacity: p.status === 'pending' ? 0.4 : 1 }, getClayStyle(isDone, C)]}>
              {isDone ? (
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: MINT_DARK, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} color="#FFF" strokeWidth={3.5} />
                </View>
              ) : isLoading ? (
                <ActivityIndicator size="small" color={MINT_DARK} />
              ) : (
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: C.textMuted }} />
              )}
              <Text style={{ color: isDone ? C.text : C.textSub, fontSize: 12, fontWeight: '700', flex: 1 }}>{p.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 9: Instant Result Summary
// ─────────────────────────────────────────────────────────
function InstantResultSummaryCard({ cardW, C }: { cardW: number; C: any }) {
  const features = [
    { id: '1', title: 'BiteFix Intelligence Score™', desc: 'Based on nutrition, sugar, processing, and ingredient signals', icon: <Activity size={20} color={MINT_DARK} /> },
    { id: '2', title: 'NOVA Scale', desc: 'Processing level detection (1 to 4)', icon: <Layers size={20} color="#F5A623" /> },
    { id: '3', title: 'Nutri-Score', desc: 'European nutrition grades (A to E)', icon: <Heart size={20} color="#00C288" /> },
    { id: '4', title: 'Additive Review', desc: 'Highlights identified colours and emulsifiers', icon: <AlertTriangle size={20} color="#EF4444" /> },
    { id: '5', title: 'Ingredient Watch', desc: 'Checks selected ingredients against your watchlist', icon: <ShieldCheck size={20} color={MINT_DARK} /> },
    { id: '6', title: 'Sugar Insights', desc: 'Highlights listed sugars and sweetening ingredients', icon: <Apple size={20} color={MINT_DARK} /> },
    { id: '7', title: 'Carbon Footprint', desc: 'Available CO₂ impact information at a glance', icon: <Globe size={20} color="#4D8DE8" /> },
  ];

  return (
    <View style={{ width: cardW, gap: 10 }}>
      {features.map((f, i) => (
        <AnimatedListItem key={f.id} index={i}>
          <View style={[{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, getClayStyle(false, C)]}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
              {f.icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{f.title}</Text>
              <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600' }}>{f.desc}</Text>
            </View>
            <Check size={16} color={MINT_DARK} strokeWidth={3} />
          </View>
        </AnimatedListItem>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 10: Final Activation Summary
// ─────────────────────────────────────────────────────────
function PaywallTransitionCard({ cardW, C, allergenFilters }: { cardW: number; C: any; allergenFilters: string[] }) {
  return (
    <View style={{ width: cardW, gap: 14 }}>
      <StickyNoteCard tilt={-1}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Award size={22} color={GOLD} />
              <Text style={{ color: C.text, fontSize: 15, fontWeight: '900' }}>Your BiteFix Profile</Text>
            </View>
            <View style={{ backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ color: '#0B0D0F', fontSize: 9.5, fontWeight: '900' }}>READY</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: C.cardBorder }} />

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '700' }}>Ingredient Preferences</Text>
              <Text style={{ color: C.text, fontSize: 12, fontWeight: '900' }}>{allergenFilters.length} Configured</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '700' }}>NOVA Processing View</Text>
              <Text style={{ color: MINT_DARK, fontSize: 12, fontWeight: '900' }}>ACTIVE</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '700' }}>Sugar Insights</Text>
              <Text style={{ color: MINT_DARK, fontSize: 12, fontWeight: '900' }}>READY</Text>
            </View>
          </View>
        </View>
      </StickyNoteCard>

      <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Info size={18} color={MINT_DARK} />
        <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', flex: 1 }}>
          Your preferences are saved and ready for your first scan.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDES DATA CONFIGURATION
// ─────────────────────────────────────────────────────────
interface SlideData {
  step: number;
  title: string;
  highlight: string;
  subtitle: string;
  buttonLabel: string;
  mascotState: MascotState;
  mascotSpeech: string;
  isLast: boolean;
}

const SLIDES: SlideData[] = [
  { step: 0, title: 'Welcome', highlight: '', subtitle: '', buttonLabel: 'Get Started', mascotState: 'idle', mascotSpeech: '', isLast: false },
  { step: 1, title: 'Let’s Make BiteFix Yours', highlight: 'BiteFix Yours', subtitle: 'Tell us your name so we can personalize your BiteFix experience.', buttonLabel: 'Personalize My Scanner', mascotState: 'happy', mascotSpeech: "Hey! I’m your BiteFix scanner mascot.", isLast: false },
  { step: 2, title: 'How Much Label Reading Do You Do?', highlight: 'Label Reading', subtitle: 'Tell us how much time you usually spend decoding ingredient labels while shopping.', buttonLabel: 'Continue', mascotState: 'scanning', mascotSpeech: 'I’ll turn the fine print into a faster overview.', isLast: false },
  { step: 3, title: 'What Matters Most to You?', highlight: 'Matters Most', subtitle: 'Choose what you want BiteFix to emphasize when you scan.', buttonLabel: 'Set My Priority', mascotState: 'happy', mascotSpeech: 'Your priorities guide what I highlight.', isLast: false },
  { step: 4, title: 'There’s More Behind the Front of the Pack', highlight: 'More Behind', subtitle: 'Processing level and ingredient details can be difficult to judge quickly while shopping.', buttonLabel: 'Show Me What I Miss', mascotState: 'caution', mascotSpeech: 'I’ll help you spot processing levels at a glance.', isLast: false },
  { step: 5, title: 'Choose Your Ingredient Watchlist', highlight: 'Ingredient Watchlist', subtitle: 'BiteFix will bring these ingredients into view so you can review them faster.', buttonLabel: 'Activate Watchlist', mascotState: 'caution', mascotSpeech: 'Your ingredient watchlist is ready.', isLast: false },
  { step: 6, title: 'Set Your Ingredient Preferences', highlight: 'Ingredient Preferences', subtitle: 'Choose allergens or ingredients you want BiteFix to flag during scans.', buttonLabel: 'Set My Preferences', mascotState: 'happy', mascotSpeech: 'I’ll keep your selected preferences in view.', isLast: false },
  { step: 7, title: 'See Environmental Signals Too', highlight: 'Environmental Signals', subtitle: 'See environmental signals alongside your food data.', buttonLabel: 'Continue', mascotState: 'happy', mascotSpeech: 'I’ll surface available environmental signals too.', isLast: false },
  { step: 8, title: 'Building Your BiteFix Profile', highlight: 'BiteFix Profile', subtitle: 'Preparing the settings and analysis view for your scanner.', buttonLabel: 'Preparing', mascotState: 'scanning', mascotSpeech: 'Setting up your BiteFix experience...', isLast: false },
  { step: 9, title: 'Your Scan, At a Glance', highlight: 'At a Glance', subtitle: 'Every barcode turns available food data into a clear, easy-to-read snapshot.', buttonLabel: 'View My Scanner', mascotState: 'happy', mascotSpeech: 'Ready to turn product data into useful insights.', isLast: false },
  { step: 10, title: 'Your BiteFix Scanner Is Ready', highlight: 'Scanner Is Ready', subtitle: 'Your preferences are saved. Scan your first product to see BiteFix in action.', buttonLabel: 'Activate BiteFix', mascotState: 'happy', mascotSpeech: 'You’re ready for your first scan.', isLast: true },
];

function DotIndicator({ active, C }: { active: boolean; C: any }) {
  const dotAnimStyle = useAnimatedStyle(
    () => ({
      width: withSpring(active ? 18 : 6, { damping: 15, stiffness: 150 }),
      backgroundColor: withTiming(active ? C.primaryDark : C.cardBorder, { duration: 200 }),
    }),
    [active, C]
  );

  return <Animated.View style={[{ height: 6, borderRadius: 3 }, dotAnimStyle]} />;
}

// ─────────────────────────────────────────────────────────
// Custom SVG Icons for HUD
// ─────────────────────────────────────────────────────────
function ShieldCheckSvg({ size = 16, color = '#00E5A0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m9 11 2 2 4-4" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GlobeSvg({ size = 16, color = '#4D8DE8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2.5} />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={color} strokeWidth={2.5} />
      <Path d="M2 12h20" stroke={color} strokeWidth={2.5} />
    </Svg>
  );
}

function WarningSvg({ size = 16, color = '#D84C5B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function CandySvg({ size = 16, color = '#D8B65C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7l4 3V7l-4 3zM21 7l-4 3V7l4 3z" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={2.5} />
      <Path d="M12 9a3 3 0 0 0-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ButtonArrowSvg({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WelcomeHudBadge({ label, icon: IconComponent, color, style }: { label: string; icon: any; color: string; style: any }) {
  return (
    <View style={[
      {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
      style
    ]}>
      <IconComponent size={14} color={color} />
      <Text style={{ color: '#111827', fontSize: 11.5, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

function WelcomeScreen({ onNext, isShort, insets, isDark }: { onNext: () => void; isShort: boolean; insets: any; isDark: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Background Image */}
      <ExpoImage
        source={require('../../../assets/images/welcome_bg.png')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />

      {/* Content Container */}
      <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}>

        {/* Top: Centralized Premium Status Capsule with Miniature Mascot */}
        <View style={{
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.90)',
          borderColor: 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1.2,
          borderRadius: 22,
          paddingHorizontal: 20,
          paddingVertical: 9,
          gap: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 2,
          marginTop: 6,
        }}>
          {/* Miniature Mascot */}
          <OrbMascot state="idle" size={28} theme={isDark ? 'obsidian' : 'porcelain'} showShadow={false} />

          {/* Centralized Text */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#111827', fontSize: 13, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' }}>
              BiteFix
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 8, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 1 }}>
              Food, decoded.
            </Text>
          </View>
        </View>

        {/* Center Section: App Icon with Glowing Backdrop */}
        <View style={{ width: 320, height: 320, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {/* Beautifully visible connecting dashed vector lines */}
          <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Line x1="160" y1="160" x2="68" y2="40" stroke="rgba(74, 96, 47, 0.35)" strokeWidth="1.8" strokeDasharray="5,5" />
            <Line x1="160" y1="160" x2="252" y2="40" stroke="rgba(74, 96, 47, 0.35)" strokeWidth="1.8" strokeDasharray="5,5" />
            <Line x1="160" y1="160" x2="68" y2="280" stroke="rgba(74, 96, 47, 0.35)" strokeWidth="1.8" strokeDasharray="5,5" />
            <Line x1="160" y1="160" x2="252" y2="280" stroke="rgba(74, 96, 47, 0.35)" strokeWidth="1.8" strokeDasharray="5,5" />
          </Svg>

          {/* Yellow Radial Glow behind App Icon */}
          <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, overflow: 'hidden' }}>
            <Svg width="280" height="280" viewBox="0 0 100 100">
              <Defs>
                <SvgRadialGradient id="glowG" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#F5A623" stopOpacity="0.45" />
                  <Stop offset="65%" stopColor="#F5A623" stopOpacity="0.12" />
                  <Stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="50" fill="url(#glowG)" />
            </Svg>
          </View>

          {/* Squircle App Icon */}
          <ExpoImage
            source={require('../../../assets/icon.png')}
            style={{
              width: 144,
              height: 144,
              borderRadius: 34,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
            contentFit="contain"
          />

          {/* 4 Floating HUD Badges */}
          <WelcomeHudBadge label="Ingredient Watch" icon={ShieldCheckSvg} color="#4A602F" style={{ top: 22, left: -6 }} />
          <WelcomeHudBadge label="Eco Impact" icon={GlobeSvg} color="#4D8DE8" style={{ top: 22, right: -6 }} />
          <WelcomeHudBadge label="Processing Level" icon={WarningSvg} color="#D84C5B" style={{ bottom: 22, left: -6 }} />
          <WelcomeHudBadge label="Sugar Load" icon={CandySvg} color="#D8B65C" style={{ bottom: 22, right: -6 }} />
        </View>

        {/* Bottom Section: Typography & CTA */}
        <View style={{ width: '100%', alignItems: 'center', gap: 20, marginBottom: 10 }}>
          {/* Title */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{
              color: '#111827',
              fontSize: 34,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: -0.6,
              lineHeight: 40
            }}>
              Stop Reading.
            </Text>
            <Text style={{
              color: '#4A602F', // Deep Leaf Green
              fontSize: 34,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: -0.6,
              lineHeight: 40
            }}>
              Start Scanning.
            </Text>
            <Text style={{
              color: '#4A602F',
              fontSize: 34,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: -0.6,
              lineHeight: 40
            }}>
              Get Instant Insights.
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={{
            color: '#4B5563',
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
            lineHeight: 20.5,
            paddingHorizontal: 16
          }}>
            Scan a Barcode. See the Nova Score, Additives, Carbon Footprint and Sugar at a glance
          </Text>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.85}
            style={{
              width: '90%',
              height: 56,
              borderRadius: 28,
              backgroundColor: '#4A602F', // Core light mode green color
              shadowColor: '#4A602F',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.28,
              shadowRadius: 16,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 10
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>
              Get Started
            </Text>
            <ButtonArrowSvg size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN ONBOARDING SCREEN COMPONENT
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const {
    setProfile, setOnboardingComplete,
    allergenFilters, setAllergenFilters,
    setDietPreference,
    setTrackEcoScore,
    setTrackOrganic
  } = useAppStore();

  useEffect(() => {
    try {
      Asset.loadAsync([
        require('../../../assets/images/welcome_bg.png'),
        require('../../../assets/icon.png'),
        require('../../../assets/images/ultra_chips.png'),
        require('../../../assets/images/artisan_swaps.png'),
        require('../../../assets/images/oil_paint/additive_detective_oil.png'),
        require('../../../assets/images/oil_paint/gut_shield_pro_oil.png'),
        require('../../../assets/images/oil_paint/nutri_score_oil.png'),
        require('../../../assets/images/oil_paint/allergen_alert_oil.png'),
        require('../../../assets/images/oil_paint/eco_climate_oil.png'),
        require('../../../assets/images/oil_paint/sugar_audit_oil.png'),
        require('../../../assets/images/oil_paint/calorie_burn_oil.png'),
        require('../../../assets/images/oil_paint/basket_score_impasto.png'),
      ]);
    } catch (e) { }
    // Ensure allergen filters start fresh/empty
    setAllergenFilters([]);
  }, []);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { isDark } = useTheme();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const C = {
    bg: isDark ? '#080A0C' : '#F6F7F8',
    card: isDark ? '#14171A' : '#FFFFFF',
    cardInner: isDark ? '#181C20' : '#FFFFFF',
    surfaceRaised: isDark ? '#1D2226' : '#F1F3F4',
    cardBorder: isDark ? '#2B3136' : '#E1E5E8',
    chrome: isDark ? 'rgba(255,255,255,0.16)' : '#D9DEE2',
    primary: MINT,
    primaryDark: isDark ? '#49E5B1' : MINT_DARK,
    red: RED,
    gold: GOLD,
    text: isDark ? '#F2F5F4' : DARK_TEXT,
    textSub: isDark ? '#A3ABB2' : SUB_TEXT,
    textMuted: isDark ? '#727B83' : '#7A848D',
    isDark,
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const hasRequestedCamera = React.useRef(false);

  useEffect(() => {
    if ((currentSlide === 8 || currentSlide === 9) && !hasRequestedCamera.current) {
      if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
        hasRequestedCamera.current = true;
        requestCameraPermission().catch(() => { });
      }
    }
  }, [currentSlide, cameraPermission]);

  // User Form State
  const [userName, setUserName] = useState('');
  const [labelRoutine, setLabelRoutine] = useState('');
  const [userGoals, setUserGoals] = useState<GoalOption[]>([]);
  const [additives, setAdditives] = useState<string[]>([]);

  const handleNext = async () => {
    if (currentSlide === 1 && !userName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (currentSlide < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentSlide((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const mappedGoal =
        userGoals[0] === 'energy' || userGoals[0] === 'gut_microbiome'
          ? 'healthy_habits'
          : userGoals[0] === 'weight_management'
            ? 'clean_swaps'
            : userGoals[0] === 'maintain_health'
              ? 'ultra_processed'
              : 'none';

      setProfile({
        userName: userName.trim() || 'Friend',
        userGoal: mappedGoal,
      });
      setDietPreference('standard');
      setTrackEcoScore(true);
      setTrackOrganic(true);
      setOnboardingComplete(true);
      router.replace('/paywall');
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 1 && !userName.trim()) return true;
    if (currentSlide === 2 && !labelRoutine) return true;
    if (currentSlide === 3 && userGoals.length === 0) return true;
    if (currentSlide === 5 && additives.length === 0) return true;
    if (currentSlide === 6 && allergenFilters.length === 0) return true;
    return false;
  };

  const slide = SLIDES[currentSlide] || SLIDES[0];
  const isShort = height < 700;
  const cardW = Math.min(width - 32, 380);

  const toggleAdditive = (id: string) => setAdditives((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <KeyboardAvoidingView accessibilityLabel={`BiteFix onboarding`} style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {currentSlide === 0 ? (
        <WelcomeScreen
          onNext={handleNext}
          isShort={isShort}
          insets={insets}
          isDark={isDark}
        />
      ) : (
        <>
          <LuxuryBackdrop C={C} />

          {/* Pre-warm images for the demo assets (ChipSwapDemoCard) off-screen to avoid mounting layout flash */}
          <View style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }} pointerEvents="none">
            <ExpoImage source={require('../../../assets/images/ultra_chips.png')} style={{ width: 1, height: 1 }} />
            <ExpoImage source={require('../../../assets/images/artisan_swaps.png')} style={{ width: 1, height: 1 }} />
          </View>

          <View style={{ flex: 1, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 12, paddingHorizontal: 16 }}>
            {/* Header Bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: 4, justifyContent: 'flex-start' }}>
              {currentSlide > 1 && currentSlide !== 8 && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  activeOpacity={0.75}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentSlide((s) => s - 1);
                  }}
                  style={{
                    backgroundColor: C.card,
                    paddingHorizontal: 14,
                    minHeight: 34,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: C.chrome,
                    alignItems: 'center' as const,
                    justifyContent: 'center' as const,
                  }}
                >
                  <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '700' }}>Back</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable Center Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Headline Typography */}
              <View style={{ alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Animated.View key={`title-${currentSlide}`} entering={FadeInDown.duration(360).easing(Easing.bezier(0.16, 1, 0.3, 1))} style={{ alignItems: 'center', gap: 6 }}>
                  <HeadlineHighlight title={slide.title} highlight={slide.highlight} C={C} />
                  <Text style={{ color: C.textSub, fontSize: isShort ? 12.5 : 14, lineHeight: isShort ? 17 : 20, fontWeight: '500', textAlign: 'center', paddingHorizontal: 10 }}>
                    {slide.subtitle}
                  </Text>
                </Animated.View>
              </View>

              {/* Dynamic Mascot Header (On screens index 8, 9, 10, 11) */}
              {currentSlide !== 7 && currentSlide !== 8 && currentSlide !== 9 && currentSlide !== 10 && (
                <MascotDrawingBoardHeader state={slide.mascotState} speech={slide.mascotSpeech} C={C} isDark={isDark} />
              )}

              {/* Interactive Card Slots */}
              <View style={{ width: '100%', alignItems: 'center', marginTop: 8 }}>
                <Animated.View key={`card-${currentSlide}`} entering={FadeInDown.duration(380).easing(Easing.bezier(0.16, 1, 0.3, 1))} style={{ width: '100%', alignItems: 'center' }}>
                  {currentSlide === 1 && <NameCard cardW={cardW} C={C} value={userName} onChange={setUserName} />}
                  {currentSlide === 2 && <LabelInspectionRoutineCard cardW={cardW} C={C} value={labelRoutine} onSelect={setLabelRoutine} />}
                  {currentSlide === 3 && <GoalCard cardW={cardW} C={C} selected={userGoals} onSelect={setUserGoals} />}
                  {currentSlide === 4 && <NovaWakeUpCard cardW={cardW} C={C} />}
                  {currentSlide === 5 && <AdditivePrioritiesCard cardW={cardW} C={C} selected={additives} onToggle={toggleAdditive} />}
                  {currentSlide === 6 && (
                    <AllergenDefenseCard
                      cardW={cardW}
                      C={C}
                      selected={allergenFilters}
                      onToggle={(id) => {
                        if (id === 'None') {
                          setAllergenFilters(['None']);
                        } else {
                          let next = allergenFilters.filter(x => x !== 'None');
                          if (next.includes(id)) {
                            next = next.filter(x => x !== id);
                          } else {
                            next.push(id);
                          }
                          setAllergenFilters(next);
                        }
                      }}
                    />
                  )}
                  {currentSlide === 7 && <EcoQualityFocusCard cardW={cardW} C={C} />}
                  {currentSlide === 8 && <HealthAnalysisCalculationCard cardW={cardW} C={C} onComplete={() => setCurrentSlide(9)} />}
                  {currentSlide === 9 && <InstantResultSummaryCard cardW={cardW} C={C} />}
                  {currentSlide === 10 && <PaywallTransitionCard cardW={cardW} C={C} allergenFilters={allergenFilters} />}
                </Animated.View>
              </View>
            </ScrollView>

            {/* Pinned Bottom Navigation & CTA */}
            {currentSlide !== 8 && (
              <View style={{ width: '100%', gap: 10, marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.cardBorder }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                  {SLIDES.slice(1).map((_, idx) => (
                    <DotIndicator key={idx + 1} active={currentSlide === idx + 1} C={C} />
                  ))}
                </View>

                <View style={{ width: '100%', alignItems: 'stretch' }}>
                  <FullWidthPillCTA label={slide.buttonLabel} disabled={isNextDisabled()} isLast={slide.isLast} compact={isShort} onPress={handleNext} />
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
    gap: 10,
    borderWidth: 1,
    borderRadius: 24,
    padding: 10,
  },
  productCard: {
    width: '100%',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 12,
    shadowColor: '#080A0C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  productTopline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  novaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  novaValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  novaLabel: {
    fontSize: 8,
    fontWeight: '600',
  },
  productBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imageStage: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  productImage: {
    width: 64,
    height: 64,
  },
  factColumn: {
    flex: 1,
    gap: 6,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  factLabel: {
    fontSize: 8.5,
    fontWeight: '600',
  },
  factValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionWrap: {
    alignSelf: 'center',
    marginVertical: -4,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  actionIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});