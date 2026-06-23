import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, G, LinearGradient, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

interface CrystalProps {
  startX: number;
  startY: number;
  scale: number;
  delay: number;
  duration: number;
  rotationDuration: number;
  rotationDirection: 1 | -1;
  opacityMax: number;
}

// A single floating sugar crystal
const Crystal = ({ startX, startY, scale, delay, duration, rotationDuration, rotationDirection, opacityMax }: CrystalProps) => {
  const { height } = useWindowDimensions();
  
  const translateY = useSharedValue(startY);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Upward float animation with easing
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(startY - height * 0.8, { duration: duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );

    // Continuous 3D-like rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360 * rotationDirection, { duration: rotationDuration, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Opacity fades in and then dissolves (fades out) as it goes higher
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(opacityMax, { duration: duration * 0.3, easing: Easing.inOut(Easing.ease) }),
        -1,
        true // Reverses to fade out, but since repeat is true, it fades in and out.
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: startX },
      { rotate: `${rotate.value}deg` },
      { scale: scale },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, animStyle]}>
      <Svg width={40} height={40} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id="crystalGlow" cx="30%" cy="30%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFC107" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#FF9500" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#E8820C" stopOpacity="0.1" />
          </RadialGradient>
          <LinearGradient id="crystalEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD54F" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#FFB300" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FF6F00" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        {/* Diamond/Crystal Path */}
        <Path 
          d="M 20 2 L 34 16 L 20 38 L 6 16 Z" 
          fill="url(#crystalGlow)" 
        />
        {/* Glass Edge Refraction */}
        <Path 
          d="M 20 2 L 34 16 L 20 38 L 6 16 Z" 
          fill="none" 
          stroke="url(#crystalEdge)" 
          strokeWidth="2.5" 
        />
        {/* Inner geometric lines to give 3D depth */}
        <Path 
          d="M 20 2 L 20 38 M 6 16 L 34 16 M 20 2 L 28 16 L 20 38 M 20 2 L 12 16 L 20 38" 
          fill="none" 
          stroke="url(#crystalEdge)" 
          strokeWidth="1.5" 
        />
      </Svg>
    </Animated.View>
  );
};

export function MagicalBackground() {
  const { width, height } = useWindowDimensions();

  // Generate a memoized array of crystals to prevent re-renders
  const crystals = useMemo(() => {
    const items = [];
    const count = 18; // Number of dissolving crystals
    for (let i = 0; i < count; i++) {
      // Randomized properties for organic, chaotic feel
      const startX = Math.random() * width;
      const startY = height * 0.4 + Math.random() * (height * 0.4); // Start from middle-bottom
      const scale = 0.3 + Math.random() * 0.9; // Varying sizes
      const delay = Math.random() * 4000; // Staggered starts
      const duration = 4000 + Math.random() * 6000; // Float speed
      const rotationDuration = 3000 + Math.random() * 5000;
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;
      const opacityMax = 0.5 + Math.random() * 0.5;

      items.push(
        <Crystal
          key={i}
          startX={startX}
          startY={startY}
          scale={scale}
          delay={delay}
          duration={duration}
          rotationDuration={rotationDuration}
          rotationDirection={rotationDirection}
          opacityMax={opacityMax}
        />
      );
    }
    return items;
  }, [width, height]);

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
              <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.4" />
              <Stop offset="40%" stopColor="#E8820C" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={width/2} cy={width/2} r={width/2} fill="url(#ambientGlow)" />
        </Svg>
      </Animated.View>

      {/* Floating Dissolving Crystals Layer */}
      {crystals}
    </View>
  );
}
