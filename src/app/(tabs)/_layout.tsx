import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { Home, ScanBarcode, Settings, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Custom Floating Center Button for Scanner Tab
function FloatingScannerButton({ onPress, accessibilityState }: any) {
  const { colors, isDark } = useTheme();
  const isSelected = accessibilityState?.selected;

  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.15 : 1, {
      damping: 12,
      stiffness: 150,
    });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity
        onPress={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress?.(e);
        }}
        activeOpacity={0.85}
        style={{
          top: -15, // Floats above the bar
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.45 : 0.25,
          shadowRadius: 10,
          elevation: 8,
          borderWidth: 3.5,
          borderColor: colors.background,
        }}
      >
        <Animated.View style={[{ width: '100%', height: '100%', borderRadius: 26, overflow: 'hidden' }, animatedStyle]}>
          <LinearGradient
            colors={[colors.primary, '#3BB5A0']}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ScanBarcode size={24} color="white" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { user, isInitialized } = useAuthStore();
  const { isPremium } = useAppStore();

  // If Firebase Auth has finished loading and no user is logged in, redirect to the Auth Screen
  if (isInitialized && !user) {
    return <Redirect href="/auth" />;
  }

  // HARD PAYWALL GUARD: Non-premium users CANNOT access main tabs under any circumstances
  if (isInitialized && !isPremium) {
    return <Redirect href="/paywall" />;
  }


  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 18,
          right: 18,
          backgroundColor: 'transparent',
          borderWidth: 0,
          height: 74,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 0, // Fixes iOS safe area pushing content up
          paddingTop: 0,
        },
        tabBarBackground: () => (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 38,
              backgroundColor: 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.35 : 0.06,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 38,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                backgroundColor: isDark ? 'rgba(10, 10, 10, 0.6)' : 'rgba(255, 255, 255, 0.75)',
              }}
            >
              <BlurView
                tint={isDark ? "dark" : "light"}
                intensity={isDark ? 65 : 85}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          height: 74,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: Platform.OS === 'ios' ? 12 : 8,
          paddingBottom: Platform.OS === 'ios' ? 8 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={30}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
              fill={focused ? `${color}15` : 'transparent'}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarLabel: () => null,
          tabBarButton: (props) => <FloatingScannerButton {...props} />,
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Clock
              size={30}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
              fill={focused ? `${color}15` : 'transparent'}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

