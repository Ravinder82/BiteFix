import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';

// Track initial JS engine bundle load to detect restarts vs hot reloads
let isFirstLoad = true;

export default function Index() {
  const { onboardingComplete, isPremium } = useAppStore();
  const { user, isInitialized } = useAuthStore();
  const { colors } = useTheme();
  const [hydrated, setHydrated] = useState(false);
  const rootNavigationState = useRootNavigationState();

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

  // Wait until the store is hydrated, auth is initialized, AND navigation is ready
  if (!hydrated || !isInitialized || !rootNavigationState?.key) {
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

  // Step 3: If authenticated but NOT premium, locked to paywall
  if (!isPremium) {
    return <Redirect href="/paywall" />;
  }

  // Step 4: Authenticated + onboarded + premium → go to main tabs
  return <Redirect href="/(tabs)" />;
}

