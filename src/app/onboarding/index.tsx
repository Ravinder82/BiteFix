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
  Image,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
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
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot } from '../../components/features/OrbMascot';
import { MagicalBackground } from '../../components/features/MagicalBackground';
import { ArrowRight, Check, Search, AlertTriangle, ShieldCheck, ShieldAlert, Activity, Sparkles, RefreshCw, Zap, Star, X } from 'lucide-react-native';
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
  Ellipse,
  G,
  Polygon,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────
// Animated Mascot Shadow Component
// ─────────────────────────────────────────────────────────
function MascotShadow({ size, scaleStyle }: { size: number; scaleStyle: any }) {
  return (
    <Animated.View style={[{ width: size, height: size * 0.15, alignSelf: 'center' }, scaleStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 15">
        <Defs>
          <SvgRadialGradient id="shadowG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx="50" cy="7.5" r="50" fill="url(#shadowG)" />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// Mascot Thought Bubble ("Think Message")
// ─────────────────────────────────────────────────────────
function ThoughtBubble({ text, visible }: { text: string; visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && text) {
      scale.value = withDelay(250, withSpring(1, { damping: 14, stiffness: 200 }));
      opacity.value = withDelay(250, withTiming(1, { duration: 250 }));
    } else {
      scale.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, text]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!text) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          right: -58,
          top: -46,
          width: 140,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingHorizontal: 10,
          paddingVertical: 9,
          shadowColor: '#FF9500',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 9,
          borderWidth: 1.5,
          borderColor: '#FFD54F',
          zIndex: 100,
        },
        animStyle,
      ]}
    >
      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#8C4A00', lineHeight: 14, textAlign: 'center' }}>
        {text}
      </Text>
      {/* Speech bubble pointer */}
      <View
        style={{
          position: 'absolute',
          bottom: -6,
          left: 28,
          width: 11,
          height: 11,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: '#FFD54F',
          transform: [{ rotate: '45deg' }],
        }}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDE 1 BODY: Name Personalization Card
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
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
        gap: 14,
      }}
    >
      <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Personal Account Profile
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: value.trim() ? C.amber : C.cardBorder,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 12 : 8,
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

      {/* Dynamic personal greeting preview */}
      <View
        style={{
          backgroundColor: C.amberLight,
          borderRadius: 12,
          padding: 10,
          borderWidth: 1,
          borderColor: C.amber + '30',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Sparkles size={16} color={C.amber} />
        <Text style={{ color: C.text, fontSize: 11, fontWeight: '700', flex: 1 }}>
          {value.trim() ? `Welcome, ${value.trim()}! Ready to fix your bites?` : 'Type your name above to personalize your scanner!'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDE 2 BODY: Goal Customization Card
// ─────────────────────────────────────────────────────────
type GoalOption = 'ultra_processed' | 'nutri_score' | 'clean_swaps' | 'healthy_habits';

function GoalCard({
  cardW,
  C,
  selected,
  onSelect,
}: {
  cardW: number;
  C: any;
  selected: GoalOption[];
  onSelect: (vals: GoalOption[]) => void;
}) {
  const options: { label: string; tag: string; icon: React.ReactNode; value: GoalOption }[] = [
    { label: 'Avoid Ultra-Processed Foods', tag: 'NOVA 4 Alert', icon: <AlertTriangle size={18} color={C.red} />, value: 'ultra_processed' },
    { label: 'Understand Nutri-Scores', tag: 'Grades A to E', icon: <Activity size={18} color={C.amberMid} />, value: 'nutri_score' },
    { label: 'Protect Gut Shield & Digestion', tag: 'Microbiome Safe', icon: <ShieldCheck size={18} color={C.green} />, value: 'healthy_habits' },
    { label: 'Discover Clean Food Swaps', tag: '100% Clean Upgrades', icon: <Zap size={18} color={C.amber} />, value: 'clean_swaps' },
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
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
        gap: 8,
      }}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => handleToggle(opt.value)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isSelected ? C.amberLight : C.cardInner,
              borderColor: isSelected ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isSelected ? 'transparent' : C.card, alignItems: 'center', justifyContent: 'center' }}>
                {opt.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 12, fontWeight: '800' }}>{opt.label}</Text>
                <View
                  style={{
                    backgroundColor: isSelected ? C.amber + '25' : 'rgba(0,0,0,0.05)',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                    marginTop: 3,
                  }}
                >
                  <Text style={{ color: isSelected ? C.amber : C.textMuted, fontSize: 8, fontWeight: '800' }}>
                    {opt.tag}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: isSelected ? C.amber : C.textMuted,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? C.amber : 'transparent',
              }}
            >
              {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDE 3 BODY: NOVA & Nutri-Score Visual Card
// ─────────────────────────────────────────────────────────
function NovaNutriScoreDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const { height } = useWindowDimensions();
  const isShort = height < 700;

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: C.cardBorder,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
        gap: 10,
        height: isShort ? 230 : 270,
        justifyContent: 'center',
      }}
    >
      {/* ── Zigzag Sub-Component 1: NOVA System (Align Left) ── */}
      <View
        style={{
          width: '90%',
          alignSelf: 'flex-start',
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1,
          borderColor: C.cardBorder,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.amber + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={9} color={C.amber} />
          </View>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            NOVA System
          </Text>
        </View>
        <Text style={{ color: C.textSub, fontSize: 9.5, fontWeight: '500', lineHeight: 13 }}>
          Rates food processing level. <Text style={{ color: C.red, fontWeight: '800' }}>NOVA 4</Text> indicates chemical additives and ultra-processing.
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 1 }}>
          <View style={{ flex: 1, backgroundColor: C.greenLight, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 5, alignItems: 'center', flexDirection: 'row', gap: 2, justifyContent: 'center' }}>
            <ShieldCheck size={9} color={C.green} />
            <Text style={{ color: C.green, fontSize: 7.5, fontWeight: '900' }}>NOVA 1</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.redLight, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 5, alignItems: 'center', flexDirection: 'row', gap: 2, justifyContent: 'center', borderWidth: 1, borderColor: C.red + '15' }}>
            <AlertTriangle size={9} color={C.red} />
            <Text style={{ color: C.red, fontSize: 7.5, fontWeight: '900' }}>NOVA 4</Text>
          </View>
        </View>
      </View>

      {/* ── Zigzag Sub-Component 2: Nutri-Score (Align Right) ── */}
      <View
        style={{
          width: '90%',
          alignSelf: 'flex-end',
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1,
          borderColor: C.cardBorder,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.green + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={9} color={C.green} />
          </View>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Nutri-Score
          </Text>
        </View>
        <Text style={{ color: C.textSub, fontSize: 9.5, fontWeight: '500', lineHeight: 13 }}>
          Rates overall nutrition quality from <Text style={{ color: C.green, fontWeight: '800' }}>A (healthy)</Text> to <Text style={{ color: C.red, fontWeight: '800' }}>E (unhealthy)</Text>.
        </Text>
        <View style={{ flexDirection: 'row', gap: 2, height: 14, alignItems: 'center', marginTop: 1 }}>
          <View style={{ flex: 1, height: 14, backgroundColor: '#008B50', borderRadius: 2.5, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#FFFFFF' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 7.5, fontWeight: '900' }}>A</Text>
          </View>
          <View style={{ flex: 0.8, height: 12, backgroundColor: '#80BB2D', borderRadius: 2.5, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 6.5, fontWeight: '800' }}>B</Text>
          </View>
          <View style={{ flex: 0.8, height: 12, backgroundColor: '#FFC900', borderRadius: 2.5, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 6.5, fontWeight: '800' }}>C</Text>
          </View>
          <View style={{ flex: 0.8, height: 12, backgroundColor: '#FF8000', borderRadius: 2.5, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 6.5, fontWeight: '800' }}>D</Text>
          </View>
          <View style={{ flex: 0.8, height: 12, backgroundColor: '#E63312', borderRadius: 2.5, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 6.5, fontWeight: '800' }}>E</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDE 4 BODY: Hidden Sugars & Liquid Pour Card
// ─────────────────────────────────────────────────────────
function SugarLiquidPourCard({ cardW, C }: { cardW: number; C: any }) {
  const pourProgress = useSharedValue(0);

  useEffect(() => {
    pourProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withDelay(600, withTiming(0, { duration: 1200 }))
      ),
      -1,
      false
    );
  }, []);

  const p1Style = useAnimatedStyle(() => {
    const p = (pourProgress.value * 1.3) % 1.0;
    const x = (1 - p) * (1 - p) * 120 + 2 * p * (1 - p) * 164 + p * p * 208;
    const y = (1 - p) * (1 - p) * 27 + 2 * p * (1 - p) * 40 + p * p * 77;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${p * 360}deg` },
        { scale: 0.7 + (1 - p) * 0.3 },
      ],
      opacity: pourProgress.value > 0.05 && pourProgress.value < 0.95 ? 1 : 0,
    };
  });

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 14,
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: C.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Hidden Sugar Detector
        </Text>
        <View style={{ backgroundColor: C.redLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: C.red, fontSize: 8, fontWeight: '900' }}>3 ALIASES FOUND</Text>
        </View>
      </View>

      {/* Hidden sugar alias pill badges */}
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: C.cardInner, borderWidth: 1, borderColor: C.red + '40', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Search size={10} color={C.red} />
          <Text style={{ color: C.red, fontSize: 9, fontWeight: '800' }}>Maltodextrin</Text>
        </View>
        <View style={{ backgroundColor: C.cardInner, borderWidth: 1, borderColor: C.red + '40', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Search size={10} color={C.red} />
          <Text style={{ color: C.red, fontSize: 9, fontWeight: '800' }}>Dextrose</Text>
        </View>
        <View style={{ backgroundColor: C.cardInner, borderWidth: 1, borderColor: C.red + '40', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Search size={10} color={C.red} />
          <Text style={{ color: C.red, fontSize: 9, fontWeight: '800' }}>High Fructose Syrup</Text>
        </View>
      </View>

      {/* Teaspoon Liquid Pour Gauge */}
      <View style={{ width: '100%', height: 95, backgroundColor: C.cardInner, borderRadius: 14, overflow: 'hidden', justifyContent: 'center' }}>
        <Svg width="100%" height="100%" viewBox="0 0 280 100">
          <Defs>
            <SvgLinearGradient id="liquidS" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#0d0603" />
              <Stop offset="50%" stopColor="#3d1808" />
              <Stop offset="100%" stopColor="#0d0603" />
            </SvgLinearGradient>
            <SvgRadialGradient id="sugarS" cx="50%" cy="30%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" />
              <Stop offset="100%" stopColor="#c7c7cc" />
            </SvgRadialGradient>
          </Defs>

          {/* Cola Bottle */}
          <G transform="translate(30, -10) rotate(35 45 65)">
            <Path d="M 35,45 C 35,45 28,58 28,75 C 28,92 30,102 28,115 C 27.5,120 32,120 45,120 C 58,120 62.5,120 62,115 C 60,102 62,92 62,75 C 62,58 55,45 55,45 Z" fill="url(#liquidS)" />
            <SvgText x="45" y="82" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">COLA</SvgText>
            <SvgText x="45" y="90" fill="#ffb300" fontSize="7" fontWeight="800" textAnchor="middle">39g</SvgText>
          </G>

          {/* Teaspoon */}
          <G transform="translate(150, 25) rotate(-5 50 45)">
            <Path d="M 28,44 Q 49.5,12 71,44 Z" fill="url(#sugarS)" />
          </G>

          <Path d="M 100,20 Q 140,30 190,55" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
        </Svg>

        <Animated.View style={[{ position: 'absolute', width: 6, height: 6 }, p1Style]}>
          <Svg width="6" height="6" viewBox="0 0 6 6">
            <Polygon points="3,0 6,3 3,6 0,3" fill="#ffffff" />
          </Svg>
        </Animated.View>
      </View>

      {/* Metrics Bar */}
      <View style={{ width: '100%', gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '700' }}>Sugar in Single Soda:</Text>
          <Text style={{ color: C.red, fontSize: 11, fontWeight: '900' }}>9.3 Teaspoons</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: C.textMuted, fontSize: 9, fontWeight: '600' }}>WHO Daily Max:</Text>
          <Text style={{ color: C.green, fontSize: 9, fontWeight: '800' }}>6.0 Teaspoons limit</Text>
        </View>
        <View style={{ height: 5, backgroundColor: C.cardInner, borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
          <View style={{ height: '100%', width: '100%', backgroundColor: C.red }} />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDE 5 BODY: Additive & Petroleum Dye Detective Card
// ─────────────────────────────────────────────────────────
function AdditiveDetectiveDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const laserY = useSharedValue(0);

  useEffect(() => {
    laserY.value = withRepeat(
      withSequence(
        withTiming(70, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value }],
  }));

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 14,
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: C.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Additive & Dye Detective
        </Text>
        <View style={{ backgroundColor: C.redLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: C.red, fontSize: 8, fontWeight: '900' }}>HAZARD WARNING</Text>
        </View>
      </View>

      {/* Viewfinder Laser Beam Simulation */}
      <View
        style={{
          height: 80,
          backgroundColor: '#000000',
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: C.amber,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
          INGREDIENTS LABEL SCANNER
        </Text>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 5,
              left: 8,
              right: 8,
              height: 2.5,
              backgroundColor: C.red,
              shadowColor: C.red,
              shadowRadius: 6,
              shadowOpacity: 1,
            },
            laserStyle,
          ]}
        />
      </View>

      {/* Technical Hazard Cards */}
      <View style={{ gap: 6 }}>
        <View style={{ backgroundColor: C.cardInner, borderRadius: 10, padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.red + '30' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} color={C.red} />
            <View>
              <Text style={{ color: C.text, fontSize: 10, fontWeight: '800' }}>Red 40 Dye</Text>
              <Text style={{ color: C.textMuted, fontSize: 8 }}>Petroleum colorant • Hyperactivity risk</Text>
            </View>
          </View>
          <View style={{ backgroundColor: C.redLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: C.red, fontSize: 8, fontWeight: '900' }}>HIGH RISK</Text>
          </View>
        </View>

        <View style={{ backgroundColor: C.cardInner, borderRadius: 10, padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.red + '30' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} color={C.red} />
            <View>
              <Text style={{ color: C.text, fontSize: 10, fontWeight: '800' }}>Titanium Dioxide</Text>
              <Text style={{ color: C.textMuted, fontSize: 8 }}>Artificial whitener • DNA disruption risk</Text>
            </View>
          </View>
          <View style={{ backgroundColor: C.redLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: C.red, fontSize: 8, fontWeight: '900' }}>BANNED IN EU</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDE 6 BODY: Gut Shield & Emulsifiers Card
// ─────────────────────────────────────────────────────────
function GutShieldDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 14,
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={16} color={C.red} />
          <Text style={{ color: C.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Gut Shield Auditor
          </Text>
        </View>
        <View style={{ backgroundColor: C.redLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ color: C.red, fontSize: 9, fontWeight: '900' }}>SCORE: 42/100</Text>
        </View>
      </View>

      {/* Gut Barrier Status Container */}
      <View
        style={{
          backgroundColor: C.cardInner,
          borderRadius: 14,
          padding: 10,
          borderWidth: 1,
          borderColor: C.red + '35',
          gap: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} color={C.red} />
          <Text style={{ color: C.red, fontSize: 10, fontWeight: '800' }}>
            Mucosal Gut Barrier Erosion Risk
          </Text>
        </View>
        <Text style={{ color: C.textSub, fontSize: 9, lineHeight: 13 }}>
          Chemical emulsifiers break down protective intestinal mucus lining, allowing toxins into bloodstream.
        </Text>
      </View>

      {/* Emulsifiers Target Pills */}
      <View style={{ gap: 4 }}>
        <Text style={{ color: C.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
          Harmful Thickeners Logged:
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Animated.View style={[{ backgroundColor: C.redLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.red + '40', flexDirection: 'row', alignItems: 'center', gap: 4 }, pulseStyle]}>
            <AlertTriangle size={10} color={C.red} />
            <Text style={{ color: C.red, fontSize: 9, fontWeight: '900' }}>Carrageenan</Text>
          </Animated.View>
          <View style={{ backgroundColor: C.redLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.red + '40', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={10} color={C.red} />
            <Text style={{ color: C.red, fontSize: 9, fontWeight: '900' }}>Polysorbate 80</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDE 7 BODY: Smart Clean Food Swap Card
// ─────────────────────────────────────────────────────────
function FoodSwapDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const { height } = useWindowDimensions();
  const isShort = height < 700;
  const arrowPulse = useSharedValue(1);

  useEffect(() => {
    arrowPulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: arrowPulse.value }],
  }));

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: C.cardBorder,
        padding: 12,
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
        gap: 10,
        height: isShort ? 230 : 270,
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* ── Zigzag Sub-Component 1: Unhealthy Option (Align Left) ── */}
      <View
        style={{
          width: '90%',
          alignSelf: 'flex-start',
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1,
          borderColor: C.cardBorder,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.red + '20', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={9} color={C.red} />
          </View>
          <Text style={{ color: C.red, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Unhealthy Option
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1 }}>
          {/* Custom SVG Tin Can */}
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M6 18V9C6 7.34315 7.34315 6 9 6H15C16.6569 6 18 7.34315 18 9V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18Z" stroke={C.red} strokeWidth={2} />
            <Path d="M10 6V4C10 3.44772 10.4477 3 11 3H13C13.5523 3 14 3.44772 14 4V6" stroke={C.red} strokeWidth={2} />
            <Path d="M9 11H15" stroke={C.red} strokeWidth={1.5} />
            <Path d="M9 15H15" stroke={C.red} strokeWidth={1.5} />
          </Svg>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ color: C.text, fontSize: 11.5, fontWeight: '800' }} numberOfLines={1}>
              Sweet Ketchup
            </Text>
            <Text style={{ color: C.textSub, fontSize: 8.5, fontWeight: '500' }} numberOfLines={1}>
              NOVA 4 • Emulsifiers
            </Text>
          </View>
          <Text style={{ color: C.red, fontSize: 13, fontWeight: '900' }}>6.4 tsp</Text>
        </View>
      </View>

      {/* Floating Zap Icon Transition overlay in the middle of the zigzag */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: isShort ? 99 : 119,
            left: cardW / 2 - 14,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: C.amber,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: C.card,
            shadowColor: C.amber,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 5,
            zIndex: 10,
          },
          arrowStyle,
        ]}
      >
        <Zap size={13} color="#FFFFFF" />
      </Animated.View>

      {/* ── Zigzag Sub-Component 2: Clean Upgrade (Align Right) ── */}
      <View
        style={{
          width: '90%',
          alignSelf: 'flex-end',
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1,
          borderColor: C.cardBorder,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.green + '20', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={9} color={C.green} />
          </View>
          <Text style={{ color: C.green, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Clean Upgrade
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1 }}>
          {/* Custom SVG Fresh Tomato */}
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={13} r={7} fill={C.greenLight} stroke={C.green} strokeWidth={2} />
            <Path d="M12 6C12 4.5 11.5 3.5 10 3.5" stroke={C.green} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M12 6C13 5 13.5 5 15 4.5" stroke={C.green} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ color: C.text, fontSize: 11.5, fontWeight: '800' }} numberOfLines={1}>
              Tomato Purée
            </Text>
            <Text style={{ color: C.green, fontSize: 8.5, fontWeight: '700' }} numberOfLines={1}>
              NOVA 1 • Whole Food
            </Text>
          </View>
          <Text style={{ color: C.green, fontSize: 13, fontWeight: '900' }}>0.5 tsp</Text>
        </View>
      </View>
    </View>
  );
}



// ─────────────────────────────────────────────────────────
// SLIDE 4 BODY: Gut Health & Additives Demo Card (Segmented Control)
// ─────────────────────────────────────────────────────────
function GutAdditivesDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const { height } = useWindowDimensions();
  const isShort = height < 700;

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: C.cardBorder,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
        gap: 10,
        height: isShort ? 230 : 270,
        justifyContent: 'center',
      }}
    >
      {/* ── Zigzag Sub-Component 1: Gut Shield (Align Left) ── */}
      <View
        style={{
          width: '90%',
          alignSelf: 'flex-start',
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1,
          borderColor: C.cardBorder,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.red + '20', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={9} color={C.red} />
          </View>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Gut Shield
          </Text>
        </View>
        <Text style={{ color: C.textSub, fontSize: 9.5, fontWeight: '500', lineHeight: 13 }}>
          Audits foods for emulsifiers and gums that erode gut lining, triggering leaky gut.
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 1 }}>
          <View style={{ flex: 1, backgroundColor: C.redLight, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 5, alignItems: 'center', flexDirection: 'row', gap: 2, justifyContent: 'center', borderWidth: 1, borderColor: C.red + '15' }}>
            <ShieldAlert size={9} color={C.red} />
            <Text style={{ color: C.red, fontSize: 7.5, fontWeight: '900' }}>42/100 Threat</Text>
          </View>
          <View style={{ flex: 1.3, backgroundColor: C.cardInner, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.text, fontSize: 7.5, fontWeight: '800', textAlign: 'center' }} numberOfLines={1}>Carrageenan Found</Text>
          </View>
        </View>
      </View>

      {/* ── Zigzag Sub-Component 2: Additive Detective (Align Right) ── */}
      <View
        style={{
          width: '90%',
          alignSelf: 'flex-end',
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1,
          borderColor: C.cardBorder,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.amber + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={9} color={C.amber} />
          </View>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Additive Detective
          </Text>
        </View>
        <Text style={{ color: C.textSub, fontSize: 9.5, fontWeight: '500', lineHeight: 13 }}>
          Catches synthetic dyes, dangerous preservatives, and forbidden chemicals.
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 1 }}>
          <View style={{ flex: 1, backgroundColor: C.redLight, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 5, alignItems: 'center', flexDirection: 'row', gap: 2, justifyContent: 'center', borderWidth: 1, borderColor: C.red + '15' }}>
            <AlertTriangle size={9} color={C.red} />
            <Text style={{ color: C.text, fontSize: 7.5, fontWeight: '800' }} numberOfLines={1}>Red 40 Dye</Text>
          </View>
          <View style={{ flex: 1.1, backgroundColor: C.redLight, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 5, alignItems: 'center', flexDirection: 'row', gap: 2, justifyContent: 'center', borderWidth: 1, borderColor: C.red + '15' }}>
            <AlertTriangle size={9} color={C.red} />
            <Text style={{ color: C.text, fontSize: 7.5, fontWeight: '800' }} numberOfLines={1}>Titanium Dioxide</Text>
          </View>
        </View>
      </View>
    </View>
  );
}



// ─────────────────────────────────────────────────────────
// SLIDE 6 BODY: Instant 4-in-1 Scan Results Summary Card
// ─────────────────────────────────────────────────────────
function InstantResultSummaryCard({ cardW, C, isDark }: { cardW: number; C: any; isDark: boolean }) {
  // Staggered entry animation values
  const scale1 = useSharedValue(0.4);
  const opacity1 = useSharedValue(0);
  const scale2 = useSharedValue(0.4);
  const opacity2 = useSharedValue(0);
  const scale3 = useSharedValue(0.4);
  const opacity3 = useSharedValue(0);
  const scale4 = useSharedValue(0.4);
  const opacity4 = useSharedValue(0);
  const scale5 = useSharedValue(0.4);
  const opacity5 = useSharedValue(0);
  const scale6 = useSharedValue(0.4);
  const opacity6 = useSharedValue(0);

  useEffect(() => {
    const config = { damping: 14, stiffness: 120 };
    
    scale1.value = withDelay(0, withSpring(1, config));
    opacity1.value = withDelay(0, withTiming(1, { duration: 250 }));

    scale2.value = withDelay(80, withSpring(1, config));
    opacity2.value = withDelay(80, withTiming(1, { duration: 250 }));

    scale3.value = withDelay(160, withSpring(1, config));
    opacity3.value = withDelay(160, withTiming(1, { duration: 250 }));

    scale4.value = withDelay(240, withSpring(1, config));
    opacity4.value = withDelay(240, withTiming(1, { duration: 250 }));

    scale5.value = withDelay(320, withSpring(1, config));
    opacity5.value = withDelay(320, withTiming(1, { duration: 250 }));

    scale6.value = withDelay(400, withSpring(1, config));
    opacity6.value = withDelay(400, withTiming(1, { duration: 250 }));
  }, []);

  const item1Style = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }], opacity: opacity1.value }));
  const item2Style = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }], opacity: opacity2.value }));
  const item3Style = useAnimatedStyle(() => ({ transform: [{ scale: scale3.value }], opacity: opacity3.value }));
  const item4Style = useAnimatedStyle(() => ({ transform: [{ scale: scale4.value }], opacity: opacity4.value }));
  const item5Style = useAnimatedStyle(() => ({ transform: [{ scale: scale5.value }], opacity: opacity5.value }));
  const item6Style = useAnimatedStyle(() => ({ transform: [{ scale: scale6.value }], opacity: opacity6.value }));

  // Luxury Gold theme colors
  const gold = '#D4AF37';

  const features = [
    {
      title: 'NOVA Class',
      desc: 'Processing level audit',
      icon: <Activity size={12} color="#FF9500" />,
      bg: 'rgba(255, 149, 0, 0.08)',
      style: item1Style,
    },
    {
      title: 'Nutri-Score',
      desc: 'Traffic light grade',
      icon: <Sparkles size={12} color="#34C759" />,
      bg: 'rgba(52, 199, 89, 0.08)',
      style: item2Style,
    },
    {
      title: 'Gut Shield',
      desc: 'Barrier erosion alert',
      icon: <ShieldAlert size={12} color="#FF3B30" />,
      bg: 'rgba(255, 59, 48, 0.08)',
      style: item3Style,
    },
    {
      title: 'Dye Detective',
      desc: 'Synthetic dye checks',
      icon: <Search size={12} color="#AF52DE" />,
      bg: 'rgba(175, 82, 222, 0.08)',
      style: item4Style,
    },
    {
      title: 'Hidden Sugar',
      desc: 'Teaspoon daily limit',
      icon: <Zap size={12} color="#FFCC00" />,
      bg: 'rgba(255, 204, 0, 0.08)',
      style: item5Style,
    },
    {
      title: 'Smart Swaps',
      desc: 'A-Grade clean match',
      icon: <RefreshCw size={12} color="#007AFF" />,
      bg: 'rgba(0, 122, 255, 0.08)',
      style: item6Style,
    },
  ];

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: gold,
        padding: 14,
        gap: 10,
        shadowColor: gold,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 8,
      }}
    >
      {/* Premium Luxury Header */}
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={{ color: gold, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Exclusive 6-in-1 Scanner
        </Text>
        <Text style={{ color: C.text, fontSize: 14, fontWeight: '900', textAlign: 'center' }}>
          Scan Once. Unlock Everything.
        </Text>
      </View>

      {/* Sleek Horizontal Stretched Cards Container */}
      <View style={{ gap: 6, width: '100%' }}>
        {features.map((item, idx) => (
          <Animated.View
            key={idx}
            style={[
              {
                width: '100%',
                backgroundColor: C.cardInner,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.cardBorder,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              },
              item.style,
            ]}
          >
            {/* Left circular icon container */}
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </View>

            {/* Title & description side-by-side */}
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: C.text, fontSize: 11.5, fontWeight: '800' }}>
                {item.title}
              </Text>
              <Text style={{ color: C.textSub, fontSize: 9.5, fontWeight: '600' }}>
                {item.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
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
  const modalScale = useSharedValue(0.85);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    modalScale.value = withSpring(1, { damping: 15, stiffness: 180 });
    modalOpacity.value = withTiming(1, { duration: 250 });
  }, []);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const handleStarPress = (r: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRating(r);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 999, paddingHorizontal: 20 }]}>
      <Animated.View
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
          modalStyle,
        ]}
      >
        {/* Mascot Header */}
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: C.amberLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.amber + '40', marginBottom: 4 }}>
          <OrbMascot state="happy" size={80} />
        </View>

        <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
          Enjoying BiteFix?
        </Text>

        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 }}>
          If you love scanner insights and clean swaps, please take a moment to rate us on the App Store!
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
        <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
          <TouchableOpacity
            onPress={onSubmit}
            disabled={rating === 0}
            activeOpacity={0.9}
            style={{
              width: '100%',
              backgroundColor: C.amber,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: C.amber,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.15,
              shadowRadius: 10,
              elevation: 4,
              opacity: rating === 0 ? 0.55 : 1,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
              Submit Rating
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLater}
            activeOpacity={0.75}
            style={{
              width: '100%',
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '700' }}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

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
    title: 'Welcome to BiteFix',
    highlight: 'BiteFix',
    subtitle: 'Let\'s personalize your food scanning experience.',
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 2,
    title: 'Select Your Primary Goal',
    highlight: 'Primary Goal',
    subtitle: 'Tailor your scanner to focus on what matters most.',
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'idle',
  },
  {
    step: 3,
    title: 'NOVA & ',
    highlight: 'NUTRITION',
    subtitle: 'Scan and Get Nova and Nutri-Score instantly',
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 4,
    title: 'Gut Health & Additives',
    highlight: 'Gut Health',
    subtitle: 'How Gut Health is related to Additives?',
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'shocked',
  },
  {
    step: 5,
    title: 'Healthier Swaps',
    highlight: 'Healthier Swaps',
    subtitle: 'Scan and Find Healthier Options',
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 6,
    title: 'Instant Scan Intelligence',
    highlight: 'Scan Intelligence',
    subtitle: '',
    buttonLabel: 'Get Started',
    isLast: true,
    mascotState: 'happy',
  },
];

function DotIndicator({ active, C }: { active: boolean; C: any }) {
  const dotAnimStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(active ? 22 : 6, { damping: 15, stiffness: 150 }),
      backgroundColor: withTiming(active ? C.amber : C.cardBorder, { duration: 200 }),
    };
  }, [active, C]);

  return (
    <Animated.View
      style={[
        {
          height: 6,
          borderRadius: 3,
        },
        dotAnimStyle,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Main Onboarding Screen Component
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const splashOpacity = useSharedValue(0);

  useEffect(() => {
    splashOpacity.value = withTiming(1, { duration: 800 });
    const timer = setTimeout(() => {
      splashOpacity.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(setIsSplashLoading)(false);
      });
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const [userName, setUserName] = useState('');
  const [userGoals, setUserGoals] = useState<GoalOption[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showGutModal, setShowGutModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);

  const { setOnboardingComplete, setProfile } = useAppStore();
  const { user } = useAuthStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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
    if (currentSlide === 0 && !userName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (currentSlide === 1 && userGoals.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (currentSlide === 4) {
      try {
        await Camera.requestCameraPermissionsAsync();
      } catch (_) { }
    }

    if (currentSlide < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentSlide((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfile({
        userName: userName.trim(),
        userGoal: userGoals[0] || 'none',
      });
      setOnboardingComplete(true);
      setShowRatingModal(true);
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    if (currentSlide === 1 && userGoals.length === 0) return true;
    return false;
  };

  const slide = SLIDES[currentSlide] || SLIDES[0];
  const isShort = height < 700;
  const isNarrow = width < 375;
  const orbSize = Math.min(Math.round(width * 0.38), 150);
  const cardW = Math.min(width - 32, 400);

  const renderTitle = () => {
    const textSlide = SLIDES[currentTextIndex] || SLIDES[0];
    const parts = textSlide.title.split(textSlide.highlight);
    return (
      <Text
        style={{
          color: C.text,
          fontSize: isShort ? 20 : isNarrow ? 20 : 23,
          fontWeight: '900',
          textAlign: 'center',
          letterSpacing: -0.5,
          lineHeight: isShort ? 26 : 30,
        }}
      >
        {parts[0]}
        <Text style={{ color: C.amberMid }}>{textSlide.highlight}</Text>
        {parts[1] ?? ''}
      </Text>
    );
  };

  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value + jumpY.value },
      { scaleX: mascotScaleX.value },
      { scaleY: mascotScaleY.value },
    ],
  }));

  const shadowScaleStyle = useAnimatedStyle(() => {
    const totalY = floatY.value + jumpY.value;
    const ratio = Math.max(0.4, 1 + totalY / 60);
    return {
      transform: [{ scaleX: ratio }, { scaleY: ratio }],
      opacity: ratio,
    };
  });

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslateX.value }, { scale: cardScale.value }],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }],
  }));

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  if (isSplashLoading) {
    return (
      <Animated.View style={[{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }, splashStyle]}>
        <MagicalBackground />
        <View style={{ alignItems: 'center', gap: 20 }}>
          <Animated.View style={mascotAnimStyle}>
            <OrbMascot state="happy" size={orbSize * 1.2} />
          </Animated.View>
          <MascotShadow size={orbSize * 0.9} scaleStyle={shadowScaleStyle} />

          <View style={{ alignItems: 'center', marginTop: 20, gap: 8 }}>
            <Text style={{ color: C.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
              BiteFix
            </Text>
            <Text style={{ color: C.textSub, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              Clean Eating & Food Swap Scanner
            </Text>
          </View>

          <ActivityIndicator size="large" color={C.amber} style={{ marginTop: 24 }} />
        </View>
      </Animated.View>
    );
  }

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
            paddingTop: insets.top + (isShort ? 25 : 35),
            paddingBottom: Math.max(insets.bottom, 14) + (isShort ? 4 : 8),
            paddingHorizontal: 20,
            justifyContent: 'space-between',
            minHeight: height - insets.top - insets.bottom,
          }}
        >
          {/* ── 1. TOP SECTION: Mascot floating container & Mascot Think Message ── */}
          <View style={{ height: orbSize + 25, justifyContent: 'center', marginTop: isShort ? 25 : 45, zIndex: 10 }}>
            <MagicalBackground />
            <Animated.View style={[{ alignSelf: 'center', position: 'relative' }, mascotAnimStyle]}>
              <OrbMascot state={slide.mascotState} size={orbSize} />
              <ThoughtBubble
                visible={true}
                text={[
                  "Hi! I'm BiteFix. What should I call you?",
                  "What's your #1 health & food goal right now?",
                  "Do you know what NOVA & Nutri-Score mean?",
                  "Ever wondered how additives hurt your gut?",
                  "Never give up your favorite foods—swap them!",
                  "Everything delivered in 1 single barcode scan!"
                ][currentSlide] || ""}
              />
            </Animated.View>
            <MascotShadow size={orbSize * 0.75} scaleStyle={shadowScaleStyle} />
          </View>

          {/* ── 2. UPPER-MIDDLE SECTION: Title and Subtitle Below Mascot ── */}
          <Animated.View style={[textAnimStyle, { minHeight: 60, justifyContent: 'center', marginTop: isShort ? 8 : 16, marginBottom: isShort ? 4 : 8 }]}>
            {renderTitle()}
            <Text
              style={{
                color: C.textSub,
                fontSize: isShort ? 12 : 13,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 4,
                lineHeight: 18,
                paddingHorizontal: 12,
              }}
            >
              {SLIDES[currentTextIndex].subtitle}
            </Text>
          </Animated.View>

          {/* ── 3. MIDDLE BODY SECTION: Custom Animated Technical Card Containers ── */}
          <Animated.View style={[{ alignSelf: 'center', width: cardW, flex: 1, justifyContent: 'center', marginVertical: isShort ? 4 : 8 }, cardAnimStyle]}>
            {currentCardIndex === 0 && (
              <NameCard cardW={cardW} C={C} value={userName} onChange={setUserName} />
            )}
            {currentCardIndex === 1 && (
              <GoalCard cardW={cardW} C={C} selected={userGoals} onSelect={setUserGoals} />
            )}
            {currentCardIndex === 2 && (
              <NovaNutriScoreDemoCard cardW={cardW} C={C} />
            )}
            {currentCardIndex === 3 && (
              <GutAdditivesDemoCard cardW={cardW} C={C} />
            )}
            {currentCardIndex === 4 && (
              <FoodSwapDemoCard cardW={cardW} C={C} />
            )}
            {currentCardIndex === 5 && (
              <InstantResultSummaryCard cardW={cardW} C={C} isDark={isDark} />
            )}
          </Animated.View>

          {/* ── 4. BOTTOM SECTION: Dot Indicators and Action CTA Button ── */}
          <View style={{ gap: isShort ? 10 : 14, marginTop: isShort ? 4 : 8 }}>
            {/* Pagination Dots */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }}>
              {SLIDES.map((_, idx) => (
                <DotIndicator key={idx} active={currentSlide === idx} C={C} />
              ))}
            </View>

            {/* Main Action CTA Button */}
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
                  paddingVertical: isShort ? 14 : 16,
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
                <Animated.View style={[StyleSheet.absoluteFill, { width: 120, opacity: 0.4 }, shineStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>

                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }}>
                  {slide.buttonLabel}
                </Text>
                {slide.isLast ? (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
      {showRatingModal && (
        <RatingModal
          C={C}
          isDark={isDark}
          rating={rating}
          setRating={setRating}
          onSubmit={() => {
            setShowRatingModal(false);
            if (user) {
              router.replace('/paywall');
            } else {
              router.replace('/auth');
            }
          }}
          onLater={() => {
            setShowRatingModal(false);
            if (user) {
              router.replace('/paywall');
            } else {
              router.replace('/auth');
            }
          }}
          width={width}
        />
      )}
    </KeyboardAvoidingView>
  );
}
