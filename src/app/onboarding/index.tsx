// ═══════════════════════════════════════════════════════════
// BiteFix — Final 10-Screen Onboarding
// ═══════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
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
  IdentityScreen as FlagshipIdentityScreen,
  PainScreen as FlagshipPainScreen,
  LabelReadingScreen as FlagshipLabelReadingScreen,
  PrioritiesScreen as FlagshipPrioritiesScreen,
  RevelationScreen as FlagshipRevelationScreen,
  MomentOfTruthScreen,
  FinalActivationScreen,
} from '../../components/onboarding/OnboardingScreens';
import { IngredientReadingFrequency, OnboardingPriority } from '../../types/onboarding.types';

const GREEN = '#01922aff';
const TOTAL_SCREENS = 9;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

// ── Screen 0: Welcome ─────────────────────────────────────
// Flagship hero: transparent floating product scene + live scan beam + floating capability pills.
function WelcomeScreen({ colors, isDark, isActive, reduceMotion }: { colors: any; isDark: boolean; isActive: boolean; reduceMotion: boolean }) {
  const { width, height } = useWindowDimensions();
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion || !isActive) {
      scanY.stopAnimation();
      scanY.setValue(0);
      return;
    }

    const travel = Math.max(180, Math.min(310, height * 0.30));
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: travel,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(650),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(900),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [height, isActive, reduceMotion, scanY]);

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

  const heroWidth = Math.min(Math.max(width - 18, 0), 430);
  const heroHeight = Math.min(Math.max(height * 0.56, 390), 555);
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

        {/* Single native-driven scanner beam layer. Avoid animated shadows/elevation: those force expensive compositing on iOS. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: heroWidth * 0.10,
            right: heroWidth * 0.10,
            top: heroHeight * 0.18 - 8,
            height: 18,
            transform: [{ translateY: scanY }],
          }}
        >
          {/* Soft glow stays GPU-cheap because it is part of the same moving layer. */}
          <LinearGradient
            colors={['rgba(1,146,42,0)', 'rgba(1,146,42,0.20)', 'rgba(1,146,42,0)']}
            locations={[0, 0.5, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 18, borderRadius: 9 }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 8,
              height: 2,
              borderRadius: 1,
              backgroundColor: GREEN,
            }}
          />
        </Animated.View>

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
  const [isPaging, setIsPaging] = useState(false);

  const [name, setName] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<OnboardingPriority[]>([]);
  const [labelReadingFrequency, setLabelReadingFrequency] = useState<'always' | 'sometimes' | 'rarely' | 'never'>();
  const [ingredientReadingFrequency, setIngredientReadingFrequency] = useState<IngredientReadingFrequency>();
  const [revelationComplete, setRevelationComplete] = useState(false);
  const [synthesisComplete, setSynthesisComplete] = useState(false);
  const [activationComplete, setActivationComplete] = useState(false);

  const reduceMotion = useReduceMotion();
  const pagerRef = useRef<any>(null);
  const pagingUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagingLockRef = useRef(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, shimmerAnim]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({
        x: currentScreen * Math.max(screenWidth, 1),
        y: 0,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [screenWidth]);

  useEffect(() => {
    if (currentScreen === 4) {
      setRevelationComplete(false);
    } else if (currentScreen === 7) {
      setSynthesisComplete(false);
    } else if (currentScreen === 8) {
      setActivationComplete(false);
    }
  }, [currentScreen]);

  useEffect(() => {
    return () => {
      if (pagingUnlockTimerRef.current) {
        clearTimeout(pagingUnlockTimerRef.current);
      }
    };
  }, []);

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

  const finishPaging = useCallback((settledScreen?: number) => {
    if (pagingUnlockTimerRef.current) {
      clearTimeout(pagingUnlockTimerRef.current);
      pagingUnlockTimerRef.current = null;
    }
    if (typeof settledScreen === 'number') {
      setCurrentScreen(settledScreen);
    }
    pagingLockRef.current = false;
    setIsPaging(false);
  }, []);

  const goTo = useCallback(
    (screen: number) => {
      if (
        screen < 0 ||
        screen >= TOTAL_SCREENS ||
        screen === currentScreen ||
        pagingLockRef.current
      ) {
        return;
      }

      const targetX = screen * Math.max(screenWidth, 1);
      pagingLockRef.current = true;
      setIsPaging(true);
      setCurrentScreen(screen);

      pagerRef.current?.scrollTo({
        x: targetX,
        y: 0,
        animated: !reduceMotion,
      });

      if (reduceMotion) {
        finishPaging(screen);
        return;
      }

      // Native ScrollView owns the movement. This fallback only prevents a
      // permanently locked button if a platform omits momentum callbacks.
      pagingUnlockTimerRef.current = setTimeout(() => {
        finishPaging(screen);
      }, 760);
    },
    [currentScreen, finishPaging, reduceMotion, screenWidth]
  );

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const realAllergens = allergens.filter((a) => a !== 'none');
    setAllergenFilters(realAllergens);
    setOnboardingPreferences({ userPriorities: priorities, ingredientReadingFrequency });

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
  }, [allergens, ingredientReadingFrequency, name, priorities, setAllergenFilters, setOnboardingComplete, setOnboardingPreferences, setProfile, setDietPreference, setTrackEcoScore, setTrackOrganic]);

  const handleNext = useCallback(() => {
    if (pagingLockRef.current) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentScreen < TOTAL_SCREENS - 1) {
      goTo(currentScreen + 1);
    } else {
      handleComplete();
    }
  }, [currentScreen, goTo, handleComplete]);

  const handleBack = useCallback(() => {
    if (pagingLockRef.current) return;
    if (currentScreen > 0) {
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(currentScreen - 1);
    }
  }, [currentScreen, goTo]);

  const ONBOARDING_CTA_LABELS: Record<number, string> = {
    0: 'Get Started',
    4: "Let's Continue",
    8: 'Activate BiteFix',
  };

  const getCtaLabel = (screen: number) => {
    if (screen === 4) {
      return revelationComplete ? "Let's Continue" : "Revealing Score...";
    }
    if (screen === 7) {
      return synthesisComplete ? "Let's Continue" : 'Configuring Engine';
    }
    if (screen === 8) {
      return activationComplete ? 'Activate BiteFix' : 'Unlocking intelligence';
    }
    return ONBOARDING_CTA_LABELS[screen] ?? 'Continue';
  };

  const renderScreenContent = (screen: number) => {
    const isActive = screen === currentScreen && !isPaging;
    const screenReduceMotion = reduceMotion || screen !== currentScreen || isPaging;

    switch (screen) {
      case 0:
        return <WelcomeScreen colors={colors} isDark={isDark} isActive={isActive} reduceMotion={screenReduceMotion} />;
      case 1:
        return <FlagshipIdentityScreen name={name} onChange={setName} onSubmit={() => { if (name.trim().length >= 1) handleNext(); }} colors={colors} isDark={isDark} reduceMotion={screenReduceMotion} />;
      case 2:
        return <FlagshipLabelReadingScreen selected={labelReadingFrequency} onSelect={setLabelReadingFrequency} colors={colors} isDark={isDark} reduceMotion={screenReduceMotion} />;
      case 3:
        return <FlagshipPainScreen selected={ingredientReadingFrequency} onSelect={setIngredientReadingFrequency} colors={colors} isDark={isDark} reduceMotion={screenReduceMotion} isActive={isActive} />;
      case 4:
        return (
          <FlagshipRevelationScreen
            colors={colors}
            isDark={isDark}
            reduceMotion={reduceMotion}
            isActive={isActive}
            onAnimationComplete={() => setRevelationComplete(true)}
          />
        );
      case 5:
        return <FlagshipAllergyScreen selected={allergens} onToggle={toggleAllergen} colors={colors} isDark={isDark} reduceMotion={screenReduceMotion} />;
      case 6:
        return <FlagshipPrioritiesScreen selected={priorities} onToggle={togglePriority} colors={colors} isDark={isDark} reduceMotion={screenReduceMotion} />;
      case 7:
        return (
          <MomentOfTruthScreen
            selected={priorities}
            name={name}
            labelReadingFrequency={labelReadingFrequency}
            ingredientReadingFrequency={ingredientReadingFrequency}
            allergens={allergens}
            colors={colors}
            isDark={isDark}
            reduceMotion={screenReduceMotion}
            isActive={isActive}
            onAnimationComplete={() => setSynthesisComplete(true)}
          />
        );
      case 8:
        return (
          <FinalActivationScreen
            colors={colors}
            isDark={isDark}
            reduceMotion={screenReduceMotion}
            isActive={isActive}
            selected={priorities}
            onAnimationComplete={() => setActivationComplete(true)}
          />
        );
      default:
        return null;
    }
  };

  const renderSlide = (screen: number) => {
    const isVisible = Math.abs(screen - currentScreen) <= 1;
    if (!isVisible) {
      return <View style={{ width: screenWidth, height: '100%' }} />;
    }

    const ctaDisabled =
      (screen === 1 && name.trim().length < 1) ||
      (screen === 2 && !labelReadingFrequency) ||
      (screen === 3 && !ingredientReadingFrequency) ||
      (screen === 4 && !revelationComplete) ||
      (screen === 5 && allergens.length === 0) ||
      (screen === 6 && priorities.length === 0) ||
      (screen === 7 && !synthesisComplete) ||
      (screen === 8 && !activationComplete);
    const disabledBg = isDark ? '#153622ff' : '#F0F4F1';
    const disabledBorder = isDark ? 'rgba(167, 231, 63, 0.1)' : 'rgba(7, 25, 15, 0.08)';
    const disabledText = isDark ? 'rgba(172, 172, 172, 0.59)' : 'rgba(6, 33, 18, 0.42)';

    return (
      <View style={{ width: screenWidth, height: '100%' }}>
        {screen > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
            <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
              <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>

            <View style={{
              backgroundColor: isDark ? 'rgba(52, 216, 115, 0.12)' : '#EAF8EE',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(52, 216, 115, 0.25)' : 'rgba(1, 146, 42, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                color: isDark ? '#34d873' : '#01922a',
                fontSize: 12,
                fontWeight: '900',
                letterSpacing: 0.2,
              }}>
                Step {screen + 1} of {TOTAL_SCREENS}
              </Text>
            </View>

            <View style={{ width: 52 }} />
          </View>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 18,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={false}
            nestedScrollEnabled
            bounces={false}
            scrollEnabled
          >
            {renderScreenContent(screen)}
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={{ paddingHorizontal: Math.max(18, Math.min(24, screenWidth * 0.0615)), paddingBottom: 18, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={screen === TOTAL_SCREENS - 1 ? handleComplete : handleNext}
            disabled={ctaDisabled}
            activeOpacity={0.88}
            style={{
              backgroundColor: ctaDisabled ? disabledBg : (isDark ? '#06180E' : '#07190F'),
              borderRadius: 20,
              minHeight: 62,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              overflow: 'hidden',
              position: 'relative',
              borderWidth: 1.5,
              borderColor: ctaDisabled ? disabledBorder : 'rgba(163,230,53,0.40)',
              shadowColor: ctaDisabled ? 'transparent' : (isDark ? '#000000' : '#0A2B14'),
              shadowOffset: { width: 0, height: ctaDisabled ? 2 : 8 },
              shadowOpacity: ctaDisabled ? 0.05 : 0.35,
              shadowRadius: ctaDisabled ? 6 : 16,
              elevation: ctaDisabled ? 1 : 6,
            }}
          >
            {/* Shimmer sweep animation (Safe nested Animated.View for native driver support) */}
            {!ctaDisabled && !reduceMotion && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 190,
                  transform: [
                    {
                      translateX: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-190, screenWidth + 60],
                      }),
                    },
                    { skewX: '-22deg' },
                  ],
                }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.08)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Animated.View>
            )}
            <Text style={{ color: ctaDisabled ? disabledText : '#ffffffff', fontSize: 16.5, fontWeight: '900', letterSpacing: 0.2 }}>
              {getCtaLabel(screen)}
            </Text>
            <ChevronRight size={19} color={ctaDisabled ? disabledText : '#FFFFFF'} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const pageWidth = Math.max(screenWidth, 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          removeClippedSubviews={false}
          decelerationRate="fast"
          contentContainerStyle={{ width: pageWidth * TOTAL_SCREENS, minHeight: '100%' }}
          style={{ flex: 1 }}
          pointerEvents={isPaging ? 'none' : 'auto'}
          onMomentumScrollEnd={(event) => {
            const settledScreen = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
            finishPaging(Math.max(0, Math.min(TOTAL_SCREENS - 1, settledScreen)));
          }}
        >
          {Array.from({ length: TOTAL_SCREENS }).map((_, screen) => (
            <View key={screen} style={{ width: pageWidth, alignSelf: 'stretch' }}>
              {renderSlide(screen)}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
