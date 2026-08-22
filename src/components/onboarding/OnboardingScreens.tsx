import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Text } from '../Text';
import { Activity, Check, Droplets, Leaf, ListChecks, Package, ShieldCheck, ShoppingBag, Sparkles, UserRound, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { OrbMascot } from '../features/OrbMascot';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
import { LoaderThree } from '../ui/loader';
import {
  LabelCompressionVisual,
  PRIORITY_META,
} from './OnboardingVisuals';
import { IngredientReadingFrequency, OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';
import Reanimated, {
  Easing as ReanimatedEasing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// ══════════════════════════════════════════════════════════════
// DESIGN TOKENS & TYPOGRAPHY SYSTEM
// ══════════════════════════════════════════════════════════════
const GREEN = '#01922A';
const GREEN_DEEP = '#014F18';
const GREEN_BRIGHT = '#1FB44E';
const GREEN_LIGHT = '#6FE38B';
const LIME = '#A9E34B';
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
type AllergyOption = {
  id: string;
  label: string;
  emoji: string;
  stickerBg: string;
  stickerBorder: string;
  stickerShadow: string;
  stickerRotation: string;
  stickerSide: 'left' | 'right';
};

const ALLERGEN_OPTIONS: AllergyOption[] = [
  {
    id: 'none',
    label: 'No known food allergies',
    emoji: '🛡️',
    stickerBg: '#F4FAF3',
    stickerBorder: '#1ADB13',
    stickerShadow: '#4F8A43',
    stickerRotation: '-8deg',
    stickerSide: 'right',
  },
  {
    id: 'dairy',
    label: 'Dairy and milk',
    emoji: '🥛',
    stickerBg: '#F3F8FF',
    stickerBorder: '#4E8BFF',
    stickerShadow: '#5575A8',
    stickerRotation: '8deg',
    stickerSide: 'left',
  },
  {
    id: 'gluten',
    label: 'Gluten and wheat',
    emoji: '🌾',
    stickerBg: '#FFF9E9',
    stickerBorder: '#FFCC00',
    stickerShadow: '#B38A24',
    stickerRotation: '-6deg',
    stickerSide: 'right',
  },
  {
    id: 'nuts',
    label: 'Tree nuts and peanuts',
    emoji: '🥜',
    stickerBg: '#FFF6F0',
    stickerBorder: '#E58B42',
    stickerShadow: '#A86632',
    stickerRotation: '-8deg',
    stickerSide: 'right',
  },
  {
    id: 'soy',
    label: 'Soy',
    emoji: '🫘',
    stickerBg: '#F5F1FF',
    stickerBorder: '#9B7BFF',
    stickerShadow: '#6D5BA8',
    stickerRotation: '8deg',
    stickerSide: 'left',
  },
  {
    id: 'eggs',
    label: 'Eggs',
    emoji: '🥚',
    stickerBg: '#FFF9E9',
    stickerBorder: '#FFCC00',
    stickerShadow: '#B38A24',
    stickerRotation: '10deg',
    stickerSide: 'left',
  },
];

const OIL_OPTIONS: AllergyOption[] = [
  {
    id: 'none',
    label: 'No oils to watch',
    emoji: '🫒',
    stickerBg: '#F4FAF3',
    stickerBorder: '#1ADB13',
    stickerShadow: '#4F8A43',
    stickerRotation: '-8deg',
    stickerSide: 'right',
  },
  {
    id: 'palm_oil',
    label: 'Palm Oil',
    emoji: '🌴',
    stickerBg: '#FFF9E9',
    stickerBorder: '#FFCC00',
    stickerShadow: '#B38A24',
    stickerRotation: '8deg',
    stickerSide: 'left',
  },
  {
    id: 'pho_oil',
    label: 'Hydrogenated Oils',
    emoji: '🧪',
    stickerBg: '#FFF6F0',
    stickerBorder: '#E58B42',
    stickerShadow: '#A86632',
    stickerRotation: '-6deg',
    stickerSide: 'right',
  },
  {
    id: 'coconut_oil',
    label: 'Coconut Oil',
    emoji: '🥥',
    stickerBg: '#F3F8FF',
    stickerBorder: '#4E8BFF',
    stickerShadow: '#5575A8',
    stickerRotation: '8deg',
    stickerSide: 'right',
  },
  {
    id: 'palm_kernel_oil',
    label: 'Palm Kernel Oil',
    emoji: '🌰',
    stickerBg: '#FFF6F0',
    stickerBorder: '#E58B42',
    stickerShadow: '#A86632',
    stickerRotation: '-8deg',
    stickerSide: 'left',
  },
  {
    id: 'cottonseed_oil',
    label: 'Cottonseed Oil',
    emoji: '☁️',
    stickerBg: '#F5F1FF',
    stickerBorder: '#9B7BFF',
    stickerShadow: '#6D5BA8',
    stickerRotation: '10deg',
    stickerSide: 'right',
  },
];

const PRIORITY_OPTIONS: Array<{ id: OnboardingPriority; label: string; preview: string; icon: React.ComponentType<any>; color: string }> = [
  { id: 'ultra_processed', label: 'Less ultra-processed food', preview: 'NOVA 1–4', icon: Package, color: GREEN },
  { id: 'nutrition', label: 'Better nutrition profile', preview: 'Nutri-Score A–E', icon: Activity, color: TEAL },
  { id: 'ingredients', label: 'Ingredients Intelligence', preview: 'Additives · E-numbers', icon: ShieldCheck, color: GREEN },
  { id: 'sugar', label: 'Lower sugar intake', preview: '≈ tsp per serving', icon: Droplets, color: AMBER },
];

// Oil concern ranks (1–5) synthesized from nutrition research: trans-fat content,
// saturated-fat load, omega-6 ratio, refining contaminants and pesticide exposure.
// 5 = strongest evidence to avoid, 1 = least concern.
const OIL_CONCERN_RANKS: Record<string, { rank: number; note: string }> = {
  pho_oil: {
    rank: 5,
    note: 'Industrial trans fats — WHO guidance advises limiting them as much as possible.',
  },
  palm_kernel_oil: {
    rank: 4,
    note: 'About 82% saturated fat, heavy refining — among the most flagged fats in research.',
  },
  palm_oil: {
    rank: 3,
    note: 'About 50% saturated fat; refining can form 3-MCPD and glycidyl compounds.',
  },
  cottonseed_oil: {
    rank: 3,
    note: 'Very high omega-6 content; cotton is a non-food crop, so residues are tracked.',
  },
  coconut_oil: {
    rank: 2,
    note: 'About 90% saturated fat — research advises moderation, though less refined.',
  },
};

// ══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ScreenFrame({
  children,
  verticalAlign = 'center',
}: {
  children: React.ReactNode;
  verticalAlign?: 'center' | 'flex-start';
}) {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = clamp(width * 0.0615, 18, 24);
  const verticalPadding = clamp(height * 0.017, 10, 16);

  return (
    <View
      style={{
        flexGrow: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        justifyContent: verticalAlign,
        paddingHorizontal: horizontalPadding,
        paddingTop: verticalPadding,
        paddingBottom: verticalPadding + 8,
      }}
    >
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
  const { width } = useWindowDimensions();
  const titleParts = parseRichText(title);
  const subtitleParts = parseRichText(subtitle);
  const headlineSize = display
    ? clamp(width * 0.0718, 25, 28)
    : clamp(width * 0.0667, 23, 26);
  const headlineLine = display
    ? Math.round(headlineSize * 1.2)
    : Math.round(headlineSize * 1.23);
  const subtitleSize = clamp(width * 0.0359, 13, 14);

  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', marginBottom: clamp(width * 0.046, 14, 18) }}>
      <Text style={[display ? TYPE.display : TYPE.headline, { color: colors.text, textAlign: align, maxWidth: 360, fontSize: headlineSize, lineHeight: headlineLine }]}>
        {titleParts.map((part) => (
          <Text key={part.key} style={part.isBold ? { color: GREEN } : {}}>
            {part.text}
          </Text>
        ))}
      </Text>
      <Text style={[TYPE.subtitle, { color: colors.textSecondary, textAlign: align, maxWidth: 350, marginTop: 7, fontSize: subtitleSize, lineHeight: Math.round(subtitleSize * 1.5) }]}>
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
  preview,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
  multi?: boolean;
  Icon?: React.ComponentType<any>;
  accent?: string;
  preview?: string;
}) {
  const { width } = useWindowDimensions();
  const rowFontSize = clamp(width * 0.0372, 14, 15.5);

  const ledProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(ledProgress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  }, [ledProgress, selected]);

  const ledHaloOpacity = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });
  const ledHaloScale = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] });
  const ledCoreScale = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  // Use Gen Z pill colors for selections: #14ae97 (soft, vivid teal)
  const activeColor = '#14ae97';
  const activeGlow = '#13f5b0';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ selected }}
      accessibilityLabel={preview ? `${label}, ${preview}` : label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        minHeight: 54,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 17,
        borderWidth: selected ? 2.0 : 1.25,
        borderColor: selected ? (isDark ? '#06180E' : '#07190F') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        backgroundColor: selected
          ? isDark ? 'rgba(255, 255, 255, 0.045)' : 'rgba(255, 255, 255, 0.98)'
          : isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.012)',
      }}
    >
      {/* 8K HD LED Indicator */}
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: multi ? 6 : 10,
          borderWidth: 1.5,
          borderColor: selected ? activeColor : isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.16)',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: 24,
            height: 24,
            borderRadius: multi ? 8 : 12,
            borderWidth: 2.5,
            borderColor: activeGlow,
            opacity: ledHaloOpacity,
            transform: [{ scale: ledHaloScale }],
          }}
        />
        <Animated.View
          style={{
            width: 8,
            height: 8,
            borderRadius: multi ? 2 : 4,
            backgroundColor: activeColor,
            opacity: ledProgress,
            transform: [{ scale: ledCoreScale }],
            shadowColor: activeGlow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          }}
        />
      </View>

      {/* Optional icon */}
      {Icon && <Icon size={18} color={selected ? activeColor : colors.textSecondary} strokeWidth={2.1} />}

      {/* Label */}
      <Text style={{
        color: selected ? colors.text : colors.textSecondary,
        fontSize: rowFontSize,
        lineHeight: 20,
        fontWeight: selected ? '700' : '500',
        flex: 1,
      }}>
        {label}
      </Text>

      {/* Optional Insight Preview tag */}
      {preview ? (
        <Text
          numberOfLines={1}
          style={{
            color: selected ? activeColor : colors.textSecondary,
            fontSize: 12.5,
            fontWeight: selected ? '800' : '500',
            letterSpacing: -0.1,
            marginLeft: 8,
          }}
        >
          {preview}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}


// Compact assistant message used as a calm, high-end header surface.
function AssistantCard({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(90,220,130,0.28)' : 'rgba(1,146,42,0.18)',
        backgroundColor: isDark ? 'rgba(7,34,18,0.96)' : 'rgba(246,252,247,0.98)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: isDark ? 0.16 : 0.08,
        shadowRadius: 14,
        elevation: 2,
      }}
    >
      <Text
        style={{
          color: isDark ? '#F3FFF6' : '#12311E',
          fontSize: 14,
          lineHeight: 19,
          fontWeight: '800',
          letterSpacing: -0.15,
        }}
      >
        Hi! I am your BiteFix Assistant
      </Text>
    </View>
  );
}

// Premium static pill used as a contextual badge around the mascot.
// Width is content-driven so labels never truncate or wrap.
function PillSticker({
  label,
  icon,
  bg,
  border,
  textColor,
  shadowC,
  style,
}: {
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  textColor: string;
  shadowC: string;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 8,
          minHeight: 40,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: 1.25,
          borderColor: border,
          shadowColor: shadowC,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
          zIndex: 8,
        },
        style,
      ]}
    >
      {icon}
      <Text
        numberOfLines={1}
        style={{
          color: textColor,
          fontSize: 11.5,
          lineHeight: 16,
          fontWeight: '900',
          letterSpacing: 0.05,
          flexShrink: 0,
          includeFontPadding: false,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Small fruit sticker accents reused from the earlier BiteFix identity direction.
// They are decorative only and do not animate.
function EmojiSticker({
  emoji,
  bg,
  border,
  shadowC,
  rotation,
  style,
  size = 31,
}: {
  emoji: string;
  bg: string;
  border: string;
  shadowC: string;
  rotation: string;
  style?: any;
  size?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: bg,
          borderWidth: 1.5,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: shadowC,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.16,
          shadowRadius: 6,
          elevation: 3,
          transform: [{ rotate: rotation }],
          zIndex: 4,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: Math.round(size * 0.52), lineHeight: Math.round(size * 0.58) }}>
        {emoji}
      </Text>
    </View>
  );
}


