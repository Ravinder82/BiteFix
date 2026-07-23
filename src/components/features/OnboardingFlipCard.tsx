import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/Text';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { RefreshCw, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface OnboardingFlipCardProps {
  isDark: boolean;
  colors: any;
}

export function OnboardingFlipCard({ isDark, colors }: OnboardingFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const spin = useSharedValue(0);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextFlipped = !flipped;
    setFlipped(nextFlipped);
    spin.value = withSpring(nextFlipped ? 180 : 0, {
      damping: 14,
      stiffness: 110,
    });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(spin.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(spin.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleFlip}
      style={{ width: '100%', alignItems: 'center', marginVertical: 10 }}
    >
      <View style={{ width: '100%', height: 215, position: 'relative' }}>
        {/* Front Card: Unhealthy Choice */}
        <Animated.View
          style={[
            styles.cardBase,
            {
              backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)',
              shadowColor: '#EF4444',
              shadowOpacity: isDark ? 0.3 : 0.08,
            },
            frontAnimatedStyle,
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
              <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                CURRENT CHOICES
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
              <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '900' }}>NOVA 4</Text>
            </View>
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Commercial Snack</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
            Super Spicy Processed Noodles
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>BiteFix Score</Text>
              <Text style={{ color: '#EF4444', fontSize: 24, fontWeight: '900' }}>22 <Text style={{ fontSize: 12, color: colors.textMuted }}>/100</Text></Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>Nutri-Score</Text>
              <View style={{ backgroundColor: '#EE8100', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 2 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>Grade D</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <RefreshCw size={12} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '800' }}>Tap card to see 3D Clean Upgrade ↺</Text>
          </View>
        </Animated.View>

        {/* Back Card: Clean Upgrade Choice */}
        <Animated.View
          style={[
            styles.cardBase,
            styles.cardBack,
            {
              backgroundColor: isDark ? '#064E3B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.25)',
              shadowColor: '#22C55E',
              shadowOpacity: isDark ? 0.35 : 0.1,
            },
            backAnimatedStyle,
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} color="#22C55E" />
              <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                CLEAN UPGRADE FOUND
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
              <Text style={{ color: '#22C55E', fontSize: 9, fontWeight: '900' }}>NOVA 1</Text>
            </View>
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Simple Mills Clean Alternative</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
            Konjac Shirataki Whole Noodles
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>BiteFix Score</Text>
              <Text style={{ color: '#22C55E', fontSize: 24, fontWeight: '900' }}>92 <Text style={{ fontSize: 12, color: colors.textMuted }}>/100</Text></Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>Nutri-Score</Text>
              <View style={{ backgroundColor: '#038141', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 2 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>Grade A</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <RefreshCw size={12} color="#22C55E" />
            <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '800' }}>Tap to flip back ↺</Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  cardBack: {},
});
