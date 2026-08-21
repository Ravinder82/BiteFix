import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, useWindowDimensions } from 'react-native';
import { Activity, Droplets, Leaf, Package, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingPriority } from '../../types/onboarding.types';

type VisualProps = {
  colors?: any;
  isDark: boolean;
  reduceMotion?: boolean;
};

const GREEN = '#01922A';
const AMBER = '#D97706';
const TEAL = '#0F766E';

export const PRIORITY_META: Record<OnboardingPriority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  ultra_processed: { label: 'Processing Level', color: GREEN, icon: Package },
  nutrition: { label: 'Nutrition Intelligence', color: TEAL, icon: Activity },
  sugar: { label: 'Sugar Insights', color: AMBER, icon: Droplets },
  ingredients: { label: 'Ingredient Review', color: GREEN, icon: ShieldCheck },
  environment: { label: 'Eco Impact', color: TEAL, icon: Leaf },
};

// ══════════════════════════════════════════════════════════════
// SCREEN 5 — INGREDIENTS LABEL VISUAL
// A realistic back-of-pack paper label: the artifact the user
// struggles with. Warm paper contrasts the app's green system —
// the label is the problem, BiteFix is the solution.
// ══════════════════════════════════════════════════════════════
const LABEL_PARAGRAPH_LINES = 8;
const LABEL_LINE_HEIGHT = 15.5;
const LABEL_PAPER = '#F6F0E3';
const LABEL_INK = '#241E15';
const LABEL_FADED_INK = '#7A6A4F';

export function LabelCompressionVisual({ isDark, reduceMotion = false, isActive = true }: VisualProps & { isActive?: boolean }) {
  const { width } = useWindowDimensions();
  const read = useRef(new Animated.Value(0)).current;

  const cardWidth = Math.max(270, Math.min(322, width - 76));
  const bandTravel = LABEL_PARAGRAPH_LINES * LABEL_LINE_HEIGHT + 34;

  useEffect(() => {
    if (reduceMotion || !isActive) {
      read.stopAnimation();
      read.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(read, { toValue: 1, duration: 4600, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false }),
        Animated.delay(900),
        Animated.timing(read, { toValue: 0, duration: 1, useNativeDriver: true, isInteraction: false }),
        Animated.delay(500),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, read, reduceMotion]);

  // Eyes dragging down the list: a soft amber band sweeps the paragraph.
  const bandY = read.interpolate({
    inputRange: [0, 1],
    outputRange: [-32, bandTravel],
  });

  const barcodeBars = [2, 1, 3, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3];
  const hairline = isDark ? 'rgba(246,240,227,0.26)' : '#DCCFB4';

  return (
    <View
      accessible
      accessibilityLabel="A long, dense ingredient list on the back of a chocolate bar label"
      style={{ alignItems: 'center', marginTop: 6, marginBottom: 20, paddingHorizontal: 10, paddingVertical: 10 }}
    >
      {/* Second label peeking from behind — shelf-fumble depth. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 12,
          left: 18,
          right: 2,
          bottom: 2,
          borderRadius: 10,
          backgroundColor: isDark ? '#39321F' : '#EDE3CD',
          borderWidth: 1,
          borderColor: hairline,
          transform: [{ rotate: '2deg' }],
        }}
      />

      <View
        style={{
          width: cardWidth,
          borderRadius: 10,
          backgroundColor: LABEL_PAPER,
          borderWidth: 1,
          borderColor: hairline,
          paddingHorizontal: 16,
          paddingVertical: 14,
          transform: [{ rotate: '-1.5deg' }],
          shadowColor: '#6E5626',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.3 : 0.16,
          shadowRadius: 18,
          elevation: 6,
          overflow: 'hidden',
        }}
      >
        {/* Dark-mode dim so the paper sits into the night background. */}
        {isDark && (
          <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(12,10,5,0.14)' }} />
        )}

        {/* Product identity row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text numberOfLines={1} style={{ color: LABEL_INK, fontSize: 12.5, fontWeight: '900', letterSpacing: -0.1, flexShrink: 1 }}>
            Organic Dark Chocolate 72%
          </Text>
          <Text style={{ color: LABEL_FADED_INK, fontSize: 10, fontWeight: '700' }}>80 g</Text>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(246,240,227,0.18)' : '#E4D8BE', marginTop: 9, marginBottom: 10 }} />

        {/* Ingredients paragraph, swept by the slow amber reading band. */}
        <View style={{ position: 'relative', overflow: 'hidden' }}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 30,
              opacity: 0.2,
              transform: [{ translateY: bandY }],
            }}
          >
            <LinearGradient
              colors={['rgba(217,119,6,0)', 'rgba(217,119,6,0.95)', 'rgba(217,119,6,0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          <Text
            numberOfLines={LABEL_PARAGRAPH_LINES}
            style={{
              color: LABEL_INK,
              fontSize: Math.max(10, Math.min(11, width * 0.0285)),
              lineHeight: LABEL_LINE_HEIGHT,
              letterSpacing: 0.1,
            }}
          >
            Cocoa mass, sugar, cocoa butter, <Text style={{ fontWeight: '800' }}>wheat flour</Text>, glucose syrup, palm oil, maltodextrin, emulsifier (<Text style={{ fontWeight: '800' }}>soy</Text> lecithin E322), acidity regulator (E330), natural flavouring, raising agents (E500, E503), salt, dried glucose syrup, vitamins (B1, B2, B6, B12), iron, zinc.{'\n'}
            <Text style={{ fontWeight: '700' }}>May contain:</Text> <Text style={{ fontWeight: '800' }}>tree nuts</Text>, <Text style={{ fontWeight: '800' }}>milk</Text>, <Text style={{ fontWeight: '800' }}>peanuts</Text>.
          </Text>
        </View>

        {/* Barcode + storage footer */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1.5, height: 15, opacity: 0.75 }}>
            {barcodeBars.map((barWeight, index) => (
              <View key={index} style={{ width: barWeight, height: barWeight % 2 === 0 ? 15 : 11, backgroundColor: '#8A7A5E' }} />
            ))}
          </View>
          <Text style={{ color: LABEL_FADED_INK, fontSize: 8.5, fontWeight: '700', letterSpacing: 0.6 }}>
            KEEP COOL & DRY
          </Text>
        </View>
      </View>
    </View>
  );
}