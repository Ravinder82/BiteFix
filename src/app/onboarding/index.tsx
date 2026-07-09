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
import { SugarProgressRing } from '../../components/features/SugarProgressRing';
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
  Ellipse,
  G,
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
      top: -65,
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
// Slide Helper Card: Curiosity / Grams to Teaspoons Pouring
// ─────────────────────────────────────────────────────────
function CuriosityCard({ cardW, C }: { cardW: number; C: any }) {
  const pourProgress = useSharedValue(0);

  useEffect(() => {
    pourProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withDelay(800, withTiming(0, { duration: 1500 }))
      ),
      -1,
      false
    );
  }, []);

  const pourStyle = useAnimatedStyle(() => ({
    opacity: pourProgress.value,
  }));

  const sugarPileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + pourProgress.value * 0.15 }],
  }));

  // Falling sugar particles path calculations
  const p1Style = useAnimatedStyle(() => {
    const p = (pourProgress.value * 1.4) % 1.0;
    const x = 32 + p * 22;
    const y = 30 + p * 42;
    return {
      transform: [{ translateX: x }, { translateY: y }],
      opacity: pourProgress.value > 0.05 && pourProgress.value < 0.95 ? 1 : 0,
    };
  });

  const p2Style = useAnimatedStyle(() => {
    const p = ((pourProgress.value + 0.33) * 1.4) % 1.0;
    const x = 32 + p * 22;
    const y = 30 + p * 42;
    return {
      transform: [{ translateX: x }, { translateY: y }],
      opacity: pourProgress.value > 0.05 && pourProgress.value < 0.95 ? 1 : 0,
    };
  });

  const p3Style = useAnimatedStyle(() => {
    const p = ((pourProgress.value + 0.66) * 1.4) % 1.0;
    const x = 32 + p * 22;
    const y = 30 + p * 42;
    return {
      transform: [{ translateX: x }, { translateY: y }],
      opacity: pourProgress.value > 0.05 && pourProgress.value < 0.95 ? 1 : 0,
    };
  });

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Visual comparison container */}
      <View style={{ flexDirection: 'row', width: '100%', height: 110, alignItems: 'center', justifyContent: 'space-around', backgroundColor: C.cardInner, borderRadius: 16, padding: 8, overflow: 'hidden' }}>
        {/* Left: Realistic glass soda bottle */}
        <View style={{ alignItems: 'center' }}>
          <Svg width="65" height="95" viewBox="0 0 65 95">
            <G transform="rotate(35 30 45)">
              {/* Bottle Cap */}
              <Path d="M23,12 L37,12 L35,6 L25,6 Z" fill="#D3D3D3" stroke="#8E8E93" strokeWidth="0.5" />
              <Path d="M23,10 L37,10" stroke="#FF3B30" strokeWidth="1.5" />
              {/* Neck */}
              <Path d="M24,12 L36,12 L34,25 L26,25 Z" fill="rgba(255, 255, 255, 0.25)" stroke="rgba(255, 255, 255, 0.35)" />
              <Path d="M24.5,15 L35.5,15 L34,25 L26,25 Z" fill="#201103" />
              {/* Contour Glass Body */}
              <Path d="M26,25 C26,25 20,35 20,45 C20,55 22.5,60 20.5,70 C18.5,80 22.5,88 30,88 C37.5,88 41.5,80 39.5,70 C37.5,60 40,55 40,45 C40,35 34,25 34,25 Z" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
              <Path d="M26.2,25.2 C26.2,25.2 20.5,35 20.5,45 C20.5,55 22.8,60 20.8,70 C19,80 22.8,86.5 30,86.5 C37.2,86.5 41,80 39.2,70 C37.2,60 39.5,55 39.5,45 C39.5,35 33.8,25.2 33.8,25.2 Z" fill="#180B02" />
              {/* Red Label */}
              <Path d="M20.5,42 C20.5,42 24.5,44 30,44 C35.5,44 39.5,42 39.5,42 L39.2,54 C39.2,54 35.5,52 30,52 C24.5,52 20.8,54 20.8,54 Z" fill="#FF3B30" />
              <SvgText x="30" y="49" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.2">COLA</SvgText>
              <SvgText x="30" y="59" fill="#FFD54F" fontSize="5.5" fontWeight="800" textAnchor="middle">39g</SvgText>
              {/* Highlights */}
              <Path d="M22,30 C22,30 24,38 24,46" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
            </G>
          </Svg>
        </View>

        {/* Falling sugar particles container */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={[{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: '#E5E5EA' }, p1Style]} />
          <Animated.View style={[{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFEAA7', borderWidth: 0.5, borderColor: '#E5E5EA' }, p2Style]} />
          <Animated.View style={[{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: '#E5E5EA' }, p3Style]} />
        </View>

        {/* Pouring stream overlay */}
        <Animated.View style={[{ position: 'absolute', top: 35, left: '38%', width: 22, height: 40 }, pourStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 22 40" preserveAspectRatio="none">
            <Line x1="2" y1="0" x2="20" y2="40" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="3,3" opacity="0.6" />
          </Svg>
        </Animated.View>

        {/* Right: Teaspoon and Sugar Pile */}
        <Animated.View style={[{ alignItems: 'center' }, sugarPileStyle]}>
          <Svg width="70" height="95" viewBox="0 0 70 95">
            <Path d="M 5,80 Q 35,30 65,80 Z" fill="#FFFFFF" stroke="#EFEFEC" strokeWidth="0.5" />
            <Path d="M 50,45 L 30,65 C 28,67 25,67 23,65 L 10,52 C 8,50 8,47 10,45 L 23,32" fill="none" stroke="#D3D3D3" strokeWidth="2.5" strokeLinecap="round" />
            <Ellipse cx="14" cy="48" rx="8" ry="6" fill="#E5E5EA" stroke="#8E8E93" strokeWidth="1" transform="rotate(-45 14 48)" />
            <Path d="M22,76 L34,76 L34,84 L22,84 Z" fill="#F2F2F7" opacity="0.9" />
            <Path d="M32,70 L42,70 L42,78 L32,78 Z" fill="#FFFFFF" stroke="#E5E5EA" strokeWidth="0.5" />
            <SvgText x="35" y="85" fill="#E8820C" fontSize="11" fontWeight="900" textAnchor="middle">9.3 tsp</SvgText>
          </Svg>
        </Animated.View>
      </View>

      {/* Dynamic stats */}
      <View style={{ width: '100%', gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '700' }}>Sugar in a Single Cola:</Text>
          <Text style={{ color: C.red, fontSize: 12, fontWeight: '900' }}>9.3 Teaspoons</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '600' }}>WHO Daily Limit:</Text>
          <Text style={{ color: C.green, fontSize: 10, fontWeight: '800' }}>6.0 Teaspoons</Text>
        </View>
        {/* Visual bar */}
        <View style={{ height: 6, backgroundColor: C.cardInner, borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
          <View style={{ position: 'absolute', left: '64%', width: 2, height: '100%', backgroundColor: C.red, zIndex: 10 }} />
          <View style={{ height: '100%', width: '100%', backgroundColor: C.red }} />
        </View>
        <Text style={{ color: C.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2, fontStyle: 'italic' }}>
          One can exceeds your daily recommended budget by 155%!
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide Helper Card: Barcode Scanner Demo
// ─────────────────────────────────────────────────────────
function ScannerDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const scanLineY = useSharedValue(0);
  const cardTranslateY = useSharedValue(60);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(80, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    cardTranslateY.value = withDelay(800, withSpring(0, { damping: 12 }));
    cardOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
  }, []);

  const lineAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }]
  }));

  const cardSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
      height: 220,
      justifyContent: 'space-between',
      overflow: 'hidden',
    }}>
      {/* Viewfinder simulation */}
      <View style={{
        height: 100,
        backgroundColor: '#000000',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#FFD54F',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <View style={{ position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#FFFFFF' }} />
        <View style={{ position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF' }} />
        <View style={{ position: 'absolute', bottom: 8, left: 8, width: 12, height: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#FFFFFF' }} />
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF' }} />

        {/* Barcode lines */}
        <Svg width="120" height="40" viewBox="0 0 100 40">
          <Path d="M10 5 L10 35 M16 5 L16 35 M20 5 L20 35 M28 5 L28 35 M34 5 L34 35 M40 5 L40 35 M48 5 L48 35 M54 5 L54 35 M60 5 L60 35 M66 5 L66 35 M74 5 L74 35 M80 5 L80 35 M88 5 L88 35 M94 5 L94 35" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.7" />
        </Svg>

        <Animated.View style={[
          {
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            height: 3,
            backgroundColor: '#FF3B30',
            shadowColor: '#FF3B30',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 8,
          },
          lineAnimStyle
        ]} />
      </View>

      {/* Product Details Card */}
      <Animated.View style={[
        {
          backgroundColor: C.cardInner,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.cardBorder,
          padding: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          height: 85,
        },
        cardSlideStyle
      ]}>
        <View style={{
          width: 50,
          height: '100%',
          backgroundColor: C.card,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.cardBorder,
        }}>
          <Svg width="30" height="30" viewBox="0 0 40 40">
            <Circle cx="20" cy="20" r="16" fill="#DEB887" />
            <Circle cx="12" cy="16" r="2" fill="#8B4513" />
            <Circle cx="20" cy="12" r="2.5" fill="#8B4513" />
            <Circle cx="28" cy="18" r="2" fill="#8B4513" />
            <Circle cx="18" cy="26" r="2" fill="#8B4513" />
            <Circle cx="26" cy="28" r="2.2" fill="#8B4513" />
            <Path d="M 32,10 A 6,6 0 0,0 38,20 A 6,6 0 0,0 32,24" fill={C.cardInner} />
          </Svg>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ color: C.text, fontSize: 11, fontWeight: '800' }} numberOfLines={1}>
            Choco Chip Cookies
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 8, fontWeight: '600', marginTop: 1 }}>
            SnackCo • 140 kcal
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ width: '68%', height: '100%', backgroundColor: '#F5A623', borderRadius: 3 }} />
            </View>
            <Text style={{ color: C.textSub, fontSize: 8, fontWeight: '800' }}>68% WHO</Text>
          </View>
        </View>

        <View style={{
          backgroundColor: '#000000',
          borderWidth: 1.5,
          borderColor: '#FFD54F',
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 5,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: -0.5 }}>5.8</Text>
          <Text style={{ color: '#FFD54F', fontSize: 7, fontWeight: '800', letterSpacing: 0.2, marginTop: -2 }}>tsp</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide Helper Card: Healthy Collections Showcase
