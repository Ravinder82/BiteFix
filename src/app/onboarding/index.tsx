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
  runOnJS,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
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
  Sparkles,
  Zap,
  Layers,
  Heart,
  Flame,
  ShoppingCart,
  ArrowRightLeft,
  ArrowDown,
  Apple,
  CircleAlert,
  Droplets,
  Layers3,
  X,
  Users,
  Award,
  Shield,
  CheckCircle,
  Info,
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
const MINT_LIGHT = '#EAFBF5';
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

function StepRail({ current, total, C }: { current: number; total: number; C: any }) {
  return (
    <View style={{ flex: 1, marginRight: 12, gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }}>
          PROFILE FORGE
        </Text>
        <Text style={{ color: C.textSub, fontSize: 10.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </Text>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: C.cardBorder, overflow: 'hidden' }}>
        <View style={{ width: `${((current + 1) / total) * 100}%`, height: '100%', borderRadius: 2, backgroundColor: current === total - 1 ? GOLD : MINT_DARK }} />
      </View>
    </View>
  );
}

function MascotShadow({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size * 0.12, alignSelf: 'center' }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 15">
        <Defs>
          <SvgRadialGradient id="shadowG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx="50" cy="7.5" r="50" fill="url(#shadowG)" />
      </Svg>
    </View>
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
            <Sparkles size={13} color={C.primaryDark} />
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
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#EAFBF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#008F67', shadowColor: '#008F67', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}>
      <Apple size={size * 0.55} color="#76B738" strokeWidth={2.5} />
    </View>
  );
}

