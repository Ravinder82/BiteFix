import '../global.css';
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState, type AppStateStatus } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useFonts, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '../stores/authStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Removed unsafe defaultProps mutation. Use custom Text component for styling.

import { View, Text, TouchableOpacity } from 'react-native';

class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary] Caught production error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#000' }}>
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            BiteFix encountered an unexpected issue. Please restart the app.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: '#10B981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const { theme, colors, isDark } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();
    return () => unsubscribe();
  }, []);

  // ── Foreground-resume subscription check ──────────────────────────────
  // When the user returns from background (e.g. they went to Apple Settings
  // to cancel their subscription, or a subscription just renewed), we
  // re-verify with StoreKit. This is the standard App Store best practice.
  //
  // Handles:
  //   • Cancelled subscription still in grace period → stays premium ✅
  //   • Subscription expires → isPremium flips to false → root gate redirects ✅
  //   • Subscription auto-renewed successfully → isPremium stays true ✅
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      const isForeground = nextState === 'active';
      appStateRef.current = nextState;

      if (wasBackground && isForeground) {
        // Prevent Simulator/Dev environment from forcefully dropping bypassed subscriptions 
        // when foregrounding from external apps (e.g. returning from Mail app).
        if (!__DEV__) {
          try {
            const { getLoadedIapService } = await import('../services/iapLoader');
            const service = getLoadedIapService();
            if (service) {
              await service.checkSubscriptionStatus();
            }
          } catch {
            // Best-effort — don't crash the app
          }
        }
      }
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding/index" />
              <Stack.Screen name="auth/index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="delete-account" options={{ presentation: 'modal' }} />
            </Stack>
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}
