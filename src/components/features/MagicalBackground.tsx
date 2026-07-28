import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function MagicalBackground() {
  const { width, height } = useWindowDimensions();

  // Ambient core glow breathing animation
  const glowOpacity = useSharedValue(0.3);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    glowScale.value = withRepeat(
      withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const ambientAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Central Ambient Magic Glow behind Mascot */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', top: -height * 0.2 }, ambientAnimStyle]}>
        <Svg width={width} height={width} viewBox={`0 0 ${width} ${width}`}>
          <Defs>
            <RadialGradient id="ambientGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#0D9668" stopOpacity="0.4" />
              <Stop offset="40%" stopColor="#10B981" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={width/2} cy={width/2} r={width/2} fill="url(#ambientGlow)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
