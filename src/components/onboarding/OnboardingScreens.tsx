import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Activity, Check, Droplets, Leaf, Package, ShieldCheck, Sparkles, UserRound } from 'lucide-react-native';
import Svg, { Circle, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { OrbMascot } from '../features/OrbMascot';
import {
  LabelCompressionVisual,
  MomentResultCard,
} from './OnboardingVisuals';
import { IngredientReadingFrequency, OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';

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

const PRIORITY_OPTIONS: Array<{ id: OnboardingPriority; label: string; preview: string; icon: React.ComponentType<any>; color: string }> = [
  { id: 'ultra_processed', label: 'Less ultra-processed food', preview: 'NOVA 1–4', icon: Package, color: GREEN },
  { id: 'nutrition', label: 'Better nutrition profile', preview: 'Nutri-Score A–E', icon: Activity, color: TEAL },
  { id: 'ingredients', label: 'Ingredients and allergens', preview: 'Additives · E-numbers', icon: ShieldCheck, color: GREEN },
  { id: 'sugar', label: 'Lower sugar intake', preview: '≈ tsp per serving', icon: Droplets, color: AMBER },
];

// ══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ScreenFrame({ children }: { children: React.ReactNode }) {
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
        justifyContent: 'center',
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

function LedLight({ active, color = '#14ae97', glow = '#13f5b0' }: { active: boolean, color?: string, glow?: string }) {
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
      <Text style={{
        fontSize: 9.5,
        fontWeight: '900',
        color: active ? color : 'rgba(150, 150, 150, 0.6)',
        letterSpacing: 1.2,
      }}>
        {active ? 'ACTIVE' : 'STANDBY'}
      </Text>
    </View>
  );
}

function ShieldStatusBar({
  selected,
  colors,
  isDark,
}: {
  selected: string[];
  colors: any;
  isDark: boolean;
}) {
  const isNone = selected.includes('none');
  const activeAllergens = selected.filter((id) => id !== 'none');
  const ledActive = isNone || activeAllergens.length > 0;

  let statusTitle = 'Allergen Shield Locked';
  let statusSubtitle = 'Choose ingredients below to activate your allergen safeguard.';
  let ledColor = '#e58b42'; // Standby/amber
  let ledGlow = '#ffaa66';

  if (isNone) {
    statusTitle = 'Allergen Shield Unlocked';
    statusSubtitle = 'No ingredients selected. Safe scanning enabled.';
    ledColor = '#7ec201'; // Lime
    ledGlow = '#a3cb48';
  } else if (activeAllergens.length > 0) {
    statusTitle = 'Allergen Shield Unlocked';
    statusSubtitle = 'BiteFix checks for selected ingredients for You.';
    ledColor = '#14ae97'; // Teal
    ledGlow = '#13f5b0';
  }

  const activeOptions = ALLERGEN_OPTIONS.filter(opt => activeAllergens.includes(opt.id));
  
  // 8K Progress Meter Bar calculation
  const totalOptions = 5;
  const progressPercent = isNone ? 100 : (activeAllergens.length / totalOptions) * 100;

  // Dark greenish black CTA button color scheme
  const cardBg = isDark ? '#06180E' : '#07190F';
  const cardBorder = isDark ? 'rgba(20, 174, 151, 0.25)' : 'rgba(7, 25, 15, 0.15)';

  return (
    <View
      style={{
        width: '100%',
        borderRadius: 22,
        borderWidth: 1.25,
        borderColor: cardBorder,
        backgroundColor: cardBg,
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
        <LedLight active={ledActive} color={ledColor} glow={ledGlow} />
        <Text style={{ fontSize: 9.5, fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: 0.5 }}>
          BITEFIX ENGINE V1.2
        </Text>
      </View>

      <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <Text
          style={{
            color: '#FFFFFF', // High-contrast white text on dark greenish black
            fontSize: 16,
            fontWeight: '800',
            letterSpacing: -0.3,
          }}
        >
          {statusTitle}
        </Text>
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.7)', // High-contrast secondary text
            fontSize: 12.5,
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
            const cleanLabel = getCleanLabel(opt.id);
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
                    fontSize: 12.5,
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
    </View>
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

  let statusTitle = 'Priorities standby';
  let statusSubtitle = 'Select priorities below to customize scanning metrics.';
  let ledActive = false;
  let ledColor = '#7ec201'; // lime standby
  let ledGlow = '#a3cb48';

  if (isActive) {
    statusTitle = `${activeOptions.length} Priority module${activeOptions.length > 1 ? 's' : ''} engaged`;
    statusSubtitle = 'Custom rules injected into scanning algorithm.';
    ledActive = true;
    ledColor = '#14ae97'; // teal active
    ledGlow = '#13f5b0';
  }

  // 8K Progress Meter Bar calculation
  const totalOptions = 4;
  const progressPercent = (activeOptions.length / totalOptions) * 100;

  // Dark greenish black CTA button color scheme
  const cardBg = isDark ? '#06180E' : '#07190F';
  const cardBorder = isDark ? 'rgba(20, 174, 151, 0.25)' : 'rgba(7, 25, 15, 0.15)';

  return (
    <View
      style={{
        width: '100%',
        borderRadius: 22,
        borderWidth: 1.25,
        borderColor: cardBorder,
        backgroundColor: cardBg,
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
        <LedLight active={ledActive} color={ledColor} glow={ledGlow} />
        <Text style={{ fontSize: 9.5, fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: 0.5 }}>
          BITEFIX ENGINE V1.2
        </Text>
      </View>

      <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <Text
          style={{
            color: '#FFFFFF', // High-contrast white text on dark cards
            fontSize: 15.5,
            fontWeight: '800',
            letterSpacing: -0.3,
          }}
        >
          {statusTitle}
        </Text>
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.7)', // High-contrast secondary text
            fontSize: 12.5,
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
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1.25,
                  borderColor: isDark ? border + '30' : border,
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
                    numberOfLines={1}
                    style={{
                      fontSize: 12.5,
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
}: {
  option: AllergyOption;
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
      accessibilityLabel={option.label}
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

      {/* Label */}
      <Text
        style={{
          color: selected ? colors.text : colors.textSecondary,
          fontSize: 14.5,
          lineHeight: 19,
          fontWeight: selected ? '700' : '500',
          flex: 1,
        }}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2 — IDENTITY
// ══════════════════════════════════════════════════════════════
export function IdentityScreen({
  name,
  onChange,
  colors,
  isDark,
  reduceMotion = false,
}: {
  name: string;
  onChange: (name: string) => void;
  colors: any;
  isDark: boolean;
  reduceMotion?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const { width, height } = useWindowDimensions();
  const compositionScale = clamp(width / 390, 0.82, 1.04);
  const verticalScale = clamp(height / 844, 0.88, 1.06);
  const mascotSize = Math.round(200 * compositionScale);
  const compositionMinHeight = Math.round(clamp(height * 0.38, 280, 350));

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,
      }}
    >
      <AssistantCard isDark={isDark} />

      <View
        style={{
          flex: 1,
          minHeight: compositionMinHeight,
          marginTop: 10,
          marginBottom: 12,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Layer 1: Food emoji stickers positioned around the mascot. */}
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
          subtitle="Tell us your name so we can **personalize BiteFix for you.**"
          colors={colors}
        />
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3 — CONTEXT
// ══════════════════════════════════════════════════════════════
export function ContextScreen({ selected, onSelect, colors, isDark, reduceMotion }: { selected?: ShoppingFrequency; onSelect: (value: ShoppingFrequency) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const options: Array<{
    id: ShoppingFrequency;
    label: string;
    emoji: string;
    stickerBg: string;
    stickerBorder: string;
    stickerShadow: string;
    stickerRotation: string;
    stickerSide: 'left' | 'right';
  }> = [
      {
        id: 'rarely',
        label: "I don't buy packaged food",
        emoji: '🥦',
        stickerBg: isDark ? '#202C22' : '#F4FAF3',
        stickerBorder: isDark ? '#344C38' : '#1ADB13',
        stickerShadow: '#4F8A43',
        stickerRotation: '-8deg',
        stickerSide: 'right',
      },
      {
        id: 'often',
        label: 'I buy packaged food weekly',
        emoji: '🛒',
        stickerBg: isDark ? '#2B2818' : '#FFF9E9',
        stickerBorder: isDark ? '#564F27' : '#FFCC00',
        stickerShadow: '#B38A24',
        stickerRotation: '8deg',
        stickerSide: 'right',
      },
      {
        id: 'sometimes',
        label: 'I buy packaged food monthly',
        emoji: '📅',
        stickerBg: isDark ? '#20252C' : '#F3F7FF',
        stickerBorder: isDark ? '#384A61' : '#4E8BFF',
        stickerShadow: '#5575A8',
        stickerRotation: '-6deg',
        stickerSide: 'right',
      },
      {
        id: 'most_trips',
        label: 'I buy snacks daily',
        emoji: '🍿',
        stickerBg: isDark ? '#2C2020' : '#FFF6F3',
        stickerBorder: isDark ? '#563333' : '#FB3802',
        stickerShadow: '#B64E3B',
        stickerRotation: '10deg',
        stickerSide: 'right',
      },
    ];

  return (
    <ScreenFrame>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <OrbMascot state="thinking" size={82} reduceMotion={reduceMotion} accessibilityLabel="Curious BiteFix scanner mascot" />
      </View>

      <ScreenHeading
        title="How often do you buy **packaged food**?"
        subtitle="This helps BiteFix **tune the experience** to your buying habits."
        colors={colors}
      />

      <View style={{ gap: 2, marginTop: 2 }}>
        {options.map((option) => (
          <ContextOptionRow
            key={option.id}
            label={option.label}
            emoji={option.emoji}
            stickerBg={option.stickerBg}
            stickerBorder={option.stickerBorder}
            stickerShadow={option.stickerShadow}
            stickerRotation={option.stickerRotation}
            stickerSide={option.stickerSide}
            selected={selected === option.id}
            onPress={() => onSelect(option.id)}
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
// SCREEN 5 — ALLERGIES (moved after the pain point and instant insight)
// ══════════════════════════════════════════════════════════════
export function AllergyScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return (
    <ScreenFrame>
      <ShieldStatusBar selected={selected} colors={colors} isDark={isDark} />
      <ScreenHeading
        title="Anything we should **watch for you**?"
        subtitle=""
        colors={colors}
      />
      <View style={{ gap: 10, marginTop: -20 }}>
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
// SCREEN 4 — LABEL READING BEHAVIOR
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
          subtitle="Tell us how often you actually stop to check."
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
// SCREEN 4 — PAIN POINT (shown before allergies by the host flow)
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
        title="What makes it hard to choose from the **label** ?"
        subtitle=""
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
// SCREEN 7 — PRIORITIES
// ══════════════════════════════════════════════════════════════
export function PrioritiesScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: OnboardingPriority[]; onToggle: (id: OnboardingPriority) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  return (
    <ScreenFrame>
      <PriorityStatusBar selected={selected} colors={colors} isDark={isDark} />
      <ScreenHeading
        title="What should BiteFix **surface first**?"
        subtitle="Pick what matters — it goes to the top of every scan."
        colors={colors}
      />
      <View style={{ gap: 9, marginTop: 4 }}>
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
// SCREEN 6 — INSTANT INSIGHT SCORE REVEAL HERO (LIQUID MERCURY EDITION)
// ══════════════════════════════════════════════════════════════
const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

const SURGE_SPARK_ANGLES = [15, 75, 135, 195, 255, 315].map((deg) => (deg * Math.PI) / 180);

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
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 18,
          backgroundColor: isDark ? '#06130A' : '#07180D',
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
        }}
      >
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
            zIndex: 6,
          }}
        >
          <Sparkles size={11} color="#291500" strokeWidth={2.8} />
          <Text style={{ color: '#291500', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }}>
            UNLOCKED
          </Text>
        </Animated.View>

        <Text style={{ color: isDark ? '#A3E635' : '#84CC16', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
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
}: {
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
  onAnimationComplete?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = clamp(width * 0.0615, 18, 24);
  const isCompact = height < 700;

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: horizontalPadding,
        paddingTop: isCompact ? 10 : 20,
        paddingBottom: isCompact ? 16 : 28,
        justifyContent: 'space-between',
      }}
    >
      {/* Upper/Middle Hero Area — spacious, commanding hero */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: isCompact ? 240 : 280,
        }}
      >
        <MascotScoreRingTeaser
          colors={colors}
          isDark={isDark}
          reduceMotion={reduceMotion}
          isActive={isActive}
          onAnimationComplete={onAnimationComplete}
        />
      </View>

      {/* Lower Content Area — clean, de-congested typography block */}
      <View style={{ alignItems: 'center', width: '100%', marginBottom: isCompact ? 8 : 16 }}>
        {/* Title — 2 distinct lines with tasteful green accent */}
        <View style={{ alignItems: 'center', marginBottom: 8, maxWidth: 360 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: clamp(width * 0.086, 30, 35),
              lineHeight: clamp(width * 0.102, 36, 42),
              fontWeight: '900',
              letterSpacing: -0.9,
              textAlign: 'center',
            }}
          >
            BiteFix Intelligence
          </Text>
          <Text
            style={{
              color: GREEN,
              fontSize: clamp(width * 0.086, 30, 35),
              lineHeight: clamp(width * 0.102, 36, 42),
              fontWeight: '900',
              letterSpacing: -0.9,
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
          Your assistant is powered up — turn labels into answers in seconds.
        </Text>
      </View>
    </View>
  );
}

export function MomentOfTruthScreen({
  selected,
  name,
  colors,
  isDark,
  reduceMotion,
  isActive = true,
  shoppingFrequency,
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
  shoppingFrequency?: ShoppingFrequency;
  ingredientReadingFrequency?: IngredientReadingFrequency;
  allergens: string[];
  onAnimationComplete?: () => void;
}) {
  const profileName = name?.trim() ? name : 'guest';
  const frequencyText = shoppingFrequency === 'rarely' ? 'occasional' : shoppingFrequency === 'sometimes' ? 'monthly' : shoppingFrequency === 'often' ? 'weekly' : 'daily';
  
  const allergenCount = allergens.filter(id => id !== 'none').length;
  const allergenText = allergens.includes('none') ? 'No allergies' : `Watching ${allergenCount} substance${allergenCount === 1 ? '' : 's'}`;
  
  const priorityCount = selected.length;
  const priorityText = `${priorityCount} scanner module${priorityCount === 1 ? '' : 's'}`;

  const checklistItems = [
    `Configuring profile for ${profileName}...`,
    `Analyzing ${frequencyText} packaged food frequency...`,
    `Arming allergen safeguard: ${allergenText}...`,
    `Injecting engine priorities: ${priorityText}...`,
  ];

  const [stepStates, setStepStates] = useState<('pending' | 'loading' | 'complete')[]>(['pending', 'pending', 'pending', 'pending']);
  
  const step1Val = useRef(new Animated.Value(0)).current;
  const step2Val = useRef(new Animated.Value(0)).current;
  const step3Val = useRef(new Animated.Value(0)).current;
  const step4Val = useRef(new Animated.Value(0)).current;
  const stepsAnim = [step1Val, step2Val, step3Val, step4Val];

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive || reduceMotion) {
      spinValue.setValue(0);
      return;
    }
    const spinAnim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    spinAnim.start();
    return () => spinAnim.stop();
  }, [isActive, reduceMotion]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (reduceMotion) {
      setStepStates(['complete', 'complete', 'complete', 'complete']);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      stepsAnim.forEach(val => val.setValue(1));
      return;
    }

    if (!isActive) {
      setStepStates(['pending', 'pending', 'pending', 'pending']);
      stepsAnim.forEach(val => val.setValue(0));
      return;
    }

    // Reset
    setStepStates(['loading', 'pending', 'pending', 'pending']);
    stepsAnim.forEach(val => val.setValue(0));

    // Staggered step fade-in triggers
    Animated.timing(step1Val, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
      isInteraction: false,
    }).start();

    const t1 = setTimeout(() => {
      setStepStates(['complete', 'loading', 'pending', 'pending']);
      Animated.timing(step2Val, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        isInteraction: false,
      }).start();
    }, 900);

    const t2 = setTimeout(() => {
      setStepStates(['complete', 'complete', 'loading', 'pending']);
      Animated.timing(step3Val, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        isInteraction: false,
      }).start();
    }, 1800);

    const t3 = setTimeout(() => {
      setStepStates(['complete', 'complete', 'complete', 'loading']);
      Animated.timing(step4Val, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        isInteraction: false,
      }).start();
    }, 2700);

    const t4 = setTimeout(() => {
      setStepStates(['complete', 'complete', 'complete', 'complete']);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isActive, reduceMotion]);

  return (
    <ScreenFrame>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
        }}
      >
        {/* Title */}
        <ScreenHeading
          title="Synthesizing your **BiteFix scanner**..."
          subtitle="Compiling custom parameters based on your profile inputs."
          colors={colors}
          align="center"
        />

        {/* Beautiful high-tech circular LED rotating loader */}
        <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginVertical: 32 }}>
          <Animated.View style={{
            position: 'absolute',
            width: 130,
            height: 130,
            transform: reduceMotion ? [] : [{ rotate: spin }],
          }}>
            <Svg width={130} height={130} viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="44"
                stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}
                strokeWidth="3.5"
                fill="none"
              />
              <Circle
                cx="50"
                cy="50"
                r="44"
                stroke="#14ae97"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray="276.4"
                strokeDashoffset="80"
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
          <OrbMascot
            state={stepStates[3] === 'complete' ? 'happy' : 'thinking'}
            size={76}
            reduceMotion={reduceMotion}
            accessibilityLabel="Synthesizing BiteFix scanner mascot"
          />
        </View>

        {/* Staggered checklist */}
        <View style={{ width: '100%', gap: 10 }}>
          {checklistItems.map((item, index) => {
            const state = stepStates[index];
            const opacityVal = stepsAnim[index];
            const isComplete = state === 'complete';
            const isLoading = state === 'loading';

            return (
              <Animated.View
                key={index}
                style={{
                  opacity: opacityVal,
                  transform: [{
                    translateY: opacityVal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  }],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1.25,
                  borderColor: isLoading
                    ? isDark ? 'rgba(20, 174, 151, 0.3)' : 'rgba(7, 25, 15, 0.15)'
                    : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  backgroundColor: isLoading
                    ? isDark ? '#06180E' : 'rgba(20, 174, 151, 0.04)'
                    : isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                }}
              >
                {/* Status LED / Checkmark */}
                <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
                  {isComplete ? (
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#14ae97',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#13f5b0',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 3,
                      elevation: 2,
                    }}>
                      <Check size={11} color="#FFFFFF" strokeWidth={3.5} />
                    </View>
                  ) : isLoading ? (
                    <LedLight active={true} color="#e58b42" glow="#ffaa66" />
                  ) : (
                    <View style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      borderWidth: 1.5,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                    }} />
                  )}
                </View>

                {/* Checklist Label */}
                <Text style={{
                  color: isComplete
                    ? colors.text
                    : isLoading
                      ? isDark ? '#FFFFFF' : '#12311E'
                      : colors.textSecondary,
                  fontSize: 13.5,
                  fontWeight: isComplete || isLoading ? '700' : '500',
                  flex: 1,
                }}>
                  {item}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </ScreenFrame>
  );
}


// ══════════════════════════════════════════════════════════════
// SCREEN 10 — FINAL ACTIVATION
// ══════════════════════════════════════════════════════════════
const FINAL_FEATURE_PILLS = [
  'Processing',
  'Nutrition',
  'Allergens',
  'Ingredients',
  'Additives',
  'Sugar',
  'Eco Impact',
] as const;

export function FinalActivationScreen({
  colors,
  isDark,
  reduceMotion,
  isActive = true,
  selected = [],
}: {
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  isActive?: boolean;
  selected?: OnboardingPriority[];
}) {
  const { width, height } = useWindowDimensions();
  const orbit = useRef(new Animated.Value(0)).current;

  const compact = width < 360;
  const radius = clamp(Math.min(width * 0.29, height * 0.15), compact ? 92 : 104, 118);
  const orbSize = Math.round(clamp(width * 0.235, 78, 94));
  const pillWidth = clamp(width * 0.17, 62, 72);

  useEffect(() => {
    if (reduceMotion || !isActive) {
      orbit.stopAnimation();
      orbit.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );

    animation.start();
    return () => {
      animation.stop();
      orbit.stopAnimation();
    };
  }, [isActive, orbit, reduceMotion]);

  const rotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterRotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: clamp(width * 0.06, 20, 28),
        paddingVertical: clamp(height * 0.03, 18, 28),
      }}
      accessible
      accessibilityLabel="Your BiteFix scanner is ready"
    >
      <Text
        style={{
          color: colors.text,
          fontSize: clamp(width * 0.062, 23, 26),
          lineHeight: clamp(width * 0.078, 30, 34),
          fontWeight: '900',
          letterSpacing: -0.45,
          textAlign: 'center',
          marginBottom: 7,
        }}
      >
        Your BiteFix Scanner Is Ready
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: clamp(width * 0.034, 12.5, 14),
          lineHeight: clamp(width * 0.052, 19, 21),
          fontWeight: '500',
          textAlign: 'center',
          maxWidth: 350,
          marginBottom: clamp(height * 0.04, 28, 38),
        }}
      >
        Scan a product and let BiteFix turn available food data into a clear snapshot.
      </Text>

      <View
        style={{
          width: radius * 2,
          height: radius * 2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: clamp(height * 0.03, 18, 28),
        }}
      >
        <OrbMascot
          state="happy"
          size={orbSize}
          reduceMotion={reduceMotion}
          accessibilityLabel="Happy BiteFix scanner mascot"
        />

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: radius * 2,
            height: radius * 2,
            transform: reduceMotion ? [] : [{ rotate }],
          }}
        >
          {FINAL_FEATURE_PILLS.map((pill, index) => {
            const angle = (index / FINAL_FEATURE_PILLS.length) * Math.PI * 2;
            const r = radius - 16;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            return (
              <Animated.View
                key={pill}
                style={{
                  position: 'absolute',
                  left: radius + x - pillWidth / 2,
                  top: radius + y - 12,
                  width: pillWidth,
                  alignItems: 'center',
                  transform: reduceMotion ? [] : [{ rotate: counterRotate }],
                }}
              >
                <View
                  style={{
                    minWidth: pillWidth,
                    backgroundColor: isDark
                      ? 'rgba(20, 24, 22, 0.95)'
                      : 'rgba(255, 255, 255, 0.96)',
                    borderRadius: 12,
                    paddingHorizontal: 7,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: `${GREEN}50`,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.25 : 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.text,
                      fontSize: clamp(width * 0.024, 8.5, 9.5),
                      fontWeight: '800',
                      textAlign: 'center',
                    }}
                  >
                    {pill}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>

      <Text
        style={{
          color: GREEN,
          fontSize: 10.5,
          fontWeight: '900',
          letterSpacing: 2.3,
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        Ready when you are
      </Text>

      {/* Profile scan result card rendered directly below the mascot */}
      <View style={{ width: '100%', marginTop: 8 }}>
        <MomentResultCard colors={colors} isDark={isDark} selected={selected} />
      </View>
    </View>
  );
}