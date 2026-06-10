import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';

// Track initial JS engine bundle load to detect restarts vs hot reloads
let isFirstLoad = true;

export default function Index() {
  const { onboardingComplete } = useAppStore();
  const { colors } = useTheme();
  const [hydrated, setHydrated] = useState(false);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    const handleHydration = () => {
      if (__DEV__ && isFirstLoad) {
        isFirstLoad = false;
        // Automatically reset onboarding completion on startup in development for full flow testing
        useAppStore.getState().setOnboardingComplete(false);
      }
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

  // Wait until the store is hydrated AND the root navigation state is ready
  if (!hydrated || !rootNavigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary || '#6D28D9'} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