function ContextOptionRow({
  label,
  emoji,
  stickerBg,
  stickerBorder,
  stickerShadow,
  stickerRotation,
  stickerSide,
  selected,
  onPress,
  colors,
  isDark,
  reduceMotion,
}: {
  label: string;
  emoji: string;
  stickerBg: string;
  stickerBorder: string;
  stickerShadow: string;
  stickerRotation: string;
  stickerSide: 'left' | 'right';
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
}) {
  const ledProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      ledProgress.setValue(selected ? 1 : 0);
      return;
    }

    Animated.timing(ledProgress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  }, [ledProgress, reduceMotion, selected]);

  const ledHaloOpacity = ledProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });
  const ledHaloScale = ledProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const ledCoreScale = ledProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <View style={{ marginTop: 18 }}>
      <EmojiSticker
        emoji={emoji}
        bg={stickerBg}
        border={stickerBorder}
        shadowC={stickerShadow}
        rotation={stickerRotation}
        size={40}
        style={{ top: -38, ...(stickerSide === 'left' ? { left: 10 } : { right: 10 }) }}
      />

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.86}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        style={{
          minHeight: 72,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 18,
          borderWidth: selected ? 2.0 : 1.25,
          borderColor: selected ? (isDark ? '#06180E' : '#07190F') : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.085)',
          backgroundColor: selected
            ? isDark ? 'rgba(255, 255, 255, 0.055)' : 'rgba(255, 255, 255, 0.95)'
            : isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.60)',
        }}
      >
        {/* Neutral card; selection is communicated only by the LED. */}
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            borderWidth: 1.5,
            borderColor: selected ? '#14ae97' : isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2.5,
              borderColor: '#13f5b0',
              opacity: ledHaloOpacity,
              transform: [{ scale: ledHaloScale }],
            }}
          />
          <Animated.View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#14ae97',
              opacity: ledProgress,
              transform: [{ scale: ledCoreScale }],
              shadowColor: '#13f5b0',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            }}
          />
        </View>

        <Text
          style={{
            color: colors.text,
            fontSize: 15.5,
            lineHeight: 21,
            fontWeight: '700',
            flex: 1,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getCleanLabel = (id: string) => {
  switch (id) {
    case 'dairy': return 'Dairy';
    case 'gluten': return 'Gluten';
    case 'nuts': return 'Peanuts/Nuts';
    case 'soy': return 'Soy';
    case 'eggs': return 'Eggs';
    default: return '';
  }
};

function LedLight({ active, color = '#14ae97', glow = '#13f5b0', showLabel = true, textColor }: { active: boolean, color?: string, glow?: string, showLabel?: boolean, textColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: active ? color : 'rgba(150, 150, 150, 0.4)',
        shadowColor: active ? glow : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: active ? 0.9 : 0,
        shadowRadius: 5,
        elevation: active ? 3 : 0,
      }} />
      {showLabel && (
        <Text style={{
          fontSize: 9.5,
          fontWeight: '900',
          color: textColor || (active ? color : 'rgba(150, 150, 150, 0.6)'),
          letterSpacing: 1.2,
        }}>
          {active ? 'ACTIVE' : 'STANDBY'}
        </Text>
      )}
    </View>
  );
}

function ShieldStatusBar({
  selected,
  colors,
  isDark,
  options = ALLERGEN_OPTIONS,
  lockedTitle = 'Allergen Shield Locked',
  lockedSubtitle = 'Choose ingredients below to activate your allergen safeguard.',
  noneTitle = 'Allergen Shield Unlocked',
  noneSubtitle = 'No ingredients selected. Full scanning enabled.',
  activeTitle = 'Allergen Shield Unlocked',
  activeSubtitle = 'BiteFix checks for selected ingredients for You.',
}: {
  selected: string[];
  colors: any;
  isDark: boolean;
  options?: AllergyOption[];
  lockedTitle?: string;
  lockedSubtitle?: string;
  noneTitle?: string;
  noneSubtitle?: string;
  activeTitle?: string;
  activeSubtitle?: string;
}) {
  const isNone = selected.includes('none');
  const activeAllergens = selected.filter((id) => id !== 'none');
  const ledActive = isNone || activeAllergens.length > 0;

  let statusTitle = lockedTitle;
  let statusSubtitle = lockedSubtitle;
  let ledColor = '#e58b42'; // Standby/amber
  let ledGlow = '#ffaa66';

  if (isNone) {
    statusTitle = noneTitle;
    statusSubtitle = noneSubtitle;
    ledColor = '#7ec201'; // Lime
    ledGlow = '#a3cb48';
  } else if (activeAllergens.length > 0) {
    statusTitle = activeTitle;
    statusSubtitle = activeSubtitle;
    ledColor = '#14ae97'; // Teal
    ledGlow = '#13f5b0';
  }

  const activeOptions = options.filter(opt => activeAllergens.includes(opt.id));

  // 8K Progress Meter Bar calculation
  const totalOptions = options.filter((opt) => opt.id !== 'none').length;
  const progressPercent = isNone ? 100 : (activeAllergens.length / totalOptions) * 100;

  // Dark greenish black CTA button color scheme
  const cardBg = isDark ? '#07190F' : '#07190F';
  const cardBorder = isDark ? 'rgba(20, 174, 151, 0.25)' : 'rgba(7, 25, 15, 0.15)';

  return (
    <LinearGradient
      colors={isDark ? ['#157d53ff', '#062618ff'] : ['#02c570ff', '#000000ff']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        width: '100%',
        borderRadius: 22,
        borderWidth: 1.25,
        borderColor: cardBorder,
        padding: 16,
        paddingTop: 18, // Extra padding top for the progress bar
        marginBottom: 20,
        shadowColor: ledActive ? ledColor : 'transparent',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.25 : 0.12,
        shadowRadius: 20,
        elevation: ledActive ? 4 : 0,
        overflow: 'hidden', // Required to clip the top progress bar
      }}
    >
      {/* 8K LED Progress Meter Bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
      }}>
        {ledActive && (
          <View style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: isNone ? '#7ec201' : '#14ae97',
            shadowColor: isNone ? '#a3cb48' : '#13f5b0',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 4,
          }} />
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <LedLight
          active={ledActive}
          color={ledColor}
          glow={ledGlow}
          textColor={isDark ? undefined : (ledActive ? '#ffffffff' : 'rgba(0, 0, 0, 0.5)')}
        />
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#ffffffff', letterSpacing: 0.5 }}>
          BITEFIX ENGINE V1.2
        </Text>
      </View>

      <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <Text
          style={{
            color: '#FFFFFF', // High-contrast white text on dark cards
            fontSize: 18,
            fontWeight: '800',
            letterSpacing: -0.3,
          }}
        >
          {statusTitle}
        </Text>
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.7)', // High-contrast secondary text
            fontSize: 13.5,
            fontWeight: '500',
            marginTop: 3,
            lineHeight: 18, // Fixed line height for clean wrapping
          }}
        >
          {statusSubtitle}
        </Text>
      </View>

      {activeOptions.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 }}>
          {activeOptions.map((opt) => {
            const cleanLabel = getCleanLabel(opt.id) || opt.label;
            return (
              <View
                key={opt.id}
                style={{
                  width: '48.5%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? opt.stickerBorder + '30' : opt.stickerBorder + '60',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11.5,
                    fontWeight: '700',
                    color: '#FFFFFF', // White text on dark cards
                    flex: 1,
                  }}
                >
                  {cleanLabel}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </LinearGradient>
  );
}

function PriorityStatusBar({
  selected,
  colors,
  isDark,
}: {
  selected: OnboardingPriority[];
  colors: any;
  isDark: boolean;
}) {
  const activeOptions = PRIORITY_OPTIONS.filter(opt => selected.includes(opt.id));
  const isActive = activeOptions.length > 0;
  const isAll = activeOptions.length === PRIORITY_OPTIONS.length;

  let statusTitle = 'Priorities standby';
  let statusSubtitle = 'Select priorities below to customize your BiteFix Scanner.';
  let ledActive = false;
  let ledColor = '#7ec201'; // lime standby
  let ledGlow = '#a3cb48';

  if (isAll) {
    statusTitle = 'All Priority Features Engaged';
    statusSubtitle = 'Full scan suite customized for BiteFix Scan Intelligence';
    ledActive = true;
    ledColor = '#14ae97'; // teal active
    ledGlow = '#13f5b0';
  } else if (isActive) {
    statusTitle = `${activeOptions.length} Priority Feature${activeOptions.length > 1 ? 's' : ''} Engaged`;
    statusSubtitle = 'Priorities customized for BiteFix Scan Intelligence';
    ledActive = true;
    ledColor = '#14ae97'; // teal active
    ledGlow = '#13f5b0';
  }

  // 8K Progress Meter Bar calculation
  const totalOptions = PRIORITY_OPTIONS.length;
  const progressPercent = (activeOptions.length / totalOptions) * 100;

  // Dark greenish black CTA button color scheme
  const cardBg = isDark ? '#06180E' : '#07190F';
  const cardBorder = isDark ? 'rgba(20, 174, 151, 0.25)' : 'rgba(7, 25, 15, 0.15)';

  return (
    <LinearGradient
      colors={isDark ? ['#157d53ff', '#062618ff'] : ['#02c570ff', '#000000ff']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        width: '100%',
        borderRadius: 22,
        borderWidth: 1.25,
        borderColor: cardBorder,
        padding: 16,
        paddingTop: 18, // Extra padding top for progress bar
        marginBottom: 20,
        shadowColor: ledActive ? ledColor : 'transparent',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.25 : 0.12,
        shadowRadius: 20,
        elevation: ledActive ? 3 : 0,
        overflow: 'hidden', // Required to clip the top progress bar
      }}
    >
      {/* 8K LED Progress Meter Bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
      }}>
        {ledActive && (
          <View style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: '#14ae97',
            shadowColor: '#13f5b0',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 4,
          }} />
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <LedLight
          active={ledActive}
          color={ledColor}
          glow={ledGlow}
          textColor={isDark ? undefined : (ledActive ? '#ffffffff' : 'rgba(250, 247, 247, 0.5)')}
        />
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#ffffffff', letterSpacing: 0.5 }}>
          BITEFIX ENGINE V1.2
        </Text>
      </View>

      <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <Text
          style={{
            color: '#FFFFFF', // High-contrast white text on dark cards
            fontSize: 18,
            fontWeight: '800',
            letterSpacing: -0.3,
          }}
        >
          {statusTitle}
        </Text>
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.7)', // High-contrast secondary text
            fontSize: 13.5,
            fontWeight: '500',
            marginTop: 3,
            lineHeight: 18, // Fixed line height for clean wrapping
          }}
        >
          {statusSubtitle}
        </Text>
      </View>

      {isActive && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 }}>
          {activeOptions.map((opt) => {
            const Icon = opt.icon;
            let bg = '#F3F8FF';
            let border = '#4E8BFF';
            if (opt.id === 'ultra_processed') { bg = isDark ? 'rgba(78, 139, 255, 0.15)' : '#F3F8FF'; border = '#4E8BFF'; }
            else if (opt.id === 'nutrition') { bg = isDark ? 'rgba(255, 204, 0, 0.15)' : '#FFF9E9'; border = '#FFCC00'; }
            else if (opt.id === 'ingredients') { bg = isDark ? 'rgba(229, 139, 66, 0.15)' : '#FFF6F0'; border = '#E58B42'; }
            else if (opt.id === 'sugar') { bg = isDark ? 'rgba(155, 123, 255, 0.15)' : '#F5F1FF'; border = '#9B7BFF'; }

            return (
              <View
                key={opt.id}
                style={{
                  width: '48.5%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? border + '30' : border + '60',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: 8,
                }}
              >
                <View style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}>
                  <Icon size={14} color={border} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 11.5,
                      fontWeight: '800',
                      color: '#FFFFFF', // White text on dark cards
                      letterSpacing: -0.2,
                    }}
                  >
                    {opt.preview}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 9.5,
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: 1,
                    }}
                  >
                    {opt.id === 'ultra_processed' ? 'NOVA Check' :
                      opt.id === 'nutrition' ? 'Grade Scan' :
                        opt.id === 'ingredients' ? 'Additives' : 'Sugar Filter'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </LinearGradient>
  );
}

// ─── Oil Concern Battery — phone-style SVG meter ────────────────
// Five segments fill to the oil's research rank (5 = strongest evidence to avoid).
function OilBatteryMeter({ rank, isDark }: { rank: number; isDark: boolean; muted?: string }) {
  const color = rank >= 4 ? '#EF4444' : rank >= 3 ? '#E5A50A' : GREEN_BRIGHT;
  const emptyFill = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const segments = [1, 2, 3, 4, 5];

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={36} height={17} viewBox="0 0 36 17">
        {/* Battery body */}
        <Rect
          x={1}
          y={1.5}
          width={30}
          height={14}
          rx={3.75}
          strokeWidth={1.5}
          stroke={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)'}
          fill={isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.6)'}
        />
        {/* Positive nub */}
        <Rect x={32.5} y={5.5} width={3} height={6} rx={1.2} fill={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)'} />
        {/* Charge segments */}
        {segments.map((seg) => (
          <Rect
            key={seg}
            x={3 + (seg - 1) * 5.2}
            y={4}
            width={4.4}
            height={9}
            rx={1.2}
            fill={seg <= rank ? color : emptyFill}
          />
        ))}
      </Svg>
    </View>
  );
}

