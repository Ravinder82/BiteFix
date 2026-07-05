import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';

export default function Index() {
  const { onboardingComplete } = useAppStore();
  const { user, isInitialized } = useAuthStore();
  const { colors } = useTheme();
  const [hydrated, setHydrated] = useState(false);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    const handleHydration = () => {
      setHydrated(true);
    };

    // Check if the store has already hydrated from AsyncStorage
    if (useAppStore.persist.hasHydrated()) {
      handleHydration();
    } else {
      // If not, subscribe to the finish event
      const unsub = useAppStore.persist.onFinishHydration(() => {
        handleHydration();
      });
      return () => unsub();
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

  // Flow: Onboarding → Auth → Tabs
  // Step 1: If onboarding not complete, go to onboarding
  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // Step 2: If not authenticated, go to auth screen
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // Step 3: Authenticated + onboarded → go to main tabs
  return <Redirect href="/(tabs)" />;
}
