import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G, Rect, Polygon, Defs, LinearGradient, Stop, RadialGradient, Ellipse, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface SugarPileProps {
  teaspoons: number; // e.g. 4.2
}

export function SugarPile({ teaspoons }: SugarPileProps) {
  const roundedTeaspoons = Math.max(0, teaspoons);
  const integerPart = Math.floor(roundedTeaspoons);
  const fractionalPart = roundedTeaspoons - integerPart;

  // We will build an array of items to render
  const cubes = [];
  for (let i = 0; i < integerPart; i++) {
    cubes.push({ id: `cube-${i}`, scale: 1, delay: i * 150 });
  }
  if (fractionalPart > 0.1) {
    cubes.push({
      id: `cube-fractional`,
      scale: fractionalPart, // Scale down the fractional cube
      delay: integerPart * 150,
    });
  }

  // Trigger haptic feedback for each falling cube
  useEffect(() => {
    if (roundedTeaspoons > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [teaspoons]);

  return (
    <View className="items-center justify-center py-6">
      {/* Title */}
      <View className="mb-6 items-center">
        <Text className="text-5xl font-black text-primary dark:text-primary-light">
          {roundedTeaspoons.toFixed(1)}
        </Text>
        <Text className="text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider text-sm mt-1">
          {roundedTeaspoons === 1 ? 'Teaspoon' : 'Teaspoons'} of Sugar
        </Text>
        <Text className="text-stone-400 dark:text-stone-500 text-xs mt-1">
          (Equals {(roundedTeaspoons * 3.2).toFixed(1)}g total at 3.2g/tsp)
        </Text>
      </View>

      {/* Grid or Stack of cubes */}
      {cubes.length === 0 ? (
        <Text className="text-stone-400 italic py-6">No sugar! Zero sugar heaven 🥳</Text>
      ) : (
        <View className="flex-row flex-wrap justify-center max-w-[280px] min-h-[120px] items-end px-2">
          {cubes.map((cube, index) => (
            <AnimatedCube key={cube.id} delay={cube.delay} scaleFactor={cube.scale} />
          ))}
        </View>
      )}
    </View>
  );
}

interface AnimatedCubeProps {
  delay: number;
  scaleFactor: number;
}

function AnimatedCube({ delay, scaleFactor }: AnimatedCubeProps) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(-120);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Memoize random start values so they persist across re-renders of the same instance
  const startX = React.useMemo(() => (Math.random() - 0.5) * 50, []);
  const startRotation = React.useMemo(() => (Math.random() - 0.5) * 90, []);

  useEffect(() => {
    scale.value = 0;
    translateY.value = -120;
    translateX.value = startX;
    rotation.value = startRotation;

    scale.value = withDelay(
      delay,
      withSpring(scaleFactor, { damping: 11, stiffness: 100 })
    );

    translateX.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 90 })
    );

    rotation.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 90 })
    );

    translateY.value = withDelay(
      delay,
      withSequence(
        withSpring(0, { damping: 10, stiffness: 100 }),
        // Landing bounce
        withSpring(-8, { damping: 7, stiffness: 140 }),
        withSpring(0, { damping: 7, stiffness: 140 })
      )
    );
  }, [delay, scaleFactor]);

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[animStyle]} className="m-1.5">
      <Svg width="46" height="46" viewBox="0 0 60 60" fill="none">
        <Defs>
          {/* Subtle 3D gradient for the faces */}
          <LinearGradient id="topFaceGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F5F6FF" />
          </LinearGradient>
          <LinearGradient id="leftFaceGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#E9EDF5" />
            <Stop offset="100%" stopColor="#D2D9E8" />
          </LinearGradient>
          <LinearGradient id="rightFaceGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#DBE1ED" />
            <Stop offset="100%" stopColor="#C4CEDF" />
          </LinearGradient>
          
          {/* Shadow gradient */}
          <RadialGradient id="cubeShadowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Drop Shadow */}
        <Ellipse cx="30" cy="50" rx="20" ry="4" fill="url(#cubeShadowGrad)" />

        {/* 3D Isometric Sugar Cube */}
        <G>
          {/* Top Face */}
          <Polygon points="30,12 48,21 30,30 12,21" fill="url(#topFaceGrad)" stroke="#C4CEDF" strokeWidth="1" />
          
          {/* Left Face */}
          <Polygon points="12,21 30,30 30,48 12,39" fill="url(#leftFaceGrad)" stroke="#B0BACD" strokeWidth="1" />
          
          {/* Right Face */}
          <Polygon points="30,30 48,21 48,39 30,48" fill="url(#rightFaceGrad)" stroke="#B0BACD" strokeWidth="1" />
          
          {/* Speckle highlights to give crystal sugar feel */}
          <Circle cx="22" cy="18" r="0.8" fill="#FFFFFF" opacity={0.8} />
          <Circle cx="35" cy="16" r="0.8" fill="#FFFFFF" opacity={0.8} />
          <Circle cx="26" cy="24" r="0.6" fill="#FFFFFF" opacity={0.8} />
        </G>
      </Svg>
    </Animated.View>
  );
}
