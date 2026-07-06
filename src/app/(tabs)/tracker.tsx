import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Sparkles } from 'lucide-react-native';

export default function TrackerScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 justify-center items-center px-6">
        <View 
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8
          }} 
          className="w-full py-12 px-8 rounded-3xl items-center justify-center"
        >
          <View 
            style={{ backgroundColor: colors.primary + '15' }}
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
          >
            <Sparkles size={32} color={colors.primary} />
          </View>
          <Text 
            style={{ color: colors.text }} 
            className="text-3xl font-black tracking-tight"
          >
            CleanBite
          </Text>
          <Text 
            style={{ color: colors.textSecondary }} 
            className="text-sm font-medium text-center mt-2"
          >
            Your clean, simplified nutrition tracking experience.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
