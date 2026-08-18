// ═══════════════════════════════════════════════════════════
// BiteFix — Final 10-Screen Onboarding
// ═══════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
  AccessibilityInfo,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';
import { OrbMascot } from '../../components/features/OrbMascot';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Activity,
  Droplets,
  Package,
} from 'lucide-react-native';
import {
  AllergyScreen as FlagshipAllergyScreen,
  ContextScreen as FlagshipContextScreen,
  IdentityScreen as FlagshipIdentityScreen,
  PainScreen as FlagshipPainScreen,
  PrioritiesScreen as FlagshipPrioritiesScreen,
  RevelationScreen as FlagshipRevelationScreen,
  MomentOfTruthScreen,
} from '../../components/onboarding/OnboardingScreens';
import { IngredientReadingFrequency, OnboardingPriority, ShoppingFrequency } from '../../types/onboarding.types';

const GREEN = '#01922aff';
const GREEN_DIM = '#00C28820';
const TOTAL_SCREENS = 9;

const FEATURE_PILLS = ['Processing Level', 'Nutrition Intelligence', 'Ingredient Review', 'Allergen Watch', 'Additives', 'Sugar Insights', 'Eco Impact'];


function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);
  return reduceMotion;
}

// ── Screen 0: Welcome ─────────────────────────────────────
// Flagship hero: transparent floating product scene + live scan beam + floating capability pills.
function WelcomeScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  const { width, height } = useWindowDimensions();
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const travel = Math.max(180, Math.min(310, height * 0.30));
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: travel,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(650),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [height, scanY]);

  const pillBase = {
    position: 'absolute' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: isDark ? 'rgba(12,17,14,0.78)' : 'rgba(255,255,255,0.76)',
    borderColor: GREEN + '55',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: isDark ? 0.18 : 0.07,
    shadowRadius: 12,
    elevation: 3,
  };

  const heroWidth = Math.min(width - 18, 430);
  const heroHeight = Math.min(Math.max(height * 0.57, 470), 555);
  const bottomFadeHeight = Math.min(185, Math.max(140, heroHeight * 0.34));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, overflow: 'hidden' }}>
      {/* Entire hero is visually open: no card shell, no hard frame, no visible section boundary. */}
      <View
        style={{
          width: heroWidth,
          height: heroHeight,
          alignSelf: 'center',
          position: 'relative',
          borderTopLeftRadius: 42,
          borderTopRightRadius: 42,
          overflow: 'hidden',
        }}
      >
        {/* Product scene */}
        <Image
          source={require('../../../assets/images/onboarding_welcome_product.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '100%',
            opacity: isDark ? 0.86 : 1,
          }}
          resizeMode="cover"
        />

        {/* Very soft atmospheric wash so the image feels integrated into the page. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: isDark ? 'rgba(9,14,11,0.10)' : 'rgba(255,255,255,0.02)',
          }}
        />

        {/* Live barcode scanning beam */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: heroWidth * 0.10,
            right: heroWidth * 0.10,
            top: heroHeight * 0.18,
            height: 2,
            transform: [{ translateY: scanY }],
            backgroundColor: GREEN,
            shadowColor: GREEN,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 9,
            elevation: 4,
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: heroWidth * 0.10,
            right: heroWidth * 0.10,
            top: heroHeight * 0.18 - 8,
            height: 18,
            opacity: 0.18,
            transform: [{ translateY: scanY }],
            backgroundColor: GREEN,
          }}
        />

        {/* Lightweight scanner framing — intentionally borderless overall. */}
        <View pointerEvents="none" style={{ position: 'absolute', left: heroWidth * 0.14, top: heroHeight * 0.23, width: 34, height: 34, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#FFFFFF', borderTopLeftRadius: 7 }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: heroWidth * 0.14, top: heroHeight * 0.23, width: 34, height: 34, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF', borderTopRightRadius: 7 }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: heroWidth * 0.14, bottom: heroHeight * 0.25, width: 34, height: 34, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#FFFFFF', borderBottomLeftRadius: 7 }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: heroWidth * 0.14, bottom: heroHeight * 0.25, width: 34, height: 34, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF', borderBottomRightRadius: 7 }} />

        {/* Small scanner status — no AI wording. */}
        <View
          style={{
            position: 'absolute',
            top: heroHeight * 0.13,
            alignSelf: 'center',
            borderRadius: 999,
            backgroundColor: isDark ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.78)',
            borderWidth: 1,
            borderColor: GREEN + '45',
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              color: isDark ? '#FFFFFF' : '#11301F',
              fontSize: 9,
              fontWeight: '900',
              letterSpacing: 0.9,
              textTransform: 'uppercase',
            }}
          >
            Scanning Product
          </Text>
        </View>

        {/* Floating capability pills */}
        <View style={[pillBase, { left: heroWidth * 0.03, top: heroHeight * 0.35 }]}>
          <Package size={14} color={GREEN} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800' }} numberOfLines={1}>
            Processing Level
          </Text>
        </View>

        <View style={[pillBase, { right: heroWidth * 0.03, top: heroHeight * 0.25 }]}>
          <Activity size={14} color={GREEN} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800' }} numberOfLines={1}>
            Nutrition
          </Text>
        </View>

        <View style={[pillBase, { left: heroWidth * 0.04, bottom: heroHeight * 0.25, maxWidth: heroWidth * 0.44 }]}>
          <ShieldCheck size={14} color={GREEN} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>
            Ingredient Review
          </Text>
        </View>

        <View style={[pillBase, { right: heroWidth * 0.04, bottom: heroHeight * 0.32, borderColor: '#D97706' + '55', maxWidth: heroWidth * 0.40 }]}>
          <Droplets size={14} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>
            Sugar Insights
          </Text>
        </View>

        {/* Soft bottom fade: this is atmospheric, NOT a divider. */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            isDark ? 'rgba(12,17,14,0)' : 'rgba(255,255,255,0)',
            isDark ? 'rgba(12,17,14,0.10)' : 'rgba(255,255,255,0.16)',
            isDark ? 'rgba(12,17,14,0.55)' : 'rgba(255,255,255,0.70)',
            colors.background,
          ]}
          locations={[0, 0.36, 0.76, 1]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomFadeHeight,
          }}
        />

        {/* BiteFix icon floats ABOVE the fade. */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: Math.max(8, bottomFadeHeight * 0.10),
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor: isDark ? 'rgba(17,23,19,0.84)' : 'rgba(255,255,255,0.72)',
              borderWidth: 1.5,
              borderColor: GREEN + '70',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: GREEN,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Image
              source={require('../../../assets/icon.png')}
              style={{ width: 72, height: 72, borderRadius: 20 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* Editorial brand/message block — visually grows out of the image fade. */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 22,
          paddingTop: 0,
          paddingBottom: 6,
          marginTop: -6,
        }}
      >
        <Text style={{ color: GREEN, fontSize: 10.5, fontWeight: '900', letterSpacing: 3.4, textTransform: 'uppercase', marginBottom: 10 }}>
          BITEFIX
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: Math.min(31, Math.max(28, width * 0.074)),
            fontWeight: '900',
            textAlign: 'center',
            lineHeight: Math.min(36, Math.max(32, width * 0.087)),
            letterSpacing: -0.95,
            maxWidth: 370,
          }}
          numberOfLines={3}
          adjustsFontSizeToFit
        >
          Stop <Text style={{ fontWeight: '900', color: GREEN }}>Reading</Text>.{'\n'}
          Start <Text style={{ fontWeight: '900', color: GREEN }}>Scanning</Text>.{'\n'}
          Get <Text style={{ fontWeight: '900', color: GREEN }}>Instant Insights</Text>.
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13.5, fontWeight: '600', textAlign: 'center', lineHeight: 20, maxWidth: 370, marginTop: 12 }}>
          Scan any barcode. See the NOVA Score, Additives, Nutritional Value and more. In seconds!
        </Text>
      </View>
    </View>
  );
}

function FinalScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  const reduceMotion = useReduceMotion();
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const mascotEntrance = useRef(new Animated.Value(0)).current;
  const atmosphereEntrance = useRef(new Animated.Value(0)).current;
  const pillEntrances = useRef(FEATURE_PILLS.map(() => new Animated.Value(0))).current;
  const { width } = useWindowDimensions();

  // The mascot gets time to settle before the surrounding feature pills arrive.
  useEffect(() => {
    if (reduceMotion) {
      mascotEntrance.setValue(1);
      atmosphereEntrance.setValue(1);
      pillEntrances.forEach((value) => value.setValue(1));
      return;
    }

    mascotEntrance.setValue(0);
    atmosphereEntrance.setValue(0);
    pillEntrances.forEach((value) => value.setValue(0));

    let orbitLoop: Animated.CompositeAnimation | null = null;
    const entrance = Animated.parallel([
      Animated.timing(mascotEntrance, {
        toValue: 1,
        duration: 520,
        easing: Easing.bezier(0.16, 1.0, 0.3, 1.0),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(220),
        Animated.timing(atmosphereEntrance, {
          toValue: 1,
          duration: 520,
          easing: Easing.bezier(0.16, 1.0, 0.3, 1.0),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        // Let the mascot establish focus before the background elements begin.
        Animated.delay(300),
        Animated.stagger(
          90,
          pillEntrances.map((value) =>
            Animated.timing(value, {
              toValue: 1,
              duration: 420,
              easing: Easing.bezier(0.16, 1.0, 0.3, 1.0),
              useNativeDriver: true,
            })
          )
        ),
      ]),
    ]);

    entrance.start();

    // Keep the pills still while they arrive; begin the orbit only after the staged entrance.
    const orbitTimer = setTimeout(() => {
      orbitLoop = Animated.loop(
        Animated.timing(orbitAnim, {
          toValue: 1,
          duration: 26000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      orbitLoop.start();
    }, 1280);

    return () => {
      entrance.stop();
      clearTimeout(orbitTimer);
      orbitLoop?.stop();
    };
  }, [reduceMotion, orbitAnim, mascotEntrance, atmosphereEntrance, pillEntrances]);

  const rotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterRotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const RADIUS = Math.min(128, Math.max(106, (width - 56) / 2.25));
  const mascotSize = Math.min(116, Math.max(92, width * 0.28));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 32, letterSpacing: -0.4, textAlign: 'center', marginBottom: 8 }}>
        Your BiteFix Scanner Is Ready
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', textAlign: 'center', marginBottom: 40 }}>
        Scan a product and let BiteFix turn available food data into a clear snapshot.
      </Text>
      <View style={{ width: RADIUS * 2, height: RADIUS * 2, alignItems: 'center', justifyContent: 'center' }}>
        {/* Subtle Orbit Guide */}
        <Animated.View
          style={{
            position: 'absolute',
            width: RADIUS * 2,
            height: RADIUS * 2,
            borderRadius: RADIUS,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            opacity: atmosphereEntrance,
          }}
        />

        <Animated.View
          style={{
            opacity: mascotEntrance,
            transform: [
              { translateY: mascotEntrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              { scale: mascotEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          }}
        >
          <OrbMascot state="happy" size={mascotSize} reduceMotion={reduceMotion} />
        </Animated.View>

        {/* Orbit track */}
        <Animated.View
          style={{
            position: 'absolute',
            width: RADIUS * 2,
            height: RADIUS * 2,
            transform: reduceMotion ? [] : [{ rotate }],
          }}
          pointerEvents="none"
        >
          {FEATURE_PILLS.map((pill, i) => {
            const angle = (i / FEATURE_PILLS.length) * 2 * Math.PI;
            const r = RADIUS;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            const depthValue = (phase: number) => 0.82 + ((Math.sin(angle + phase) + 1) / 2) * 0.18;
            const scale = reduceMotion ? 1 : orbitAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [depthValue(0), depthValue(Math.PI / 2), depthValue(Math.PI), depthValue(Math.PI * 1.5), depthValue(Math.PI * 2)],
            });
            const opacity = reduceMotion ? 1 : orbitAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [
                depthValue(0) > 0.92 ? 1 : 0.58,
                depthValue(Math.PI / 2) > 0.92 ? 1 : 0.58,
                depthValue(Math.PI) > 0.92 ? 1 : 0.58,
                depthValue(Math.PI * 1.5) > 0.92 ? 1 : 0.58,
                depthValue(Math.PI * 2) > 0.92 ? 1 : 0.58,
              ]
            });

            return (
              <Animated.View
                key={pill}
                style={{
                  position: 'absolute',
                  left: RADIUS + x - 71,
                  top: RADIUS + y,
                  width: 142,
                  alignItems: 'center',
                  opacity: reduceMotion ? 1 : pillEntrances[i],
                  transform: [
                    { translateY: pillEntrances[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                    { scale: pillEntrances[i].interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                  ],
                }}
              >
                <Animated.View
                  style={{
                    alignItems: 'center',
                    opacity: reduceMotion ? 1 : opacity,
                    transform: [
                      ...(reduceMotion ? [] : [{ rotate: counterRotate }]),
                      { scale },
                    ],
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(20, 24, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 14,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      minHeight: 30,
                      maxWidth: 142,
                      borderWidth: 1,
                      borderColor: GREEN + '40',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                  >
                    <Text numberOfLines={1} style={{ color: colors.text, fontSize: 10.5, lineHeight: 14, fontWeight: '800', textAlign: 'center' }}>{pill}</Text>
                  </View>
                </Animated.View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const {
    setOnboardingComplete,
    setProfile,
    setOnboardingPreferences,
    setAllergenFilters,
    setDietPreference,
    setTrackEcoScore,
    setTrackOrganic,
  } = useAppStore();

  const [currentScreen, setCurrentScreen] = useState(0);
  const [transitionScreen, setTransitionScreen] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<OnboardingPriority[]>([]);
  const [shoppingFrequency, setShoppingFrequency] = useState<ShoppingFrequency>();
  const [ingredientReadingFrequency, setIngredientReadingFrequency] = useState<IngredientReadingFrequency>();

  const reduceMotion = useReduceMotion();
  const ctaShimmer = useRef(new Animated.Value(-1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const transitionLockRef = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      ctaShimmer.stopAnimation();
      ctaShimmer.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(ctaShimmer, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(ctaShimmer, { toValue: -1, duration: 1, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ctaShimmer, reduceMotion]);

  const toggleAllergen = useCallback((id: string) => {
    Haptics.selectionAsync();
    setAllergens((prev) => {
      if (id === 'none') return prev.includes('none') ? [] : ['none'];
      const withoutNone = prev.filter((a) => a !== 'none');
      return withoutNone.includes(id) ? withoutNone.filter((a) => a !== id) : [...withoutNone, id];
    });
  }, []);

  const togglePriority = useCallback((id: OnboardingPriority) => {
    Haptics.selectionAsync();
    setPriorities((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);

  const goTo = useCallback(
    (screen: number) => {
      if (reduceMotion) {
        setCurrentScreen(screen);
        return;
      }

      if (
        transitionLockRef.current ||
        transitionScreen !== null ||
        screen === currentScreen ||
        screen < 0 ||
        screen >= TOTAL_SCREENS
      ) {
        return;
      }

      transitionLockRef.current = true;
      slideAnim.stopAnimation();
      slideAnim.setValue(0);
      setTransitionScreen(screen);

      const isForward = screen > currentScreen;

      Animated.timing(slideAnim, {
        toValue: isForward ? -screenWidth : screenWidth,
        duration: 480,
        easing: Easing.bezier(0.16, 1.0, 0.3, 1.0),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setCurrentScreen(screen);
        setTransitionScreen(null);
        slideAnim.setValue(0);
        transitionLockRef.current = false;
      });
    },
    [currentScreen, reduceMotion, screenWidth, slideAnim, transitionScreen]
  );

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const realAllergens = allergens.filter((a) => a !== 'none');
    setAllergenFilters(realAllergens);
    setOnboardingPreferences({ userPriorities: priorities, shoppingFrequency, ingredientReadingFrequency });

    const goalMap: Record<string, 'ultra_processed' | 'nutri_score' | 'clean_swaps' | 'healthy_habits' | 'none'> = {
      ultra_processed: 'ultra_processed',
      nutrition: 'nutri_score',
      ingredients: 'clean_swaps',
      sugar: 'healthy_habits',
    };
    const primaryGoal = priorities.length > 0 ? goalMap[priorities[0]] ?? 'none' : 'none';
    setProfile({ userName: name.trim() || undefined, userGoal: primaryGoal });
    setTrackEcoScore(priorities.includes('environment'));
    setTrackOrganic(false);
    setDietPreference('standard');

    setOnboardingComplete(true);
    router.replace('/paywall');
  }, [allergens, ingredientReadingFrequency, name, priorities, setAllergenFilters, setOnboardingComplete, setOnboardingPreferences, setProfile, setDietPreference, setTrackEcoScore, setTrackOrganic, shoppingFrequency]);

  const handleNext = useCallback(() => {
    if (transitionLockRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentScreen < TOTAL_SCREENS - 1) {
      goTo(currentScreen + 1);
    } else {
      handleComplete();
    }
  }, [currentScreen, goTo, handleComplete]);

  const handleBack = useCallback(() => {
    if (transitionLockRef.current) return;
    if (currentScreen > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(currentScreen - 1);
    }
  }, [currentScreen, goTo]);

  const getCtaLabel = (screen: number) =>
    screen === TOTAL_SCREENS - 1 ? 'Activate BiteFix' :
      screen === 0 ? 'Get Started' :
        screen === 6 ? 'Show Me' :
          screen === 7 ? 'See My BiteFix' : 'Continue';

  const renderScreenContent = (screen: number) => {
    switch (screen) {
      case 0:
        return <WelcomeScreen colors={colors} isDark={isDark} />;
      case 1:
        return <FlagshipIdentityScreen name={name} onChange={setName} colors={colors} isDark={isDark} reduceMotion={reduceMotion} />;
      case 2:
        return <FlagshipContextScreen selected={shoppingFrequency} onSelect={setShoppingFrequency} colors={colors} isDark={isDark} reduceMotion={reduceMotion} />;
      case 3:
        return <FlagshipAllergyScreen selected={allergens} onToggle={toggleAllergen} colors={colors} isDark={isDark} reduceMotion={reduceMotion} />;
      case 4:
        return <FlagshipPainScreen selected={ingredientReadingFrequency} onSelect={setIngredientReadingFrequency} colors={colors} isDark={isDark} reduceMotion={reduceMotion} />;
      case 5:
        return <FlagshipPrioritiesScreen selected={priorities} onToggle={togglePriority} colors={colors} isDark={isDark} reduceMotion={reduceMotion} />;
      case 6:
        return <FlagshipRevelationScreen colors={colors} isDark={isDark} reduceMotion={reduceMotion} />;
      case 7:
        return <MomentOfTruthScreen selected={priorities} name={name} colors={colors} isDark={isDark} reduceMotion={reduceMotion} />;
      case 8:
        return <FinalScreen colors={colors} isDark={isDark} />;
      default:
        return null;
    }
  };

  const renderSlide = (screen: number) => {
    const ctaDisabled = screen === 1 && name.trim().length < 1;
    const disabledBg = isDark ? 'rgba(0, 107, 31, 0.22)' : '#E8F6ED';
    const disabledBorder = isDark ? 'rgba(0, 200, 80, 0.30)' : 'rgba(0, 107, 31, 0.22)';
    const disabledText = isDark ? 'rgba(100, 240, 140, 0.70)' : 'rgba(0, 107, 31, 0.68)';

    return (
      <View style={{ flex: 1, width: screenWidth }}>
        {/* Every slide owns its header, content, and CTA so they move together. */}
        {screen > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
            <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
              <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
                <View key={i} style={{ width: i === screen ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === screen ? GREEN : colors.textMuted + '50' }} />
              ))}
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', width: 52, textAlign: 'right' }}>
              {screen + 1}/{TOTAL_SCREENS}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={screen !== 1}
          >
            {renderScreenContent(screen)}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={screen === TOTAL_SCREENS - 1 ? handleComplete : handleNext}
            disabled={ctaDisabled}
            activeOpacity={0.88}
            style={{
              backgroundColor: ctaDisabled ? disabledBg : '#006B1F',
              borderRadius: 20,
              minHeight: 62,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: ctaDisabled ? disabledBorder : 'rgba(255,255,255,0.22)',
              shadowColor: ctaDisabled ? GREEN : '#004A16',
              shadowOffset: { width: 0, height: ctaDisabled ? 2 : 8 },
              shadowOpacity: ctaDisabled ? 0.05 : 0.28,
              shadowRadius: ctaDisabled ? 6 : 16,
              elevation: ctaDisabled ? 1 : 6,
            }}
          >
            {!ctaDisabled && (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -20,
                    bottom: -20,
                    width: 72,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    transform: [
                      { translateX: ctaShimmer.interpolate({ inputRange: [-1, 1], outputRange: [-360, 360] }) },
                      { rotate: '18deg' },
                    ],
                  }}
                />
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 1,
                    left: 18,
                    right: 18,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.32)',
                    opacity: ctaShimmer.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.2, 0.6, 0.2] }),
                  }}
                />
              </>
            )}
            <Text style={{ color: ctaDisabled ? disabledText : '#FFFFFF', fontSize: 16.5, fontWeight: '900', letterSpacing: 0.2 }}>
              {getCtaLabel(screen)}
            </Text>
            <ChevronRight size={19} color={ctaDisabled ? disabledText : '#FFFFFF'} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1, overflow: 'hidden' }} pointerEvents={transitionScreen === null ? 'auto' : 'none'}>
        <Animated.View
          style={{
            flex: 1,
            width: screenWidth,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Active Screen (permanently at 0) */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: screenWidth,
            }}
          >
            {renderSlide(currentScreen)}
          </View>

          {/* Incoming Target Screen (mounted only during slide) */}
          {transitionScreen !== null && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: transitionScreen > currentScreen ? screenWidth : -screenWidth,
                width: screenWidth,
              }}
            >
              {renderSlide(transitionScreen)}
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

