import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Text } from '../../components/Text';
import { Tabs, Redirect, usePathname, router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';
import { Home, ScanBarcode, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Custom Floating Center Button for Scanner Tab
function FloatingScannerButton({ onPress, accessibilityState }: any) {
  const { colors, isDark } = useTheme();
  const isSelected = accessibilityState?.selected;
  const pathname = usePathname();
  const isScanner = pathname === '/scanner';

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
          if (isScanner) {
            router.push('/');
          } else {
            onPress?.(e);
          }
        }}
        activeOpacity={0.85}
        style={{
          top: -14,
          width: 160,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.45 : 0.25,
          shadowRadius: 10,
          elevation: 8,
          borderWidth: 2.5,
          borderColor: colors.background,
        }}
      >
        <Animated.View style={[{ width: '100%', height: '100%', borderRadius: 26, overflow: 'hidden' }, animatedStyle]}>
          <LinearGradient
            colors={[colors.primary, '#3BB5A0']}
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isScanner ? <Home size={22} color="white" /> : <ScanBarcode size={22} color="white" />}
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
              {isScanner ? 'Home' : 'Scan'}
            </Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { isPremium, freeScansUsed } = useAppStore();
  const pathname = usePathname();

  // GATING GUARD: Allow access if user is premium, has free scans, or is accessing settings
  const isSettingsPage = pathname === '/settings';
  const canAccessApp = isPremium || (typeof freeScansUsed === 'number' && freeScansUsed < 5) || isSettingsPage;
  if (!canAccessApp) {
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
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          height: 74,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 0, // Fixes iOS safe area pushing content up
          paddingTop: 0,
        },
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
          href: null,
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
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

