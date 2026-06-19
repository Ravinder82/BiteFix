import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
// Slide 4: Nutrition Label Illustration
// ─────────────────────────────────────────────────────────
function NutritionCard({ cardW, C }: { cardW: number; C: any }) {
  const scanLineY = useSharedValue(0);
  useEffect(() => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(80, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);
  const lineAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }]
  }));

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
      aspectRatio: 1.2,
    }}>
      <View style={{
        width: 140, height: 140, borderRadius: 24, backgroundColor: C.cardInner,
        borderWidth: 1.5, borderColor: C.cardBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }}>
        <View style={{ flexDirection: 'row', gap: 5, height: 70, alignItems: 'center' }}>
          {[40, 70, 50, 70, 30, 60, 70, 45, 70].map((h, i) => (
            <View key={i} style={{ width: i % 3 === 0 ? 8 : 4, height: h, backgroundColor: C.text, opacity: 0.15, borderRadius: 2 }} />
          ))}
        </View>
        <Animated.View style={[{ position: 'absolute', top: 30, left: 0, right: 0, height: 2.5, backgroundColor: C.green, shadowColor: C.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 }, lineAnimStyle]} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 5: Teaspoon Visualization
// ─────────────────────────────────────────────────────────
function TeaspoonCard({ cardW, C }: { cardW: number; C: any }) {
  const radius = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * 0.75; 

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
      aspectRatio: 1.2,
    }}>
      <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute' }}>
          <Circle cx="80" cy="80" r={radius} stroke={C.cardInner} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="80" cy="80" r={radius} stroke={C.amber} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" transform="rotate(-90 80 80)" />
        </Svg>
        <Text style={{ color: C.text, fontSize: 42, fontWeight: '900', letterSpacing: -1 }}>8</Text>
        <Text style={{ color: C.amberMid, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>tsp</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 6: Progress Chart Card
// ─────────────────────────────────────────────────────────
function ProgressCard({ cardW, C }: { cardW: number; C: any }) {
  const linePath = "M10 90 Q50 40 90 60 T170 50 T250 20";
  const areaPath = `${linePath} L250 140 L10 140 Z`;

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
      aspectRatio: 1.2,
    }}>
      <View style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: C.cardInner, borderWidth: 1, borderColor: C.cardBorder }}>
        <Svg width="100%" height="100%" viewBox="0 0 260 140" preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={C.green} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={C.green} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#grad2)" />
          <Path d={linePath} fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round" />
          <Circle cx="250" cy="20" r="7" fill={C.bg} stroke={C.green} strokeWidth="4" />
        </Svg>
        <View style={{ position: 'absolute', right: 20, top: 20, backgroundColor: C.green, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>In Range</Text>
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
// Slide 2: Personalized Diabetic Status Card
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
    { label: "Boost daily energy", value: 'energy' },
    { label: "Lose weight naturally", value: 'weight' },
    { label: "Medical/Health reasons", value: 'medical' },
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
// Slide 3: Sweet Tooth Screen
// ─────────────────────────────────────────────────────────
type SweetToothOption = 'high' | 'moderate' | 'low' | 'none';

function SweetToothCard({
  cardW,
  C,
  selected,
  onSelect,
}: {
  cardW: number;
  C: any;
  selected: SweetToothOption;
  onSelect: (val: SweetToothOption) => void;
}) {
  const options: { label: string; value: SweetToothOption }[] = [
    { label: "High (I crave sweets often)", value: 'high' },
    { label: "Moderate (Occasional treats)", value: 'moderate' },
    { label: "Low (I'm already cautious)", value: 'low' },
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
// Slide 4: Pace / Commitment Screen
// ─────────────────────────────────────────────────────────
type PaceOption = 'cold_turkey' | 'gradual' | 'tracking' | 'none';

function PaceCard({
  cardW,
  C,
  selected,
  onSelect,
}: {
  cardW: number;
  C: any;
  selected: PaceOption;
  onSelect: (val: PaceOption) => void;
}) {
  const options: { label: string; value: PaceOption }[] = [
    { label: "Cold Turkey (100% sugar-free instantly)", value: 'cold_turkey' },
    { label: "Gradual Reduction (Step-by-step)", value: 'gradual' },
    { label: "Just Tracking (Exploring my habits)", value: 'tracking' },
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
// Slide 5: Tutorial Opt-In Screen
// ─────────────────────────────────────────────────────────
type TutorialOption = 'yes' | 'no' | 'none';

function TutorialOptInCard({
  cardW,
  C,
  selected,
  onSelect,
}: {
  cardW: number;
  C: any;
  selected: TutorialOption;
  onSelect: (val: TutorialOption) => void;
}) {
  const options: { label: string; value: TutorialOption }[] = [
    { label: "See how it works", value: 'yes' },
    { label: "Skip to the dashboard", value: 'no' },
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
// Slide 8: Setup Complete Payoff Screen
// ─────────────────────────────────────────────────────────
function SetupCompleteCard({
  cardW,
  C,
  userName,
  userGoal,
}: {
  cardW: number;
  C: any;
  userName: string;
  userGoal: GoalOption;
}) {
  let payoffMsg = "Going sugar-free will boost your daily energy levels and long-term vitality!";
  if (userGoal === 'weight') {
    payoffMsg = "We'll help you cut out hidden sugars to support your natural weight loss goals!";
  } else if (userGoal === 'medical') {
    payoffMsg = "We will help you monitor sugar levels closely to protect your long-term health.";
  } else if (userGoal === 'mental') {
    payoffMsg = "Say goodbye to sugar crashes and hello to sustained, clear focus!";
  }

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: 1.2,
    }}>
      <View style={{
        backgroundColor: C.cardInner,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: C.cardBorder,
      }}>
        <Text style={{ color: C.amberMid, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Your Customized Journey
        </Text>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'center', lineHeight: 22 }}>
          {payoffMsg}
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
    title: "What brings you here?",
    highlight: "brings you here?",
    subtitle: "Select your primary goal so we can tailor your experience.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'idle',
  },
  {
    step: 3,
    title: "Your Sweet Tooth",
    highlight: "Sweet Tooth",
    subtitle: "How would you describe your current sugar cravings?",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 4,
    title: "Your Commitment",
    highlight: "Commitment",
    subtitle: "Choose the pace that works best for you.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 5,
    title: "Your Personalized Roadmap",
    highlight: "Roadmap",
    subtitle: "Our Tools Help you Track and Manage Sugar Intake for Better Control over your Health.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 6,
    title: 'Real Time Product Analysis',
    highlight: 'Product Analysis',
    subtitle: 'Our database instantly analyzes barcodes and nutrition labels, filtering out the marketing noise to give you the raw data.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 7,
    title: 'See it to Believe it',
    highlight: 'Believe it',
    subtitle: 'We translate abstract grams into a universal metric—teaspoons. Make faster, more informed dietary decisions at a glance.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'dizzy',
  },
  {
    step: 8,
    title: 'Log your Blood Sugar.',
    highlight: 'Blood Sugar.',
    subtitle: 'We help you log your Blood Sugar on an empty stomach and post-meal over time, so you can track and manage blood sugar levels.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 9,
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
  const [sweetTooth, setSweetTooth] = useState<SweetToothOption>('none');
  const [journeyPace, setJourneyPace] = useState<PaceOption>('none');
  const [wantsTutorial, setWantsTutorial] = useState<TutorialOption>('none');

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
    if (currentSlide === 2) {
      if (sweetTooth === 'none') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }
    if (currentSlide === 3) {
      if (journeyPace === 'none') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }
    
    if (currentSlide === 4) {
      if (wantsTutorial === 'none') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (wantsTutorial === 'no') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCurrentSlide(8); // Jump directly to Setup Complete
        return;
      }
    }

    // Camera permission request during feature showcase
    if (currentSlide === 5) {
      try {
        await Camera.requestCameraPermissionsAsync();
      } catch (_) {}
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
        sweetTooth,
        journeyPace,
      });
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    if (currentSlide === 1 && userGoal === 'none') return true;
    if (currentSlide === 2 && sweetTooth === 'none') return true;
    if (currentSlide === 3 && journeyPace === 'none') return true;
    if (currentSlide === 4 && wantsTutorial === 'none') return true;
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
            <View style={{ height: orbSize + 20, justifyContent: 'center', marginBottom: isShort ? 4 : 8 }}>
              <Animated.View style={[{ alignSelf: 'center' }, mascotAnimStyle]}>
                <OrbMascot state={slide.mascotState} size={orbSize} />
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
              {currentCardIndex === 2 && (
                <SweetToothCard
                  cardW={cardW}
                  C={C}
                  selected={sweetTooth}
                  onSelect={setSweetTooth}
                />
              )}
              {currentCardIndex === 3 && (
                <PaceCard
                  cardW={cardW}
                  C={C}
                  selected={journeyPace}
                  onSelect={setJourneyPace}
                />
              )}
              {currentCardIndex === 4 && (
                <TutorialOptInCard
                  cardW={cardW}
                  C={C}
                  selected={wantsTutorial}
                  onSelect={setWantsTutorial}
                />
              )}
              {currentCardIndex === 5 && <NutritionCard cardW={cardW} C={C} />}
              {currentCardIndex === 6 && <TeaspoonCard cardW={cardW} C={C} />}
              {currentCardIndex === 7 && <ProgressCard cardW={cardW} C={C} />}
              {currentCardIndex === 8 && (
                <SetupCompleteCard
                  cardW={cardW}
                  C={C}
                  userName={userName}
                  userGoal={userGoal}
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
