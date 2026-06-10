import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

export type MascotState = 'idle' | 'happy' | 'shocked' | 'dizzy';

interface MascotProps {
  state?: MascotState;
  size?: number;
}

export function Mascot({ state = 'idle', size = 150 }: MascotProps) {
  // Shared values for animations
  const bounce = useSharedValue(0);
  const breath = useSharedValue(1);
  const eyeSquint = useSharedValue(1);
  const sweatOffset = useSharedValue(-10);
  const bodyRotation = useSharedValue(0);

  useEffect(() => {
    // Reset animations
    bounce.value = 0;
    breath.value = 1;
    eyeSquint.value = 1;
    sweatOffset.value = -10;
    bodyRotation.value = 0;

    if (state === 'idle') {
      // Gentle breathing animation
      breath.value = withRepeat(
        withTiming(0.96, { duration: 1200 }),
        -1,
        true
      );
      // Occasional winking (handled by squinting)
      const interval = setInterval(() => {
        eyeSquint.value = withSequence(
          withTiming(0.1, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
      }, 4000);
      return () => clearInterval(interval);
    } else if (state === 'happy') {
      // Excited bouncing and wiggling
      bounce.value = withRepeat(
        withSequence(
          withSpring(-15, { damping: 4 }),
          withSpring(0, { damping: 4 })
        ),
        -1,
        false
      );
      bodyRotation.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 150 }),
          withTiming(4, { duration: 150 })
        ),
        -1,
        true
      );
    } else if (state === 'shocked') {
      // Trembling rotation and sweating
      bodyRotation.value = withRepeat(
        withSequence(
          withTiming(-1.5, { duration: 50 }),
          withTiming(1.5, { duration: 50 })
        ),
        -1,
        true
      );
      sweatOffset.value = withRepeat(
        withTiming(15, { duration: 1000 }),
        -1,
        false
      );
    } else if (state === 'dizzy') {
      // Swaying slow rotation and closed eyes
      bodyRotation.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 800 }),
          withTiming(8, { duration: 800 })
        ),
        -1,
        true
      );
      breath.value = withRepeat(
        withTiming(0.94, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [state]);

  // Animated styles
  const animBodyStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: bounce.value },
        { scaleY: breath.value },
        { rotate: `${bodyRotation.value}deg` },
      ],
    };
  });

  const animSweatStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: sweatOffset.value },
      ],
      opacity: state === 'shocked' ? 1 : 0,
    };
  });

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Animated.View style={[animBodyStyle]} className="items-center justify-center">
        <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
          <Defs>
            <LinearGradient id="cubeGrad" x1="0" y1="0" x2="0" y2="120">
              <Stop offset="0%" stopColor="#ffffff" />
              <Stop offset="100%" stopColor="#f3f4f6" />
            </LinearGradient>
            <LinearGradient id="sweatGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#38bdf8" />
              <Stop offset="100%" stopColor="#0284c7" />
            </LinearGradient>
          </Defs>

          {/* Shadow */}
          <EllipseSVG cx="60" cy="110" rx="35" ry="6" fill="#000000" opacity="0.08" />

          {/* Legs */}
          <Path d="M45 95 C45 105, 42 108, 38 108" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" />
          <Path d="M75 95 C75 105, 78 108, 82 108" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" />

          {/* Cube Main Body */}
          <Rect
            x="20"
            y="20"
            width="80"
            height="80"
            rx="16"
            fill="url(#cubeGrad)"
            stroke="#4338ca"
            strokeWidth="4"
          />

          {/* Inside Cube Sparkles/Highlights */}
          <Path d="M30 30 L45 30" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
          <Path d="M30 30 L30 45" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />

          {/* State Specific Faces */}
          {state === 'idle' && (
            <G>
              {/* Cute normal eyes */}
              <Circle cx="45" cy="55" r="4.5" fill="#312e81" />
              <Circle cx="75" cy="55" r="4.5" fill="#312e81" />
              {/* Blush */}
              <Circle cx="36" cy="62" r="5" fill="#fda4af" opacity="0.7" />
              <Circle cx="84" cy="62" r="5" fill="#fda4af" opacity="0.7" />
              {/* Smiling mouth */}
              <Path d="M56 64 Q60 68 64 64" stroke="#312e81" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </G>
          )}

          {state === 'happy' && (
            <G>
              {/* Happy curved eyes */}
              <Path d="M40 56 Q45 50 50 56" stroke="#312e81" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <Path d="M70 56 Q75 50 80 56" stroke="#312e81" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* Blush */}
              <Circle cx="36" cy="62" r="6" fill="#f43f5e" opacity="0.5" />
              <Circle cx="84" cy="62" r="6" fill="#f43f5e" opacity="0.5" />
              {/* Big open mouth */}
              <Path d="M53 62 Q60 72 67 62" fill="#e11d48" stroke="#312e81" strokeWidth="3" strokeLinecap="round" />
            </G>
          )}

          {state === 'shocked' && (
            <G>
              {/* Big round eyes */}
              <Circle cx="42" cy="52" r="7" fill="#312e81" />
              <Circle cx="78" cy="52" r="7" fill="#312e81" />
              <Circle cx="40" cy="50" r="2" fill="#ffffff" />
              <Circle cx="76" cy="50" r="2" fill="#ffffff" />
              {/* Worried mouth */}
              <Circle cx="60" cy="68" r="8" fill="#312e81" />
              <Circle cx="60" cy="67" r="6" fill="#fda4af" />
            </G>
          )}

          {state === 'dizzy' && (
            <G>
              {/* X eyes */}
              <Path d="M38 48 L48 58 M48 48 L38 58" stroke="#312e81" strokeWidth="4" strokeLinecap="round" />
              <Path d="M72 48 L82 58 M82 48 L72 58" stroke="#312e81" strokeWidth="4" strokeLinecap="round" />
              {/* Wavy mouth */}
              <Path d="M52 68 Q56 62 60 68 T68 68" stroke="#312e81" strokeWidth="4" strokeLinecap="round" fill="none" />
            </G>
          )}

          {/* Arms (Idle/Wave / Scared) */}
          {state === 'happy' ? (
            <G>
              <Path d="M20 60 C10 50, 5 45, 10 38" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" fill="none" />
              <Path d="M100 60 C110 50, 115 45, 110 38" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" fill="none" />
            </G>
          ) : state === 'shocked' ? (
            <G>
              <Path d="M20 60 C12 65, 8 70, 10 75" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" fill="none" />
              <Path d="M100 60 C108 65, 112 70, 110 75" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" fill="none" />
            </G>
          ) : (
            <G>
              <Path d="M20 60 C12 64, 10 70, 14 74" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" fill="none" />
              <Path d="M100 60 C108 64, 110 70, 106 74" stroke="#3730a3" strokeWidth="4" strokeLinecap="round" fill="none" />
            </G>
          )}
        </Svg>

        {/* Sweat Droplet for Shocked state */}
        <Animated.View style={[{ position: 'absolute', top: 35, right: 25 }, animSweatStyle]}>
          <Svg width="15" height="20" viewBox="0 0 15 20">
            <Path d="M7.5 0 C7.5 0, 15 10, 15 14 C15 17.3 11.6 20 7.5 20 C3.4 20 0 17.3 0 14 C0 10, 7.5 0, 7.5 0 Z" fill="url(#sweatGrad)" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Internal wrapper to support custom elliptical shadow in pure SVG
function EllipseSVG({ cx, cy, rx, ry, fill, opacity }: { cx: string; cy: string; rx: string; ry: string; fill: string; opacity?: string }) {
  return (
    <Path
      d={`M ${parseFloat(cx) - parseFloat(rx)} ${cy} A ${rx} ${ry} 0 1 0 ${parseFloat(cx) + parseFloat(rx)} ${cy} A ${rx} ${ry} 0 1 0 ${parseFloat(cx) - parseFloat(rx)} ${cy} Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}
