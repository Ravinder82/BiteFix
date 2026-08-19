import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, Check, Droplets, Leaf, Package, ShieldCheck, UserRound } from 'lucide-react-native';
import { OrbMascot } from '../features/OrbMascot';
import {
  InsightTransformVisual,
  LabelCompressionVisual,
  MomentResultCard,
  PriorityConstellation,
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
    emoji: '✨',
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
  const accentColor = accent || GREEN;

  return (
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
          borderWidth: 1.25,
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.085)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.60)',
        }}
      >
        {/* Neutral card; selection is communicated only by the LED. */}
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: GREEN,
              opacity: ledHaloOpacity,
              transform: [{ scale: ledHaloScale }],
            }}
          />
          <Animated.View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: GREEN,
              opacity: ledProgress,
              transform: [{ scale: ledCoreScale }],
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

function AllergyOptionTile({
  option,
  selected,
  onPress,
  colors,
  isDark,
  reduceMotion,
  style,
}: {
  option: AllergyOption;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
  reduceMotion: boolean;
  style?: any;
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

  const stickerBg = isDark ? 'rgba(255,255,255,0.08)' : option.stickerBg;
  const stickerBorder = isDark ? 'rgba(150,255,170,0.72)' : option.stickerBorder;
  const stickerShadow = isDark ? GREEN : option.stickerShadow;
  const ledHaloOpacity = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] });
  const ledHaloScale = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const ledCoreScale = ledProgress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <View style={[{ marginTop: 18 }, style]}>
      <EmojiSticker
        emoji={option.emoji}
        bg={stickerBg}
        border={stickerBorder}
        shadowC={stickerShadow}
        rotation={option.stickerRotation}
        size={36}
        style={{ top: -34, ...(option.stickerSide === 'left' ? { left: 8 } : { right: 8 }) }}
      />

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.86}
        accessibilityRole="checkbox"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        style={{
          minHeight: option.id === 'none' ? 70 : 86,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 13,
          borderRadius: 18,
          borderWidth: 1.25,
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.085)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.60)',
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 29,
              height: 29,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: GREEN,
              opacity: ledHaloOpacity,
              transform: [{ scale: ledHaloScale }],
            }}
          />
          <Animated.View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: GREEN,
              opacity: ledProgress,
              transform: [{ scale: ledCoreScale }],
            }}
          />
        </View>

        <Text style={{ color: colors.text, fontSize: 13.5, lineHeight: 18, fontWeight: '700', flex: 1 }}>
          {option.label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1 — IDENTITY
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
          minHeight: 310,
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
          size={50}
          style={{ left: '50%', top: '50%', transform: [{ translateX: -140 }, { translateY: -78 }, { rotate: '-12deg' }] }}
        />
        <EmojiSticker
          emoji="🍎"
          bg={isDark ? '#2C2020' : '#FFF6F3'}
          border={isDark ? '#563333' : '#fb3802ff'}
          shadowC="#B64E3B"
          rotation="11deg"
          size={55}
          style={{ left: '50%', top: '50%', transform: [{ translateX: 100 }, { translateY: -140 }, { rotate: '11deg' }] }}
        />
        <EmojiSticker
          emoji="🥦"
          bg={isDark ? '#202C22' : '#F4FAF3'}
          border={isDark ? '#344C38' : '#1adb13ff'}
          shadowC="#4F8A43"
          rotation="-8deg"
          size={60}
          style={{ left: '50%', top: '50%', transform: [{ translateX: -130 }, { translateY: 60 }, { rotate: '-8deg' }] }}
        />
        <EmojiSticker
          emoji="🍋"
          bg={isDark ? '#2B2818' : '#FFF9E9'}
          border={isDark ? '#564F27' : '#ffcc00ff'}
          shadowC="#B38A24"
          rotation="14deg"
          size={60}
          style={{ left: '50%', top: '50%', transform: [{ translateX: 90 }, { translateY: 60 }, { rotate: '14deg' }] }}
        />

        {/* Layer 2: Glass Pills (Outer Layer - positioned further away to frame composition) */}
        <PillSticker
          label="Personalized just for you"
          icon={<UserRound size={15} color="#D7FFE2" strokeWidth={2.3} />}
          bg="#14ae97ff"
          border="#13f5b0"
          textColor="#F3FFF6"
          shadowC="#073A1B"
          style={{ left: '50%', top: '50%', transform: [{ translateX: -160 }, { translateY: -150 }] }}
        />
        <PillSticker
          label="Your privacy is protected"
          icon={<ShieldCheck size={15} color="#D7F4FF" strokeWidth={2.3} />}
          bg="#7ec201ff"
          border="#a3cb48"
          textColor="#F4FFFF"
          shadowC="#103C3F"
          style={{ left: '50%', top: '50%', transform: [{ translateX: -30 }, { translateY: 140 }] }}
        />

        {/* Layer 3: Centered Mascot Container */}
        <View
          style={{
            width: 174,
            height: 174,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6,
          }}
        >
          <OrbMascot
            state="idle"
            size={200}
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
// SCREEN 3 — ALLERGY
// ══════════════════════════════════════════════════════════════
export function AllergyScreen({ selected, onToggle, colors, isDark, reduceMotion }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean; reduceMotion: boolean }) {
  const mascotState = selected.some((id) => id !== 'none') ? 'caution' : selected.includes('none') ? 'happy' : 'thinking';

  const none = ALLERGEN_OPTIONS[0];
  const dairy = ALLERGEN_OPTIONS[1];
  const gluten = ALLERGEN_OPTIONS[2];
  const nuts = ALLERGEN_OPTIONS[3];
  const soy = ALLERGEN_OPTIONS[4];
  const eggs = ALLERGEN_OPTIONS[5];

  return (
    <ScreenFrame>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <OrbMascot
          state={mascotState}
          size={88}
          reduceMotion={reduceMotion}
          showShadow={false}
          accessibilityLabel="BiteFix assistant helping set allergy preferences"
        />
      </View>
      <ScreenHeading
        title="Anything we should **watch for you** ?"
        subtitle="Tell BiteFix what Ingredients to watch for in the **available product data**."
        colors={colors}
      />
      <View style={{ gap: 10, marginTop: 2 }}>
        <AllergyOptionTile
          option={none}
          selected={selected.includes(none.id)}
          onPress={() => onToggle(none.id)}
          colors={colors}
          isDark={isDark}
          reduceMotion={reduceMotion}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AllergyOptionTile
            option={dairy}
            selected={selected.includes(dairy.id)}
            onPress={() => onToggle(dairy.id)}
            colors={colors}
            isDark={isDark}
            reduceMotion={reduceMotion}
            style={{ flex: 1 }}
          />
          <AllergyOptionTile
            option={gluten}
            selected={selected.includes(gluten.id)}
            onPress={() => onToggle(gluten.id)}
            colors={colors}
            isDark={isDark}
            reduceMotion={reduceMotion}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AllergyOptionTile
            option={nuts}
            selected={selected.includes(nuts.id)}
            onPress={() => onToggle(nuts.id)}
            colors={colors}
            isDark={isDark}
            reduceMotion={reduceMotion}
            style={{ flex: 1 }}
          />
          <AllergyOptionTile
            option={soy}
            selected={selected.includes(soy.id)}
            onPress={() => onToggle(soy.id)}
            colors={colors}
            isDark={isDark}
            reduceMotion={reduceMotion}
            style={{ flex: 1 }}
          />
        </View>

        <AllergyOptionTile
          option={eggs}
          selected={selected.includes(eggs.id)}
          onPress={() => onToggle(eggs.id)}
          colors={colors}
          isDark={isDark}
          reduceMotion={reduceMotion}
        />
      </View>
    </ScreenFrame>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4 — PAIN
// ══════════════════════════════════════════════════════════════
export function PainScreen({ selected, onSelect, colors, isDark, reduceMotion, isActive = true }: { selected?: IngredientReadingFrequency; onSelect: (value: IngredientReadingFrequency) => void; colors: any; isDark: boolean; reduceMotion: boolean; isActive?: boolean }) {
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
      <LabelCompressionVisual colors={colors} isDark={isDark} reduceMotion={reduceMotion} isActive={isActive} />
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
      <InsightTransformVisual colors={colors} isDark={isDark} />
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
      {/* Static profile summary: the screen is ready as soon as it opens. */}
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
      <MomentResultCard colors={colors} isDark={isDark} selected={selected} />
    </ScreenFrame>
  );
}