function ShieldRow({
  option,
  selected,
  onPress,
  colors,
  isDark,
  reduceMotion,
  concernRank,
  concernNote,
}: {
  option: AllergyOption;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  concernRank?: number;
  concernNote?: string;
}) {
  const ledProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      ledProgress.setValue(selected ? 1 : 0);
      return;
    }

    Animated.timing(ledProgress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  }, [ledProgress, reduceMotion, selected]);

  const ledHaloOpacity = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });
  const ledHaloScale = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] });
  const ledCoreScale = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  // Use Gen Z pill colors for selections: #14ae97 (soft, vivid teal)
  const activeColor = '#14ae97';
  const activeGlow = '#13f5b0';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.84}
      accessibilityRole="checkbox"
      accessibilityState={{ selected }}
      accessibilityLabel={concernRank !== undefined ? `${option.label}, research limit rating ${concernRank} out of 5` : option.label}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: selected ? 2.0 : 1.25,
        borderColor: selected ? (isDark ? '#06180E' : '#07190F') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        backgroundColor: selected
          ? isDark ? 'rgba(255, 255, 255, 0.045)' : 'rgba(255, 255, 255, 0.98)'
          : isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.012)',
      }}
    >
      {/* 8K HD LED indicator (physical-looking neon LED) */}
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: selected ? activeColor : isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.16)',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2.5,
            borderColor: activeGlow,
            opacity: ledHaloOpacity,
            transform: [{ scale: ledHaloScale }],
          }}
        />
        <Animated.View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: activeColor,
            opacity: ledProgress,
            transform: [{ scale: ledCoreScale }],
            shadowColor: activeGlow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          }}
        />
      </View>

      {/* Emoji Chip 32x32 rounded-rect with subtle bg */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 16 }}>{option.emoji}</Text>
      </View>

      {/* Label + optional research note */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <Text
          style={{
            color: selected ? colors.text : colors.textSecondary,
            fontSize: 14.5,
            lineHeight: 19,
            fontWeight: selected ? '700' : '500',
          }}
        >
          {option.label}
        </Text>
        {selected && concernNote !== undefined && (
          <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '600', lineHeight: 14.5, marginTop: 1.5, paddingRight: 8 }}>
            {concernNote}
          </Text>
        )}
      </View>

      {/* Oil concern battery meter (research rank out of 5) */}
      {concernRank !== undefined && (
        <OilBatteryMeter rank={concernRank} isDark={isDark} muted={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2 — IDENTITY
// ══════════════════════════════════════════════════════════════
export function IdentityScreen({
  name,
  onChange,
  onSubmit,
  colors,
  isDark,
  reduceMotion = false,
}: {
  name: string;
  onChange: (name: string) => void;
  onSubmit?: () => void;
  colors: any;
  isDark: boolean;
  reduceMotion?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const { width, height } = useWindowDimensions();
  const compositionScale = clamp(width / 390, 0.82, 1.04);
  const verticalScale = clamp(height / 844, 0.88, 1.06);
  const compositionMinHeight = focused
    ? Math.round(clamp(height * 0.22, 170, 220))
    : Math.round(clamp(height * 0.38, 280, 350));
  const mascotSize = focused
    ? Math.round(150 * compositionScale)
    : Math.round(200 * compositionScale);

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingTop: focused ? 8 : 20,
        paddingBottom: 10,
      }}
    >
      <AssistantCard isDark={isDark} />

      <View
        style={{
          flex: 1,
          minHeight: compositionMinHeight,
          marginTop: focused ? 4 : 10,
          marginBottom: focused ? 4 : 12,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Layer 1: Food emoji stickers positioned around the mascot. */}
        {!focused && (
          <>
            <EmojiSticker
              emoji="🥑"
              bg={isDark ? '#202C22' : '#F4FAF3'}
              border={isDark ? '#344C38' : '#fac104ff'}
              shadowC="#5E8F4B"
              rotation="-12deg"
              size={Math.round(50 * compositionScale)}
              style={{ left: '50%', top: '50%', transform: [{ translateX: -140 * compositionScale }, { translateY: -78 * verticalScale }, { rotate: '-12deg' }] }}
            />
            <EmojiSticker
              emoji="🍎"
              bg={isDark ? '#2C2020' : '#FFF6F3'}
              border={isDark ? '#563333' : '#fb3802ff'}
              shadowC="#B64E3B"
              rotation="11deg"
              size={Math.round(55 * compositionScale)}
              style={{ left: '50%', top: '50%', transform: [{ translateX: 100 * compositionScale }, { translateY: -140 * verticalScale }, { rotate: '11deg' }] }}
            />
            <EmojiSticker
              emoji="🥦"
              bg={isDark ? '#202C22' : '#F4FAF3'}
              border={isDark ? '#344C38' : '#1adb13ff'}
              shadowC="#4F8A43"
              rotation="-8deg"
              size={Math.round(60 * compositionScale)}
              style={{ left: '50%', top: '50%', transform: [{ translateX: -130 * compositionScale }, { translateY: 60 * verticalScale }, { rotate: '-8deg' }] }}
            />
            <EmojiSticker
              emoji="🍋"
              bg={isDark ? '#2B2818' : '#FFF9E9'}
              border={isDark ? '#564F27' : '#ffcc00ff'}
              shadowC="#B38A24"
              rotation="14deg"
              size={Math.round(60 * compositionScale)}
              style={{ left: '50%', top: '50%', transform: [{ translateX: 90 * compositionScale }, { translateY: 60 * verticalScale }, { rotate: '14deg' }] }}
            />

            {/* Layer 2: Glass Pills (Outer Layer - positioned further away to frame composition) */}
            <PillSticker
              label="Personalized just for you"
              icon={<UserRound size={15} color="#D7FFE2" strokeWidth={2.3} />}
              bg="#14ae97ff"
              border="#13f5b0"
              textColor="#F3FFF6"
              shadowC="#073A1B"
              style={{ left: '50%', top: '50%', transform: [{ translateX: -160 * compositionScale }, { translateY: -150 * verticalScale }] }}
            />
            <PillSticker
              label="Your privacy is protected"
              icon={<ShieldCheck size={15} color="#D7F4FF" strokeWidth={2.3} />}
              bg="#7ec201ff"
              border="#a3cb48"
              textColor="#F4FFFF"
              shadowC="#103C3F"
              style={{ left: '50%', top: '50%', transform: [{ translateX: -30 * compositionScale }, { translateY: 140 * verticalScale }] }}
            />
          </>
        )}

        {/* Layer 3: Centered Mascot Container */}
        <View
          style={{
            width: Math.round(174 * compositionScale),
            height: Math.round(174 * compositionScale),
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6,
          }}
        >
          <OrbMascot
            state="idle"
            size={mascotSize}
            reduceMotion={reduceMotion}
            showShadow
            accessibilityLabel="Friendly BiteFix scanner mascot"
          />
        </View>
      </View>

      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: focused ? GREEN : name ? GREEN : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
          backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.98)',
          shadowColor: GREEN,
          shadowOpacity: focused ? 0.14 : name ? 0.05 : 0,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: focused ? 2 : 0,
          overflow: 'hidden',
          marginBottom: 18,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingHorizontal: 16 }}>
          <UserRound
            size={20}
            color={name || focused ? GREEN : colors.textMuted}
            strokeWidth={2.1}
          />
          <TextInput
            value={name}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmit}
            placeholder="First name"
            placeholderTextColor={colors.textMuted}
            maxLength={40}
            autoCapitalize="words"
            returnKeyType="done"
            accessible
            accessibilityLabel="First name, required"
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 16,
              fontWeight: '600',
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
          />
          {(name.length > 0 || focused) && (
            <View style={{ width: 2, height: 20, borderRadius: 1, backgroundColor: GREEN, opacity: focused ? 1 : 0.45 }} />
          )}
        </View>
      </View>

      <View style={{ marginBottom: -20 }}>
        <ScreenHeading
          title="Let's make BiteFix **yours**."
          subtitle="Optional — we'll use it to **personalize your scanner.**"
          colors={colors}
        />
      </View>
    </View>
  );
}



