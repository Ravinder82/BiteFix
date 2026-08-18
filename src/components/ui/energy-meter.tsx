import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, ViewProps } from 'react-native';

interface EnergyMeterProps extends ViewProps {
  value: number;
  segments?: number;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  showValue?: boolean;
  colors: any;
}

function getVariant(value: number) {
  if (value < 30) return 'critical';
  if (value <= 60) return 'warning';
  return 'primary';
}

const variantColors = {
  primary: {
    filled: '#01922A', // GREEN
    unfilled: 'rgba(1, 146, 42, 0.2)',
  },
  warning: {
    filled: '#D97706', // AMBER
    unfilled: 'rgba(217, 119, 6, 0.2)',
  },
  critical: {
    filled: '#DC2626', // RED
    unfilled: 'rgba(220, 38, 38, 0.2)',
  },
};

export function EnergyMeter({
  value,
  segments = 10,
  label,
  orientation = 'horizontal',
  showValue = true,
  colors,
  style,
  ...props
}: EnergyMeterProps) {
  const isVertical = orientation === 'vertical';
  const variant = getVariant(value);
  const vColor = variantColors[variant];

  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: value,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, fillAnim]);

  return (
    <View style={[{ gap: 6 }, style]} {...props}>
      {(label || showValue) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text style={{ fontSize: 14, fontWeight: '900', color: vColor.filled }}>
              {Math.round(value)}
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          flexDirection: isVertical ? 'column-reverse' : 'row',
          gap: 3,
          height: isVertical ? 100 : 10,
          width: isVertical ? 10 : '100%',
        }}
      >
        {Array.from({ length: segments }).map((_, i) => {
          const segmentValue = (100 / segments) * (i + 1);
          const prevSegmentValue = (100 / segments) * i;
          
          const fillPercentage = fillAnim.interpolate({
            inputRange: [prevSegmentValue, segmentValue],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp'
          });

          return (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: vColor.unfilled,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  top: isVertical ? undefined : 0,
                  bottom: isVertical ? 0 : 0,
                  left: 0,
                  right: isVertical ? 0 : undefined,
                  width: isVertical ? '100%' : fillPercentage,
                  height: isVertical ? fillPercentage : '100%',
                  backgroundColor: vColor.filled,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
