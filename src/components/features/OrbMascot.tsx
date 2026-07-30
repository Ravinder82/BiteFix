import React, { memo, useEffect, useId, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * BiteFix OrbMascot — “The Living Scanner”
 *
 * Character thesis:
 * The orb is made from intelligent glass. Its internal liquid is the food truth
 * it discovers, while a barcode scan beam is the unmistakable BiteFix signature.
 * It does not decorate the UI: it communicates scan status and product safety.
 *
 * Dependencies:
 *   react-native-svg
 *   react-native-reanimated >= 3
 *
 * Accessibility:
 *   Set reduceMotion from your app/system accessibility preference.
 */

export type MascotState =
  | 'idle'
  | 'thinking'
  | 'scanning'
  | 'clean'
  | 'caution'
  | 'blocked'
  // Legacy aliases retained for drop-in compatibility.
  | 'happy'
  | 'shocked'
  | 'dizzy';

export type MascotTheme = 'obsidian' | 'porcelain';

export interface OrbMascotProps {
  state?: MascotState;
  size?: number;
  theme?: MascotTheme;
  reduceMotion?: boolean;
  showShadow?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional accessible name. Defaults to a state-specific description. */
  accessibilityLabel?: string;
  /** Fired once when the finite clean-result celebration completes. */
  onCelebrationComplete?: () => void;
  testID?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const CX = 60;
const CY = 60;
const R = 46;
const TWO_PI_R = 2 * Math.PI * 51;

const TOKENS = {
  obsidian: '#060708',
  ink: '#111417',
  eyeOnDark: '#07120E',
  eyeOnLight: '#102019',
  white: '#F7FBFA',
  clean: {
    primary: '#5ece02ff',   // Luxury Lighter Lime Green
    secondary: '#A3E66F', // Bright Light Lime
    deep: '#3A5E14',      // Deep Lime Green for shading
    halo: '#F0FCE6',      // Soft Lime Glow
  },
  caution: {
    primary: '#FFB800',   // Vibrant Gold/Yellow
    secondary: '#FF7A00', // Vivid Orange
    deep: '#3D1C00',      // Deep Amber Dark
    halo: '#FFF8EB',      // Soft Gold Glow
  },
  blocked: {
    primary: '#FF4141',   // Vivid Coral Red
    secondary: '#C90000', // Deep Crimson
    deep: '#450000',      // Red-Black Dark
    halo: '#FFEBEB',      // Soft Coral Glow
  },
  neutral: {
    primary: '#CEFFA6',   // Luxury Lighter Lime Green
    secondary: '#A3E66F', // Bright Light Lime
    deep: '#3A5E14',      // Deep Lime Green for shading
    halo: '#F0FCE6',      // Soft Lime Glow
  },
  champagne: '#E8C36A',
} as const;

type VisualState = 'idle' | 'thinking' | 'scanning' | 'clean' | 'caution' | 'blocked';

function normalizeState(state: MascotState): VisualState {
  if (state === 'happy') return 'clean';
  if (state === 'shocked') return 'blocked';
  if (state === 'dizzy') return 'caution';
  return state;
}

function stateLabel(state: VisualState): string {
  switch (state) {
    case 'scanning': return 'BiteFix mascot scanning a food barcode';
    case 'thinking': return 'BiteFix mascot analysing ingredients';
    case 'clean': return 'BiteFix mascot confirms this product is a clean choice';
    case 'caution': return 'BiteFix mascot advises caution for this product';
    case 'blocked': return 'BiteFix mascot warns that this product conflicts with your shield';
    default: return 'BiteFix food scanner mascot ready to scan';
  }
}

function paletteFor(state: VisualState) {
  if (state === 'clean') return TOKENS.clean;
  if (state === 'caution') return TOKENS.caution;
  if (state === 'blocked') return TOKENS.blocked;
  return TOKENS.neutral;
}

function OrbMascotComponent({
  state = 'idle',
  size = 180,
  theme = 'obsidian',
  reduceMotion = false,
  showShadow = true,
  style,
  accessibilityLabel,
  onCelebrationComplete,
  testID,
}: OrbMascotProps) {
  const visualState = normalizeState(state);
  const palette = useMemo(() => paletteFor(visualState), [visualState]);
  const uid = useId().replace(/[:]/g, '');
  const id = (name: string) => `${name}-${uid}`;

  // Character motion.
  const lift = useSharedValue(0);
  const squash = useSharedValue(1);
  const turn = useSharedValue(0);
  const halo = useSharedValue(0.5);
  const blink = useSharedValue(1);
  const gazeX = useSharedValue(0);

  // Material motion.
  const waveA = useSharedValue(0);
  const waveB = useSharedValue(-120);
  const bubble1 = useSharedValue(78);
  const bubble2 = useSharedValue(72);
  const bubble3 = useSharedValue(83);

  // Scanner and result motion.
  const scanY = useSharedValue(24);
  const scanOpacity = useSharedValue(0);
  const orbit = useSharedValue(0);
  const resultRing = useSharedValue(0);
  const resultScale = useSharedValue(0.84);

  const stopAll = () => {
    [lift, squash, turn, halo, blink, gazeX, waveA, waveB, bubble1, bubble2,
      bubble3, scanY, scanOpacity, orbit, resultRing, resultScale]
      .forEach(cancelAnimation);
  };

  useEffect(() => {
    stopAll();
    lift.value = withTiming(0, { duration: 160 });
    squash.value = withTiming(1, { duration: 160 });
    turn.value = withTiming(0, { duration: 160 });
    gazeX.value = withTiming(0, { duration: 140 });
    blink.value = 1;
    scanOpacity.value = 0;
    resultRing.value = 0;
    resultScale.value = 0.84;

    if (reduceMotion) {
      halo.value = 0.58;
      if (visualState === 'scanning') {
        scanY.value = 60;
        scanOpacity.value = 0.92;
      }
      if (visualState === 'clean') {
        resultRing.value = 1;
        resultScale.value = 1;
      }
      return stopAll;
    }

    // The orb always feels alive, but never bounces continuously during warnings.
    halo.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.44, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );

    if (visualState === 'idle') {
      lift.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        ), -1, false,
      );
      squash.value = withRepeat(
        withSequence(
          withTiming(0.975, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        ), -1, false,
      );
    }

    if (visualState === 'thinking') {
      turn.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(4, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 520, easing: Easing.out(Easing.quad) }),
        ), -1, false,
      );
      gazeX.value = withRepeat(
        withSequence(withTiming(2.5, { duration: 700 }), withTiming(-2, { duration: 1100 })),
        -1, true,
      );
      orbit.value = withRepeat(withTiming(360, { duration: 3200, easing: Easing.linear }), -1, false);
    }

    if (visualState === 'scanning') {
      scanOpacity.value = withTiming(1, { duration: 180 });
      scanY.value = 25;
      scanY.value = withRepeat(
        withSequence(
          withTiming(93, { duration: 1050, easing: Easing.inOut(Easing.quad) }),
          withTiming(25, { duration: 1050, easing: Easing.inOut(Easing.quad) }),
        ), -1, false,
      );
      squash.value = withRepeat(
        withSequence(withTiming(0.988, { duration: 1050 }), withTiming(1, { duration: 1050 })),
        -1, false,
      );
    }

    if (visualState === 'clean') {
      resultRing.value = withTiming(1, {
        duration: 720,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      });
      resultScale.value = withSpring(1, { damping: 13, stiffness: 180, mass: 0.9 });
      lift.value = withSequence(
        withSpring(-16, { damping: 8, stiffness: 210 }),
        withSpring(0, { damping: 12, stiffness: 190 }),
        withDelay(150, withSequence(
          withTiming(-4, { duration: 180 }),
          withTiming(0, { duration: 220 }),
        )),
      );
      const timer = setTimeout(() => onCelebrationComplete?.(), 1250);
      return () => { clearTimeout(timer); stopAll(); };
    }

    if (visualState === 'caution') {
      turn.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 440, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 440, easing: Easing.inOut(Easing.sin) }),
        ), -1, true,
      );
    }

    if (visualState === 'blocked') {
      turn.value = withSequence(
        withTiming(-5, { duration: 55 }), withTiming(5, { duration: 55 }),
        withTiming(-4, { duration: 55 }), withTiming(4, { duration: 55 }),
        withTiming(0, { duration: 90 }),
      );
      squash.value = withSequence(
        withTiming(0.92, { duration: 110 }),
        withSpring(1, { damping: 11, stiffness: 240 }),
      );
    }

    return stopAll;
  }, [visualState, reduceMotion]);

  // Organic liquid motion is independent from semantic state.
  useEffect(() => {
    if (reduceMotion) {
      waveA.value = 0;
      waveB.value = -120;
      return;
    }
    waveA.value = withRepeat(withTiming(-120, { duration: 3600, easing: Easing.linear }), -1, false);
    waveB.value = withRepeat(withTiming(0, { duration: 4700, easing: Easing.linear }), -1, false);
    bubble1.value = withRepeat(withTiming(43, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    bubble2.value = withRepeat(withTiming(38, { duration: 3300, easing: Easing.inOut(Easing.sin) }), -1, true);
    bubble3.value = withRepeat(withTiming(50, { duration: 2900, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => [waveA, waveB, bubble1, bubble2, bubble3].forEach(cancelAnimation);
  }, [reduceMotion]);

  // Natural, irregular blink rhythm (deterministic sequence, no runaway interval).
  useEffect(() => {
    if (reduceMotion || !['idle', 'thinking'].includes(visualState)) {
      blink.value = 1;
      return;
    }
    blink.value = withRepeat(
      withSequence(
        withDelay(3200, withSequence(
          withTiming(0.06, { duration: 72 }),
          withTiming(1, { duration: 105 }),
        )),
        withDelay(170, withSequence(
          withTiming(0.06, { duration: 62 }),
          withTiming(1, { duration: 96 }),
        )),
        withDelay(1800, withTiming(1, { duration: 1 })),
      ), -1, false,
    );
    return () => cancelAnimation(blink);
  }, [visualState, reduceMotion]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { rotateZ: `${turn.value}deg` },
      { scaleY: squash.value },
      { scale: resultScale.value === 0.84 && visualState !== 'clean' ? 1 : resultScale.value },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => {
    const altitude = Math.min(1, Math.max(0, -lift.value / 16));
    return {
      opacity: 0.3 - altitude * 0.13,
      transform: [{ scaleX: 1 - altitude * 0.2 }, { scaleY: 1 - altitude * 0.12 }],
    };
  });

  const haloProps = useAnimatedProps(() => ({ opacity: halo.value }));
  const eyeProps = useAnimatedProps(() => ({ ry: Math.max(0.45, blink.value * 4.1) }));
  const leftPupilProps = useAnimatedProps(() => ({ cx: 47 + gazeX.value }));
  const rightPupilProps = useAnimatedProps(() => ({ cx: 73 + gazeX.value }));
  const waveAProps = useAnimatedProps(() => ({ transform: [{ translateX: waveA.value }] }));
  const waveBProps = useAnimatedProps(() => ({ transform: [{ translateX: waveB.value }] }));
  const bubble1Props = useAnimatedProps(() => ({ cy: bubble1.value }));
  const bubble2Props = useAnimatedProps(() => ({ cy: bubble2.value }));
  const bubble3Props = useAnimatedProps(() => ({ cy: bubble3.value }));
  const scanProps = useAnimatedProps(() => ({ y: scanY.value, opacity: scanOpacity.value }));
  const orbitProps = useAnimatedProps(() => ({
    transform: `rotate(${orbit.value} ${CX} ${CY})`,
  }));
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: TWO_PI_R * (1 - resultRing.value),
    opacity: resultRing.value,
  }));

  const eye = theme === 'obsidian' ? TOKENS.eyeOnDark : TOKENS.eyeOnLight;
  const liquidTop = visualState === 'blocked' ? 48 : visualState === 'caution' ? 43 : 39;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? stateLabel(visualState)}
      testID={testID}
      style={[{ width: size, height: size * 1.1, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Animated.View style={[{ width: size, height: size }, orbStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 120 120">
          <Defs>
            <RadialGradient id={id('halo')} cx="50%" cy="48%" rx="52%" ry="52%">
              <Stop offset="0" stopColor={palette.halo} stopOpacity="0.34" />
              <Stop offset="0.62" stopColor={palette.primary} stopOpacity="0.11" />
              <Stop offset="1" stopColor={palette.primary} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={id('glass')} cx="32%" cy="25%" rx="74%" ry="78%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.24" />
              <Stop offset="0.32" stopColor="#FFFFFF" stopOpacity="0.05" />
              <Stop offset="0.7" stopColor={palette.deep} stopOpacity="0.11" />
              <Stop offset="1" stopColor={TOKENS.obsidian} stopOpacity="0.48" />
            </RadialGradient>
            <LinearGradient id={id('liquid')} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.halo} />
              <Stop offset="0.22" stopColor={palette.primary} />
              <Stop offset="1" stopColor={palette.secondary} />
            </LinearGradient>
            <LinearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.94" />
              <Stop offset="0.2" stopColor="#FFFFFF" stopOpacity="0.22" />
              <Stop offset="0.58" stopColor={palette.primary} stopOpacity="0.42" />
              <Stop offset="0.82" stopColor="#FFFFFF" stopOpacity="0.13" />
              <Stop offset="1" stopColor={TOKENS.champagne} stopOpacity="0.68" />
            </LinearGradient>
            <LinearGradient id={id('beam')} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={palette.primary} stopOpacity="0" />
              <Stop offset="0.2" stopColor={palette.halo} stopOpacity="0.9" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="0.8" stopColor={palette.halo} stopOpacity="0.9" />
              <Stop offset="1" stopColor={palette.primary} stopOpacity="0" />
            </LinearGradient>
            <RadialGradient id={id('shadow')} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={palette.deep} stopOpacity="0.55" />
              <Stop offset="1" stopColor={palette.deep} stopOpacity="0" />
            </RadialGradient>
            <ClipPath id={id('clip')}>
              <Circle cx={CX} cy={CY} r={R - 2.5} />
            </ClipPath>
          </Defs>

          {/* Signature aura and earned result ring. */}
          <AnimatedCircle animatedProps={haloProps} cx={CX} cy={CY} r="58" fill={`url(#${id('halo')})`} />
          {visualState === 'clean' && (
            <AnimatedCircle
              animatedProps={ringProps}
              cx={CX}
              cy={CY}
              r="51"
              fill="none"
              stroke={TOKENS.champagne}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray={TWO_PI_R}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          )}

          {/* Intelligent glass body. */}
          <Circle cx={CX} cy={CY} r={R} fill={`url(#${id('glass')})`} />
          <G clipPath={`url(#${id('clip')})`}>
            <Circle cx={CX} cy={CY} r={R - 2.5} fill={palette.deep} opacity="0.2" />

            <AnimatedG animatedProps={waveBProps} opacity="0.5">
              <Path
                d={`M-120 ${liquidTop + 4} C-100 ${liquidTop - 2},-80 ${liquidTop - 2},-60 ${liquidTop + 4} S-20 ${liquidTop + 10},0 ${liquidTop + 4} S40 ${liquidTop - 2},60 ${liquidTop + 4} S100 ${liquidTop + 10},120 ${liquidTop + 4} S160 ${liquidTop - 2},180 ${liquidTop + 4} S220 ${liquidTop + 10},240 ${liquidTop + 4} L240 120 L-120 120Z`}
                fill={palette.secondary}
              />
            </AnimatedG>
            <AnimatedG animatedProps={waveAProps}>
              <Path
                d={`M0 ${liquidTop} C20 ${liquidTop - 6},40 ${liquidTop - 6},60 ${liquidTop} S100 ${liquidTop + 6},120 ${liquidTop} S160 ${liquidTop - 6},180 ${liquidTop} S220 ${liquidTop + 6},240 ${liquidTop} L240 120 L0 120Z`}
                fill={`url(#${id('liquid')})`}
              />
            </AnimatedG>

            <AnimatedCircle cx="43" r="1.8" fill="#FFFFFF" opacity="0.58" animatedProps={bubble1Props} />
            <AnimatedCircle cx="74" r="1.45" fill="#FFFFFF" opacity="0.42" animatedProps={bubble2Props} />
            <AnimatedCircle cx="61" r="2.15" fill="#FFFFFF" opacity="0.5" animatedProps={bubble3Props} />

            {/* Barcode DNA: subtle until scanning, then illuminated by the beam. */}
            {visualState === 'scanning' && (
              <G opacity="0.26">
                {[39, 43, 46, 51, 54, 60, 64, 68, 74, 77].map((x, i) => (
                  <Rect key={x} x={x} y="28" width={i % 3 === 0 ? 2 : 1} height="64" rx="0.5" fill="#FFFFFF" />
                ))}
              </G>
            )}
            <AnimatedRect
              animatedProps={scanProps}
              x="22"
              width="76"
              height="2.2"
              rx="1.1"
              fill={`url(#${id('beam')})`}
            />
          </G>

          {/* Machined glass rim and asymmetric luxury highlights. */}
          <Circle cx={CX} cy={CY} r={R} fill="none" stroke={`url(#${id('rim')})`} strokeWidth="2.1" />
          <Ellipse cx="43" cy="38" rx="16" ry="6" transform="rotate(-35 43 38)" fill="#FFFFFF" opacity="0.17" />
          <Ellipse cx="40" cy="34" rx="6.5" ry="2.2" transform="rotate(-35 40 34)" fill="#FFFFFF" opacity="0.62" />
          <Path d="M87 82 A35 35 0 0 1 94 65" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.26" strokeLinecap="round" />

          {/* Thinking orbit: a restrained data glyph, not a cartoon symbol. */}
          {visualState === 'thinking' && (
            <AnimatedG animatedProps={orbitProps}>
              <Circle cx="60" cy="8" r="2.3" fill={palette.primary} />
              <Circle cx="60" cy="8" r="5" fill={palette.primary} opacity="0.12" />
            </AnimatedG>
          )}

          {/* Face system. */}
          {(visualState === 'idle' || visualState === 'thinking' || visualState === 'scanning') && (
            <>
              <AnimatedEllipse cx="47" cy="56" rx="4.5" fill={eye} animatedProps={eyeProps} />
              <AnimatedEllipse cx="73" cy="56" rx="4.5" fill={eye} animatedProps={eyeProps} />
              <AnimatedCircle cy="54.8" r="1.15" fill="#FFFFFF" opacity="0.9" animatedProps={leftPupilProps} />
              <AnimatedCircle cy="54.8" r="1.15" fill="#FFFFFF" opacity="0.9" animatedProps={rightPupilProps} />
              {visualState === 'thinking' ? (
                <Path d="M53 70 Q60 67 67 70" fill="none" stroke={eye} strokeWidth="2.5" strokeLinecap="round" />
              ) : visualState === 'scanning' ? (
                <Path d="M54 70 L66 70" fill="none" stroke={eye} strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <Path d="M52 68 Q60 76 68 68" fill="none" stroke={eye} strokeWidth="2.7" strokeLinecap="round" />
              )}
            </>
          )}

          {visualState === 'clean' && (
            <>
              <Path d="M43 57 Q47 51 52 57" fill="none" stroke={eye} strokeWidth="3" strokeLinecap="round" />
              <Path d="M68 57 Q73 51 77 57" fill="none" stroke={eye} strokeWidth="3" strokeLinecap="round" />
              <Path d="M50 67 Q60 80 70 67" fill={palette.deep} stroke={eye} strokeWidth="2.4" strokeLinejoin="round" />
              <Path d="M55 69 L65 69" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
              <Circle cx="37" cy="66" r="5" fill={TOKENS.clean.halo} opacity="0.18" />
              <Circle cx="83" cy="66" r="5" fill={TOKENS.clean.halo} opacity="0.18" />
            </>
          )}

          {visualState === 'caution' && (
            <>
              <Path d="M42 54 Q47 51 52 55" fill="none" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
              <Path d="M68 55 Q73 51 78 54" fill="none" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
              <Circle cx="47" cy="57" r="3.5" fill={eye} />
              <Circle cx="73" cy="57" r="3.5" fill={eye} />
              <Path d="M52 72 Q60 66 68 72" fill="none" stroke={eye} strokeWidth="2.7" strokeLinecap="round" />
            </>
          )}

          {visualState === 'blocked' && (
            <>
              <Circle cx="47" cy="55" r="5.4" fill={eye} />
              <Circle cx="73" cy="55" r="5.4" fill={eye} />
              <Circle cx="45.4" cy="53.2" r="1.8" fill="#FFFFFF" opacity="0.92" />
              <Circle cx="71.4" cy="53.2" r="1.8" fill="#FFFFFF" opacity="0.92" />
              <Ellipse cx="60" cy="71" rx="5.3" ry="6.5" fill={eye} />
              <Ellipse cx="60" cy="73" rx="2.7" ry="3" fill={palette.deep} />
            </>
          )}
        </Svg>
      </Animated.View>

      {showShadow && (
        <Animated.View style={[{ width: size * 0.56, height: size * 0.09, marginTop: -size * 0.045 }, shadowStyle]}>
          {/* Gradient is deliberately defined in this SVG; IDs cannot cross SVG roots. */}
          <Svg width="100%" height="100%" viewBox="0 0 80 12">
            <Defs>
              <RadialGradient id={id('groundShadow')} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" stopColor={palette.deep} stopOpacity="0.72" />
                <Stop offset="1" stopColor={palette.deep} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="40" cy="6" rx="38" ry="5" fill={`url(#${id('groundShadow')})`} />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

export const OrbMascot = memo(OrbMascotComponent);
OrbMascot.displayName = 'OrbMascot';
export default OrbMascot;