// ─────────────────────────────────────────────────────────
function CollectionsDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const collectionItems = [
    { name: "Greek Yogurt", brand: "Fage Organic", sugar: "0.5 tsp", tag: "Clean Bite", tagBg: '#F0FDF4', tagColor: '#22C55E', isFav: true },
    { name: "Almond Milk", brand: "Califia Farms", sugar: "0.0 tsp", tag: "Sugar Free", tagBg: '#EFF6FF', tagColor: '#3B82F6', isFav: true },
    { name: "Fresh Strawberries", brand: "Local Farm", sugar: "1.0 tsp", tag: "Low Sugar", tagBg: '#FEF3E4', tagColor: '#E8820C', isFav: false },
  ];

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
      height: 220,
      justifyContent: 'center',
      gap: 8,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.cardBorder, paddingBottom: 6, marginBottom: 2 }}>
        <Text style={{ color: C.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Healthy Collection
        </Text>
        <Text style={{ color: C.amber, fontSize: 10, fontWeight: '800' }}>3 items</Text>
      </View>

      {collectionItems.map((item, idx) => (
        <View key={idx} style={{
          backgroundColor: C.cardInner,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: C.cardBorder,
        }}>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ color: C.text, fontSize: 10, fontWeight: '800' }}>{item.name}</Text>
            <Text style={{ color: C.textMuted, fontSize: 7, fontWeight: '500' }}>{item.brand}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              backgroundColor: item.tagBg,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 6,
            }}>
              <Text style={{ color: item.tagColor, fontSize: 7, fontWeight: '800' }}>{item.tag}</Text>
            </View>
            <Text style={{ color: C.text, fontSize: 10, fontWeight: '900' }}>{item.sugar}</Text>

            <Svg width="12" height="12" viewBox="0 0 24 24">
              <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={item.isFav ? "#FFC107" : "none"} stroke="#FFC107" strokeWidth="2.5" />
            </Svg>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide Helper Card: Food Swap Demo Card
// ─────────────────────────────────────────────────────────
function FoodSwapDemoCard({ cardW, C }: { cardW: number; C: any }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    }}>
      <Text style={{ color: C.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, alignSelf: 'flex-start', borderBottomWidth: 1, borderBottomColor: C.cardBorder, width: '100%', paddingBottom: 6 }}>
        Smart Food Swap
      </Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', flex: 1 }}>
        <View style={{
          flex: 1,
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1.5,
          borderColor: C.red + '35',
          alignItems: 'center',
          gap: 4,
          height: 135,
          justifyContent: 'center',
        }}>
          <Text style={{ color: C.red, fontSize: 7, fontWeight: '900', letterSpacing: 0.3 }}>HIGH SUGAR</Text>
          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.cardBorder }}>
            <Text style={{ fontSize: 24 }}>🥫</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
            Sweet Ketchup
          </Text>
          <Text style={{ color: C.red, fontSize: 12, fontWeight: '900' }}>6.4 tsp</Text>
          <Text style={{ color: C.textMuted, fontSize: 7, fontWeight: '600' }}>(27g per 100g)</Text>
        </View>

        <Animated.View style={[{ marginHorizontal: 6, alignItems: 'center' }, arrowStyle]}>
          <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <Path d="M4 12H20M20 12L14 6M20 12L14 18" stroke={C.amber} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>

        <View style={{
          flex: 1,
          backgroundColor: C.cardInner,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1.5,
          borderColor: C.green + '35',
          alignItems: 'center',
          gap: 4,
          height: 135,
          justifyContent: 'center',
        }}>
          <Text style={{ color: C.green, fontSize: 7, fontWeight: '900', letterSpacing: 0.3 }}>SWAP TO</Text>
          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.cardBorder }}>
            <Text style={{ fontSize: 24 }}>🍅</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
            Tomato Purée
          </Text>
          <Text style={{ color: C.green, fontSize: 12, fontWeight: '900' }}>0.5 tsp</Text>
          <Text style={{ color: C.textMuted, fontSize: 7, fontWeight: '600' }}>(2g per 100g)</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Slide Helper Card: Hidden Sugar Finder Card
