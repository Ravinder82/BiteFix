import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay 
} from 'react-native-reanimated';
import { AlertOctagon, Droplets, Info } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export interface ShieldAlert {
  id: string;
  type: 'allergen' | 'oil';
  name: string;
}

interface ShieldPillCardProps {
  alert: ShieldAlert;
  index: number;
}

export function ShieldPillCard({ alert, index }: ShieldPillCardProps) {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(index * 150, withSpring(1));
    translateY.value = withDelay(index * 150, withSpring(0, { damping: 12, stiffness: 100 }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const isAllergen = alert.type === 'allergen';
  const bgColor = isAllergen ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 149, 0, 0.15)';
  const iconColor = isAllergen ? '#FF3B30' : '#FF9500';
  const IconComponent = isAllergen ? AlertOctagon : Droplets;

  return (
    <Animated.View style={[styles.container, animatedStyle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: bgColor }]}>
      <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
        <IconComponent size={16} color={iconColor} strokeWidth={2.5} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isAllergen ? 'Allergen Alert' : 'Oil Watchlist'}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
          Contains {alert.name}
        </Text>
      </View>
      <View style={styles.rightAction}>
        <Info size={16} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  rightAction: {
    paddingLeft: 8,
  },
});
