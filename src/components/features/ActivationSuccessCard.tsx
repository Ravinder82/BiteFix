import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Text } from '../Text';
import { Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GOLD = '#D4AF37';
const EMERALD = '#01922A';

export interface ActivationSuccessCardProps {
  onAnimationComplete?: () => void;
}

export function ActivationSuccessCard({ onAnimationComplete }: ActivationSuccessCardProps) {
  const { colors, isDark } = useTheme();

  // ── Shared Values ─────────────────────────────────────────
  const cardProgress = useSharedValue(0);  // Entry scale and tilt
  const statusPhase = useSharedValue(0);   // Text morph phase (0 to 1)
  const checkProgress = useSharedValue(0); // SVG draw-on

  // ── Animation Lifecycle ────────────────────────────────────
  useEffect(() => {
    // 1. Initial haptic feedback on success
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 2. Card 3D Scale & Tilt In
    cardProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // Apple Cubic Bezier
    });

    // 3. Morph Text after card settles
    statusPhase.value = withDelay(800, withTiming(1, { duration: 400 }));

    // 4. Draw Checkmark & Bounce
    checkProgress.value = withDelay(
      900,
      withSpring(1, { damping: 14, stiffness: 200 }, (finished) => {
        if (finished && onAnimationComplete) {
          // Trigger completion callback after a short pause for the user to read
          setTimeout(() => {
            // Run on JS thread
            if (onAnimationComplete) onAnimationComplete();
          }, 1200);
        }
      })
    );
  }, [cardProgress, statusPhase, checkProgress, onAnimationComplete]);

  // ── Animated Styles ────────────────────────────────────────
  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(cardProgress.value, [0, 1], [0.85, 1], Extrapolate.CLAMP);
    const rotateX = `${interpolate(cardProgress.value, [0, 1], [25, 0], Extrapolate.CLAMP)}deg`;
    const opacity = interpolate(cardProgress.value, [0, 0.6], [0, 1], Extrapolate.CLAMP);

    return {
      opacity,
      transform: [
        { perspective: 800 },
        { scale },
        { rotateX },
      ],
    };
  });

  const checkProps = useAnimatedProps(() => {
    const pathLength = 50;
    const strokeDashoffset = interpolate(checkProgress.value, [0, 1], [pathLength, 0], Extrapolate.CLAMP);
    return {
      strokeDashoffset,
    };
  });

  const statusText1Style = useAnimatedStyle(() => ({
    opacity: interpolate(statusPhase.value, [0, 0.5], [1, 0], Extrapolate.CLAMP),
    transform: [{ translateY: interpolate(statusPhase.value, [0, 0.5], [0, -10], Extrapolate.CLAMP) }],
    position: 'absolute',
  }));

  const statusText2Style = useAnimatedStyle(() => ({
    opacity: interpolate(statusPhase.value, [0.5, 1], [0, 1], Extrapolate.CLAMP),
    transform: [{ translateY: interpolate(statusPhase.value, [0.5, 1], [10, 0], Extrapolate.CLAMP) }],
  }));

  // ── Render ────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)' }]}>
      
      {/* 3D Payment / Pass Card */}
      <Animated.View style={[styles.cardWrapper, cardStyle, { shadowColor: isDark ? '#FFF' : '#000', shadowOpacity: isDark ? 0.1 : 0.2 }]}>
        <LinearGradient
          colors={
            isDark 
              ? ['#1C2A20', '#101B14'] 
              : ['#FFFFFF', '#F0F8F3']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Glossy overlay effect */}
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <Crown size={20} color={GOLD} />
            </View>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>BiteFix Premium</Text>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.cardSubtitle}>ANNUAL PASS</Text>
            <LinearGradient 
              colors={['#D4AF37', '#F9E596', '#D4AF37']} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 1}}
              style={styles.goldChip}
            />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.svgContainer}>
          <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <AnimatedPath
              d="M20 6L9 17L4 12"
              stroke={EMERALD}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="50"
              animatedProps={checkProps}
            />
          </Svg>
        </View>

        <View style={styles.textContainer}>
          <Animated.Text style={[styles.statusText, { color: colors.textSecondary }, statusText1Style]}>
            Activating BiteFix Premium...
          </Animated.Text>
          <Animated.Text style={[styles.statusText, { color: colors.text }, statusText2Style]}>
            BiteFix Premium Activated
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  cardWrapper: {
    width: 290,
    height: 180,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 25,
    elevation: 10,
    backgroundColor: 'transparent', // Let gradient handle bg
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.15)', // Light gold
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  goldChip: {
    width: 32,
    height: 24,
    borderRadius: 6,
    opacity: 0.9,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 32,
    height: 30, // Fixed height to prevent jumping
  },
  svgContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    justifyContent: 'center',
    height: 24,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