// ─────────────────────────────────────────────────────────
function HiddenSugarFinderCard({ cardW, C }: { cardW: number; C: any }) {
  const listOpacity1 = useSharedValue(0.15);
  const listOpacity2 = useSharedValue(0.15);
  const listOpacity3 = useSharedValue(0.15);

  useEffect(() => {
    const runAnim = () => {
      listOpacity1.value = withSequence(
        withTiming(1, { duration: 350 }),
        withDelay(2200, withTiming(0.15, { duration: 350 }))
      );
      listOpacity2.value = withSequence(
        withDelay(600, withTiming(1, { duration: 350 })),
        withDelay(1600, withTiming(0.15, { duration: 350 }))
      );
      listOpacity3.value = withSequence(
        withDelay(1200, withTiming(1, { duration: 350 })),
        withDelay(1000, withTiming(0.15, { duration: 350 }))
      );
    };
    runAnim();
    const interval = setInterval(runAnim, 3600);
    return () => clearInterval(interval);
  }, []);

  const style1 = useAnimatedStyle(() => ({ opacity: listOpacity1.value }));
  const style2 = useAnimatedStyle(() => ({ opacity: listOpacity2.value }));
  const style3 = useAnimatedStyle(() => ({ opacity: listOpacity3.value }));

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
      height: 220,
      justifyContent: 'space-between',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.cardBorder, paddingBottom: 6, marginBottom: 2 }}>
        <Text style={{ color: C.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Stealth Sugar Audit
        </Text>
        <View style={{ backgroundColor: C.redLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: C.red, fontSize: 7, fontWeight: '900' }}>3 MATCHED</Text>
        </View>
      </View>

      <View style={{ gap: 8, flex: 1, justifyContent: 'center' }}>
        <Animated.View style={[{
          backgroundColor: C.cardInner,
          borderRadius: 12,
          padding: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1.2,
          borderColor: C.red + '30',
        }, style1]}>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '800' }}>🔍 Maltodextrin</Text>
          <Text style={{ color: C.red, fontSize: 7.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.2 }}>Disguised Sugar</Text>
        </Animated.View>

        <Animated.View style={[{
          backgroundColor: C.cardInner,
          borderRadius: 12,
          padding: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1.2,
          borderColor: C.red + '30',
        }, style2]}>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '800' }}>🔍 Dextrose</Text>
          <Text style={{ color: C.red, fontSize: 7.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.2 }}>High Glycemic</Text>
        </Animated.View>

        <Animated.View style={[{
          backgroundColor: C.cardInner,
          borderRadius: 12,
          padding: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1.2,
          borderColor: C.red + '30',
        }, style3]}>
          <Text style={{ color: C.text, fontSize: 10, fontWeight: '800' }}>🔍 Barley Malt Extract</Text>
          <Text style={{ color: C.red, fontSize: 7.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.2 }}>Hidden Sweetener</Text>
        </Animated.View>
      </View>
      
      <Text style={{ color: C.textMuted, fontSize: 8.5, textAlign: 'center', fontStyle: 'italic', marginTop: 2 }}>
        Exposing hidden sugars disguised under healthy-sounding aliases.
      </Text>
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
type GoalOption = 'energy' | 'weight' | 'mental' | 'none';

