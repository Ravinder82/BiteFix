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
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot } from '../../components/features/OrbMascot';
import { MagicalBackground } from '../../components/features/MagicalBackground';
import { ArrowRight, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Line,
  Text as SvgText,
  Circle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────
// Custom Animated Shadow Component for Floating Mascot
// ─────────────────────────────────────────────────────────
function MascotShadow({ size, scaleStyle }: { size: number; scaleStyle: any }) {
  return (
    <Animated.View style={[{ width: size, height: size * 0.15, alignSelf: 'center' }, scaleStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 15">
        <Defs>
          <SvgRadialGradient id="shadowG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx="50" cy="7.5" r="50" fill="url(#shadowG)" />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// Animated Comic-Style Thought Bubble for Mascot
// ─────────────────────────────────────────────────────────
function ThoughtBubble({ text, visible }: { text: string; visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && text) {
      scale.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 200 }));
      opacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, text]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!text) return null;

  return (
    <Animated.View style={[{
      position: 'absolute',
      right: -70,
      top: -80,
      width: 140,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 12,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1.5,
      borderColor: '#FFD54F',
      zIndex: 100,
    }, animStyle]}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#B26A00', lineHeight: 14, textAlign: 'center' }}>
        {text}
      </Text>
      {/* Little tail pointing to mascot */}
      <View style={{
        position: 'absolute',
        bottom: -6,
        left: 30,
        width: 12,
        height: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1.5,
        borderRightWidth: 1.5,
        borderColor: '#FFD54F',
        transform: [{ rotate: '45deg' }],
      }} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide Helper Card: Scanner + Teaspoons Combined
// ─────────────────────────────────────────────────────────
function ScannerTeaspoonCard({ cardW, C }: { cardW: number; C: any }) {
  const scanLineY = useSharedValue(0);
  useEffect(() => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const lineAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }]
  }));

  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * 0.70;

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      aspectRatio: 1.8,
    }}>
      {/* Left: Glowing Barcode Scanner SVG */}
      <View style={{
        flex: 1,
        height: '100%',
        borderRadius: 16,
        backgroundColor: '#000000', // Dark contrast for glow
        borderWidth: 2,
        borderColor: '#FFD54F',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute' }}>
          <Defs>
            <SvgRadialGradient id="scanGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="80" fill="url(#scanGlow)" />
          {/* HD Barcode Lines */}
          <Path d="M20 20 L20 80 M30 20 L30 80 M40 20 L40 80 M45 20 L45 80 M55 20 L55 80 M65 20 L65 80 M75 20 L75 80" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.6" strokeLinecap="round" />
          <Path d="M25 20 L25 80 M35 20 L35 80 M50 20 L50 80 M60 20 L60 80 M70 20 L70 80 M80 20 L80 80" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />
        </Svg>
        <Animated.View style={[
          {
            position: 'absolute',
            top: -5,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: '#FF3B30', // Red laser
            shadowColor: '#FF3B30',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 10,
          },
          lineAnimStyle
        ]} />
      </View>

      {/* Right: Teaspoon gauge conversion */}
      <View style={{
        flex: 1,
        height: '100%',
        borderRadius: 16,
        backgroundColor: '#000000', // Dark contrast for glow to match left side
        borderWidth: 2,
        borderColor: '#FFD54F',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute' }}>
          <Defs>
            <SvgRadialGradient id="gaugeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="80" fill="url(#gaugeGlow)" />
        </Svg>
        <View style={{ width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width="90" height="90" viewBox="0 0 90 90" style={{ position: 'absolute' }}>
            <Defs>
              <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FF9500" stopOpacity="1" />
                <Stop offset="100%" stopColor="#E8820C" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx="45" cy="45" r={radius} stroke="#333333" strokeWidth={strokeWidth} fill="none" />
            <Circle
              cx="45"
              cy="45"
              r={radius}
              stroke="url(#ringGrad)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${progress} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
            />
          </Svg>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>4.2</Text>
          <Text style={{ color: '#FFD54F', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.0, marginTop: -2 }}>tsp</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 4: Progress Chart Card (HD Glowing Trendline)
// ─────────────────────────────────────────────────────────
function ProgressCard({ cardW, C }: { cardW: number; C: any }) {
  const linePath = "M10 100 Q40 60 80 80 T160 60 T250 20";
  const areaPath = `${linePath} L250 140 L10 140 Z`;

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#34C759',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
      aspectRatio: 1.4,
    }}>
      <View style={{
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000000',
        borderWidth: 2,
        borderColor: '#34C759',
        position: 'relative'
      }}>
        <Svg width="100%" height="100%" viewBox="0 0 260 140" preserveAspectRatio="none" style={{ position: 'absolute' }}>
          <Defs>
            <SvgLinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#34C759" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#34C759" stopOpacity="0" />
            </SvgLinearGradient>
            <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#34C759" />
              <Stop offset="100%" stopColor="#A4E3B4" />
            </SvgLinearGradient>
          </Defs>

          {/* Background Grid Lines */}
          <Path d="M0 35 L260 35 M0 70 L260 70 M0 105 L260 105" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="4 4" />

          <Path d={areaPath} fill="url(#chartGrad)" />
          <Path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="6" strokeLinecap="round" />

          {/* Glowing Data Points */}
          <Circle cx="80" cy="80" r="5" fill="#000000" stroke="#34C759" strokeWidth="3" />
          <Circle cx="160" cy="60" r="5" fill="#000000" stroke="#34C759" strokeWidth="3" />
          <Circle cx="250" cy="20" r="7" fill="#FFFFFF" stroke="#34C759" strokeWidth="4" />
          {/* Outer glow ring for latest point */}
          <Circle cx="250" cy="20" r="14" fill="none" stroke="#34C759" strokeWidth="2" strokeOpacity="0.5" />
        </Svg>

        <View style={{ position: 'absolute', right: 12, top: 12, backgroundColor: '#34C759', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, shadowColor: '#34C759', shadowOpacity: 0.8, shadowRadius: 8, elevation: 5 }}>
          <Text style={{ color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>TARGET ZONE</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 1: Personalized Name Question Card
// ─────────────────────────────────────────────────────────
function NameCard({
  cardW,
  C,
  value,
  onChange,
}: {
  cardW: number;
  C: any;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: value.trim() ? C.amber : C.cardBorder,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 6,
        backgroundColor: C.cardInner,
      }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Enter your name"
          placeholderTextColor={C.textMuted}
          style={{
            flex: 1,
            color: C.text,
            fontSize: 16,
            fontWeight: '600',
          }}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={20}
        />
      </View>
      <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 10, lineHeight: 15 }}>
        Your name is kept private and used only to personalize your tracking experience.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 2: Primary Goal Card (4 Options)
// ─────────────────────────────────────────────────────────
type GoalOption = 'energy' | 'weight' | 'medical' | 'mental' | 'none';

function GoalCard({
  cardW,
  C,
  selected,
  onSelect,
}: {
  cardW: number;
  C: any;
  selected: GoalOption;
  onSelect: (val: GoalOption) => void;
}) {
  const options: { label: string; value: GoalOption }[] = [
    { label: "Boost daily Energy", value: 'energy' },
    { label: "Lose Weight", value: 'weight' },
    { label: "Manage Blood Sugar", value: 'medical' },
    { label: "Build Healthy Eating Habits", value: 'mental' },
  ];

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    }}>
      <View style={{ gap: 8 }}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.value);
              }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isSelected ? C.amberLight : C.cardInner,
                borderColor: isSelected ? C.amber : C.cardBorder,
                borderWidth: 1.5,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>
                {opt.label}
              </Text>
              <View style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: isSelected ? C.amber : C.textMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber }} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 5: Setup Complete Payoff Screen
// ─────────────────────────────────────────────────────────
function SetupCompleteCard({
  cardW,
  C,
}: {
  cardW: number;
  C: any;
}) {
  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 32,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 32,
      elevation: 8,
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: 1.2,
      overflow: 'hidden',
    }}>
      <Svg style={{ position: 'absolute' }} width="100%" height="100%" viewBox="0 0 200 200">
        <Defs>
          <SvgRadialGradient id="celebrationGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFC107" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx="100" cy="100" r="100" fill="url(#celebrationGlow)" />
        {/* Animated Burst Lines */}
        <Path d="M100 20 L100 40 M100 160 L100 180 M20 100 L40 100 M160 100 L180 100 M43 43 L57 57 M143 143 L157 157 M157 43 L143 57 M43 157 L57 143" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
      </Svg>

      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFD54F',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}>
        <Text style={{ color: C.amber, fontSize: 16, fontWeight: '900', textAlign: 'center', lineHeight: 26 }}>
          We Welcome you on your SugarFree Lifestyle
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide Definitions
// ─────────────────────────────────────────────────────────
interface SlideData {
  step: number;
  title: string;
  highlight: string;
  subtitle: string;
  buttonLabel: string;
  isLast: boolean;
  mascotState: 'idle' | 'happy' | 'shocked' | 'dizzy';
}

const SLIDES: SlideData[] = [
  {
    step: 1,
    title: "Welcome! What's your name?",
    highlight: "What's your name?",
    subtitle: "Let's personalize your path to a sugar-free lifestyle.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 2,
    title: "Describe Your Goals",
    highlight: "Goals",
    subtitle: "Choose What Brings you on this App",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'idle',
  },
  {
    step: 3,
    title: 'Real Time Sugar Scanner',
    highlight: 'Sugar Scanner',
    subtitle: 'Scan product barcodes and see abstract grams instantly converted into teaspoons.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 4,
    title: 'Log your Blood Sugar.',
    highlight: 'Blood Sugar.',
    subtitle: 'Log fasting and post-meal readings to manage clinical blood sugar trends.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 5,
    title: "Your Setup is Complete",
    highlight: "Setup is Complete",
    subtitle: "We're ready to start this life-changing journey together.",
    buttonLabel: 'Get Started',
    isLast: true,
    mascotState: 'happy',
  },
];

// ─────────────────────────────────────────────────────────
// Main Onboarding Screen
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Questionnaire states
  const [userName, setUserName] = useState('');
  const [userGoal, setUserGoal] = useState<GoalOption>('none');

  const { setOnboardingComplete, setProfile } = useAppStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Dynamic colors adapted for light/dark themes
  const C = {
    bg: colors.background,
    card: colors.surface,
    cardBorder: colors.border,
    cardInner: colors.surfaceRaised,
    amber: colors.primary,
    amberLight: colors.primary + '15',
    amberMid: colors.secondary,
    text: colors.text,
    textSub: colors.textSecondary,
    textMuted: colors.textMuted,
    green: colors.success,
    greenLight: colors.success + '15',
    red: colors.error,
    redLight: colors.error + '15',
  };

  // ───────────────────────────────────────────────────────
  // Shared Animation Values
  // ───────────────────────────────────────────────────────
  const floatY = useSharedValue(0);
  const mascotScaleX = useSharedValue(1);
  const mascotScaleY = useSharedValue(1);
  const jumpY = useSharedValue(0);

  const cardOpacity = useSharedValue(1);
  const cardTranslateX = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const textOpacity = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const buttonScale = useSharedValue(1);
  const shineX = useSharedValue(-200);

  // ───────────────────────────────────────────────────────
  // Animation Triggers
  // ───────────────────────────────────────────────────────
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    mascotScaleX.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    mascotScaleY.value = withRepeat(
      withSequence(
        withTiming(0.97, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    shineX.value = withRepeat(
      withSequence(
        withTiming(width, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withDelay(2000, withTiming(-width, { duration: 0 }))
      ),
      -1,
      false
    );

    buttonScale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [width]);

  // Handle screen transition animations
  useEffect(() => {
    jumpY.value = withSequence(
      withTiming(-25, { duration: 180, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 11, stiffness: 130 })
    );

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

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 12, stiffness: 350 });
  };
  const handlePressOut = () => {
    buttonScale.value = withSpring(1.0, { damping: 12, stiffness: 350 });
  };

  const handleNext = async () => {
    // Validation triggers
    if (currentSlide === 0) {
      if (!userName.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }
    if (currentSlide === 1) {
      if (userGoal === 'none') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    // Camera permission request during feature showcase
    if (currentSlide === 2) {
      try {
        await Camera.requestCameraPermissionsAsync();
      } catch (_) { }
    }

    if (currentSlide < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentSlide((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Save profile config
      setProfile({
        userName: userName.trim(),
        userGoal,
      });
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    if (currentSlide === 1 && userGoal === 'none') return true;
    return false;
  };

  const slide = SLIDES[currentSlide];
  const isShort = height < 700;
  const isNarrow = width < 375;
  const orbSize = Math.min(Math.round(width * 0.42), 170);
  const cardW = Math.min(width - 32, 400);

  const renderTitle = () => {
    const textSlide = SLIDES[currentTextIndex];
    const parts = textSlide.title.split(textSlide.highlight);
    return (
      <Text
        style={{
          color: C.text,
          fontSize: isShort ? 20 : isNarrow ? 20 : 24,
          fontWeight: '900',
          textAlign: 'center',
          letterSpacing: -0.5,
          lineHeight: isShort ? 26 : 32,
        }}
      >
        {parts[0]}
        <Text style={{ color: C.amberMid }}>{textSlide.highlight}</Text>
        {parts[1] ?? ''}
      </Text>
    );
  };

  const mascotAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: floatY.value + jumpY.value },
        { scaleX: mascotScaleX.value },
        { scaleY: mascotScaleY.value },
      ],
    };
  });

  const shadowScaleStyle = useAnimatedStyle(() => {
    const totalY = floatY.value + jumpY.value;
    const ratio = Math.max(0.4, 1 + totalY / 60);
    return {
      transform: [{ scaleX: ratio }, { scaleY: ratio }],
      opacity: ratio,
    };
  });

  const cardAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [
        { translateX: cardTranslateX.value },
        { scale: cardScale.value }
      ],
    };
  });

  const textAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  const buttonAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const shineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shineX.value }],
    };
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + (isShort ? 6 : 12),
            paddingBottom: Math.max(insets.bottom, 16) + (isShort ? 4 : 8),
            paddingHorizontal: 24,
            justifyContent: 'space-between',
            minHeight: height - insets.top - insets.bottom,
          }}
        >
          {/* ── 2. Middle Section: Vertical Stacking of Mascot and Card ── */}
          <View style={{ flex: 1, justifyContent: 'center', marginVertical: isShort ? 10 : 20 }}>
            {/* A. Mascot floating container */}
            <View style={{ height: orbSize + 20, justifyContent: 'center', marginBottom: isShort ? 4 : 8, zIndex: 10 }}>
              <MagicalBackground />
              <Animated.View style={[{ alignSelf: 'center', position: 'relative' }, mascotAnimStyle]}>
                <OrbMascot state={slide.mascotState} size={orbSize} />
                <ThoughtBubble
                  visible={true}
                  text={[
                    "WHO Standard \n 1 Teaspoon = 4.2 grams of sugar.",
                    "Measuring Teaspoons of sugar helps visualize the actual sugar content in the food we consume.",
                    "Don't Let Sugar in Grams Confuse you, Scan Any Packaged Food Barcode for Instant Sugar Amount",
                    "Track your Blood Sugar and keep yourself up to date with Blood Sugar Trends.",
                    ""
                  ][currentSlide] || ""}
                />
              </Animated.View>
              <MascotShadow size={orbSize * 0.75} scaleStyle={shadowScaleStyle} />
            </View>

            {/* B. Visual Card container (centered and animated) */}
            <Animated.View style={[{ alignSelf: 'center', width: cardW }, cardAnimStyle]}>
              {currentCardIndex === 0 && (
                <NameCard
                  cardW={cardW}
                  C={C}
                  value={userName}
                  onChange={setUserName}
                />
              )}
              {currentCardIndex === 1 && (
                <GoalCard
                  cardW={cardW}
                  C={C}
                  selected={userGoal}
                  onSelect={setUserGoal}
                />
              )}
              {currentCardIndex === 2 && <ScannerTeaspoonCard cardW={cardW} C={C} />}
              {currentCardIndex === 3 && <ProgressCard cardW={cardW} C={C} />}
              {currentCardIndex === 4 && (
                <SetupCompleteCard
                  cardW={cardW}
                  C={C}
                />
              )}
            </Animated.View>
          </View>

          {/* ── 3. Bottom Section: Text, Dots, and CTA Button ── */}
          <View style={{ gap: isShort ? 14 : 18 }}>
            {/* Title and Subtitle */}
            <Animated.View style={[textAnimStyle, { minHeight: 70, justifyContent: 'center' }]}>
              {renderTitle()}
              <Text
                style={{
                  color: C.textSub,
                  fontSize: isShort ? 12 : 13,
                  fontWeight: '500',
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 18,
                  paddingHorizontal: 16,
                }}
              >
                {SLIDES[currentTextIndex].subtitle}
              </Text>
            </Animated.View>

            {/* Page dot indicators */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 7,
              }}
            >
              {SLIDES.map((_, idx) => {
                const dotAnimStyle = useAnimatedStyle(() => {
                  const active = currentSlide === idx;
                  return {
                    width: withSpring(active ? 22 : 6, { damping: 15, stiffness: 150 }),
                    backgroundColor: withTiming(active ? C.amber : C.cardBorder, { duration: 200 }),
                  };
                }, [currentSlide]);

                return (
                  <Animated.View
                    key={idx}
                    style={[{
                      height: 6,
                      borderRadius: 3,
                    }, dotAnimStyle]}
                  />
                );
              })}
            </View>

            {/* CTA Button with pulse and moving shiny bar */}
            <Animated.View style={[buttonAnimStyle, { width: '100%', opacity: isNextDisabled() ? 0.5 : 1 }]}>
              <TouchableOpacity
                onPress={handleNext}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isNextDisabled()}
                activeOpacity={0.92}
                style={{
                  width: '100%',
                  backgroundColor: C.amber,
                  borderRadius: 20,
                  paddingVertical: isShort ? 16 : 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: C.amber,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isDark ? 0.45 : 0.25,
                  shadowRadius: 14,
                  elevation: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shiny reflection element */}
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { width: 120, opacity: 0.4 },
                    shineStyle,
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>

                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 17,
                    fontWeight: '800',
                    letterSpacing: 0.3,
                  }}
                >
                  {slide.buttonLabel}
                </Text>
                {slide.isLast
                  ? <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  : <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
