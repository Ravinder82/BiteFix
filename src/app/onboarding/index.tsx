import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
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

// ─────────────────────────────────────────────────────────
// Premium Shiny Leather Dark-Grey Palette
// ─────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',          // Bright white shiny like silk
  card: '#FFFFFF',         // Pure white card
  cardBorder: 'rgba(0, 0, 0, 0.04)', // Subtle soft border
  cardInner: '#F9F9F9',    // Soft nested light grey
  amber: '#FF9500',        // Vibrant glowing amber
  amberLight: 'rgba(255, 149, 0, 0.12)', // Amber background glow tint
  amberMid: '#FF9F0A',     // High-intensity amber accent
  text: '#1C1C1E',         // Premium dark text
  textSub: '#8E8E93',      // Silver-grey secondary text
  textMuted: '#AEAEB2',    // Muted slate text
  green: '#34C759',        // Premium iOS-style green
  greenLight: 'rgba(52, 199, 89, 0.12)', // Green tint
  red: '#FF3B30',          // Error / Limit red
  redLight: 'rgba(255, 59, 48, 0.1)', // Red tint
};

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
// Slide 1: Nutrition Label Illustration
// ─────────────────────────────────────────────────────────
function NutritionCard({ cardW }: { cardW: number }) {
  const rows = [
    ['Total Fat', '3g', '5%'],
    ['Cholesterol', '0mg', '0%'],
    ['Sodium', '90mg', '3%'],
    ['Total Carbs', '24g', '8%'],
    ['Sugars', '7g', ''],
    ['Protein', '2g', ''],
  ];

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* Header */}
      <Text style={{ color: C.text, fontSize: 13, fontWeight: '900', letterSpacing: -0.2 }}>
        Nutrition Facts
      </Text>
      <View style={{ height: 1.5, backgroundColor: C.text, marginVertical: 5 }} />
      <Text style={{ color: C.textSub, fontSize: 8 }}>Serving Size 1 Package (28g)</Text>
      <View style={{ height: 5, backgroundColor: C.text, marginVertical: 5, borderRadius: 2 }} />

      {/* Calories */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ color: C.textSub, fontSize: 9, fontWeight: '700' }}>Calories</Text>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>120</Text>
      </View>
      <View style={{ height: 3, backgroundColor: C.text, marginVertical: 5, borderRadius: 1 }} />

      {/* Nutrient rows */}
      {rows.map(([label, amount, pct], i) => (
        <View key={i}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5 }}>
            <Text style={{ color: C.text, fontSize: 8, fontWeight: label === 'Sugars' ? '900' : '500' }}>
              {label === 'Sugars' ? '  ' : ''}{label}
              <Text style={{ color: C.amber, fontWeight: '900' }}>
                {label === 'Sugars' ? '  7g' : ''}
              </Text>
            </Text>
            <Text style={{ color: C.textSub, fontSize: 8 }}>{label !== 'Sugars' ? amount : ''}{pct ? `  ${pct}` : ''}</Text>
          </View>
          {i < rows.length - 1 && <View style={{ height: 0.5, backgroundColor: '#E5E5EA' }} />}
        </View>
      ))}

      {/* Amber sugar highlight badge */}
      <View style={{
        marginTop: 10,
        backgroundColor: C.amberLight,
        borderRadius: 10,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderLeftWidth: 3,
        borderLeftColor: C.amber,
      }}>
        <Text style={{ fontSize: 14 }}>🍬</Text>
        <Text style={{ color: C.amberMid, fontSize: 9, fontWeight: '800', flex: 1 }}>
          7g sugar = 2.2 tsp
        </Text>
      </View>

      {/* Barcode */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 1.5, marginTop: 12 }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <View key={i} style={{ width: i % 4 === 0 ? 2.5 : 1, height: 16, backgroundColor: C.text, opacity: 0.5 }} />
        ))}
      </View>
      <Text style={{ color: C.textMuted, fontSize: 7, textAlign: 'center', marginTop: 3 }}>
        0 12345 67890 3
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 2: Teaspoon Visualization
// ─────────────────────────────────────────────────────────
function TeaspoonCard({ cardW }: { cardW: number }) {
  const SAFE_LIMIT = 6;

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
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    }}>
      {/* Title row */}
      <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
        Sugar Content
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <Text style={{ color: C.text, fontSize: 36, fontWeight: '900', lineHeight: 42 }}>8</Text>
        <Text style={{ color: C.amber, fontSize: 13, fontWeight: '700' }}>Teaspoons</Text>
      </View>

      {/* Spoon grid — 2 rows of 4 */}
      <View style={{ gap: 6, marginTop: 10 }}>
        {[0, 1].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2, 3].map((col) => {
              const idx = row * 4 + col;
              const filled = idx < SAFE_LIMIT;
              const overLimit = idx >= SAFE_LIMIT;
              return (
                <View
                  key={col}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 10,
                    backgroundColor: filled ? C.amberLight : overLimit ? C.redLight : C.cardInner,
                    borderWidth: 1.5,
                    borderColor: filled ? C.amber : overLimit ? C.red : '#E5E5EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{filled ? '🥄' : '🚫'}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Daily limit info */}
      <View style={{
        marginTop: 12,
        backgroundColor: C.redLight,
        borderRadius: 10,
        padding: 9,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderLeftWidth: 3,
        borderLeftColor: C.red,
      }}>
        <Text style={{ fontSize: 14 }}>⚠️</Text>
        <Text style={{ color: C.red, fontSize: 9, fontWeight: '700', flex: 1 }}>
          WHO limit: 6 tsp/day{'\n'}This product = 2 tsp over limit!
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide 3: Progress Chart Card
// ─────────────────────────────────────────────────────────
function ProgressCard({ cardW }: { cardW: number }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const points = [[30, 40], [55, 32], [80, 44], [105, 24], [130, 30], [155, 36], [180, 26]];
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const areaPath = `${linePath} L180 65 L30 65 Z`;

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: C.text, fontSize: 12, fontWeight: '800' }}>Your Progress</Text>
        <View style={{ backgroundColor: C.amberLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: C.amberMid, fontSize: 8, fontWeight: '700' }}>7 Days ▾</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={{ height: 72 }}>
        <Svg width="100%" height="72" viewBox="0 0 210 72">
          <Defs>
            <SvgLinearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={C.amber} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={C.amber} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          {/* Grid */}
          {[15, 35, 55].map((y, i) => (
            <Line key={i} x1="26" y1={y} x2="205" y2={y} stroke="#E5E5EA" strokeWidth="1" />
          ))}
          {/* Y labels */}
          <SvgText x="2" y="18" fill={C.textMuted} fontSize="7">180</SvgText>
          <SvgText x="2" y="38" fill={C.textMuted} fontSize="7">120</SvgText>
          <SvgText x="2" y="58" fill={C.textMuted} fontSize="7">60</SvgText>
          {/* Area */}
          <Path d={areaPath} fill="url(#areaG)" />
          {/* Line */}
          <Path d={linePath} stroke={C.amber} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {points.map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r="3.5" fill={C.amber} />
          ))}
        </Svg>
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 2 }}>
        {days.map((d) => <Text key={d} style={{ color: C.textMuted, fontSize: 7, fontWeight: '600' }}>{d}</Text>)}
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
        {[
          { label: 'Fasting', value: '98', unit: 'mg/dL', color: C.amber },
          { label: 'Post-Meal', value: '136', unit: 'mg/dL', color: C.amber },
          { label: 'In Range', value: '85%', unit: '✓', color: C.green },
        ].map((stat, i) => (
          <View key={i} style={{
            flex: 1,
            backgroundColor: i === 2 ? C.greenLight : C.amberLight,
            borderRadius: 10,
            padding: 8,
            alignItems: 'center',
          }}>
            <Text style={{ color: C.textSub, fontSize: 7, fontWeight: '600' }}>{stat.label}</Text>
            <Text style={{ color: stat.color, fontSize: 15, fontWeight: '900', marginTop: 2 }}>{stat.value}</Text>
            <Text style={{ color: C.textMuted, fontSize: 7 }}>{stat.unit}</Text>
          </View>
        ))}
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
    title: 'Scan Any Food',
    highlight: 'Any Food',
    subtitle: 'Scan barcodes or labels in seconds.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 2,
    title: 'See Sugar Clearly',
    highlight: 'Sugar',
    subtitle: 'We show sugar in teaspoons — easy to understand.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'idle',
  },
  {
    step: 3,
    title: 'Track. Improve. Feel Better.',
    highlight: 'Improve.',
    subtitle: 'Log readings and watch your progress over time.',
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
  const { setOnboardingComplete } = useAppStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ───────────────────────────────────────────────────────
  // Shared Animation Values
  // ───────────────────────────────────────────────────────
  // 1. Continuous Float/Breathe for Mascot
  const floatY = useSharedValue(0);
  const mascotScaleX = useSharedValue(1);
  const mascotScaleY = useSharedValue(1);
  
  // 2. Playful jump on transition
  const jumpY = useSharedValue(0);

  // 3. Card Fade/Slide transitions
  const cardOpacity = useSharedValue(1);
  const cardTranslateX = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // 4. Text Fade/Slide transitions
  const textOpacity = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // 5. Button animations (Breath & Metallic Shine)
  const buttonScale = useSharedValue(1);
  const shineX = useSharedValue(-200);

  // ───────────────────────────────────────────────────────
  // Animation Triggers
  // ───────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Start Mascot Idle floating + breathing loop
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

    // 2. Loop the metallic shiny reflection overlay on the CTA button
    shineX.value = withRepeat(
      withSequence(
        withTiming(width, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withDelay(2000, withTiming(-width, { duration: 0 }))
      ),
      -1,
      false
    );

    // 3. Make the CTA button gently breathe
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
    // A. Mascot Jumps playfully on transition
    jumpY.value = withSequence(
      withTiming(-25, { duration: 180, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 11, stiffness: 130 })
    );

    // B. Visual Card transitions out, switches content, then springs in
    if (currentSlide !== currentCardIndex) {
      cardOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.93, { duration: 150 });
      cardTranslateX.value = withTiming(-35, { duration: 150 }, () => {
        runOnJS(setCurrentCardIndex)(currentSlide);
        cardTranslateX.value = 35; // Reset to the right side
        cardOpacity.value = withTiming(1, { duration: 250 });
        cardScale.value = withTiming(1, { duration: 250 });
        cardTranslateX.value = withSpring(0, { damping: 13, stiffness: 120 });
      });
    }

    // C. Text transitions out, switches, then springs up
    if (currentSlide !== currentTextIndex) {
      textOpacity.value = withTiming(0, { duration: 150 });
      textTranslateY.value = withTiming(15, { duration: 150 }, () => {
        runOnJS(setCurrentTextIndex)(currentSlide);
        textTranslateY.value = -15; // Reset to top
        textOpacity.value = withTiming(1, { duration: 220 });
        textTranslateY.value = withSpring(0, { damping: 13, stiffness: 120 });
      });
    }
  }, [currentSlide]);

  // Button interactive scale effects on press
  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 12, stiffness: 350 });
  };
  const handlePressOut = () => {
    buttonScale.value = withSpring(1.0, { damping: 12, stiffness: 350 });
  };

  const handleNext = async () => {
    if (currentSlide === 2) {
      try {
        await Camera.requestCameraPermissionsAsync();
      } catch (_) {}
    }
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    }
  };

  const slide = SLIDES[currentSlide];

  // ── Responsive Dimensions ──
  const isShort = height < 700;
  const isNarrow = width < 375;
  
  // Clean proportional sizing: Mascot uses 45% of screen width, Cards take width minus padding
  const orbSize = Math.min(Math.round(width * 0.45), 180);
  const cardW = Math.min(width - 32, 400);

  // ── Title & Highlights Renderer ──
  const renderTitle = () => {
    const textSlide = SLIDES[currentTextIndex];
    const parts = textSlide.title.split(textSlide.highlight);
    return (
      <Text
        style={{
          color: C.text,
          fontSize: isShort ? 22 : isNarrow ? 22 : 26,
          fontWeight: '900',
          textAlign: 'center',
          letterSpacing: -0.5,
          lineHeight: isShort ? 28 : 34,
        }}
      >
        {parts[0]}
        <Text style={{ color: C.amberMid }}>{textSlide.highlight}</Text>
        {parts[1] ?? ''}
      </Text>
    );
  };

  // ── Animated style mappings ──
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
    // ratio decreases as mascot floats higher
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
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        paddingTop: insets.top + (isShort ? 6 : 12),
        paddingBottom: Math.max(insets.bottom, 16) + (isShort ? 4 : 8),
        paddingHorizontal: 24,
        justifyContent: 'space-between',
      }}
    >
      {/* ── 1. Top Section: Step Badge ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: '#F2F2F7',
            borderRadius: 100,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: 'rgba(255, 149, 0, 0.4)',
          }}
        >
          <Text style={{ color: C.amberMid, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Step {slide.step} of 3
          </Text>
        </View>
        
        {/* Simple skip link on top-right */}
        <TouchableOpacity
          onPress={() => {
            setOnboardingComplete(true);
            router.replace('/(tabs)');
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: C.textSub, fontSize: 14, fontWeight: '700' }}>Skip</Text>
        </TouchableOpacity>
      </View>

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
          {currentCardIndex === 0 && <NutritionCard cardW={cardW} />}
          {currentCardIndex === 1 && <TeaspoonCard cardW={cardW} />}
          {currentCardIndex === 2 && <ProgressCard cardW={cardW} />}
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
                backgroundColor: withTiming(active ? C.amber : '#E5E5EA', { duration: 200 }),
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
        <Animated.View style={[buttonAnimStyle, { width: '100%' }]}>
          <TouchableOpacity
            onPress={handleNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
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
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 8,
              position: 'relative',
              overflow: 'hidden', // Required for shiny reflection overlay
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
  );
}
