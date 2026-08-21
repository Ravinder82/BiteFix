import '../global.css';
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState, type AppStateStatus } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Removed unsafe defaultProps mutation. Use custom Text component for styling.

import { View, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';

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

  // No custom fonts to load — the app renders in the native system font
  // (SF Pro on iOS), so the splash screen can hide immediately.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // ── Canonical One-Time RevenueCat Initialization ──────────────────────
  // Configures RevenueCat Purchases exactly once per app session on startup
  useEffect(() => {
    (async () => {
      try {
        const { getIapService } = await import('../services/iapLoader');
        const service = await getIapService();
        if (service) {
          await service.checkSubscriptionStatus();
        }
      } catch (err) {
        console.warn('[RootLayout] RevenueCat initial sync error:', err);
      }
    })();
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
        try {
          const { getIapService } = await import('../services/iapLoader');
          const service = await getIapService();
          if (service) {
            await service.checkSubscriptionStatus();
          }
        } catch {
          // Best-effort — don't crash the app
        }
      }
    });
    return () => subscription.remove();
  }, []);

  return (    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding/index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            </Stack>
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}
