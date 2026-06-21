import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, LinearGradient, Stop, Ellipse, G, Rect, Polygon } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export type MascotState = 'idle' | 'happy' | 'shocked' | 'dizzy';

interface OrbMascotProps {
  state?: MascotState;
  size?: number;
}

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function OrbMascot({ state = 'idle', size = 120 }: OrbMascotProps) {
  const bounce = useSharedValue(0);
  const scaleY = useSharedValue(1);
  const rotation = useSharedValue(0);
  const eyeBlink = useSharedValue(1); // Blinking multiplier: 1 = open, 0 = closed

  useEffect(() => {
    // Cancel previous loops/values
    bounce.value = 0;
    scaleY.value = 1;
    rotation.value = 0;

    if (state === 'idle') {
      // Gentle floating animation
      bounce.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      // Breathing squash & stretch
      scaleY.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else if (state === 'happy') {
      // Happy bouncy loop
      bounce.value = withRepeat(
        withSequence(
          withSpring(-20, { damping: 4, stiffness: 120 }),
          withSpring(2, { damping: 4, stiffness: 120 }),
          withSpring(0, { damping: 6, stiffness: 120 }),
        ),
        -1,
        false
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 150, easing: Easing.inOut(Easing.quad) }),
          withTiming(6, { duration: 150, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 100 }),
        ),
        -1,
        false
      );
    } else if (state === 'shocked') {
      // High frequency vibration
      rotation.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 })
        ),
        -1,
        true
      );
    } else if (state === 'dizzy') {
      // Wobbly sway
      rotation.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(10, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [state]);

  // Periodic Eye Blink Loop
  useEffect(() => {
    let blinkInterval: NodeJS.Timeout;
    
    if (state === 'idle') {
      blinkInterval = setInterval(() => {
        // Run a double blink sequence every 4.5 seconds
        eyeBlink.value = withSequence(
          withTiming(0.05, { duration: 100 }),
          withTiming(1, { duration: 120 }),
          withDelay(120, withSequence(
            withTiming(0.05, { duration: 80 }),
            withTiming(1, { duration: 100 })
          ))
        );
      }, 4500);
    } else {
      eyeBlink.value = 1;
    }

    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [state]);

  // Mascot dynamic movement style
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { scaleY: scaleY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  // Shadow scale & opacity dynamic animation based on height
  const shadowStyle = useAnimatedStyle(() => {
    // bounce goes from 0 (low) to -8 (high)
    // Map -8 to 0.7 scale and 0.5 opacity; Map 0 to 1.0 scale and 1.0 opacity
    const progress = -bounce.value / 8; // 0 to 1
    const scale = 1 - progress * 0.25;
    const opacity = 1 - progress * 0.35;
    return {
      transform: [{ scaleX: scale }, { scaleY: scale }],
      opacity: opacity,
    };
  });

  // Animated properties for blinking eyes
  const eyeAnimatedProps = useAnimatedProps(() => ({
    ry: eyeBlink.value * 3.5,
  }));

  // ViewBox coordinates
  const cx = 49;
  const cy = 63;
  const r = 46;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size * 0.95 }, animStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 110 110">
          <Defs>
            {/* Front Face: Warm medium-light raw sugar gradient */}
            <LinearGradient id="frontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF3E3" />
              <Stop offset="45%" stopColor="#E8C59C" />
              <Stop offset="100%" stopColor="#C69D70" />
            </LinearGradient>

            {/* Top Face: Very light glowing cream/sugar crystal gradient */}
            <LinearGradient id="topGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#E8C59C" />
              <Stop offset="60%" stopColor="#FFF9F2" />
              <Stop offset="100%" stopColor="#FFFFFF" />
            </LinearGradient>

            {/* Right Face: Shaded golden/caramel brown gradient */}
            <LinearGradient id="rightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#C69D70" />
              <Stop offset="70%" stopColor="#A4774E" />
              <Stop offset="100%" stopColor="#7D5330" />
            </LinearGradient>

            {/* Glowing outer halo ring */}
            <RadialGradient id="glowRing" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#E8C59C" stopOpacity="0.35" />
              <Stop offset="60%" stopColor="#C69D70" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#C69D70" stopOpacity="0" />
            </RadialGradient>

            {/* Specular highlight details on front face */}
            <RadialGradient id="specularG" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>

            {/* Dynamic Shadow Grad */}
            <RadialGradient id="shadowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#5C3415" stopOpacity="0.32" />
              <Stop offset="100%" stopColor="#5C3415" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Glow ring - centered around the full 3D cube */}
          <Circle cx={55} cy={57} r={50} fill="url(#glowRing)" />

          {/* 3D Sugar Cube Faces */}

          {/* 1. Top Face with rounded stroke joints */}
          <Polygon
            points="20,32 30,20 90,20 80,32"
            fill="url(#topGrad)"
            stroke="url(#topGrad)"
            strokeWidth={5}
            strokeLinejoin="round"
          />

          {/* 2. Right Face with rounded stroke joints */}
          <Polygon
            points="80,32 90,20 90,80 80,92"
            fill="url(#rightGrad)"
            stroke="url(#rightGrad)"
            strokeWidth={5}
            strokeLinejoin="round"
          />

          {/* 3. Front Face */}
          <Rect
            x={18}
            y={32}
            width={62}
            height={62}
            rx={12}
            fill="url(#frontGrad)"
          />

          {/* Glistening Sugar Crystals */}
          <Path d="M 38 23 L 40 25 L 38 27 L 36 25 Z" fill="white" opacity={0.6} />
          <Path d="M 62 21 L 64 23 L 62 25 L 60 23 Z" fill="white" opacity={0.5} />
          <Path d="M 80 23 L 82 25 L 80 27 L 78 25 Z" fill="white" opacity={0.7} />
          <Path d="M 26 38 L 28 40 L 26 42 L 24 40 Z" fill="white" opacity={0.55} />
          <Path d="M 72 44 L 74 46 L 72 48 L 70 46 Z" fill="white" opacity={0.6} />
          <Path d="M 32 80 L 34 82 L 32 84 L 30 82 Z" fill="white" opacity={0.5} />
          <Path d="M 86 50 L 88 52 L 86 54 L 84 52 Z" fill="white" opacity={0.5} />
          <Path d="M 85 72 L 87 74 L 85 76 L 83 74 Z" fill="white" opacity={0.4} />

          {/* Specular highlight details */}
          <Circle cx={cx - 13} cy={cy - 13} r={16} fill="url(#specularG)" />
          <Circle cx={cx - 15} cy={cy - 15} r={5} fill="white" opacity={0.5} />

          {/* Front Face Top-Left Bevel Highlight */}
          <Path
            d="M 22 44 C 22 36, 26 34, 34 34 L 70 34"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.2}
            opacity={0.32}
            strokeLinecap="round"
          />

          {/* Expressions */}
          {state === 'idle' && (
            <>
              {/* Blinking eyes */}
              <AnimatedEllipse cx={cx - 11} cy={cy - 3} rx={3.5} fill="#4A2500" animatedProps={eyeAnimatedProps} />
              <AnimatedEllipse cx={cx + 11} cy={cy - 3} rx={3.5} fill="#4A2500" animatedProps={eyeAnimatedProps} />
              
              {/* Eye sparkle highlights */}
              <Circle cx={cx - 12.2} cy={cy - 4.2} r={1.2} fill="white" opacity={0.85} />
              <Circle cx={cx + 9.8} cy={cy - 4.2} r={1.2} fill="white" opacity={0.85} />
              
              {/* Cute smiling mouth */}
              <Path
                d={`M${cx - 8.5} ${cy + 7.5} Q${cx} ${cy + 13.5} ${cx + 8.5} ${cy + 7.5}`}
                stroke="#4A2500"
                strokeWidth={2.8}
                strokeLinecap="round"
                fill="none"
              />
              {/* Soft rosy blush */}
              <Circle cx={cx - 19} cy={cy + 4.5} r={4.5} fill="#FF7B25" opacity={0.22} />
              <Circle cx={cx + 19} cy={cy + 4.5} r={4.5} fill="#FF7B25" opacity={0.22} />
            </>
          )}

          {state === 'happy' && (
            <>
              {/* Happy closed arched eyes */}
              <Path
                d={`M${cx - 15} ${cy + 0.5} Q${cx - 10.5} ${cy - 5.5} ${cx - 6} ${cy + 0.5}`}
                stroke="#4A2500"
                strokeWidth={3.2}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={`M${cx + 6} ${cy + 0.5} Q${cx + 10.5} ${cy - 5.5} ${cx + 15} ${cy + 0.5}`}
                stroke="#4A2500"
                strokeWidth={3.2}
                strokeLinecap="round"
                fill="none"
              />
              {/* Cheerful open mouth */}
              <Path
                d={`M${cx - 9.5} ${cy + 6} Q${cx} ${cy + 17.5} ${cx + 9.5} ${cy + 6}`}
                stroke="#4A2500"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="#AC4E00"
              />
              {/* Cute teeth */}
              <Path
                d={`M${cx - 5.5} ${cy + 6.5} L${cx + 5.5} ${cy + 6.5}`}
                stroke="white"
                strokeWidth={1.8}
                strokeLinecap="round"
                fill="none"
                opacity={0.85}
              />
              {/* Vivid blush */}
              <Circle cx={cx - 21} cy={cy + 4.5} r={6.5} fill="#FF7B25" opacity={0.26} />
              <Circle cx={cx + 21} cy={cy + 4.5} r={6.5} fill="#FF7B25" opacity={0.26} />
            </>
          )}

          {state === 'shocked' && (
            <>
              {/* Wide open eyes */}
              <Circle cx={cx - 11} cy={cy - 2.5} r={5.2} fill="#4A2500" />
              <Circle cx={cx + 11} cy={cy - 2.5} r={5.2} fill="#4A2500" />
              <Circle cx={cx - 12.8} cy={cy - 4.5} r={2.0} fill="white" opacity={0.9} />
              <Circle cx={cx + 9.2} cy={cy - 4.5} r={2.0} fill="white" opacity={0.9} />
              
              {/* Shocked O-shaped mouth */}
              <Circle cx={cx} cy={cy + 10} r={5.8} fill="#4A2500" />
              <Circle cx={cx} cy={cy + 9} r={3.8} fill="#9C4B00" />
            </>
          )}

          {state === 'dizzy' && (
            <>
              {/* Crossed eyes */}
              <Path d={`M${cx - 14} ${cy - 5.5} L${cx - 7.5} ${cy + 1}`} fill="none" stroke="#4A2500" strokeWidth={3} strokeLinecap="round" />
              <Path d={`M${cx - 7.5} ${cy - 5.5} L${cx - 14} ${cy + 1}`} fill="none" stroke="#4A2500" strokeWidth={3} strokeLinecap="round" />
              <Path d={`M${cx + 7.5} ${cy - 5.5} L${cx + 14} ${cy + 1}`} fill="none" stroke="#4A2500" strokeWidth={3} strokeLinecap="round" />
              <Path d={`M${cx + 14} ${cy - 5.5} L${cx + 7.5} ${cy + 1}`} fill="none" stroke="#4A2500" strokeWidth={3} strokeLinecap="round" />
              
              {/* Uneven wiggly mouth */}
              <Path
                d={`M${cx - 9.5} ${cy + 8.5} Q${cx - 4.5} ${cy + 3.5} ${cx} ${cy + 8.5} T${cx + 9.5} ${cy + 8.5}`}
                stroke="#4A2500"
                strokeWidth={2.8}
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
        </Svg>
      </Animated.View>

      {/* Floating shadow that scales dynamically with bounce height */}
      <Animated.View style={[{ width: size * 0.55, height: size * 0.1, marginTop: 4 }, shadowStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 60 10">
          <Circle cx={30} cy={5} r={28} fill="url(#shadowGrad)" scaleY={0.16} />
        </Svg>
      </Animated.View>
    </View>
  );
}

