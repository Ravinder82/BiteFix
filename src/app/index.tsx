import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../stores/appStore';

export default function Index() {
  const { onboardingComplete, isPremium, freeScansUsed, trialStarted } = useAppStore();
  const [hydrated, setHydrated] = useState(false);
  const rootNavigationState = useRootNavigationState();
  const [subChecked, setSubChecked] = useState<boolean | null>(null);

  // Handle store hydration status
  useEffect(() => {
    let mounted = true;
    const handleHydration = () => {
      if (mounted) {
        setHydrated(true);
        useAppStore.getState().setOnboardingComplete(false);
      }
    };

    if (useAppStore.persist?.hasHydrated?.()) {
      handleHydration();
    } else if (useAppStore.persist?.onFinishHydration) {
      const unsub = useAppStore.persist.onFinishHydration(() => {
        handleHydration();
      });
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

  // Sync free scans count from keychain
  useEffect(() => {
    if (hydrated) {
      useAppStore.getState().syncFreeScansFromKeychain();
    }
  }, [hydrated]);

  // Check StoreKit IAP subscription status
  useEffect(() => {
    if (!hydrated) {
      setSubChecked(null);
      return;
    }

    if (isPremium) {
      setSubChecked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { getIapService } = await import('../services/iapLoader');
        const service = await getIapService();
        if (service && !cancelled) {
          await service.checkSubscriptionStatus();
        }
      } catch {
        // Fail silently if StoreKit unavailable
      } finally {
        if (!cancelled) setSubChecked(false);
      }
    })();

    return () => { cancelled = true; };
  }, [hydrated, isPremium]);

  const isReady = hydrated && !!rootNavigationState?.key;
  const waitingForSubCheck = isReady && onboardingComplete && !isPremium && subChecked === null;

  // Return a clean blank view during the split-second hydration check
  if (!isReady || waitingForSubCheck) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  // Route 1: Onboarding
  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // Route 2: Paywall (Gated Free Tier Users)
  const isTrialActive = trialStarted || (freeScansUsed || 0) > 0;
  if (!isPremium && ((freeScansUsed || 0) >= 5 || !isTrialActive)) {
    return <Redirect href="/paywall" />;
  }

  // Route 3: Tabs Dashboard (Onboarded + Premium/Active Trial)
  return <Redirect href="/(tabs)" />;
}