function GoalCard({
  cardW,
  C,
  selected,
  onSelect,
}: {
  cardW: number;
  C: any;
  selected: GoalOption | null;
  onSelect: (val: GoalOption) => void;
}) {
  const options: { label: string; desc: string; value: GoalOption }[] = [
    { label: "⚡ Boost Energy & Alertness", desc: "Prevent insulin spikes and beat the afternoon crash.", value: 'energy' },
    { label: "⚖️ Manage Weight & Cravings", desc: "Break the sugar loop and regain control of your appetite.", value: 'weight' },
    { label: "🧠 Sharpen Mental Focus", desc: "Clear the brain fog and maintain sustained mental clarity.", value: 'mental' },
    { label: "🛡️ Protect Long-Term Health", desc: "Align with WHO limits to protect cardiovascular and metabolic health.", value: 'none' },
  ];

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
                flexDirection: 'column',
                backgroundColor: isSelected ? C.amberLight : C.cardInner,
                borderColor: isSelected ? C.amber : C.cardBorder,
                borderWidth: 1.5,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ color: C.text, fontSize: 13, fontWeight: '800' }}>
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
              </View>
              <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '500', paddingRight: 20 }}>
                {opt.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
    title: "What should we call you?",
    highlight: "call you?",
    subtitle: "Please enter your name to personalize your health dashboard.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 2,
    title: "What is your primary health goal?",
    highlight: "health goal?",
    subtitle: "Choose what brings you to CutSugar.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'idle',
  },
  {
    step: 3,
    title: "Your Personal Sweet-Safe Haven.",
    highlight: "Sweet-Safe Haven.",
    subtitle: "Build a curated pantry of low and no-sugar favorites. Scan, collect, and keep track of clean-label items.",
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 4,
    title: "Meet Your Healthy Upgrades.",
    highlight: "Healthy Upgrades.",
    subtitle: "Food Swap is here. Instantly discover cleaner, lower-sugar alternatives to high-sugar foods.",
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 5,
    title: "Sugar. Measured in Teaspoons.",
    highlight: "Teaspoons.",
    subtitle: "We translate complex laboratory metrics into clear, visual teaspoons—fully aligned with the WHO guidelines.",
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'shocked',
  },
  {
    step: 6,
    title: "Grocery Shopping, Cleaned Up.",
    highlight: "Cleaned Up.",
    subtitle: "Scan barcodes, build your low-sugar pantry, and use Food Swap to bypass sugary traps on the fly.",
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 7,
    title: "Expose the Stealth Sugars.",
    highlight: "Stealth Sugars.",
    subtitle: "Brands hide sugar under 60+ chemical aliases. Our Stealth Sugar Audit exposes hidden sweeteners instantly.",
    buttonLabel: 'Get Started',
    isLast: true,
    mascotState: 'dizzy',
  },
];

