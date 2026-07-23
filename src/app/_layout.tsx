import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';
import { useFonts, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { TextInput } from 'react-native';
import { Text } from '@/components/Text';
import { useAuthStore } from '../stores/authStore';

SplashScreen.preventAutoHideAsync();

// Apply Inter font globally
const customTextProps = {
  style: { fontFamily: 'Inter_500Medium' } // Made bolder by default
};

const AnyText = Text as any;
const AnyTextInput = TextInput as any;

if (AnyText.defaultProps) {
  AnyText.defaultProps.style = [AnyText.defaultProps.style, customTextProps.style];
} else {
  AnyText.defaultProps = customTextProps;
}

if (AnyTextInput.defaultProps) {
  AnyTextInput.defaultProps.style = [AnyTextInput.defaultProps.style, customTextProps.style];
} else {
  AnyTextInput.defaultProps = customTextProps;
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
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();
    return () => unsubscribe();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
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
  );
}
