import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { Asset } from 'expo-asset';

// Track initial JS engine bundle load to detect restarts vs hot reloads
let isFirstLoad = true;

export default function Index() {
  const { onboardingComplete, isPremium } = useAppStore();
  const { user, isInitialized } = useAuthStore();
  const { colors } = useTheme();
  const [hydrated, setHydrated] = useState(false);
  const rootNavigationState = useRootNavigationState();
  // null = still checking with StoreKit; false/true = check complete
  const [subChecked, setSubChecked] = useState<boolean | null>(null);
  
  // Enforce a minimum 5-second splash screen display on first load
  const [splashFinished, setSplashFinished] = useState(!isFirstLoad);

  // Dev reset helper: Reset onboarding on fresh startup in development mode
  // only if the user is not authenticated.
  useEffect(() => {
    if (hydrated && isInitialized && __DEV__ && isFirstLoad) {
      isFirstLoad = false;
      if (!user) {
        useAppStore.getState().setOnboardingComplete(false);
      }
    }
  }, [hydrated, isInitialized, user]);

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

  // ── Startup Subscription Status Check ───────────────────────────────
  //
  // Runs once after the store is hydrated AND the user is authenticated AND
  // local state says they are NOT premium.
  //
  // Key scenarios this covers:
  //   1. User deleted account → re-registers same Apple ID → active sub → Home (no paywall)
  //   2. User cancelled auto-renew but sub is still in paid period → still entitled → Home
  //   3. User reinstalled the app → has active sub → Home (no need to re-subscribe)
  //   4. User has genuinely no active sub → Paywall
  //
  // We skip this check when already marked premium locally to avoid an
  // unnecessary StoreKit round-trip on every app launch for paying users.
  useEffect(() => {
    if (!hydrated || !isInitialized || !user) {
      setSubChecked(null);
      return;
    }

    if (isPremium) {
      // Already entitled in local state — skip the StoreKit check
      setSubChecked(true);
      return;
    }

    // Local state says not premium but user is authenticated.
    // Ask Apple's StoreKit whether there's actually an active subscription.
    let cancelled = false;
    (async () => {
      try {
        const { getIapService } = await import('../services/iapLoader');
        const service = await getIapService();
        if (service && !cancelled) {
          // checkSubscriptionStatus() calls hasActiveSubscriptions() via StoreKit 2,
          // sets isPremium(true) in the store if active, and returns the boolean.
          await service.checkSubscriptionStatus();
        }
      } catch {
        // StoreKit unavailable (simulator, no internet, etc.) — don't block routing
      } finally {
        if (!cancelled) setSubChecked(false);
      }
    })();

    return () => { cancelled = true; };
  }, [hydrated, isInitialized, user, isPremium]);

  useEffect(() => {
    // Preload onboarding images during the 5s splash delay
    try {
      Asset.loadAsync([
        require('../../assets/images/ultra_chips.png'),
        require('../../assets/images/artisan_swaps.png'),
      ]);
    } catch (e) {}

    if (isFirstLoad) {
      const splashTimer = setTimeout(() => {
        setSplashFinished(true);
      }, 5000);
      return () => clearTimeout(splashTimer);
    }
  }, []);

  // Wait until the store is hydrated, auth is initialized, AND navigation is ready
  const isReady = hydrated && isInitialized && !!rootNavigationState?.key && splashFinished;
  // If user is logged in and not yet premium, wait for the StoreKit check to finish
  const waitingForSubCheck = isReady && !!user && onboardingComplete && !isPremium && subChecked === null;

  if (!isReady || waitingForSubCheck) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary || '#6D28D9'} />
      </View>
    );
  }

  // Step 1: If onboarding not complete, go to onboarding
  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // Step 2: If not authenticated, go to auth
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // Step 3: If authenticated but NOT premium, lock to paywall.
  // Note: checkSubscriptionStatus() above will have already set isPremium = true
  // in the store if Apple confirms an active subscription, so returning users
  // with a valid sub bypass the paywall automatically.
  if (!isPremium) {
    return <Redirect href="/paywall" />;
  }

  // Step 4: Authenticated + onboarded + premium → go to main tabs
  return <Redirect href="/(tabs)" />;
}
