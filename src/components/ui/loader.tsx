import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

const GREEN = '#01922aff';
const GREEN_BRIGHT = '#34d873';

export function LoaderThree({
  isActive = true,
  phase = 'synthesizing',
  isDark = false,
}: {
  isActive?: boolean;
  phase?: 'synthesizing' | 'complete';
  isDark?: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      pulseAnim.setValue(0);
      return;
    }

    if (phase === 'synthesizing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, phase]);

  const segments = 5;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 24, marginVertical: 6 }}>
      {Array.from({ length: segments }).map((_, i) => {
        // Stagger the pulse for each segment
        const opacity = phase === 'complete' ? 1 : pulseAnim.interpolate({
          inputRange: [
            Math.max(0, (i - 1.5) / segments),
            i / segments,
            Math.min(1, (i + 1.5) / segments)
          ],
          outputRange: [0.15, 1, 0.15],
          extrapolate: 'clamp',
        });

        const scale = phase === 'complete' ? 1 : pulseAnim.interpolate({
            inputRange: [
              Math.max(0, (i - 1.5) / segments),
              i / segments,
              Math.min(1, (i + 1.5) / segments)
            ],
            outputRange: [0.85, 1.3, 0.85],
            extrapolate: 'clamp',
          });

        return (
          <Animated.View
            key={i}
            style={{
              width: 48,
              height: 8,
              borderRadius: 4,
              backgroundColor: (phase === 'complete' || isDark) ? GREEN_BRIGHT : GREEN,
              opacity: opacity,
              transform: [{ scaleY: phase === 'complete' ? 1.15 : scale }, { scaleX: phase === 'complete' ? 1.05 : scale }],
              shadowColor: (phase === 'complete' || isDark) ? GREEN_BRIGHT : GREEN,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: phase === 'complete' ? 0.95 : 0.6,
              shadowRadius: phase === 'complete' ? 8 : 4,
              elevation: 4,
            }}
          />
        );
      })}
    </View>
  );
}
