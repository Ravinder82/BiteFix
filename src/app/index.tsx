import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../stores/appStore';

export default function Index() {
  const { onboardingComplete, isPremium, freeScansUsed, trialStarted } = useAppStore();
  const [hydrated, setHydrated] = useState(false);
  const rootNavigationState = useRootNavigationState();

  // Handle store hydration status
  useEffect(() => {
    let mounted = true;
    const handleHydration = () => {
      if (mounted) {
        setHydrated(true);
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

  const isReady = hydrated && !!rootNavigationState?.key;

  // Return a clean blank view during the split-second hydration check
  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  // Route 1: Onboarding (if not completed)
  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // Route 2: Paywall — RevenueCat entitlement verification is the source of truth
  return <Redirect href="/paywall" />;
}