// ─────────────────────────────────────────────────────────
// Pagination Dot Component (Prevents hook inside .map loop)
// ─────────────────────────────────────────────────────────
function DotIndicator({ active, C }: { active: boolean; C: any }) {
  const dotAnimStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(active ? 22 : 6, { damping: 15, stiffness: 150 }),
      backgroundColor: withTiming(active ? C.amber : C.cardBorder, { duration: 200 }),
    };
  }, [active, C]);

  return (
    <Animated.View
      style={[{
        height: 6,
        borderRadius: 3,
      }, dotAnimStyle]}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Main Onboarding Screen
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Splash Screen loading state
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const splashOpacity = useSharedValue(0);

  // Handle Splash Screen fade and timeout
  useEffect(() => {
    splashOpacity.value = withTiming(1, { duration: 800 });
    const timer = setTimeout(() => {
      splashOpacity.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(setIsSplashLoading)(false);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Questionnaire states
  const [userName, setUserName] = useState('');
  const [userGoal, setUserGoal] = useState<GoalOption | null>(null);

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
      if (userGoal === null) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    // Camera permission request during feature showcase (on slide 5, Clean Grocery Shopping)
    if (currentSlide === 5) {
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
        userGoal: userGoal || 'none',
      });
      setOnboardingComplete(true);
      router.replace('/auth');
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    if (currentSlide === 1 && userGoal === null) return true;
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
              CutSugar
            </Text>
            <Text style={{ color: C.textSub, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              Goodbye Sugar. Hello Health.
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
            <View style={{ height: orbSize + 20, justifyContent: 'center', marginTop: isShort ? 25 : 45, marginBottom: isShort ? 4 : 8, zIndex: 10 }}>
              <MagicalBackground />
              <Animated.View style={[{ alignSelf: 'center', position: 'relative' }, mascotAnimStyle]}>
                <OrbMascot state={slide.mascotState} size={orbSize} />
                <ThoughtBubble
                  visible={true}
                  text={[
                    "Hi there! Let's get to know each other first!",
                    "Awesome! Having a clear motive is key to success.",
                    "Save your go-to clean products in your personal pantry!",
                    "Instantly discover cleaner, lower-sugar alternatives!",
                    "WHO Standard:\n1 Teaspoon = 4.2g.\nLet's visualize it!",
                    "Scan any product barcode to instantly see what's inside.",
                    "Let's expose hidden sugars disguised as additives!"
                  ][currentSlide] || ""}
                />
              </Animated.View>
              <MascotShadow size={orbSize * 0.75} scaleStyle={shadowScaleStyle} />
            </View>

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
                <CollectionsDemoCard
                  cardW={cardW}
                  C={C}
                />
              )}
              {currentCardIndex === 3 && (
                <FoodSwapDemoCard
                  cardW={cardW}
                  C={C}
                />
              )}
              {currentCardIndex === 4 && (
                <CuriosityCard
                  cardW={cardW}
                  C={C}
                />
              )}
              {currentCardIndex === 5 && (
                <ScannerDemoCard
                  cardW={cardW}
                  C={C}
                />
              )}
              {currentCardIndex === 6 && (
                <HiddenSugarFinderCard
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
              {SLIDES.map((_, idx) => (
                <DotIndicator key={idx} active={currentSlide === idx} C={C} />
              ))}
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
