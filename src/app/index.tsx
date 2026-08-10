import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import { Asset } from 'expo-asset';
import { Text } from '../components/Text';
import { OrbMascot } from '../components/features/OrbMascot';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const MINT = '#00E5A0';
const GOLD = '#D8B65C';

// Track initial JS engine bundle load to detect restarts vs hot reloads
let isFirstLoad = true;

export default function Index() {
  const { onboardingComplete, isPremium, freeScansUsed, trialStarted } = useAppStore();
  const { colors } = useTheme();
  const [hydrated, setHydrated] = useState(false);
  const rootNavigationState = useRootNavigationState();
  // null = still checking with StoreKit; false/true = check complete
  const [subChecked, setSubChecked] = useState<boolean | null>(null);
  
  // Custom premium splash loading state & animations
  const progress = useSharedValue(0);
  const [statusText, setStatusText] = useState('Securing Food Shield database...');

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });
  
  // Enforce a minimum 2.5-second splash screen display on first load
  const [splashFinished, setSplashFinished] = useState(!isFirstLoad);

  // Dev reset helper: Reset onboarding on fresh startup in development mode
  useEffect(() => {
    if (hydrated && __DEV__ && isFirstLoad) {
      isFirstLoad = false;
      // In dev mode, you might want to force onboarding:
      // useAppStore.getState().setOnboardingComplete(false);
    }
  }, [hydrated]);

  useEffect(() => {
    let mounted = true;
    const handleHydration = () => {
      if (mounted) setHydrated(true);
    };

    // Check if store already hydrated
    if (useAppStore.persist?.hasHydrated?.()) {
      handleHydration();
    } else if (useAppStore.persist?.onFinishHydration) {
      const unsub = useAppStore.persist.onFinishHydration(() => {
        handleHydration();
      });
      // Safety timeout: guarantee hydration after 500ms max
      const timer = setTimeout(handleHydration, 500);
      return () => {
        mounted = false;
        unsub();
        clearTimeout(timer);
      };
    } else {
      handleHydration();
    }
  }, []);

  // Sync Keychain free scans counter on mount after hydration
  useEffect(() => {
    if (hydrated) {
      useAppStore.getState().syncFreeScansFromKeychain();
    }
  }, [hydrated]);

  // ── Startup Subscription Status Check ───────────────────────────────
  useEffect(() => {
    if (!hydrated) {
      setSubChecked(null);
      return;
    }

    if (isPremium) {
      // Already entitled in local state — skip the StoreKit check
      setSubChecked(true);
      return;
    }

    // Local state says not premium. Ask Apple's StoreKit whether there's actually an active subscription.
    let cancelled = false;
    (async () => {
      try {
        const { getIapService } = await import('../services/iapLoader');
        const service = await getIapService();
        if (service && !cancelled) {
          await service.checkSubscriptionStatus();
        }
      } catch {
        // StoreKit unavailable (simulator, no internet, etc.) — don't block routing
      } finally {
        if (!cancelled) setSubChecked(false);
      }
    })();

    return () => { cancelled = true; };
  }, [hydrated, isPremium]);

  useEffect(() => {
    // Preload onboarding images during the 2.5s splash delay
    try {
      Asset.loadAsync([
        require('../../assets/images/ultra_chips.png'),
        require('../../assets/images/artisan_swaps.png'),
      ]);
    } catch (e) {}

    if (isFirstLoad) {
      progress.value = withTiming(1, { duration: 2500, easing: Easing.linear });
      const t1 = setTimeout(() => setStatusText('Calibrating local barcode scanner...'), 900);
      const t2 = setTimeout(() => setStatusText('Initializing clean cart engine...'), 1800);
      const splashTimer = setTimeout(() => {
        setSplashFinished(true);
      }, 2500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(splashTimer);
      };
    } else {
      progress.value = 1;
      setStatusText('Ready.');
    }
  }, []);

  // Wait until the store is hydrated AND navigation is ready
  const isReady = hydrated && !!rootNavigationState?.key && splashFinished;
  // If not yet premium, wait for the StoreKit check to finish
  const waitingForSubCheck = isReady && onboardingComplete && !isPremium && subChecked === null;

  if (!isReady || waitingForSubCheck) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080A0C', justifyContent: 'center', alignItems: 'center' }}>
        {/* Luxury Backdrop with ambient radial gradients */}
        <View style={{ ...StyleSheet.absoluteFillObject }} pointerEvents="none">
          <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
            <Defs>
              <RadialGradient id="ambientMint" cx="88%" cy="5%" rx="75%" ry="50%">
                <Stop offset="0%" stopColor={MINT} stopOpacity={0.12} />
                <Stop offset="100%" stopColor={MINT} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="ambientGold" cx="5%" cy="95%" rx="60%" ry="45%">
                <Stop offset="0%" stopColor={GOLD} stopOpacity={0.08} />
                <Stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="#080A0C" />
            <Rect width="100%" height="100%" fill="url(#ambientMint)" />
            <Rect width="100%" height="100%" fill="url(#ambientGold)" />
          </Svg>
        </View>

        {/* Center Content */}
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {/* Mascot in scanning state */}
          <View style={{
            shadowColor: MINT,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
          }}>
            <OrbMascot size={120} state="scanning" />
          </View>

          {/* Branded Title */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 28,
              fontFamily: 'Inter_800ExtraBold',
              letterSpacing: 6,
              textAlign: 'center',
            }}>
              BITEFIX
            </Text>
            <Text style={{
              color: GOLD,
              fontSize: 10,
              fontFamily: 'Inter_700Bold',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}>
              Food Scanner Shield
            </Text>
          </View>
        </View>

        {/* Bottom Loading Area */}
        <View style={{
          position: 'absolute',
          bottom: 70,
          left: 30,
          right: 30,
          alignItems: 'center',
          gap: 12
        }}>
          {/* Progress Bar Track */}
          <View style={{
            width: 200,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            {/* Progress Bar Fill */}
            <Animated.View style={[{
              height: '100%',
              backgroundColor: MINT,
              borderRadius: 2,
            }, progressStyle]} />
          </View>

          {/* Dynamic Status Text */}
          <Text style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            fontFamily: 'Inter_500Medium',
            textAlign: 'center',
            minHeight: 18,
          }}>
            {statusText}
          </Text>
        </View>
        
        {/* Footnote */}
        <Text style={{
          position: 'absolute',
          bottom: 24,
          color: 'rgba(255,255,255,0.25)',
          fontSize: 9,
          fontFamily: 'Inter_400Regular',
          letterSpacing: 0.5,
        }}>
          v2.0.0 • Safe Eating Made Easy
        </Text>
      </View>
    );
  }

  // Step 1: If onboarding not complete, go to onboarding
  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // Step 2: Gating checks for free users.
  // We direct them to the paywall if:
  // - They are NOT premium AND
  // - EITHER they used up all free scans (>= 5) OR they have not started the trial yet
  const isTrialActive = trialStarted || (freeScansUsed || 0) > 0;
  if (!isPremium && ((freeScansUsed || 0) >= 5 || !isTrialActive)) {
    return <Redirect href="/paywall" />;
  }

  // Step 3: Onboarded + premium OR active trial → go to main tabs
  return <Redirect href="/(tabs)" />;
}