function ClayBasketSvg({ size = 44 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#F7F3E9', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#D8B65C', shadowColor: '#D8B65C', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}>
      <ShoppingCart size={size * 0.55} color="#F5A623" strokeWidth={2.5} />
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
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1.5, borderColor: '#00C288', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#00C288', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#EAFBF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A1F3D5' }}>
        <ShieldCheck size={22} color="#00C288" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#101418', fontSize: 13, fontWeight: '900' }}>Personal Gut Shield</Text>
          <View style={{ backgroundColor: '#A1F3D5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: '#101418', fontSize: 8.5, fontWeight: '900' }}>{status}</Text>
          </View>
        </View>
        <Text style={{ color: '#626B74', fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>
          Checks selected additives, colours and oils against your personal watchlist.
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Sparkles size={22} color={C.primaryDark} />
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 18 }}>
            {value.trim() ? `Welcome, ${value.trim()}! Let's shape your scanner around your daily food choices.` : 'Type your name above to personalize your BiteFix scanner!'}
          </Text>
        </View>
      </StickyNoteCard>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2: Daily Meal Sourcing
// ─────────────────────────────────────────────────────────
function DailyMealSourcingCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const options = [
    { label: 'Fresh home cooking', desc: 'Cook meals mostly from raw ingredients', val: 'fresh_home' },
    { label: 'Mix of home & packaged', desc: 'Combine fresh cooking with store-bought items', val: 'mixed' },
    { label: 'Takeout & delivery', desc: 'Order restaurant food or meal kits frequently', val: 'takeout' },
    { label: 'Ready-to-eat packaged', desc: 'Rely heavily on convenient shelf-stable foods', val: 'packaged' },
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
// STEP 3: Store Label Inspection Routine
// ─────────────────────────────────────────────────────────
function LabelInspectionRoutineCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const options = [
    { label: 'Always — inspect every line', desc: 'Turn every pack around to read fine print ingredients', val: 'always' },
    { label: 'Sometimes — if suspicious', desc: 'Check ingredients only on unfamiliar or high-risk brands', val: 'sometimes' },
    { label: 'Rarely — labels are confusing', desc: 'Hard to understand synthetic terms and additive codes', val: 'rarely' },
    { label: 'Never — trust front labels', desc: 'Rely on claims like "Natural", "Organic" or "Low Fat"', val: 'never' },
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
    { label: 'Feel more energized', tag: 'Avoid foods causing afternoon slumps', icon: <Flame size={20} color="#FF6D00" />, value: 'energy' },
    { label: 'Better digestion', tag: 'Stay away from gut-irritating emulsifiers', icon: <Activity size={20} color="#00C288" />, value: 'gut_microbiome' },
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
// STEP 5: NOVA 4 Wake-Up Call Alert Dashboard
// ─────────────────────────────────────────────────────────
function NovaWakeUpCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, gap: 12, alignItems: 'center' }}>
      <AnimatedListItem index={0}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: C.red, fontSize: 46, fontWeight: '900', letterSpacing: -1.5 }}>73%</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: -4 }}>
            OF STORE FOODS ARE NOVA 4
          </Text>
        </View>
      </AnimatedListItem>

      <AnimatedListItem index={1}>
        <StickyNoteCard tilt={1}>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>
            Factory formulations use cheap synthetic ingredients you would never keep in your own home kitchen.
          </Text>
        </StickyNoteCard>
      </AnimatedListItem>

      <View style={{ width: '100%', gap: 8 }}>
        {[
          'Emulsifiers that disrupt stomach lining',
          'Synthetic dyes affecting focus & behavior',
          'Refined sweeteners tricking metabolism',
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
// STEP 6: Category Smart Swap Demo Component
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['Self', 'Kids']);
  const members = [
    { id: 'Self', label: 'Myself', icon: <Heart size={16} color={MINT_DARK} /> },
    { id: 'Partner', label: 'Partner', icon: <Users size={16} color="#4D8DE8" /> },
    { id: 'Kids', label: 'Kids', icon: <Sparkles size={16} color="#F5A623" /> },
    { id: 'Seniors', label: 'Parents', icon: <Shield size={16} color="#EF4444" /> },
  ];

  const toggleMember = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <View style={{ width: cardW, gap: 14 }}>
      <AnimatedListItem index={0}>
        <GutShieldCard status="FAMILY SHIELD" />
      </AnimatedListItem>

      <AnimatedListItem index={1}>
        <StickyNoteCard tilt={-1}>
          <View style={{ gap: 10 }}>
            <Text style={{ color: C.textSub, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Select Family Members Protected
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {members.map((m) => {
                const active = selectedMembers.includes(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleMember(m.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: active ? MINT_LIGHT : C.surfaceRaised,
                      borderWidth: 1.5,
                      borderColor: active ? MINT_DARK : C.cardBorder,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                    }}
                  >
                    {m.icon}
                    <Text style={{ color: active ? MINT_DARK : C.text, fontSize: 12, fontWeight: '800' }}>{m.label}</Text>
                    {active && <Check size={12} color={MINT_DARK} strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </StickyNoteCard>
      </AnimatedListItem>

      <AnimatedListItem index={2}>
        <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ClayAppleSvg size={42} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: '900' }}>78% Household Coverage</Text>
            <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
              Filters out food colorings, artificial preservatives, and harsh emulsifiers before they enter your kitchen.
            </Text>
          </View>
        </View>
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
    { id: 'bloating', label: 'Bloating & tummy discomfort', icon: <AlertTriangle size={18} color="#EF4444" /> },
    { id: 'brainfog', label: 'Hard to focus / brain fog', icon: <Search size={18} color="#00C288" /> },
    { id: 'cravings', label: "Can't stop sugar cravings", icon: <Heart size={18} color="#4D8DE8" /> },
  ];

  return (
    <View style={{ width: cardW, gap: 10 }}>
      {symptoms.map((s, idx) => {
        const active = selected.includes(s.id);
        return (
          <AnimatedListItem key={s.id} index={idx}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(s.id);
              }}
              activeOpacity={0.85}
              style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }, getClayStyle(active, C)]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </View>
                <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800', flex: 1 }}>{s.label}</Text>
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
// STEP 9: Additive Priorities Card
// ─────────────────────────────────────────────────────────
function AdditivePrioritiesCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const additives = [
    { id: 'dyes', label: 'Synthetic colours', desc: 'Red 40, Yellow 5, Blue 1' },
    { id: 'hfcs', label: 'Added sugars & syrups', desc: 'Concentrated high fructose corn syrup' },
    { id: 'emulsifiers', label: 'Selected emulsifiers', desc: 'Gut disruptors like Polysorbate 80' },
    { id: 'oils', label: 'Refined seed oils', desc: 'Palm oil, canola & hydrogenated oils' },
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
// STEP 10: Personal Allergen Defense Card (REDESIGNED)
// ─────────────────────────────────────────────────────────
function AllergenDefenseCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const items = [
    { id: 'Gluten', label: 'Gluten & Wheat', icon: <Layers size={18} color="#D8B65C" /> },
    { id: 'Dairy', label: 'Dairy & Milk', icon: <Droplets size={18} color="#4D8DE8" /> },
    { id: 'Soy', label: 'Soy Derivatives', icon: <Sparkles size={18} color="#00C288" /> },
    { id: 'Nuts', label: 'Tree Nuts & Peanuts', icon: <Shield size={18} color="#FF6D00" /> },
    { id: 'Eggs', label: 'Egg Products', icon: <CircleAlert size={18} color="#F5A623" /> },
    { id: 'Palm Oil', label: 'Palm & Seed Oils', icon: <Droplets size={18} color="#EF4444" /> },
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
            BiteFix alerts you the moment any scanned product contains checked items.
          </Text>
        </View>
      </StickyNoteCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {items.map((item, idx) => {
          const active = selected.includes(item.id);
          return (
            <AnimatedListItem key={item.id} index={idx} style={{ width: '48%' }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggle(item.id);
                }}
                activeOpacity={0.85}
                style={[
                  {
                    padding: 12,
                    borderRadius: 16,
                    gap: 8,
                    minHeight: 88,
                    justifyContent: 'space-between',
                  },
                  getClayStyle(active, C),
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: active ? C.primaryDark : C.textMuted, backgroundColor: active ? C.primaryDark : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {active && <Check size={12} color="#FFF" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={{ color: C.text, fontSize: 12.5, fontWeight: '800' }}>{item.label}</Text>
              </TouchableOpacity>
            </AnimatedListItem>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 11: Healthy Basket Intro Card (REDESIGNED)
// ─────────────────────────────────────────────────────────
function HealthyBasketIntroCard({ cardW, C }: { cardW: number; C: any }) {
  const basketItems = [
    { title: 'Artisan Olive Oil Chips', tag: 'NOVA 3 Clean Swap', clean: true },
    { title: 'Organic Almond Milk', tag: 'Zero Emulsifiers', clean: true },
    { title: 'Grass-fed Greek Yogurt', tag: 'High Protein', clean: true },
  ];

  return (
    <View style={{ width: cardW, gap: 12 }}>
      <StickyNoteCard tilt={1}>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ClayBasketSvg size={36} />
              <View>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '900' }}>Clean Basket Blueprint</Text>
                <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '700' }}>Automatic Safe List</Text>
              </View>
            </View>
            <View style={{ backgroundColor: MINT_LIGHT, borderBottomColor: MINT_DARK, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: MINT_DARK, fontSize: 10, fontWeight: '900' }}>SCORE 98/100</Text>
            </View>
          </View>

          <View style={{ gap: 6, marginTop: 4 }}>
            {basketItems.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surfaceRaised, padding: 8, borderRadius: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={14} color={MINT_DARK} />
                  <Text style={{ color: C.text, fontSize: 11.5, fontWeight: '800' }}>{item.title}</Text>
                </View>
                <Text style={{ color: C.textSub, fontSize: 9.5, fontWeight: '700' }}>{item.tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </StickyNoteCard>

      <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.cardBorder, gap: 8 }}>
        <Text style={{ color: C.text, fontSize: 12.5, fontWeight: '900' }}>Why build a clean basket?</Text>
        <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', lineHeight: 16 }}>
          Save items that meet your strict standards. Your next grocery run becomes 3x faster and stress-free.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 12: Calculation Loader Card (UPDATED WITH LOGO & SLOGAN)
// ─────────────────────────────────────────────────────────
function HealthAnalysisCalculationCard({ cardW, C, onComplete }: { cardW: number; C: any; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState([
    { label: 'Mapping Additive Defense & Shield...', status: 'loading' },
    { label: 'Indexing Category Swap Database...', status: 'pending' },
    { label: 'Building Personal Healthy Basket Engine...', status: 'pending' },
  ]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(38);
      setPhases([
        { label: 'Mapping Additive Defense & Shield...', status: 'done' },
        { label: 'Indexing Category Swap Database...', status: 'loading' },
        { label: 'Building Personal Healthy Basket Engine...', status: 'pending' },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1800);

    const t2 = setTimeout(() => {
      setProgress(74);
      setPhases([
        { label: 'Mapping Additive Defense & Shield...', status: 'done' },
        { label: 'Indexing Category Swap Database...', status: 'done' },
        { label: 'Building Personal Healthy Basket Engine...', status: 'loading' },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 3600);

    const t3 = setTimeout(() => {
      setProgress(100);
      setPhases([
        { label: 'Mapping Additive Defense & Shield...', status: 'done' },
        { label: 'Indexing Category Swap Database...', status: 'done' },
        { label: 'Building Personal Healthy Basket Engine...', status: 'done' },
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
            <Sparkles size={18} color="#0B0D0F" />
          </View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>BiteFix</Text>
        </View>
        <Text style={{ color: MINT_DARK, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
          Scan . Swap . EatClean
        </Text>
      </View>

      {/* Orbital Loader */}
      <View style={{ width: 130, height: 130, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: MINT, opacity: 0.2, transform: [{ scale: 1.15 }] }} />
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="44" stroke="#E8EDE9" strokeWidth="6" fill="transparent" />
          <Circle cx="50" cy="50" r="44" stroke={MINT_DARK} strokeWidth="6" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} strokeLinecap="round" transform="rotate(-90 50 50)" />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>{progress}%</Text>
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
// STEP 13: Instant Result Summary
// ─────────────────────────────────────────────────────────
function InstantResultSummaryCard({ cardW, C }: { cardW: number; C: any }) {
  const features = [
    { id: '1', title: 'Health Score', desc: 'Instant 0-100 quality gauge', icon: <Activity size={20} color={MINT_DARK} /> },
    { id: '2', title: 'NOVA Scale', desc: 'Processing level detection (1 to 4)', icon: <Layers size={20} color="#F5A623" /> },
    { id: '3', title: 'Nutri-Score', desc: 'European nutrition grades (A to E)', icon: <Heart size={20} color="#00C288" /> },
    { id: '4', title: 'Additive Alerts', desc: 'Surfaces colours & emulsifiers', icon: <AlertTriangle size={20} color="#EF4444" /> },
    { id: '5', title: 'Gut Shield', desc: 'Checks against gut watchlist', icon: <ShieldCheck size={20} color={MINT_DARK} /> },
    { id: '6', title: 'Smart Swaps', desc: 'Recommends cleaner picks instantly', icon: <ArrowRightLeft size={20} color={MINT_DARK} /> },
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
// STEP 14: Paywall Blueprint Summary Card (REDESIGNED)
// ─────────────────────────────────────────────────────────
function PaywallTransitionCard({ cardW, C }: { cardW: number; C: any }) {
  const { allergenFilters } = useAppStore();

  return (
    <View style={{ width: cardW, gap: 14 }}>
      <StickyNoteCard tilt={-1}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Award size={22} color={GOLD} />
              <Text style={{ color: C.text, fontSize: 15, fontWeight: '900' }}>BiteFix Food Blueprint</Text>
            </View>
            <View style={{ backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ color: '#0B0D0F', fontSize: 9.5, fontWeight: '900' }}>VERIFIED</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: C.cardBorder }} />

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '700' }}>Allergen Shields Active</Text>
              <Text style={{ color: C.text, fontSize: 12, fontWeight: '900' }}>{allergenFilters.length} Configured</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '700' }}>NOVA 4 Ultra-Processed Guard</Text>
              <Text style={{ color: MINT_DARK, fontSize: 12, fontWeight: '900' }}>ACTIVE</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '700' }}>Smart Category Swaps</Text>
              <Text style={{ color: MINT_DARK, fontSize: 12, fontWeight: '900' }}>READY</Text>
            </View>
          </View>
        </View>
      </StickyNoteCard>

      <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Info size={18} color={MINT_DARK} />
        <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', flex: 1 }}>
          Your profile is locked and synced with your camera scanner.
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
  { step: 1, title: 'Meet your food intelligence layer', highlight: 'food intelligence', subtitle: 'Tell us your name. BiteFix will shape every scan around your priorities.', buttonLabel: 'Personalize My Scanner', mascotState: 'happy', mascotSpeech: "Hey! I'm your BiteFix scanner mascot.", isLast: false },
  { step: 2, title: 'Where do your daily meals come from?', highlight: 'daily meals', subtitle: 'Understanding your routine helps BiteFix suggest realistic swaps.', buttonLabel: 'Continue', mascotState: 'thinking', mascotSpeech: 'Sourcing clean food starts with daily habits.', isLast: false },
  { step: 3, title: 'How often do you read store labels?', highlight: 'read store labels?', subtitle: 'Fine print ingredient lists can hide artificial additives behind complex numbers.', buttonLabel: 'Continue', mascotState: 'scanning', mascotSpeech: 'I decode hidden fine-print ingredients for you!', isLast: false },
  { step: 4, title: 'What should every scan protect?', highlight: 'protect?', subtitle: 'Select your core health focus. BiteFix will highlight it on every barcode.', buttonLabel: 'Set My Priority', mascotState: 'happy', mascotSpeech: 'Your priorities guide every single scan!', isLast: false },
  { step: 5, title: 'The label rarely tells the whole story', highlight: 'whole story', subtitle: 'Processing levels and cosmetic additives lurk behind bright packaging.', buttonLabel: 'Show Me What I Miss', mascotState: 'caution', mascotSpeech: '73% of supermarket foods are ultra-processed!', isLast: false },
  { step: 6, title: 'Same craving. A cleaner label.', highlight: 'cleaner label.', subtitle: 'Compare products in the same category and see exactly what changes.', buttonLabel: 'Build My Swap Profile', mascotState: 'scanning', mascotSpeech: 'Look how easy it is to find cleaner swaps!', isLast: false },
  { step: 7, title: 'Protect your household & loved ones', highlight: 'household & loved ones', subtitle: 'Your food shield can protect the choices your entire family cares about.', buttonLabel: 'Create Our Shield', mascotState: 'happy', mascotSpeech: 'Family food safety in a single scan.', isLast: false },
  { step: 8, title: 'What do you want food to stop costing you?', highlight: 'stop costing you?', subtitle: 'Select the everyday fatigue signals you want BiteFix to keep in view.', buttonLabel: 'Add to My Profile', mascotState: 'thinking', mascotSpeech: 'Let us keep energy slumps and fog away.', isLast: false },
  { step: 9, title: 'Choose your ingredient watchlist', highlight: 'watchlist', subtitle: 'BiteFix will surface these ingredients clearly—without hiding them in fine print.', buttonLabel: 'Activate Watchlist', mascotState: 'caution', mascotSpeech: 'Watchlist active! No sneaky additives allowed.', isLast: false },
  { step: 10, title: 'Set your personal ingredient shield', highlight: 'ingredient shield', subtitle: 'Choose allergens or ingredients that should never enter your basket.', buttonLabel: 'Lock My Shield', mascotState: 'happy', mascotSpeech: 'Locking down your personal allergen shield.', isLast: false },
  { step: 11, title: 'Turn good scans into a better basket', highlight: 'better basket', subtitle: 'Save products that fit your profile and make every shop faster.', buttonLabel: 'Build My Basket', mascotState: 'happy', mascotSpeech: 'Build a basket full of foods you trust!', isLast: false },
  { step: 12, title: 'Forging your Food Shield', highlight: 'Food Shield', subtitle: 'Mapping your watchlist, swap preferences, and clean cart engine.', buttonLabel: 'Analyzing', mascotState: 'scanning', mascotSpeech: 'Forging your BiteFix profile...', isLast: false },
  { step: 13, title: 'Six layers of intelligence—ready', highlight: 'ready', subtitle: 'Every barcode now returns a clear, personal decision—not another label to decode.', buttonLabel: 'View My Shield', mascotState: 'happy', mascotSpeech: 'You get 6 deep health checks per barcode!', isLast: false },
  { step: 14, title: 'Your scanner now knows what matters', highlight: 'what matters', subtitle: 'Your Food Shield and Healthy Basket are configured and ready to use.', buttonLabel: 'Activate BiteFix', mascotState: 'happy', mascotSpeech: 'Your Food Shield is fully armed and ready!', isLast: true },
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
// MAIN ONBOARDING SCREEN COMPONENT
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
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
  const { isDark } = useTheme();
  const { setProfile, setOnboardingComplete, toggleAllergenFilter, allergenFilters } = useAppStore();
  const { user } = useAuthStore();
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
    if ((currentSlide === 11 || currentSlide === 12) && !hasRequestedCamera.current) {
      if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
        hasRequestedCamera.current = true;
        requestCameraPermission().catch(() => { });
      }
    }
  }, [currentSlide, cameraPermission]);

  // User Form State
  const [userName, setUserName] = useState('');
  const [dailyMealSource, setDailyMealSource] = useState('');
  const [labelRoutine, setLabelRoutine] = useState('');
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
      setOnboardingComplete(true);
      router.replace(user ? '/paywall' : '/auth');
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    if (currentSlide === 1 && !dailyMealSource) return true;
    if (currentSlide === 2 && !labelRoutine) return true;
    if (currentSlide === 3 && userGoals.length === 0) return true;
    if (currentSlide === 7 && symptoms.length === 0) return true;
    if (currentSlide === 8 && additives.length === 0) return true;
    if (currentSlide === 9 && allergenFilters.length === 0) return true;
    return false;
  };

  const slide = SLIDES[currentSlide] || SLIDES[0];
  const isShort = height < 700;
  const cardW = Math.min(width - 32, 380);

  const toggleSymptom = (id: string) => setSymptoms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAdditive = (id: string) => setAdditives((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <KeyboardAvoidingView accessibilityLabel={`BiteFix onboarding step ${currentSlide + 1}`} style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LuxuryBackdrop C={C} />
      <View style={{ flex: 1, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 12, paddingHorizontal: 16 }}>
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: 4 }}>
          <StepRail current={currentSlide} total={SLIDES.length} C={C} />
          {currentSlide > 0 && currentSlide !== 11 && (
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

          {/* Dynamic Mascot Header (On screens 0..10 & 12..13) */}
          {currentSlide !== 11 && (
            <MascotDrawingBoardHeader state={slide.mascotState} speech={slide.mascotSpeech} C={C} isDark={isDark} />
          )}

          {/* Interactive Card Slots */}
          <View style={{ width: '100%', alignItems: 'center', marginTop: 8 }}>
            <Animated.View key={`card-${currentSlide}`} entering={FadeInDown.duration(380).easing(Easing.bezier(0.16, 1, 0.3, 1))} style={{ width: '100%', alignItems: 'center' }}>
              {currentSlide === 0 && <NameCard cardW={cardW} C={C} value={userName} onChange={setUserName} />}
              {currentSlide === 1 && <DailyMealSourcingCard cardW={cardW} C={C} value={dailyMealSource} onSelect={setDailyMealSource} />}
              {currentSlide === 2 && <LabelInspectionRoutineCard cardW={cardW} C={C} value={labelRoutine} onSelect={setLabelRoutine} />}
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

        {/* Pinned Bottom Navigation & CTA */}
        {currentSlide !== 11 && (
          <View style={{ width: '100%', gap: 10, marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.cardBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              {SLIDES.map((_, idx) => (
                <DotIndicator key={idx} active={currentSlide === idx} C={C} />
              ))}
            </View>

            <View style={{ width: '100%', alignItems: 'stretch' }}>
              <FullWidthPillCTA label={slide.buttonLabel} disabled={isNextDisabled()} isLast={slide.isLast} compact={isShort} onPress={handleNext} />
            </View>
          </View>
        )}
      </View>
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