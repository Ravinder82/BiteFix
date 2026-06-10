import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G, Rect, Polygon } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
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
  const translateY = useSharedValue(-50);

  useEffect(() => {
    scale.value = 0;
    translateY.value = -50;

    scale.value = withDelay(
      delay,
      withSpring(scaleFactor, { damping: 12, stiffness: 100 })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 100 })
    );
  }, [delay, scaleFactor]);

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <Animated.View style={[animStyle]} className="m-2">
      <Svg width="50" height="50" viewBox="0 0 60 60" fill="none">
        {/* Shadow */}
        <Rect x="10" y="45" width="40" height="6" rx="3" fill="#000000" opacity="0.08" />

        {/* 3D Isometric Sugar Cube */}
        <G>
          {/* Top Face */}
          <Polygon points="30,10 50,20 30,30 10,20" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1.5" />
          
          {/* Left Face */}
          <Polygon points="10,20 30,30 30,50 10,40" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          
          {/* Right Face */}
          <Polygon points="30,30 50,20 50,40 30,50" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        </G>
      </Svg>
    </Animated.View>
  );
}
