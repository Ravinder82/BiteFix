import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, LinearGradient, Stop, Ellipse, G, ClipPath } from 'react-native-svg';
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
const AnimatedG = Animated.createAnimatedComponent(G);

export function OrbMascot({ state = 'idle', size = 120 }: OrbMascotProps) {
  const bounce = useSharedValue(0);
  const scaleY = useSharedValue(1);
  const rotation = useSharedValue(0);
  const eyeBlink = useSharedValue(1); // Blinking multiplier: 1 = open, 0 = closed

  // Potion and wave animation shared values
  const waveTranslation = useSharedValue(0);
  const backWaveTranslation = useSharedValue(0);
  const bubble1Y = useSharedValue(90);
  const bubble2Y = useSharedValue(85);
  const bubble3Y = useSharedValue(95);

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

  // Looping Potion Fluid Motion
  useEffect(() => {
    waveTranslation.value = withRepeat(
      withTiming(-120, { duration: 3200, easing: Easing.linear }),
      -1,
      false
    );
    backWaveTranslation.value = withRepeat(
      withTiming(120, { duration: 4200, easing: Easing.linear }),
      -1,
      false
    );

    // Floating Bubble loops
    bubble1Y.value = withRepeat(
      withTiming(62, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    bubble2Y.value = withRepeat(
      withTiming(60, { duration: 3100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    bubble3Y.value = withRepeat(
      withTiming(65, { duration: 2700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

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

  // Animated wave horizontal translation props
  const waveAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: waveTranslation.value }],
  }));

  const backWaveAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: backWaveTranslation.value }],
  }));

  // Animated bubble positions
  const bubble1Props = useAnimatedProps(() => ({
    cy: bubble1Y.value,
  }));

  const bubble2Props = useAnimatedProps(() => ({
    cy: bubble2Y.value,
  }));

  const bubble3Props = useAnimatedProps(() => ({
    cy: bubble3Y.value,
  }));

  // ViewBox coordinates
  const cx = 55;
  const cy = 55;
  const r = 46;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size * 0.95 }, animStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 110 110">
          <Defs>
            {/* Ambient amber glow ring */}
            <RadialGradient id="glowRing" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.28" />
              <Stop offset="65%" stopColor="#E8820C" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#E8820C" stopOpacity="0" />
            </RadialGradient>

            {/* Glass back shading */}
            <RadialGradient id="glassBackGrad" cx="35%" cy="35%" rx="65%" ry="65%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="75%" stopColor="#E8820C" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </RadialGradient>

            {/* Deep background nectar highlight */}
            <RadialGradient id="potionBaseGrad" cx="50%" cy="80%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor="#FFF2D4" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#7A3B00" stopOpacity="0" />
            </RadialGradient>

            {/* Front wave: magical glowing honey amber */}
            <LinearGradient id="potionLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FFB338" />
              <Stop offset="40%" stopColor="#FF8C00" />
              <Stop offset="100%" stopColor="#9C4B00" />
            </LinearGradient>

            {/* Back wave: darker shaded nectar */}
            <LinearGradient id="potionLiquidBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#E8820C" />
              <Stop offset="100%" stopColor="#5E2B00" />
            </LinearGradient>

            {/* Glass shell rim highlight refraction */}
            <LinearGradient id="glassRefractionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <Stop offset="70%" stopColor="#E8820C" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.65" />
            </LinearGradient>

            {/* Specular glass highlight gradient */}
            <RadialGradient id="specularG" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>

            {/* Dynamic Shadow Grad */}
            <RadialGradient id="shadowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#9C4B00" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#9C4B00" stopOpacity="0" />
            </RadialGradient>

            {/* Liquid clipping mask to fit perfectly in the glass orb */}
            <ClipPath id="liquidClip">
              <Circle cx={cx} cy={cy} r={r - 2.5} />
            </ClipPath>
          </Defs>

          {/* Glow ring */}
          <Circle cx={cx} cy={cy} r={53} fill="url(#glowRing)" />

          {/* Main glass back body */}
          <Circle cx={cx} cy={cy} r={r} fill="url(#glassBackGrad)" />

          {/* Liquid Potion Section (Clipped) */}
          <G clipPath="url(#liquidClip)">
            {/* Glow backdrop inside the nectar */}
            <Circle cx={cx} cy={cy} r={r - 2.5} fill="url(#potionBaseGrad)" />

            {/* Back Wave (Oscillating) */}
            <AnimatedG animatedProps={backWaveAnimatedProps}>
              <Path
                d="M -120 63 C -90 70, -90 56, -60 63 C -30 70, -30 56, 0 63 C 30 70, 30 56, 60 63 C 90 70, 90 56, 120 63 L 120 110 L -120 110 Z"
                fill="url(#potionLiquidBackGrad)"
                opacity={0.65}
              />
            </AnimatedG>

            {/* Front Wave (Oscillating in opposite phase) */}
            <AnimatedG animatedProps={waveAnimatedProps}>
              <Path
                d="M -120 60 C -90 53, -90 67, -60 60 C -30 53, -30 67, 0 60 C 30 53, 30 67, 60 60 C 90 53, 90 67, 120 60 L 120 110 L -120 110 Z"
                fill="url(#potionLiquidGrad)"
              />
            </AnimatedG>

            {/* Floating magical bubbles */}
            <AnimatedCircle cx={cx - 12} r={1.8} fill="white" opacity={0.65} animatedProps={bubble1Props} />
            <AnimatedCircle cx={cx + 14} r={1.5} fill="white" opacity={0.5} animatedProps={bubble2Props} />
            <AnimatedCircle cx={cx + 2} r={2.2} fill="white" opacity={0.55} animatedProps={bubble3Props} />
          </G>

          {/* Glass Shell Refraction Rim */}
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#glassRefractionGrad)" strokeWidth="2.2" opacity={0.8} />

          {/* Specular highlight details on top-left */}
          <Ellipse cx={cx - 13} cy={cy - 16} rx={16} ry={7} transform={`rotate(-35 ${cx - 13} ${cy - 16})`} fill="url(#specularG)" />
          <Circle cx={cx - 18} cy={cy - 21} r={3.2} fill="white" opacity={0.6} />

          {/* Specular highlight arc on bottom-right */}
          <Path
            d={`M ${cx + r * 0.5} ${cy + r * 0.6} A ${r * 0.8} ${r * 0.8} 0 0 1 ${cx + r * 0.72} ${cy + r * 0.2}`}
            fill="none"
            stroke="white"
            strokeWidth="1.6"
            opacity={0.28}
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
