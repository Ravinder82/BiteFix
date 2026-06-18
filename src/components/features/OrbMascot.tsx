import React, { useEffect } from 'react';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';

export type MascotState = 'idle' | 'happy' | 'shocked' | 'dizzy';

interface OrbMascotProps {
  state?: MascotState;
  size?: number;
}

export function OrbMascot({ state = 'idle', size = 120 }: OrbMascotProps) {
  const bounce = useSharedValue(0);
  const scaleY = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Cancel previous
    bounce.value = 0;
    scaleY.value = 1;
    rotation.value = 0;

    if (state === 'idle') {
      // Gentle breathing float
      bounce.value = withRepeat(
        withSequence(
          withTiming(-7, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      scaleY.value = withRepeat(
        withSequence(
          withTiming(0.96, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else if (state === 'happy') {
      // Joyful bouncing with squash-stretch
      bounce.value = withRepeat(
        withSequence(
          withSpring(-18, { damping: 5, stiffness: 130 }),
          withSpring(2, { damping: 5, stiffness: 130 }),
          withSpring(0, { damping: 8, stiffness: 130 }),
        ),
        -1,
        false
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 160, easing: Easing.inOut(Easing.quad) }),
          withTiming(5, { duration: 160, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 100 }),
        ),
        -1,
        false
      );
    } else if (state === 'shocked') {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 60 }),
          withTiming(3, { duration: 60 })
        ),
        -1,
        true
      );
    } else if (state === 'dizzy') {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: 900, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [state]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { scaleY: scaleY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  // All coords based on 110×110 viewBox
  const cx = 55;
  const cy = 55;
  const r = 46;

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Svg width={size} height={size} viewBox="0 0 110 110">
        <Defs>
          {/* Main 3D sphere gradient — warm amber */}
          <RadialGradient id="sphereGrad" cx="38%" cy="30%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor="#FFE0A0" />
            <Stop offset="20%" stopColor="#FFBB4D" />
            <Stop offset="55%" stopColor="#F5921E" />
            <Stop offset="85%" stopColor="#E8820C" />
            <Stop offset="100%" stopColor="#9E5000" />
          </RadialGradient>

          {/* Soft glow ring — visible on light AND dark bg */}
          <RadialGradient id="glowRing" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#F5921E" stopOpacity="0.22" />
            <Stop offset="55%" stopColor="#F5921E" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#F5921E" stopOpacity="0" />
          </RadialGradient>

          {/* Bottom contact shadow */}
          <RadialGradient id="shadowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#C06800" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#C06800" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Drop shadow ellipse at bottom */}
        <Circle cx={cx} cy={105} r={22} fill="url(#shadowGrad)" scaleY={0.3} />

        {/* Glow ring */}
        <Circle cx={cx} cy={cy} r={52} fill="url(#glowRing)" />

        {/* Main sphere body */}
        <Circle cx={cx} cy={cy} r={r} fill="url(#sphereGrad)" />

        {/* Top-left specular highlight — large soft */}
        <Circle cx={cx - 12} cy={cy - 15} r={17} fill="white" opacity={0.22} />
        {/* Tight specular hot spot */}
        <Circle cx={cx - 15} cy={cy - 18} r={7} fill="white" opacity={0.45} />

        {/* Bottom rim darkening */}
        <Path
          d={`M${cx - r * 0.7} ${cy + r * 0.6} Q${cx} ${cy + r * 1.1} ${cx + r * 0.7} ${cy + r * 0.6}`}
          fill="none"
          stroke="#7A3E00"
          strokeWidth="6"
          opacity={0.12}
          strokeLinecap="round"
        />

        {/* ── Face expressions ── */}
        {state === 'idle' && (
          <>
            <Circle cx={cx - 11} cy={cy - 3} r={3.5} fill="#5C2E00" />
            <Circle cx={cx + 11} cy={cy - 3} r={3.5} fill="#5C2E00" />
            <Circle cx={cx - 12.5} cy={cy - 4.5} r={1.3} fill="white" opacity={0.9} />
            <Circle cx={cx + 9.5} cy={cy - 4.5} r={1.3} fill="white" opacity={0.9} />
            <Path
              d={`M${cx - 9} ${cy + 8} Q${cx} ${cy + 15} ${cx + 9} ${cy + 8}`}
              stroke="#5C2E00" strokeWidth={2.8} strokeLinecap="round" fill="none"
            />
            {/* Cute blush spots */}
            <Circle cx={cx - 20} cy={cy + 4} r={5} fill="#FF9040" opacity={0.25} />
            <Circle cx={cx + 20} cy={cy + 4} r={5} fill="#FF9040" opacity={0.25} />
          </>
        )}

        {state === 'happy' && (
          <>
            {/* Curved closed happy eyes */}
            <Path
              d={`M${cx - 16} ${cy + 1} Q${cx - 11} ${cy - 7} ${cx - 6} ${cy + 1}`}
              stroke="#5C2E00" strokeWidth={3.2} strokeLinecap="round" fill="none"
            />
            <Path
              d={`M${cx + 6} ${cy + 1} Q${cx + 11} ${cy - 7} ${cx + 16} ${cy + 1}`}
              stroke="#5C2E00" strokeWidth={3.2} strokeLinecap="round" fill="none"
            />
            {/* Open happy mouth with teeth */}
            <Path
              d={`M${cx - 10} ${cy + 6} Q${cx} ${cy + 18} ${cx + 10} ${cy + 6}`}
              stroke="#5C2E00" strokeWidth={2.5} strokeLinecap="round" fill="#B85500"
            />
            <Path
              d={`M${cx - 6} ${cy + 6} L${cx - 2} ${cy + 6} L${cx + 2} ${cy + 6} L${cx + 6} ${cy + 6}`}
              stroke="white" strokeWidth={1.5} fill="none" opacity={0.7}
            />
            {/* Bigger blush */}
            <Circle cx={cx - 22} cy={cy + 4} r={7} fill="#FF8020" opacity={0.28} />
            <Circle cx={cx + 22} cy={cy + 4} r={7} fill="#FF8020" opacity={0.28} />
          </>
        )}

        {state === 'shocked' && (
          <>
            <Circle cx={cx - 11} cy={cy - 3} r={5.5} fill="#5C2E00" />
            <Circle cx={cx + 11} cy={cy - 3} r={5.5} fill="#5C2E00" />
            <Circle cx={cx - 13} cy={cy - 5} r={2.2} fill="white" opacity={0.9} />
            <Circle cx={cx + 9} cy={cy - 5} r={2.2} fill="white" opacity={0.9} />
            <Circle cx={cx} cy={cy + 10} r={6} fill="#5C2E00" />
            <Circle cx={cx} cy={cy + 9} r={4} fill="#A04000" />
          </>
        )}

        {state === 'dizzy' && (
          <>
            <Path d={`M${cx - 15} ${cy - 6} L${cx - 8} ${cy + 1}`} stroke="#5C2E00" strokeWidth={3} strokeLinecap="round" />
            <Path d={`M${cx - 8} ${cy - 6} L${cx - 15} ${cy + 1}`} stroke="#5C2E00" strokeWidth={3} strokeLinecap="round" />
            <Path d={`M${cx + 8} ${cy - 6} L${cx + 15} ${cy + 1}`} stroke="#5C2E00" strokeWidth={3} strokeLinecap="round" />
            <Path d={`M${cx + 15} ${cy - 6} L${cx + 8} ${cy + 1}`} stroke="#5C2E00" strokeWidth={3} strokeLinecap="round" />
            <Path
              d={`M${cx - 9} ${cy + 9} Q${cx - 4} ${cy + 4} ${cx} ${cy + 9} T${cx + 9} ${cy + 9}`}
              stroke="#5C2E00" strokeWidth={2.8} strokeLinecap="round" fill="none"
            />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}
