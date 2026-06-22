import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, LinearGradient, Stop, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/Text';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SugarProgressRingProps {
  totalSugar: number; // in grams
  size?: number;
  isDark?: boolean;
  colors: any;
}

export function SugarProgressRing({
  totalSugar,
  size = 200,
  isDark = true,
  colors,
}: SugarProgressRingProps) {
  // Convert total sugar to teaspoons (1 tsp = 4.2g)
  const totalTsp = totalSugar / 4.2;
  
  // 12 tsp (50g) represents 100% of the gauge scale.
  // WHO Limit is 6 tsp (25g), which is exactly 50% of the circle.
  const limitTsp = 6.0;
  const maxTsp = 12.0;
  const targetProgress = Math.min(1.0, totalTsp / maxTsp);

  // Shared values for animations
  const progressVal = useSharedValue(0);
  const breathingScale = useSharedValue(1);
  const bubbleWobble = useSharedValue(0);
  const glowPulse = useSharedValue(0.7);

  useEffect(() => {
    // Animate progress smoothly when sugar changes
    progressVal.value = withTiming(targetProgress, {
      duration: 1200,
      easing: Easing.out(Easing.back(1.0)),
    });
  }, [targetProgress]);

  useEffect(() => {
    // Sync breathing animation loop with mascot's rhythm (4s cycle)
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.98, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Bubble floating wobble cycle
    bubbleWobble.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Glow halo pulse cycle
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  // Determine current health zone status and colors
  let zone: 'safe' | 'warning' | 'limit' | 'danger' = 'safe';
  let zoneColor = colors.success || '#22C55E';
  let zoneText = 'SAFE';
  let glowColor = '#22C55E';

  if (totalTsp > 12.0) {
    zone = 'danger';
    zoneColor = '#A855F7'; // Deep purple for danger zone
    zoneText = 'DANGER ZONE';
    glowColor = '#A855F7';
  } else if (totalTsp > 6.0) {
    zone = 'limit';
    zoneColor = colors.error || '#DC2626'; // Red for exceeding WHO recommended limit
    zoneText = 'LIMIT EXCEEDED';
    glowColor = '#DC2626';
  } else if (totalTsp > 3.5) {
    zone = 'warning';
    zoneColor = colors.warning || '#F5A623'; // Amber/orange for warning zone
    zoneText = 'WARNING';
    glowColor = '#F5A623';
  }

  // Animation styles for breathing
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
  }));

  // Geometry configuration
  const cx = 100;
  const cy = 100;
  const r = 72; // radius of progress bar
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * r; // ~452.39

  // Animated props for the progress path
  const progressPathProps = useAnimatedProps(() => {
    const offset = circumference * (1 - progressVal.value);
    return {
      strokeDashoffset: offset,
    };
  });

  // Animated props for the moving tip droplet bulb
  const tipBulbProps = useAnimatedProps(() => {
    const angle = -Math.PI / 2 + progressVal.value * 2 * Math.PI;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return {
      cx: x,
      cy: y,
      opacity: progressVal.value > 0.01 ? 1.0 : 0,
    };
  });

  // Animated props for floating bubbles
  const bubbleProps = (p: number, rOffset: number, angleShift: number) => {
    return useAnimatedProps(() => {
      // Position is relative to current progress
      const bubbleProgress = progressVal.value;
      if (bubbleProgress < p) {
        return { cx: cx, cy: cy, opacity: 0, r: 0 };
      }
      
      const wobble = bubbleWobble.value;
      const angle = -Math.PI / 2 + (bubbleProgress * p) * 2 * Math.PI + (wobble * 0.08 - 0.04) + angleShift;
      const currentRadius = r + rOffset + (wobble * 3.6 - 1.8);
      const x = cx + currentRadius * Math.cos(angle);
      const y = cy + currentRadius * Math.sin(angle);
      
      // Bubble size based on wobble
      const bubbleSize = 1.6 + wobble * 1.2;
      const bubbleOpacity = 0.5 + wobble * 0.35;

      return {
        cx: x,
        cy: y,
        r: bubbleSize,
        opacity: bubbleOpacity,
      };
    });
  };

  const bubble1Props = bubbleProps(0.20, -3.2, 0.02);
  const bubble2Props = bubbleProps(0.45, 2.8, -0.01);
  const bubble3Props = bubbleProps(0.70, -1.5, 0.03);
  const bubble4Props = bubbleProps(0.88, 3.5, -0.02);

  // Generate tick marks coordinates around the circle (teaspoon lines)
  const ticks = Array.from({ length: 12 }, (_, i) => i + 1);
  const tickRadius = 88; // Slightly outside the progress bar

  // Calculate scaled sizes based on current size relative to base 200
  const scale = size / 200;

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Defs>
          {/* Ambient glow halo matching current health zone */}
          <RadialGradient id="ringGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity="0.22" />
            <Stop offset="70%" stopColor={glowColor} stopOpacity="0.04" />
            <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </RadialGradient>

          {/* Solid glass shading background */}
          <RadialGradient id="glassBack" cx="35%" cy="35%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <Stop offset="80%" stopColor="#000000" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </RadialGradient>

          {/* Liquid progress gradients matching mascot nectar styles */}
          <LinearGradient id="liquidGradSafe" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="50%" stopColor="#34D399" />
            <Stop offset="100%" stopColor="#6EE7B7" />
          </LinearGradient>

          <LinearGradient id="liquidGradWarning" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#E8820C" />
            <Stop offset="60%" stopColor="#F5A623" />
            <Stop offset="100%" stopColor="#F8E71C" />
          </LinearGradient>

          <LinearGradient id="liquidGradLimit" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#DC2626" />
            <Stop offset="60%" stopColor="#EF4444" />
            <Stop offset="100%" stopColor="#F87171" />
          </LinearGradient>

          <LinearGradient id="liquidGradDanger" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#7E22CE" />
            <Stop offset="50%" stopColor="#A855F7" />
            <Stop offset="100%" stopColor="#EC4899" />
          </LinearGradient>

          {/* Glass edge refraction gradient */}
          <LinearGradient id="glassRefraction" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <Stop offset="70%" stopColor={zoneColor} stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </LinearGradient>

          {/* Specular glass reflection */}
          <RadialGradient id="specularReflect" cx="30%" cy="30%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Halo Glow */}
        <Circle cx={cx} cy={cy} r={95} fill="url(#ringGlow)" />

        {/* Outer Teaspoon Gauge Scale Tick Marks */}
        {ticks.map((t) => {
          const angle = -Math.PI / 2 + t * (Math.PI / 6); // 30 degrees per teaspoon
          const tx = cx + tickRadius * Math.cos(angle);
          const ty = cy + tickRadius * Math.sin(angle);
          
          // Determine if this tick is active (sugar consumed reaches it)
          const isActive = totalTsp >= t;
          const tickColor = isActive ? zoneColor : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)');
          
          if (t === 6) {
            // Highlight WHO Limit (6 tsp) with a prominent double ring
            return (
              <G key={`tick-${t}`}>
                {/* Glowing ring under WHO tick */}
                <Circle cx={tx} cy={ty} r={6} fill={isActive ? zoneColor : 'transparent'} opacity={0.25} />
                <Circle cx={tx} cy={ty} r={3.5} fill={tickColor} />
                {/* Visual line pointing to circle */}
                <Path
                  d={`M ${cx + (tickRadius - 5) * Math.cos(angle)} ${cy + (tickRadius - 5) * Math.sin(angle)} L ${cx + (tickRadius - 1) * Math.cos(angle)} ${cy + (tickRadius - 1) * Math.sin(angle)}`}
                  stroke={tickColor}
                  strokeWidth={2}
                />
              </G>
            );
          }
          
          if (t === 12) {
            // Highlight Max limit (12 tsp)
            return (
              <G key={`tick-${t}`}>
                <Circle cx={tx} cy={ty} r={4.5} fill={isActive ? '#DC2626' : tickColor} />
                <Path
                  d={`M ${cx + (tickRadius - 4) * Math.cos(angle)} ${cy + (tickRadius - 4) * Math.sin(angle)} L ${cx + (tickRadius - 1) * Math.cos(angle)} ${cy + (tickRadius - 1) * Math.sin(angle)}`}
                  stroke={isActive ? '#DC2626' : tickColor}
                  strokeWidth={2}
                />
              </G>
            );
          }

          // Standard ticks
          return (
            <Circle
              key={`tick-${t}`}
              cx={tx}
              cy={ty}
              r={isActive ? 2.5 : 1.5}
              fill={tickColor}
            />
          );
        })}

        {/* WHO Indicator Scale Mark label */}
        {(() => {
          const whoAngle = Math.PI / 2;
          return (
            <G>
              {/* WHO marker label */}
              <Path
                d={`M ${cx + 80 * Math.cos(whoAngle)} ${cy + 80 * Math.sin(whoAngle)} L ${cx + 83 * Math.cos(whoAngle)} ${cy + 83 * Math.sin(whoAngle)}`}
                stroke={totalTsp >= 6 ? zoneColor : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')}
                strokeWidth={1.5}
              />
            </G>
          );
        })()}

        {/* Central Core: Translucent Glass Plate */}
        <Circle cx={cx} cy={cy} r={r - 7} fill="url(#glassBack)" />

        {/* Glass Cylinder Track Body */}
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth={strokeWidth} />
        
        {/* Glass Cylinder Inner/Outer refraction borders */}
        <Circle cx={cx} cy={cy} r={r - strokeWidth/2} fill="none" stroke="url(#glassRefraction)" strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={r + strokeWidth/2} fill="none" stroke="url(#glassRefraction)" strokeWidth={1} />

        {/* Active Liquid Progress Arc */}
        <AnimatedPath
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`}
          fill="none"
          stroke={`url(#liquidGrad${zone.charAt(0).toUpperCase() + zone.slice(1)})`}
          strokeWidth={strokeWidth - 2.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={progressPathProps}
        />

        {/* Inner Specular highlight inside the liquid (adds 3D depth) */}
        <AnimatedPath
          d={`M ${cx} ${cy - r + 3} A ${r - 3} ${r - 3} 0 1 1 ${cx - 0.01} ${cy - r + 3}`}
          fill="none"
          stroke="white"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          opacity={0.3}
          animatedProps={progressPathProps}
        />

        {/* Magical floating bubbles within progress path */}
        <AnimatedCircle fill="white" animatedProps={bubble1Props} />
        <AnimatedCircle fill="white" animatedProps={bubble2Props} />
        <AnimatedCircle fill="white" animatedProps={bubble3Props} />
        <AnimatedCircle fill="white" animatedProps={bubble4Props} />

        {/* Glowing bulb halo behind the tip bulb */}
        <AnimatedCircle
          r={14}
          fill={`url(#liquidGrad${zone.charAt(0).toUpperCase() + zone.slice(1)})`}
          animatedProps={tipBulbProps}
          opacity={0.25}
        />

        {/* Floating droplet tip bulb */}
        <AnimatedCircle
          r={9.5}
          fill={`url(#liquidGrad${zone.charAt(0).toUpperCase() + zone.slice(1)})`}
          animatedProps={tipBulbProps}
        />

        {/* Tiny shine reflection inside the tip bulb */}
        <AnimatedCircle
          r={2.5}
          fill="white"
          opacity={0.7}
          animatedProps={useAnimatedProps(() => {
            const angle = -Math.PI / 2 + progressVal.value * 2 * Math.PI - 0.2;
            const x = cx + (r - 2) * Math.cos(angle);
            const y = cy + (r - 2) * Math.sin(angle);
            return {
              cx: x,
              cy: y,
              opacity: progressVal.value > 0.01 ? 0.7 : 0,
            };
          })}
        />

        {/* Specular glass highlight reflection on top left */}
        <Path
          d={`M ${cx - r + 6} ${cy - 10} A ${r - 6} ${r - 6} 0 0 1 ${cx - 10} ${cy - r + 6}`}
          fill="none"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.25}
        />
        <Path
          d={`M ${cx - r + 9} ${cy - 6} A ${r - 9} ${r - 9} 0 0 1 ${cx - 6} ${cy - r + 9}`}
          fill="none"
          stroke="white"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.15}
        />
      </Svg>

      {/* Central Information Overlay (Absolutely Positioned HTML/React Native Views over Center of SVG) */}
      <View style={styles.centerContainer} pointerEvents="none">
        {/* Fraction Teaspoons display */}
        <View style={styles.tspContainer}>
          <Text style={[styles.tspText, { color: colors.text, fontSize: 28 * scale }]} numberOfLines={1}>
            {totalTsp.toFixed(1)}
            <Text style={[styles.limitSlash, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)', fontSize: 15 * scale }]}>/{limitTsp.toFixed(0)}</Text>
          </Text>
          <Text style={[styles.tspLabel, { color: colors.textSecondary, fontSize: 10 * scale }]}>teaspoons</Text>
        </View>

        {/* Total Sugar in Grams */}
        <Text style={[styles.gramText, { color: isDark ? '#9E9EA7' : '#5A4E42', fontSize: 12 * scale }]}>
          {totalSugar.toFixed(1)}g total
        </Text>

        {/* Dynamic Zone Status badge */}
        <View style={[styles.badge, { backgroundColor: zoneColor + '20', borderColor: zoneColor + '40', marginTop: 8 * scale, paddingHorizontal: 8 * scale, paddingVertical: 3.5 * scale }]}>
          <View style={[styles.badgeDot, { backgroundColor: zoneColor, width: 5 * scale, height: 5 * scale, borderRadius: 2.5 * scale }]} />
          <Text style={[styles.badgeText, { color: zoneColor, fontSize: 8 * scale }]}>{zoneText}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tspContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tspText: {
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  limitSlash: {
    fontWeight: '700',
  },
  tspLabel: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginTop: -2,
  },
  gramText: {
    fontWeight: '700',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeDot: {
  },
  badgeText: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