// ══════════════════════════════════════════════════════════════
// SCREEN 6 — ALLERGY SAFEGUARD
// ══════════════════════════════════════════════════════════════
export function AllergyScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return (
    <ScreenFrame>
      <ShieldStatusBar selected={selected} colors={colors} isDark={isDark} />
      <ScreenHeading
        title="Do you have any food-related **Allergies**?"
        subtitle="Tell us what we should **watch for you!**"
        colors={colors}
      />
      <View style={{ gap: 10, marginTop: 4 }}>
        {ALLERGEN_OPTIONS.map((option) => (
          <ShieldRow
            key={option.id}
            option={option}
            selected={selected.includes(option.id)}
            onPress={() => onToggle(option.id)}
            colors={colors}
            isDark={isDark}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// OIL WATCHLIST SCREEN — mirrors the Allergy Shield pattern
// ══════════════════════════════════════════════════════════════
export function OilWatchlistScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return (
    <ScreenFrame>
      <ShieldStatusBar
        selected={selected}
        colors={colors}
        isDark={isDark}
        options={OIL_OPTIONS}
        lockedTitle="Oil Watchlist Locked"
        lockedSubtitle="Choose oils below to activate your oil indicator."
        noneTitle="Oil Watchlist Unlocked"
        noneSubtitle="No oils selected. Full scanning enabled."
        activeTitle="Oil Watchlist Unlocked"
        activeSubtitle="BiteFix flags Oils when they show up in ingredient data."
      />
      <ScreenHeading
        title="Any **Oils** we should keep an eye on?"
        subtitle="Tell us which **Oils** you don't want in your Food!"
        colors={colors}
      />
      {/* Battery meter legend — how to read the research rank */}
      <View style={{ gap: 10, marginTop: 4 }}>
        {OIL_OPTIONS.map((option) => (
          <ShieldRow
            key={option.id}
            option={option}
            selected={selected.includes(option.id)}
            onPress={() => onToggle(option.id)}
            colors={colors}
            isDark={isDark}
            reduceMotion={reduceMotion}
            concernRank={OIL_CONCERN_RANKS[option.id]?.rank}
            concernNote={OIL_CONCERN_RANKS[option.id]?.note}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3 — LABEL READING BEHAVIOR
// ══════════════════════════════════════════════════════════════
export type LabelReadingFrequency = 'always' | 'sometimes' | 'rarely' | 'never';

export function LabelReadingScreen({
  selected,
  onSelect,
  colors,
  isDark,
  reduceMotion,
}: {
  selected?: LabelReadingFrequency;
  onSelect: (value: LabelReadingFrequency) => void;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
}) {
  const { width, height } = useWindowDimensions();

  // Match the premium composition language used by IdentityScreen,
  // while keeping the imagery specific to label-reading behavior.
  const compositionScale = clamp(width / 390, 0.84, 1.04);
  const verticalScale = clamp(height / 844, 0.88, 1.06);
  const mascotSize = Math.round(150 * compositionScale);
  const compositionMinHeight = Math.round(clamp(height * 0.40, 300, 350));

  const stickerSize = Math.round(50 * compositionScale);

  const options: Array<{ id: LabelReadingFrequency; label: string }> = [
    { id: 'always', label: 'Always' },
    { id: 'sometimes', label: 'Sometimes' },
    { id: 'rarely', label: 'Rarely' },
    { id: 'never', label: 'Never' },
  ];

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: clamp(width * 0.0615, 18, 24),
        paddingTop: clamp(height * 0.018, 12, 20),
        paddingBottom: 8,
      }}
    >
      {/* HERO COMPOSITION — intentionally spacious like Screen 2 */}
      <View
        style={{
          flex: 1,
          minHeight: compositionMinHeight,
          marginTop: -50,
          marginBottom: -50,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Context sticker: ingredient label */}
        <EmojiSticker
          emoji="🏷️"
          bg={isDark ? '#202C22' : '#F4FAF3'}
          border={isDark ? '#344C38' : '#1ADB13'}
          shadowC="#4F8A43"
          rotation="-10deg"
          size={stickerSize}
          style={{
            left: '50%',
            top: '50%',
            transform: [
              { translateX: -140 * compositionScale },
              { translateY: -92 * verticalScale },
              { rotate: '-10deg' },
            ],
          }}
        />

        {/* Context sticker: grocery decision */}
        <EmojiSticker
          emoji="🛒"
          bg={isDark ? '#2B2818' : '#FFF9E9'}
          border={isDark ? '#564F27' : '#FFCC00'}
          shadowC="#B38A24"
          rotation="9deg"
          size={Math.round(stickerSize * 1.04)}
          style={{
            left: '50%',
            top: '50%',
            transform: [
              { translateX: 96 * compositionScale },
              { translateY: -112 * verticalScale },
              { rotate: '9deg' },
            ],
          }}
        />

        {/* Context sticker: packaged product */}
        <EmojiSticker
          emoji="📦"
          bg={isDark ? '#20252C' : '#F3F7FF'}
          border={isDark ? '#384A61' : '#4E8BFF'}
          shadowC="#5575A8"
          rotation="-7deg"
          size={Math.round(stickerSize * 0.98)}
          style={{
            left: '50%',
            top: '50%',
            transform: [
              { translateX: -126 * compositionScale },
              { translateY: 20 * verticalScale },
              { rotate: '-7deg' },
            ],
          }}
        />

        {/* Context sticker: checking information */}
        <EmojiSticker
          emoji="🔎"
          bg={isDark ? '#2C2020' : '#FFF6F3'}
          border={isDark ? '#563333' : '#FB3802'}
          shadowC="#B64E3B"
          rotation="10deg"
          size={Math.round(stickerSize * 1.04)}
          style={{
            left: '50%',
            top: '50%',
            transform: [
              { translateX: 92 * compositionScale },
              { translateY: 20 * verticalScale },
              { rotate: '10deg' },
            ],
          }}
        />

        {/* Central hero mascot */}
        <View
          style={{
            width: Math.round(190 * compositionScale),
            height: Math.round(190 * compositionScale),
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6,
          }}
        >
          <OrbMascot
            state="thinking"
            size={mascotSize}
            reduceMotion={reduceMotion}
            showShadow
            accessibilityLabel="BiteFix assistant asking about label reading habits"
          />
        </View>
      </View>

      {/* CONTENT GROUP — intentionally lower on the screen */}
      <View style={{ marginBottom: -2 }}>
        <ScreenHeading
          title="Do you read food **labels** before buying?"
          subtitle="Tell us how often you stop to check labels."
          colors={colors}
        />

        <View style={{ gap: 7 }}>
          {options.map((option) => (
            <SelectionRow
              key={option.id}
              label={option.label}
              selected={selected === option.id}
              onPress={() => onSelect(option.id)}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4 — PRIMARY BARRIER
// ══════════════════════════════════════════════════════════════
export function PainScreen({
  selected,
  onSelect,
  colors,
  isDark,
  reduceMotion,
  isActive = true,
}: {
  selected?: IngredientReadingFrequency;
  onSelect: (value: IngredientReadingFrequency) => void;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
}) {
  const options: Array<{ id: IngredientReadingFrequency; label: string }> = [
    { id: 'always', label: "I don't have time to read it" },
    { id: 'sometimes', label: 'The ingredients are confusing' },
    { id: 'when_needed', label: "I don't know what really matters" },
    { id: 'rarely', label: 'Too many choices to compare' },
  ];

  return (
    <ScreenFrame>
      <LabelCompressionVisual
        colors={colors}
        isDark={isDark}
        reduceMotion={reduceMotion}
        isActive={isActive}
      />

      <ScreenHeading
        title="What makes it hard to choose **based on** the label?"
        subtitle="Most people feel this. That's why **BiteFix exists.**"
        colors={colors}
      />

      <View style={{ gap: 9 }}>
        {options.map((option) => (
          <SelectionRow
            key={option.id}
            label={option.label}
            selected={selected === option.id}
            onPress={() => onSelect(option.id)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 7 — SCANNER PRIORITIES
// ══════════════════════════════════════════════════════════════
export function PrioritiesScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; onToggle: (id: OnboardingPriority) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const allSelected = PRIORITY_OPTIONS.every((option) => selected.includes(option.id));

  return (
    <ScreenFrame>
      <PriorityStatusBar selected={selected} colors={colors} isDark={isDark} />
      <ScreenHeading
        title="Pick what matters most to **you!**"
        subtitle="Tell us what you want to surface first in your Scan Result!"
        colors={colors}
      />
      <View style={{ gap: 9, marginTop: 4 }}>
        <SelectionRow
          key="all"
          label="All of Them"
          selected={allSelected}
          onPress={() => onToggle('all')}
          colors={colors}
          isDark={isDark}
          multi
          Icon={Sparkles}
          accent="#10B981"
        />
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
// SCREEN 5 — INTELLIGENCE SCORE REVEAL
// ══════════════════════════════════════════════════════════════
const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

const SURGE_SPARK_ANGLES = [15, 75, 135, 195, 255, 315].map((deg) => (deg * Math.PI) / 180);

// ══════════════════════════════════════════════════════════════
// DEMO SCAN — a real barcode in, an instant verdict out.
// Fictional product (in-store-range EAN 2001234000017 — never
// assigned to any real item worldwide); zero network, zero brand risk.
// ══════════════════════════════════════════════════════════════

const DEMO_HOLD_MS = 800;
const DEMO_ANALYSE_MS = 1500;
const DEMO_SCAN_FAILSAFE_MS = 3200;
// Unlocks the CTA right as the score finishes counting — no dead window.
const DEMO_VERDICT_MS = 1400;
const DEMO_BARCODE_DIGITS = '2001234000017';
const ANALYSE_STEP_LABELS = ['Reading barcode…', 'Matching product…', 'Building your result…'];
const DEMO_SCORE = 17;
const DEMO_RING_SIZE = 150;

const EAN13_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN13_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const EAN13_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const EAN13_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

function ean13Modules(digits: string): number[] {
  const d = digits.split('').map(Number);
  const parity = EAN13_PARITY[d[0]] ?? EAN13_PARITY[0];
  const mods: number[] = [];
  const push = (pattern: string) => {
    for (const c of pattern) mods.push(c === '1' ? 1 : 0);
  };
  push('101');
  for (let i = 0; i < 6; i += 1) push(parity[i] === 'L' ? EAN13_L[d[i + 1]] : EAN13_G[d[i + 1]]);
  push('01010');
  for (let i = 0; i < 6; i += 1) push(EAN13_R[d[i + 7]]);
  push('101');
  return mods;
}

function Ean13Barcode({ barColor, width }: { barColor: string; width: number }) {
  const bars = useMemo(() => {
    const modules = ean13Modules(DEMO_BARCODE_DIGITS);
    const runs: Array<{ x: number; w: number }> = [];
    let i = 0;
    while (i < modules.length) {
      if (modules[i] === 1) {
        let j = i;
        while (j < modules.length && modules[j] === 1) j += 1;
        runs.push({ x: i, w: j - i });
        i = j;
      } else {
        i += 1;
      }
    }
    return runs;
  }, []);
  const height = Math.round(width * 0.42);
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height} viewBox="0 0 95 40" preserveAspectRatio="none">
        {bars.map((b, idx) => (
          <Rect key={idx} x={b.x} y={0} width={b.w} height={40} fill={barColor} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 6, marginTop: 5 }}>
        <Text style={{ color: barColor, fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>{DEMO_BARCODE_DIGITS.slice(0, 1)}</Text>
        <Text style={{ color: barColor, fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>{DEMO_BARCODE_DIGITS.slice(1, 7)}</Text>
        <Text style={{ color: barColor, fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>{DEMO_BARCODE_DIGITS.slice(7, 13)}</Text>
      </View>
    </View>
  );
}

const DEMO_NUTRI_GRADES = ['A', 'B', 'C', 'D', 'E'];

// ── Pipeline rail — the single loading indicator that spans the whole demo. ──
// Scan → Analyse → Result. The CTA unlocks the instant "Result" completes, so
// the rail visibly answers "how long until the button works?".
function DemoProgressRail({
  stage,
  resultReady,
  holdProgress,
  analyseProgress,
  colors,
  isDark,
}: {
  stage: 'barcode' | 'analysing' | 'verdict';
  resultReady: boolean;
  holdProgress: Animated.Value;
  analyseProgress: Animated.Value;
  colors: any;
  isDark: boolean;
}) {
  const trackColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  const steps = [
    { key: 'scan', label: 'Scan', state: stage === 'barcode' ? ('active' as const) : ('done' as const) },
    { key: 'analyse', label: 'Analyse', state: stage === 'analysing' ? ('active' as const) : stage === 'verdict' ? ('done' as const) : ('pending' as const) },
    { key: 'result', label: 'Result', state: resultReady ? ('done' as const) : stage === 'verdict' ? ('active' as const) : ('pending' as const) },
  ];

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 330 }}
      accessible
      accessibilityLabel={`Demo progress: ${stage === 'barcode' ? 'waiting to scan' : stage === 'analysing' ? 'analysing product' : resultReady ? 'result ready' : 'building result'}`}
    >
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          {i > 0 && (
            <View style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: trackColor, marginHorizontal: 7, overflow: 'hidden' }}>
              {/* First connector grows with the user's thumb; second tracks the analyse beat. */}
              <Animated.View
                style={{
                  height: '100%',
                  borderRadius: 1,
                  backgroundColor: GREEN,
                  width: (i === 1 ? holdProgress : analyseProgress).interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }}
              />
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View
              style={
                step.state === 'active'
                  ? { width: 9, height: 9, borderRadius: 5, backgroundColor: GREEN, shadowColor: GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 3 }
                  : step.state === 'done'
                    ? { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN, opacity: 0.85 }
                    : { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' }
              }
            />
            <Text
              style={{
                color: step.state === 'active' ? GREEN : step.state === 'done' ? colors.textSecondary : colors.textMuted,
                fontSize: 9,
                fontWeight: '900',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                opacity: step.state === 'pending' ? 0.7 : 1,
              }}
            >
              {step.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

function DemoScanSequence({
  colors,
  isDark,
  reduceMotion,
  isActive = true,
  skipSignal,
  onVerdictShown,
  onStageChange,
  onComplete,
}: {
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
  skipSignal: boolean;
  onVerdictShown: () => void;
  onStageChange?: (stage: 'barcode' | 'analysing' | 'verdict') => void;
  onComplete: () => void;
}) {
  const { width } = useWindowDimensions();
  const [stage, setStage] = useState<'barcode' | 'analysing' | 'verdict'>(reduceMotion ? 'verdict' : 'barcode');
  const [holding, setHolding] = useState(false);
  const [analyseStep, setAnalyseStep] = useState(0);
  const [resultReady, setResultReady] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const barcodeEntrance = useRef(new Animated.Value(0)).current;
  const verdictEntrance = useRef(new Animated.Value(0)).current;
  const beamY = useRef(new Animated.Value(0)).current;
  const arcAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const scanProgress = useRef(new Animated.Value(0)).current;
  const analyseAnim = useRef(new Animated.Value(0)).current;
  const [scoreText, setScoreText] = useState('0');

  const onVerdictShownRef = useRef(onVerdictShown);
  onVerdictShownRef.current = onVerdictShown;
  const onStageChangeRef = useRef(onStageChange);
  onStageChangeRef.current = onStageChange;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Narrate every stage cut to the parent (drives the CTA label).
  useEffect(() => {
    onStageChangeRef.current?.(stage);
  }, [stage]);

  const cardBg = isDark ? 'rgba(17,23,19,0.97)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(7,25,15,0.08)';
  const barColor = isDark ? '#F0FDF4' : '#101410';
  const red = isDark ? '#F87171' : '#DC2626';
  const amber = isDark ? '#FBBF24' : '#D97706';
  const barcodeWidth = Math.round(clamp(width * 0.58, 200, 260));
  const ringCircumference = 2 * Math.PI * (DEMO_RING_SIZE / 2 - 8);

  // Beat 3: the verdict card. onComplete fires the moment the score lands —
  // the rail's Result dot completes and the CTA unlocks in the same tick.
  const showVerdict = useCallback(() => {
    setStage('verdict');

    verdictEntrance.setValue(0);
    arcAnim.setValue(0);
    scoreAnim.setValue(0);

    Animated.spring(verdictEntrance, { toValue: 1, friction: 8, tension: 42, useNativeDriver: true }).start();
    Animated.timing(arcAnim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();

    const listenerId = scoreAnim.addListener(({ value }) => setScoreText(String(Math.round(value))));
    Animated.timing(scoreAnim, { toValue: DEMO_SCORE, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    onVerdictShownRef.current?.();

    const t = setTimeout(() => {
      scoreAnim.removeListener(listenerId);
      setResultReady(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCompleteRef.current?.();
    }, DEMO_VERDICT_MS);
    timersRef.current.push(t);
  }, [arcAnim, scoreAnim, verdictEntrance]);

  // Beat 2: the hold completes — run a short, narrated "analysing" beat so the
  // barcode → verdict swap reads as a pipeline instead of an unexplained cut.
  const beginAnalysis = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    beamY.stopAnimation();
    setHolding(false);
    scanProgress.setValue(1);
    setStage('analysing');
    analyseAnim.setValue(0);
    setAnalyseStep(0);

    const t1 = setTimeout(() => setAnalyseStep(1), Math.round(DEMO_ANALYSE_MS / 3));
    const t2 = setTimeout(() => setAnalyseStep(2), Math.round((DEMO_ANALYSE_MS / 3) * 2));
    const t3 = setTimeout(showVerdict, DEMO_ANALYSE_MS);
    timersRef.current.push(t1, t2, t3);
  }, [analyseAnim, beamY, scanProgress, showVerdict]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    beamY.stopAnimation();
    scanProgress.stopAnimation();
    analyseAnim.stopAnimation();

    if (!isActive) {
      completedRef.current = false;
      setStage('barcode');
      setHolding(false);
      setAnalyseStep(0);
      setResultReady(false);
      barcodeEntrance.setValue(0);
      verdictEntrance.setValue(0);
      beamY.setValue(0);
      arcAnim.setValue(0);
      scoreAnim.setValue(0);
      scanProgress.setValue(0);
      analyseAnim.setValue(0);
      setScoreText('0');
      return;
    }

    if (reduceMotion) {
      completedRef.current = true;
      setStage('verdict');
      setAnalyseStep(2);
      setResultReady(true);
      barcodeEntrance.setValue(1);
      verdictEntrance.setValue(1);
      arcAnim.setValue(1);
      scoreAnim.setValue(DEMO_SCORE);
      scanProgress.setValue(1);
      analyseAnim.setValue(1);
      setScoreText(String(DEMO_SCORE));
      onVerdictShownRef.current?.();
      onCompleteRef.current?.();
      return;
    }

    completedRef.current = false;
    setStage('barcode');
    setHolding(false);
    setAnalyseStep(0);
    setResultReady(false);
    barcodeEntrance.setValue(0);
    verdictEntrance.setValue(0);
    beamY.setValue(0);
    arcAnim.setValue(0);
    scoreAnim.setValue(0);
    scanProgress.setValue(0);
    analyseAnim.setValue(0);
    setScoreText('0');

    Animated.spring(barcodeEntrance, { toValue: 1, friction: 8, tension: 42, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(beamY, { toValue: 1, duration: 1050, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(beamY, { toValue: 0, duration: 1050, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // Auto-scan failsafe: if the user never holds, the demo runs itself —
    // through the same narrated pipeline, so it still reads as "scanning".
    const failsafe = setTimeout(beginAnalysis, DEMO_SCAN_FAILSAFE_MS);
    timersRef.current.push(failsafe);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      beamY.stopAnimation();
    };
  }, [isActive, reduceMotion, beginAnalysis, analyseAnim, arcAnim, barcodeEntrance, beamY, scanProgress, scoreAnim, verdictEntrance]);

  // Tap-to-skip anywhere on the screen fast-forwards to the final verdict.
  useEffect(() => {
    if (!skipSignal || !isActive) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    completedRef.current = true;
    beamY.stopAnimation();
    setHolding(false);
    setAnalyseStep(2);
    setResultReady(true);
    setStage('verdict');
    barcodeEntrance.setValue(1);
    verdictEntrance.setValue(1);
    arcAnim.setValue(1);
    scoreAnim.stopAnimation();
    scoreAnim.setValue(DEMO_SCORE);
    scanProgress.setValue(1);
    analyseAnim.setValue(1);
    setScoreText(String(DEMO_SCORE));
    onVerdictShownRef.current?.();
    onCompleteRef.current?.();
  }, [skipSignal, isActive]);

  const pressIn = () => {
    if (completedRef.current || stage !== 'barcode' || !isActive) return;
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(scanProgress, { toValue: 1, duration: DEMO_HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => {
      if (finished) beginAnalysis();
    });
  };

  const pressOut = () => {
    if (completedRef.current || !isActive) return;
    setHolding(false);
    scanProgress.stopAnimation();
    Animated.timing(scanProgress, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      {/* Status chip — mirrors the live scanner status */}
      <View
        style={{
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.85)',
          borderWidth: 1,
          borderColor: GREEN + '45',
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <Text style={{ color: isDark ? '#FFFFFF' : '#11301F', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {stage === 'barcode'
            ? holding
              ? 'Scanning…'
              : 'Press & Hold To Scan'
            : stage === 'analysing'
              ? ANALYSE_STEP_LABELS[analyseStep]
              : 'BiteFix Intelligence Score'}
        </Text>
      </View>

      {stage !== 'verdict' ? (
        /* ── Beats 1-2: hold-to-scan, then the narrated analysing beat ── */
        <Animated.View
          style={{
            opacity: barcodeEntrance,
            transform: [{ scale: barcodeEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }, { translateY: barcodeEntrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
          }}
        >
          <Pressable
            onPressIn={pressIn}
            onPressOut={pressOut}
            pointerEvents={stage === 'barcode' ? 'auto' : 'none'}
            accessibilityLabel="Demo barcode. Press and hold to scan."
          >
            <Animated.View
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
                borderWidth: 1.5,
                borderRadius: 24,
                paddingVertical: 26,
                paddingHorizontal: 22,
                transform: [{ scale: scanProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDark ? 0.35 : 0.10,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <View>
                <Ean13Barcode barColor={barColor} width={barcodeWidth} />
                {stage === 'barcode' && (
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: -8,
                      right: -8,
                      height: 16,
                      transform: [{ translateY: beamY.interpolate({ inputRange: [0, 1], outputRange: [-10, Math.round(barcodeWidth * 0.42) + 16] }) }],
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(1,146,42,0)', 'rgba(1,146,42,0.30)', 'rgba(1,146,42,0)']}
                      locations={[0, 0.5, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 16, borderRadius: 8 }}
                    />
                    <View style={{ position: 'absolute', left: 0, right: 0, top: 7, height: 2, borderRadius: 1, backgroundColor: GREEN }} />
                  </Animated.View>
                )}
              </View>
              {/* Hold progress → analysing progress (same track, continuous story) */}
              <View
                style={{
                  alignSelf: 'stretch',
                  height: 5,
                  borderRadius: 3,
                  marginTop: 16,
                  overflow: 'hidden',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}
              >
                <Animated.View
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: GREEN,
                    width: (stage === 'analysing' ? analyseAnim : scanProgress).interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }}
                />
              </View>
              {stage === 'barcode' && (
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 8 }}>
                  {holding ? 'Keep holding…' : 'Hold to run the scan'}
                </Text>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : (
        /* ── Beat 2: the instant verdict card — mirrors the real result screen ── */
        <Animated.View
          style={{
            opacity: verdictEntrance,
            transform: [{ scale: verdictEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }, { translateY: verdictEntrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: 1.5,
            borderRadius: 24,
            padding: 18,
            gap: 12,
            width: Math.min(width - 44, 372),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDark ? 0.35 : 0.10,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: isDark ? '#2C2020' : '#FFF3E4',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>🍫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }}>COCOA & CO</Text>
              <Text style={{ color: colors.text, fontSize: 17.5, fontWeight: '900', letterSpacing: -0.4 }} numberOfLines={1} adjustsFontSizeToFit>
                Choco Hazelnut Spread
              </Text>
            </View>
            <View
              style={{
                backgroundColor: isDark ? 'rgba(248,113,113,0.14)' : '#FDECEC',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ color: red, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8 }}>NOVA 4</Text>
            </View>
          </View>

          {/* Purity Score ring */}
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <View style={{ width: DEMO_RING_SIZE, height: DEMO_RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={DEMO_RING_SIZE} height={DEMO_RING_SIZE}>
                <Circle cx={DEMO_RING_SIZE / 2} cy={DEMO_RING_SIZE / 2} r={DEMO_RING_SIZE / 2 - 8} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} strokeWidth={9} fill="none" />
                <AnimatedSvgCircle
                  cx={DEMO_RING_SIZE / 2}
                  cy={DEMO_RING_SIZE / 2}
                  r={DEMO_RING_SIZE / 2 - 8}
                  stroke={red}
                  strokeWidth={9}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={arcAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ringCircumference, ringCircumference * (1 - DEMO_SCORE / 100)],
                    extrapolate: 'clamp',
                  })}
                  transform={`rotate(-90 ${DEMO_RING_SIZE / 2} ${DEMO_RING_SIZE / 2})`}
                />
              </Svg>
              <View style={{ position: 'absolute' }}>
                <OrbMascot state="blocked" size={86} showShadow={false} />
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                marginTop: 8,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                borderWidth: 1,
                borderColor: cardBorder,
                borderRadius: 999,
                paddingHorizontal: 13,
                paddingVertical: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: red }} />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 }}>
                PRODUCT SCORE: {scoreText}
              </Text>
            </View>
          </View>

          {/* NOVA row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: cardBorder,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FCFEFC',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: isDark ? 'rgba(248,113,113,0.14)' : '#FDECEC', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: red, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>NOVA 4</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '800' }}>Ultra-Processed</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[GREEN, '#14AE97', amber, red].map((c) => (
                <View key={c} style={{ width: 16, height: 7, borderRadius: 4, backgroundColor: c }} />
              ))}
            </View>
          </View>

          {/* Allergen row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(248,113,113,0.28)' : 'rgba(220,38,38,0.18)',
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: isDark ? 'rgba(248,113,113,0.07)' : '#FEF4F4',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <View>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Allergen Alert</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600' }}>Contains Milk</Text>
              </View>
            </View>
            <View style={{ backgroundColor: isDark ? 'rgba(248,113,113,0.14)' : '#FDECEC', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: red, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>FLAGGED</Text>
            </View>
          </View>

          {/* Nutri-Score strip */}
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(251,191,36,0.28)' : 'rgba(217,119,6,0.18)',
              paddingHorizontal: 12,
              paddingVertical: 10,
              gap: 8,
              backgroundColor: isDark ? 'rgba(251,191,36,0.05)' : '#FFFBF3',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '900', letterSpacing: 1.2 }}>NUTRI-SCORE</Text>
              <View style={{ backgroundColor: isDark ? 'rgba(251,146,60,0.14)' : '#FFEDD5', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Text style={{ color: isDark ? '#FB923C' : '#EA580C', fontSize: 10.5, fontWeight: '900' }}>Grade E · Lower Nutrition</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {DEMO_NUTRI_GRADES.map((grade) => {
                const isWorst = grade === 'E';
                return (
                  <View
                    key={grade}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 7,
                      borderRadius: 9,
                      backgroundColor: isWorst ? red : isDark ? 'rgba(255,255,255,0.05)' : '#F4F7F4',
                      borderWidth: isWorst ? 0 : 1,
                      borderColor: cardBorder,
                    }}
                  >
                    <Text style={{ color: isWorst ? '#FFFFFF' : colors.textSecondary, fontSize: 12.5, fontWeight: '900' }}>{grade}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600' }}>
              High in sugars, saturated fats, calories, or salt
            </Text>
          </View>

          {/* Bridge to personal value */}
          <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>
            See this level of detail on any product.
          </Text>
        </Animated.View>
      )}

      {/* Persistent pipeline rail — its Result step completes exactly when the CTA unlocks */}
      <DemoProgressRail
        stage={stage}
        resultReady={resultReady}
        holdProgress={scanProgress}
        analyseProgress={analyseAnim}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}


function MascotScoreRingTeaser({
  colors,
  isDark,
  reduceMotion,
  isActive = true,
  onAnimationComplete,
}: {
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
  onAnimationComplete?: () => void;
}) {
  const { width } = useWindowDimensions();
  const targetScore = 78;

  const ringSize = Math.round(clamp(width * 0.78, 200, 320));
  const mascotSize = Math.round(ringSize * 0.60);
  const badgeWidth = Math.min(240, Math.round(width * 0.64));

  const [displayedScore, setDisplayedScore] = useState(0);
  const [landed, setLanded] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const ringScaleAnim = useRef(new Animated.Value(0.94)).current;
  const scoreRevealAnim = useRef(new Animated.Value(0)).current;
  const badgeLiftAnim = useRef(new Animated.Value(8)).current;
  const stampScale = useRef(new Animated.Value(0)).current;
  const stampOpacity = useRef(new Animated.Value(0)).current;
  const mascotPop = useRef(new Animated.Value(1)).current;
  const sparkVal = useRef(new Animated.Value(0)).current;
  const glowFlash = useRef(new Animated.Value(0)).current;
  const hasRunRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Liquid Lime Mercury power surge fired the moment the score lands
  const fireSurge = useCallback(() => {
    setLanded(true);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(glowFlash, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: false, isInteraction: false }),
        Animated.timing(glowFlash, { toValue: 0, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: false, isInteraction: false }),
      ]),
      Animated.sequence([
        Animated.timing(mascotPop, { toValue: 1.08, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
        Animated.timing(mascotPop, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
      ]),
      Animated.timing(sparkVal, { toValue: 1, duration: 640, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false }),
      Animated.parallel([
        Animated.timing(stampOpacity, { toValue: 1, duration: 160, useNativeDriver: true, isInteraction: false }),
        Animated.sequence([
          Animated.timing(stampScale, { toValue: 1.35, duration: 1, useNativeDriver: true, isInteraction: false }),
          Animated.timing(stampScale, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true, isInteraction: false }),
        ]),
      ]),
    ]).start();

    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => setLanded(false), 650);
  }, [glowFlash, mascotPop, sparkVal, stampOpacity, stampScale]);

  useEffect(() => {
    if (!isActive) {
      progressAnim.stopAnimation();
      ringScaleAnim.stopAnimation();
      scoreRevealAnim.stopAnimation();
      badgeLiftAnim.stopAnimation();
      progressAnim.setValue(0);
      ringScaleAnim.setValue(0.94);
      scoreRevealAnim.setValue(0);
      badgeLiftAnim.setValue(8);
      stampScale.setValue(0);
      stampOpacity.setValue(0);
      sparkVal.setValue(0);
      glowFlash.setValue(0);
      setDisplayedScore(0);
      setLanded(false);
      hasRunRef.current = false;
      return;
    }

    if (reduceMotion) {
      progressAnim.stopAnimation();
      ringScaleAnim.stopAnimation();
      scoreRevealAnim.stopAnimation();
      badgeLiftAnim.stopAnimation();
      progressAnim.setValue(targetScore);
      ringScaleAnim.setValue(1);
      scoreRevealAnim.setValue(1);
      badgeLiftAnim.setValue(0);
      stampScale.setValue(1);
      stampOpacity.setValue(1);
      setDisplayedScore(targetScore);
      setLanded(true);
      hasRunRef.current = true;
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      return;
    }

    if (hasRunRef.current) return;
    hasRunRef.current = true;

    progressAnim.setValue(0);
    ringScaleAnim.setValue(0.94);
    scoreRevealAnim.setValue(0);
    badgeLiftAnim.setValue(8);
    setDisplayedScore(0);

    const listener = progressAnim.addListener(({ value }) => {
      setDisplayedScore(Math.min(targetScore, Math.round(value)));
    });

    const animation = Animated.sequence([
      // Phase 1 (0-450ms): Preparation & subtle scale-in
      Animated.parallel([
        Animated.timing(ringScaleAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(scoreRevealAnim, {
          toValue: 0.35,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
      // Phase 2 (450-2000ms): Synchronous ring fill + natural score count
      Animated.parallel([
        Animated.timing(progressAnim, {
          toValue: targetScore,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
          isInteraction: false,
        }),
        Animated.timing(scoreRevealAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(badgeLiftAnim, {
          toValue: 0,
          duration: 650,
          delay: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
      // Phase 3 (2000-2350ms): Controlled settle
      Animated.timing(ringScaleAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);

    animation.start(({ finished }) => {
      if (!finished) return;
      setDisplayedScore(targetScore);
      fireSurge();
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });

    return () => {
      progressAnim.removeListener(listener);
      animation.stop();
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      progressAnim.stopAnimation();
      ringScaleAnim.stopAnimation();
      scoreRevealAnim.stopAnimation();
      badgeLiftAnim.stopAnimation();
    };
  }, [badgeLiftAnim, fireSurge, isActive, progressAnim, reduceMotion, ringScaleAnim, scoreRevealAnim, onAnimationComplete]);

  const scoreScale = scoreRevealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const scoreOpacity = scoreRevealAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 1] });
  const sparkSpread = Math.round(ringSize * 0.16);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: ringSize,
          height: ringSize,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transform: [{ scale: ringScaleAnim }],
        }}
      >
        <Svg width={ringSize} height={ringSize} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
          <Defs>
            {/* Liquid Lime Mercury Ambient Halo */}
            <RadialGradient id="obScreen6RingGlowV2" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#A3E635" stopOpacity={isDark ? '0.35' : '0.22'} />
              <Stop offset="65%" stopColor="#65A30D" stopOpacity={isDark ? '0.08' : '0.04'} />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
            {/* Liquid Lime Mercury Metallic Gradient */}
            <SvgLinearGradient id="obScreen6LimeMercuryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="22%" stopColor="#b4dc45ff" />
              <Stop offset="55%" stopColor="#8cc62fff" />
              <Stop offset="82%" stopColor="#58900bff" />
              <Stop offset="100%" stopColor="#156332ff" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx="60" cy="60" r="56" fill="url(#obScreen6RingGlowV2)" />
          {/* Precision machined titanium track */}
          <Circle cx="60" cy="60" r="49" fill="none" stroke={isDark ? 'rgba(163,230,53,0.12)' : 'rgba(21,128,61,0.10)'} strokeWidth="10.5" />
          <Circle cx="60" cy="60" r="40" fill="none" stroke={isDark ? 'rgba(228,251,162,0.22)' : 'rgba(101,163,13,0.18)'} strokeWidth="1.2" opacity="0.4" />
          <AnimatedSvgCircle
            cx="60"
            cy="60"
            r="49"
            fill="none"
            stroke="url(#obScreen6LimeMercuryGrad)"
            strokeWidth="10.5"
            strokeLinecap="round"
            strokeDasharray="307.9"
            strokeDashoffset={progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: [307.9, 0],
              extrapolate: 'clamp',
            })}
            transform="rotate(-90 60 60)"
          />
          {/* One-shot liquid lime power flash when score lands */}
          <AnimatedSvgCircle
            cx="60"
            cy="60"
            r="49"
            fill="none"
            stroke="#E4FBA2"
            strokeWidth="10.5"
            opacity={glowFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] })}
            transform="rotate(-90 60 60)"
          />
        </Svg>

        <Animated.View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            transform: [{ scale: mascotPop }],
          }}
        >
          <OrbMascot
            state="happy"
            size={mascotSize}
            reduceMotion={reduceMotion}
            showShadow={false}
            accessibilityLabel="BiteFix assistant powered up with BiteFix Intelligence"
          />
        </Animated.View>

        {/* Liquid Lime / Mercury spark flares fired at the unlock moment */}
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0, zIndex: 4 }}
        >
          {SURGE_SPARK_ANGLES.map((angle, index) => {
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const startR = ringSize * 0.42;
            const endR = ringSize * 0.42 + sparkSpread;

            return (
              <Animated.View
                key={index}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: -3,
                  marginTop: -3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#D9F99D',
                  shadowColor: '#A3E635',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 6,
                  opacity: sparkVal.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                  transform: [
                    { translateX: sparkVal.interpolate({ inputRange: [0, 1], outputRange: [dx * startR, dx * endR] }) },
                    { translateY: sparkVal.interpolate({ inputRange: [0, 1], outputRange: [dy * startR, dy * endR] }) },
                    { scale: sparkVal.interpolate({ inputRange: [0, 1], outputRange: [1.3, 0.3] }) },
                  ],
                }}
              />
            );
          })}
        </Animated.View>
      </Animated.View>

      {/* Unified Score Card directly underneath the ring — Dark Shiny Greenish-Black Obsidian */}
      <Animated.View
        style={{
          minWidth: badgeWidth,
          marginTop: -14,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(163,230,53,0.35)' : 'rgba(77,124,15,0.40)',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.45 : 0.25,
          shadowRadius: 18,
          elevation: 6,
          alignItems: 'center',
          transform: [{ translateY: badgeLiftAnim }],
          zIndex: 5,
          position: 'relative',
        }}
      >
        <LinearGradient
          colors={isDark ? ['#157d53ff', '#062618ff'] : ['#02c570ff', '#000000ff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16.5,
          }}
        />

        <View style={{ alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, width: '100%' }}>
          <Text style={{ color: isDark ? '#A3E635' : '#053A20', fontSize: 13.5, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
            BITEFIX INTELLIGENCE SCORE™
          </Text>
          <Animated.Text
            style={{
              color: '#FFFFFF',
              fontSize: 42,
              lineHeight: 48,
              fontWeight: '900',
              letterSpacing: -1,
              marginTop: 2,
              transform: [{ scale: scoreScale }],
              opacity: scoreOpacity,
            }}
          >
            {displayedScore}
          </Animated.Text>
        </View>

        {/* UNLOCKED stamp — High-Contrast Vibrant Amber-Gold Capsule (Main Focal Point) */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -13,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: '#FFB800',
            borderWidth: 1.2,
            borderColor: '#FFE57F',
            shadowColor: '#FF9500',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.45,
            shadowRadius: 8,
            elevation: 6,
            opacity: stampOpacity,
            transform: [{ scale: stampScale }],
            zIndex: 10,
          }}
        >
          <Sparkles size={11} color="#291500" strokeWidth={2.8} />
          <Text style={{ color: '#291500', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }}>
            UNLOCKED
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export function RevelationScreen({
  colors,
  isDark,
  reduceMotion,
  isActive = true,
  onAnimationComplete,
  onStageChange,
}: {
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
  onAnimationComplete?: () => void;
  onStageChange?: (stage: 'barcode' | 'analysing' | 'verdict') => void;
}) {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = clamp(width * 0.0615, 18, 24);
  const isCompact = height < 700;
  const [verdictShown, setVerdictShown] = useState(false);
  const [skipCount, setSkipCount] = useState(0);

  // Replay the demo whenever the screen is re-entered.
  useEffect(() => {
    if (!isActive) {
      setVerdictShown(false);
      setSkipCount(0);
    }
  }, [isActive]);

  // One screen: scan on top, verdict below. Tap anywhere to skip.
  const skipAll = () => {
    setSkipCount((c) => (c === 0 ? 1 : c));
    setVerdictShown(true);
    onAnimationComplete?.();
  };

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: horizontalPadding,
        paddingTop: isCompact ? 10 : 20,
        paddingBottom: isCompact ? 12 : 20,
      }}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={skipAll} style={{ flex: 1 }}>
        <DemoScanSequence
          colors={colors}
          isDark={isDark}
          reduceMotion={reduceMotion}
          isActive={isActive}
          skipSignal={skipCount > 0}
          onVerdictShown={() => setVerdictShown(true)}
          onStageChange={onStageChange}
          onComplete={() => {
            setVerdictShown(true);
            onAnimationComplete?.();
          }}
        />
        {!verdictShown && (
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 10 }}>
            Tap to skip
          </Text>
        )}
      </TouchableOpacity>

      {verdictShown && (
        <View style={{ alignItems: 'center', width: '100%', marginTop: 18, paddingBottom: isCompact ? 2 : 6 }}>
          {/* Title — 2 distinct lines with tasteful green accent */}
          <View style={{ alignItems: 'center', marginBottom: 8, maxWidth: 360 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: clamp(width * 0.082, 28, 32),
                lineHeight: clamp(width * 0.098, 34, 38),
                fontWeight: '900',
                letterSpacing: -0.8,
                textAlign: 'center',
              }}
            >
              BiteFix Intelligence
            </Text>
            <Text
              style={{
                color: GREEN,
                fontSize: clamp(width * 0.082, 28, 32),
                lineHeight: clamp(width * 0.098, 34, 38),
                fontWeight: '900',
                letterSpacing: -0.8,
                textAlign: 'center',
              }}
            >
              unlocked.
            </Text>
          </View>

          {/* Subtitle */}
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: clamp(width * 0.038, 14.5, 15.5),
              lineHeight: clamp(width * 0.054, 21, 23),
              fontWeight: '500',
              textAlign: 'center',
              maxWidth: 340,
            }}
          >
            Your assistant is powered up — one scan gives an{' '}
            <Text style={{ color: GREEN, fontWeight: '800' }}>instant intelligence score</Text>, on any product.
          </Text>
        </View>
      )}
    </View>
  );
}

const GREEN_DARK_ICON = '#34D873';

function SynthesisRing({
  phase,
  colors,
  isDark,
  reduceMotion,
  isActive,
  animateToAmbient = false,
  size = 140,
}: {
  phase: 'synthesizing' | 'complete';
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive: boolean;
  animateToAmbient?: boolean;
  size?: number;
}) {
  const mainRotAnim = useRef(new Animated.Value(0)).current;
  const counterRotAnim = useRef(new Animated.Value(0)).current;
  const mainRotationLoop = useRef<Animated.CompositeAnimation | null>(null);
  const counterRotationLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Circ for main (r44) = 276.46. 270 deg = 207.34. dashoffset = 276.46 - 207.34 = 69.12
  // Circ for counter (r35) = 219.91. 90 deg = 54.98. dashoffset = 219.91 - 54.98 = 164.93
  const mainDashoffset = useRef(new Animated.Value(69.12)).current;
  const counterDashoffset = useRef(new Animated.Value(164.93)).current;

  useEffect(() => {
    if (!isActive) {
      mainDashoffset.setValue(69.12);
      counterDashoffset.setValue(164.93);
      return;
    }

    if (reduceMotion) {
      mainDashoffset.setValue(0);
      counterDashoffset.setValue(0);
      return;
    }

    if (phase === 'complete') {
      Animated.parallel([
        Animated.timing(mainDashoffset, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(counterDashoffset, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      mainDashoffset.setValue(69.12);
      counterDashoffset.setValue(164.93);
    }
  }, [phase, isActive, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !isActive) {
      mainRotAnim.setValue(0);
      counterRotAnim.setValue(0);
      return;
    }

    if (mainRotationLoop.current) mainRotationLoop.current.stop();
    if (counterRotationLoop.current) counterRotationLoop.current.stop();

    mainRotAnim.setValue(0);
    counterRotAnim.setValue(0);

    if (phase === 'synthesizing') {
      mainRotationLoop.current = Animated.loop(
        Animated.timing(mainRotAnim, {
          toValue: 1,
          duration: animateToAmbient ? 8000 : 2400,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      counterRotationLoop.current = Animated.loop(
        Animated.timing(counterRotAnim, {
          toValue: 1,
          duration: animateToAmbient ? 12000 : 3600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      if (animateToAmbient) {
        Animated.timing(mainRotAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
        Animated.timing(counterRotAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      }
    } else {
      mainRotationLoop.current = Animated.loop(
        Animated.timing(mainRotAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      counterRotationLoop.current = Animated.loop(
        Animated.timing(counterRotAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
    }

    mainRotationLoop.current.start();
    counterRotationLoop.current.start();

    return () => {
      mainRotationLoop.current?.stop();
      counterRotationLoop.current?.stop();
    };
  }, [phase, isActive, reduceMotion, animateToAmbient]);

  const mainRotate = mainRotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterRotate = counterRotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  // Ambient rotation for mounted dossier avatar (external trigger)
  const ambientRotation = useRef(new Animated.Value(0)).current;
  const ambientLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      ambientRotation.setValue(0);
      return;
    }

    ambientLoop.current?.stop();
    ambientRotation.setValue(0);

    ambientLoop.current = Animated.loop(
      Animated.timing(ambientRotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    ambientLoop.current.start();

    return () => {
      ambientLoop.current?.stop();
      ambientRotation.setValue(0);
    };
  }, [reduceMotion]);

  const ambientRotate = ambientRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Base layer: secondary blur overlay for volumetric depth in dark mode */}
      <Svg width={size} height={size} viewBox="0 0 100 100" style={isDark ? { position: 'absolute', filter: 'blur(28px)' } : undefined}>
        <Circle cx="50" cy="50" r="58" fill={isDark ? 'rgba(52, 216, 115, 0.05)' : 'transparent'} />
      </Svg>

      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="synthesisMascotGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={GREEN} stopOpacity={isDark ? 0.30 : 0.18} />
            <Stop offset="70%" stopColor={GREEN} stopOpacity={isDark ? 0.06 : 0.02} />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>

          <SvgLinearGradient id="synthesisMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={GREEN} />
            <Stop offset="50%" stopColor={isDark ? GREEN_LIGHT : GREEN_BRIGHT} />
            <Stop offset="100%" stopColor={isDark ? GREEN_LIGHT : GREEN_BRIGHT} />
          </SvgLinearGradient>
        </Defs>

        <Circle cx="50" cy="50" r="48" fill="url(#synthesisMascotGlow)" />

        <Circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeDasharray="2 6"
          opacity="0.18"
        />

        {/* Glowing futuristic center scanner core instead of mascot */}
        <Circle cx="50" cy="50" r="16" fill="url(#synthesisMainGrad)" opacity={isDark ? 0.18 : 0.10} />
        <Circle cx="50" cy="50" r="6" fill={GREEN} opacity="0.9" />
      </Svg>

      <Animated.View style={{
        position: 'absolute',
        width: size,
        height: size,
        transform: reduceMotion ? [] : [{ rotate: mainRotate }],
      }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Subtle shadow projection for main arc */}
          <Circle
            cx="50"
            cy="52"
            r="44"
            fill="none"
            stroke={isDark ? 'rgba(52, 216, 115, 0.12)' : 'rgba(0, 0, 0, 0.04)'}
            strokeWidth="6"
          />
          <AnimatedSvgCircle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#synthesisMainGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray="276.46"
            strokeDashoffset={reduceMotion ? 0 : mainDashoffset}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        width: size,
        height: size,
        transform: reduceMotion ? [] : [{ rotate: counterRotate }],
      }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Subtle shadow projection for counter arc */}
          <Circle
            cx="50"
            cy="51"
            r="35"
            fill="none"
            stroke={isDark ? 'rgba(52, 216, 115, 0.08)' : 'rgba(0, 0, 0, 0.02)'}
            strokeWidth="5"
          />
          <AnimatedSvgCircle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke={GREEN_LIGHT}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="219.91"
            strokeDashoffset={reduceMotion ? 0 : counterDashoffset}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

function SynthesisCard({
  title,
  detail,
  state,
  delay,
  colors,
  isDark,
  reduceMotion,
  isActive,
}: {
  title: string;
  detail: string;
  state: 'pending' | 'loading' | 'complete';
  delay: number;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive: boolean;
}) {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(14)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.3)).current;
  const detailOpacity = useRef(new Animated.Value(0)).current;

  const isPending = state === 'pending';
  const isLoading = state === 'loading';
  const isComplete = state === 'complete';

  useEffect(() => {
    if (!isActive) {
      cardOpacity.setValue(0);
      cardTranslateY.setValue(14);
      checkScale.setValue(0.3);
      flashOpacity.setValue(0);
      detailOpacity.setValue(0);
      return;
    }

    if (reduceMotion) {
      cardOpacity.setValue(1);
      cardTranslateY.setValue(0);
      checkScale.setValue(1);
      detailOpacity.setValue(1);
      return;
    }

    const tEntrance = setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: isPending ? 0.35 : 1.0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(detailOpacity, {
          toValue: isLoading ? 1 : 0,
          duration: isLoading ? 200 : 0,
          delay: isLoading ? 100 : 0,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(tEntrance);
  }, [delay, isActive, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !isActive) return;

    if (!isPending) {
      Animated.timing(cardOpacity, {
        toValue: 1.0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [state, isActive, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !isActive) return;

    if (isComplete) {
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();

      Animated.spring(checkScale, {
        toValue: 1,
        tension: 65,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [state, isActive, reduceMotion]);

  const [ellipsis, setEllipsis] = useState('');
  useEffect(() => {
    if (!isLoading) {
      setEllipsis('');
      return;
    }
    const interval = setInterval(() => {
      setEllipsis(prev => (prev === '...' ? '.' : prev + '.'));
    }, 350);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <Animated.View
      style={{
        opacity: cardOpacity,
        transform: [{ translateY: cardTranslateY }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 22,
        borderWidth: 1.0,
        borderColor: isLoading
          ? (isDark ? 'rgba(52,216,115,0.35)' : 'rgba(1,146,42,0.20)')
          : isComplete
            ? (isDark ? 'rgba(52,216,115,0.25)' : 'rgba(1,146,42,0.15)')
            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)'),
        backgroundColor: isLoading
          ? (isDark ? '#06180E' : 'rgba(1,146,42,0.04)')
          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {!reduceMotion && (
        <Animated.View style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: isDark ? 'rgba(52,216,115,0.15)' : 'rgba(1,146,42,0.08)',
          opacity: flashOpacity,
          pointerEvents: 'none',
        }} />
      )}

      <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
        {isComplete ? (
          <Animated.View style={{
            transform: [{ scale: checkScale }],
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: GREEN,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: GREEN_BRIGHT,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 3,
            elevation: 2,
          }}>
            <Check size={12} color="#FFFFFF" strokeWidth={3.5} />
          </Animated.View>
        ) : isLoading ? (
          <LedLight active={true} color={GREEN} glow={GREEN_BRIGHT} showLabel={false} />
        ) : (
          <View style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
          }} />
        )}
      </View>

      <View style={{ flex: 1, flexDirection: 'column' }}>
        <Text style={{
          color: isComplete || isLoading ? colors.text : colors.textSecondary,
          fontSize: 14,
          fontWeight: '800',
          letterSpacing: -0.15,
        }}>
          {title}
        </Text>
        <Animated.View style={{ opacity: detailOpacity }}>
          <Text style={{
            color: isComplete ? colors.text : isLoading ? (isDark ? '#FFFFFF' : GREEN) : colors.textSecondary,
            fontSize: 12.5,
            fontWeight: '500',
            marginTop: 2,
          }}>
            {detail}{isLoading ? ellipsis : ''}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function ScannerDossier({
  name,
  labelHabitText,
  painText,
  allergenText,
  priorityText,
  selectedPriorities,
  colors,
  isDark,
  reduceMotion,
  isActive,
}: {
  name: string;
  labelHabitText: string;
  painText: string;
  allergenText: string;
  priorityText: string;
  selectedPriorities: OnboardingPriority[];
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive: boolean;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const cardPadding = compact ? 14 : 16;
  const sealSize = compact ? 48 : 56;
  const dossierOpacity = useRef(new Animated.Value(0)).current;
  const dossierScale = useRef(new Animated.Value(0.96)).current;

  const row1Opacity = useRef(new Animated.Value(0)).current;
  const row2Opacity = useRef(new Animated.Value(0)).current;
  const row3Opacity = useRef(new Animated.Value(0)).current;
  const row4Opacity = useRef(new Animated.Value(0)).current;
  const row5Opacity = useRef(new Animated.Value(0)).current;
  const rowAnims = [row1Opacity, row2Opacity, row3Opacity, row4Opacity, row5Opacity];

  useEffect(() => {
    if (!isActive) {
      dossierOpacity.setValue(0);
      dossierScale.setValue(0.96);
      rowAnims.forEach(v => v.setValue(0));
      return;
    }

    if (reduceMotion) {
      dossierOpacity.setValue(1);
      dossierScale.setValue(1);
      rowAnims.forEach(v => v.setValue(1));
      return;
    }

    Animated.parallel([
      Animated.timing(dossierOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dossierScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const anims = rowAnims.map((val, i) =>
      Animated.timing(val, {
        toValue: 1,
        duration: 250,
        delay: i * 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    Animated.parallel(anims).start();
  }, [isActive, reduceMotion]);

  const dossierRows = [
    { icon: UserRound, label: 'Profile Identity', value: name },
    { icon: Leaf, label: 'Label Habit', value: labelHabitText },
    { icon: Package, label: 'Shopping Barrier', value: painText },
    { icon: ShieldCheck, label: 'Allergen Safeguard', value: allergenText },
    { icon: Zap, label: 'Active Scanners', value: priorityText },
  ];

  return (
    <Animated.View style={{
      width: '100%',
      opacity: dossierOpacity,
      transform: [{ scale: dossierScale }],
      padding: cardPadding,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(52,216,115,0.32)' : 'rgba(1,146,42,0.18)',
      backgroundColor: isDark ? '#06180E' : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 20,
      elevation: 5,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <View
          style={{
            width: sealSize,
            height: sealSize,
            borderRadius: sealSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(52,216,115,0.08)' : '#F3FBF5',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(52,216,115,0.22)' : 'rgba(1,146,42,0.11)',
          }}
        >
          <OrbMascot
            state="happy"
            size={sealSize * 0.7}
            reduceMotion={true}
            showShadow={false}
            style={{ height: sealSize * 0.7 }}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: isDark ? '#FFFFFF' : '#12311E', fontSize: compact ? 15 : 17, fontWeight: '900', letterSpacing: -0.35 }}>
            {name}'s Scanner
          </Text>
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: isDark ? 'rgba(52,216,115,0.12)' : '#EAF8EE' }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isDark ? GREEN_DARK_ICON : GREEN }} />
            <Text style={{ color: isDark ? GREEN_DARK_ICON : GREEN, fontSize: 9, fontWeight: '900' }}>
              Ready to scan
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(1,79,24,0.08)', marginBottom: 8 }} />

      <Text style={{ color: isDark ? 'rgba(255,255,255,0.50)' : '#789080', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
        Built around you
      </Text>

      <View style={{ gap: 4, marginBottom: 16 }}>
        {dossierRows.map((row, i) => {
          const Icon = row.icon;
          const rowOpacity = rowAnims[i];
          return (
            <Animated.View
              key={i}
              style={{
                opacity: rowOpacity,
                transform: [{
                  translateY: rowOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                }],
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 10,
                borderRadius: 14,
                backgroundColor: i % 2 === 0
                  ? (isDark ? 'rgba(255,255,255,0.025)' : '#F7FBF8')
                  : 'transparent',
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(52,216,115,0.10)' : '#EAF8EE' }}>
                <Icon size={16} color={isDark ? GREEN_DARK_ICON : GREEN} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 3 }}>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.52)' : '#718675', fontSize: 11, fontWeight: '800', letterSpacing: 0.15, marginBottom: 2 }}>
                  {row.label}
                </Text>
                <Text style={{ color: colors.text, fontSize: compact ? 12.5 : 13.25, lineHeight: compact ? 17 : 18, fontWeight: '800', flexShrink: 1 }}>
                  {row.value}
                </Text>
              </View>
              <View style={{ justifyContent: 'center', alignItems: 'center', minWidth: 24 }}>
                <LedLight active={true} color={isDark ? GREEN_BRIGHT : GREEN} glow={GREEN_BRIGHT} showLabel={false} />
              </View>
            </Animated.View>
          );
        })}
      </View>

      {selectedPriorities.length > 0 && (
        <View style={{ marginTop: 2 }}>
          <Text style={{ color: isDark ? 'rgba(255,255,255,0.50)' : '#789080', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
            Your active modules
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {selectedPriorities.map((p) => {
              const label = PRIORITY_META[p]?.label ?? p;
              return (
                <View
                  key={p}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: isDark ? 'rgba(52,216,115,0.10)' : '#EAF8EE',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(52,216,115,0.24)' : 'rgba(1,146,42,0.23)',
                    maxWidth: '100%',
                  }}
                >
                  <Text style={{ color: isDark ? GREEN_DARK_ICON : GREEN, fontSize: 10.5, lineHeight: 14, fontWeight: '900' }}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

export function MomentOfTruthScreen({
  selected,
  name,
  colors,
  isDark,
  reduceMotion,
  isActive = true,
  labelReadingFrequency,
  ingredientReadingFrequency,
  allergens,
  onAnimationComplete,
}: {
  selected: OnboardingPriority[];
  name?: string;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
  labelReadingFrequency?: 'always' | 'sometimes' | 'rarely' | 'never';
  ingredientReadingFrequency?: IngredientReadingFrequency;
  allergens: string[];
  onAnimationComplete?: () => void;
}) {
  const { width } = useWindowDimensions();
  const profileName = name?.trim() ? name : 'Guest';

  const allergenCount = allergens.filter(id => id !== 'none').length;
  const allergenText = allergens.includes('none') ? 'Standby' : `Watching ${allergenCount}`;

  const priorityCount = selected.length || 3;
  const priorityText = `${priorityCount} Active`;

  const labelLabels = {
    always: 'Always checks nutrition labels',
    sometimes: 'Checks labels when uncertain',
    rarely: 'Rarely checks food labels',
    never: 'Never reads label fine print',
  };
  const painLabels: Record<IngredientReadingFrequency, string> = {
    always: 'No time for complex labels',
    sometimes: 'Confused by hidden additives',
    when_needed: 'Unclear what ingredients matter',
    rarely: 'Overwhelmed by choices',
  };

  const cardConfigs = [
    { title: 'Profile Identity', detail: `Configuring for ${profileName}` },
    { title: 'Label Habit', detail: labelReadingFrequency ? labelLabels[labelReadingFrequency] : 'Checks labels when needed' },
    { title: 'Primary Barrier', detail: ingredientReadingFrequency ? painLabels[ingredientReadingFrequency] : 'Simplifying complex ingredients' },
    { title: 'Allergen Shield', detail: allergens.includes('none') ? 'No food allergies — shield on standby' : `Watching ${allergenCount} allergen${allergenCount === 1 ? '' : 's'}` },
    { title: 'Scanner Priorities', detail: `Loading ${priorityCount} priority module${priorityCount === 1 ? '' : 's'}` },
  ];

  const [phase, setPhase] = useState<'synthesizing' | 'complete'>('synthesizing');

  const [c0State, setC0State] = useState<'pending' | 'loading' | 'complete'>('pending');
  const [c1State, setC1State] = useState<'pending' | 'loading' | 'complete'>('pending');
  const [c2State, setC2State] = useState<'pending' | 'loading' | 'complete'>('pending');
  const [c3State, setC3State] = useState<'pending' | 'loading' | 'complete'>('pending');
  const [c4State, setC4State] = useState<'pending' | 'loading' | 'complete'>('pending');

  const cStates = [c0State, c1State, c2State, c3State, c4State];
  const setCSters = [setC0State, setC1State, setC2State, setC3State, setC4State];

  const title1Opacity = useRef(new Animated.Value(1)).current;
  const title2Opacity = useRef(new Animated.Value(0)).current;
  const checklistOpacity = useRef(new Animated.Value(1)).current;
  const [dossierShown, setDossierShown] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCSters.forEach(fn => fn('pending'));
      setPhase('synthesizing');
      setDossierShown(false);
      title1Opacity.setValue(1);
      title2Opacity.setValue(0);
      checklistOpacity.setValue(1);
      return;
    }

    if (reduceMotion) {
      setCSters.forEach(fn => fn('complete'));
      setPhase('complete');
      setDossierShown(true);
      title1Opacity.setValue(0);
      title2Opacity.setValue(1);
      checklistOpacity.setValue(0);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      return;
    }

    // Reset run
    setCSters.forEach(fn => fn('pending'));
    setPhase('synthesizing');
    setDossierShown(false);
    title1Opacity.setValue(1);
    title2Opacity.setValue(0);
    checklistOpacity.setValue(1);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Staggered loadings for 5 cards (150 + i*550ms, completes 450ms later)
    cardConfigs.forEach((_, i) => {
      const loadTime = 150 + i * 550;
      const completeTime = loadTime + 450;
      timers.push(setTimeout(() => {
        setCSters[i]('loading');
      }, loadTime));
      timers.push(setTimeout(() => {
        setCSters[i]('complete');
      }, completeTime));
    });

    // t = 3100ms: Title crossfade & ring flip (Card 4 completes at 2800ms)
    timers.push(setTimeout(() => {
      setPhase('complete');
      Animated.parallel([
        Animated.timing(title1Opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(title2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 3100));

    // t = 3300ms: Checklist crossfades out, Dossier fades in
    timers.push(setTimeout(() => {
      setDossierShown(true);
      Animated.timing(checklistOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }, 3300));

    // t = 4500ms: Complete callback
    timers.push(setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 4500));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isActive, reduceMotion]);

  return (
    <ScreenFrame verticalAlign="flex-start">
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          // Never centre a profile taller than the viewport: that would push the title under the nav.
          justifyContent: 'flex-start',
          paddingVertical: 10,
        }}
      >
        {/* Both phases reserve the same measured heading space so the completion copy cannot collide with the navigation. */}
        <View style={{ width: '100%', minHeight: 96, justifyContent: 'center', marginBottom: 2 }}>
          <Animated.View style={{
            position: 'absolute',
            width: '100%',
            opacity: title1Opacity,
            pointerEvents: phase === 'synthesizing' ? 'auto' : 'none',
          }}>
            <ScreenHeading
              title={`Hi **${profileName}**, your Profile is being **Loaded**`}
              subtitle="Compiling your custom scanner parameters."
              colors={colors}
              align="center"
              display={true}
            />
          </Animated.View>
          <Animated.View style={{
            position: 'absolute',
            width: '100%',
            opacity: title2Opacity,
            pointerEvents: phase === 'complete' ? 'auto' : 'none',
          }}>
            <ScreenHeading
              title="Your **BiteFix Scanner** is ready"
              subtitle=""
              colors={colors}
              align="center"
              display={true}
            />
          </Animated.View>
        </View>

        {/* Dynamic Flat Telemetry Loader */}
        <View style={{ height: 32, justifyContent: 'center', alignItems: 'center', marginVertical: 4 }}>
          <LoaderThree
            phase={phase}
            isDark={isDark}
            isActive={isActive}
          />
        </View>

        {/* Checklist or Scanner Dossier */}
        <View style={{ width: '100%', minHeight: 330, position: 'relative', marginTop: 8 }}>
          {!dossierShown ? (
            <Animated.View style={{
              width: '100%',
              opacity: checklistOpacity,
            }}>
              <View style={{ gap: 8 }}>
                {cardConfigs.map((cfg, idx) => (
                  <SynthesisCard
                    key={cfg.title}
                    title={cfg.title}
                    detail={cfg.detail}
                    state={cStates[idx]}
                    delay={idx * 60}
                    colors={colors}
                    isDark={isDark}
                    reduceMotion={reduceMotion}
                    isActive={isActive}
                  />
                ))}
              </View>
            </Animated.View>
          ) : (
            <ScannerDossier
              name={profileName}
              labelHabitText={labelReadingFrequency ? labelLabels[labelReadingFrequency] : 'Checks when needed'}
              painText={ingredientReadingFrequency ? painLabels[ingredientReadingFrequency] : 'Simplifying ingredients'}
              allergenText={allergens.includes('none') ? 'Standby' : `Watching ${allergenCount}`}
              priorityText={priorityText}
              selectedPriorities={selected}
              colors={colors}
              isDark={isDark}
              reduceMotion={reduceMotion}
              isActive={dossierShown}
            />
          )}
        </View>
      </View>
    </ScreenFrame>
  );
}


// ══════════════════════════════════════════════════════════════
// SCREEN 9 — FINAL ACTIVATION
// ══════════════════════════════════════════════════════════════
type ActivationFeatureId = 'processing' | 'nutrition' | 'allergens' | 'ingredients' | 'additives' | 'sugar' | 'eco';

type ActivationFeature = {
  id: ActivationFeatureId;
  label: string;
  icon: React.ComponentType<any>;
  priority?: OnboardingPriority;
};

const ACTIVATION_FEATURES: ActivationFeature[] = [
  { id: 'processing', label: 'Processing check', icon: Package, priority: 'ultra_processed' },
  { id: 'nutrition', label: 'Nutrition insight', icon: Activity, priority: 'nutrition' },
  { id: 'allergens', label: 'Allergen guard', icon: ShieldCheck },
  { id: 'ingredients', label: 'Ingredient clarity', icon: ListChecks, priority: 'ingredients' },
  { id: 'additives', label: 'Additive check', icon: Check },
  { id: 'sugar', label: 'Sugar signal', icon: Droplets, priority: 'sugar' },
  { id: 'eco', label: 'Eco impact', icon: Leaf, priority: 'environment' },
];

const PRIORITY_TO_FEATURE_ID: Partial<Record<OnboardingPriority, ActivationFeatureId>> = {
  ultra_processed: 'processing',
  nutrition: 'nutrition',
  ingredients: 'ingredients',
  sugar: 'sugar',
  environment: 'eco',
};

export type ActivationStatusState = {
  unlockedCount: number;
  total: number;
  sequenceComplete: boolean;
  spotlightLabel: string;
};

function PowerFeatureRow({
  feature,
  isUnlocked,
  isDark,
  colors,
  reduceMotion,
  compact,
}: {
  feature: ActivationFeature;
  isUnlocked: boolean;
  isDark: boolean;
  colors: any;
  reduceMotion: boolean;
  compact: boolean;
}) {
  const unlockProgress = useSharedValue(reduceMotion ? 1 : 0);
  const Icon = feature.icon;

  useEffect(() => {
    if (reduceMotion) {
      unlockProgress.set(isUnlocked ? 1 : 0);
      return;
    }

    unlockProgress.set(isUnlocked
      ? withSpring(1, { dampingRatio: 0.86, duration: 400 })
      : withTiming(0, { duration: 180, easing: ReanimatedEasing.out(ReanimatedEasing.quad) }));
  }, [isUnlocked, reduceMotion, unlockProgress]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(unlockProgress.get(), [0, 1], [0.35, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(unlockProgress.get(), [0, 1], [8, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Reanimated.View
      accessible
      accessibilityLabel={`${feature.label}, ${isUnlocked ? 'online' : 'locked'}`}
      style={[{ width: '100%' }, rowStyle]}
    >
      <View
        style={{
          minHeight: compact ? 46 : 52,
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 10 : 12,
          paddingHorizontal: compact ? 12 : 14,
          paddingVertical: compact ? 7 : 9,
          borderRadius: 18,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: isUnlocked
            ? (isDark ? 'rgba(111,227,139,0.38)' : 'rgba(1,146,42,0.22)')
            : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(7,25,15,0.08)'),
          backgroundColor: isUnlocked
            ? (isDark ? 'rgba(9,24,15,0.92)' : 'rgba(255,255,255,0.94)')
            : (isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)'),
          shadowColor: isUnlocked ? (isDark ? '#000' : GREEN) : 'transparent',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isUnlocked ? (isDark ? 0.16 : 0.05) : 0,
          shadowRadius: isUnlocked ? 8 : 0,
          elevation: isUnlocked ? 2 : 0,
        }}
      >
        <View style={{ width: compact ? 28 : 32, height: compact ? 28 : 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isUnlocked ? (isDark ? 'rgba(111,227,139,0.17)' : '#DDF5E5') : (isDark ? 'rgba(255,255,255,0.07)' : '#F1F4F1') }}>
          <Icon size={compact ? 15 : 17} color={isUnlocked ? (isDark ? GREEN_LIGHT : GREEN) : colors.textMuted} strokeWidth={2.5} />
        </View>
        <Text style={{ flex: 1, minWidth: 0, color: isUnlocked ? colors.text : colors.textMuted, fontSize: compact ? 13 : 14, lineHeight: compact ? 17 : 19, fontWeight: isUnlocked ? '800' : '600', letterSpacing: -0.1 }}>
          {feature.label}
        </Text>
        <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isUnlocked ? (isDark ? GREEN : '#EAF8EE') : (isDark ? 'rgba(255,255,255,0.07)' : '#F1F4F1') }}>
          {isUnlocked ? <Check size={13} color={isDark ? '#06180E' : GREEN} strokeWidth={3.5} /> : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted }} />}
        </View>
      </View>
    </Reanimated.View>
  );
}

export function ActivationStatus({
  unlockedCount,
  total,
  sequenceComplete,
  spotlightLabel,
  colors,
  isDark,
}: {
  unlockedCount: number;
  total: number;
  sequenceComplete: boolean;
  spotlightLabel: string;
  colors: any;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        width: '100%',
        maxWidth: 430,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: sequenceComplete
          ? (isDark ? 'rgba(111,227,139,0.34)' : 'rgba(1,146,42,0.22)')
          : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(7,25,15,0.09)'),
        backgroundColor: sequenceComplete
          ? (isDark ? 'rgba(52,216,115,0.10)' : '#F1FAF3')
          : (isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.72)'),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: isDark ? 0.18 : 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Unlock status
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 1 }}>
            <Text style={{ color: colors.text, fontSize: 42, lineHeight: 45, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -1.4 }}>
              {String(unlockedCount).padStart(2, '0')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '800', marginLeft: 5 }}>
              / {String(total).padStart(2, '0')}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', maxWidth: 190, flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sequenceComplete ? GREEN : colors.textMuted }} />
            <Text style={{ color: sequenceComplete ? GREEN : colors.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' }}>
              {sequenceComplete ? '7 features online' : 'Powering up'}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 5, textAlign: 'right' }}>
            {sequenceComplete ? 'Activated · Ready to scan' : `Next signal · ${spotlightLabel}`}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 4, marginTop: 11 }}>
        {Array.from({ length: total }).map((_, index) => (
          <View key={index} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: index < unlockedCount ? (sequenceComplete ? GREEN : GREEN_LIGHT) : (isDark ? 'rgba(255,255,255,0.12)' : '#DCE7DF') }} />
        ))}
      </View>
    </View>
  );
}

const PAIN_BARRIER_LABELS: Record<IngredientReadingFrequency, string> = {
  always: 'No time for complex labels',
  sometimes: 'Confused by hidden additives',
  when_needed: 'Unclear what ingredients matter',
  rarely: 'Overwhelmed by choices',
};

export function FinalActivationScreen({
  colors,
  isDark,
  reduceMotion,
  isActive = true,
  selected = [],
  painAnswer,
  onStatusChange,
  onAnimationComplete,
}: {
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
  selected?: OnboardingPriority[];
  painAnswer?: IngredientReadingFrequency;
  onStatusChange?: (status: ActivationStatusState) => void;
  onAnimationComplete?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 860;
  const rowGap = compact ? 6 : 8;
  const rowHeight = compact ? 46 : 52;
  const columnHeight = rowHeight * ACTIVATION_FEATURES.length + rowGap * (ACTIVATION_FEATURES.length - 1);

  const orderedFeatures = useMemo(() => {
    const prioritizedIds = selected
      .map((priority) => PRIORITY_TO_FEATURE_ID[priority])
      .filter((id): id is ActivationFeatureId => Boolean(id));
    const seen = new Set<ActivationFeatureId>();
    return [...prioritizedIds, ...ACTIVATION_FEATURES.map((feature) => feature.id)]
      .filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((id) => ACTIVATION_FEATURES.find((feature) => feature.id === id)!)
      .filter(Boolean);
  }, [selected]);

  const [unlockedCount, setUnlockedCount] = useState(0);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setUnlockedCount(0);
    setSequenceComplete(false);

    const initialStatus: ActivationStatusState = {
      unlockedCount: 0,
      total: orderedFeatures.length,
      sequenceComplete: false,
      spotlightLabel: orderedFeatures[0]?.label ?? 'Core scan',
    };
    onStatusChangeRef.current?.(initialStatus);

    if (!isActive) return;

    if (reduceMotion) {
      setUnlockedCount(orderedFeatures.length);
      setSequenceComplete(true);
      onStatusChangeRef.current?.({
        unlockedCount: orderedFeatures.length,
        total: orderedFeatures.length,
        sequenceComplete: true,
        spotlightLabel: 'Ready to scan',
      });
      onAnimationCompleteRef.current?.();
      return;
    }

    const unlockStart = 300;
    const unlockStep = 260;
    orderedFeatures.forEach((_, index) => {
      timersRef.current.push(setTimeout(() => {
        setUnlockedCount(index + 1);
        onStatusChangeRef.current?.({
          unlockedCount: index + 1,
          total: orderedFeatures.length,
          sequenceComplete: false,
          spotlightLabel: orderedFeatures[Math.min(index + 1, orderedFeatures.length - 1)]?.label ?? 'Core scan',
        });
        if (Platform.OS === 'ios') {
          Haptics.selectionAsync();
        }

        if (index === orderedFeatures.length - 1) {
          const completeTimer = setTimeout(() => {
            setSequenceComplete(true);
            onStatusChangeRef.current?.({
              unlockedCount: orderedFeatures.length,
              total: orderedFeatures.length,
              sequenceComplete: true,
              spotlightLabel: 'Ready to scan',
            });
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onAnimationCompleteRef.current?.();
          }, 300);
          timersRef.current.push(completeTimer);
        }
      }, unlockStart + index * unlockStep));
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [isActive, orderedFeatures, reduceMotion]);

  return (
    <View
      style={{
        flexGrow: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        alignItems: 'center',
        paddingHorizontal: clamp(width * 0.055, 18, 24),
        paddingTop: compact ? 8 : 14,
        paddingBottom: 16,
      }}
      accessible
      accessibilityLabel="BiteFix Intelligence full power"
    >
      <Text style={{ color: GREEN, fontSize: 10.5, fontWeight: '900', letterSpacing: 2.3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 7 }}>
        BiteFix Intelligence
      </Text>
      <Text style={{ color: colors.text, fontSize: clamp(width * 0.092, 32, 38), lineHeight: clamp(width * 0.105, 38, 44), fontWeight: '900', letterSpacing: -1.2, textAlign: 'center' }}>
        Activated!
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: clamp(width * 0.036, 13, 14.5), lineHeight: clamp(width * 0.053, 19, 22), fontWeight: '500', textAlign: 'center', maxWidth: 330, marginTop: 8, marginBottom: 12 }}>
        Your <Text style={{ color: GREEN, fontWeight: '800' }}>instant-insight scanner</Text> is fully online.
      </Text>
      {painAnswer && (
        <Text style={{ color: GREEN, fontSize: 11.5, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2, marginBottom: 14, marginTop: -4 }}>
          Built around: “{PAIN_BARRIER_LABELS[painAnswer]}”
        </Text>
      )}

      <View style={{ width: '100%', minHeight: columnHeight, gap: rowGap }}>
        {orderedFeatures.map((feature, index) => (
          <PowerFeatureRow
            key={feature.id}
            feature={feature}
            isUnlocked={index < unlockedCount}
            isDark={isDark}
            colors={colors}
            reduceMotion={reduceMotion}
            compact={compact}
          />
        ))}
      </View>
    </View>
  );
}
