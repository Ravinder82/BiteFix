import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Camera } from 'expo-camera';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { Mascot, MascotState } from '../../components/features/Mascot';
import { ArrowRight, Check } from 'lucide-react-native';

const SLIDES = [
  {
    title: 'GoodBye Sugar 🍇',
    description: 'Packaged foods list sugar in grams, which is hard to visualize. We convert it to exact teaspoons of sugar, so you see the real impact instantly.',
    mascotState: 'happy' as MascotState,
  },
  {
    title: 'Blood Sugar Tracker 🩸',
    description: 'Log your fasting and post-meal blood sugar readings to see clinical trend lines and manage your health targets.',
    mascotState: 'idle' as MascotState,
  },
  {
    title: 'Grant Scanner Access 📷',
    description: "We use your camera to scan barcodes and read nutrition labels. Let's activate the scanner to start scanning foods.",
    mascotState: 'happy' as MascotState,
    isPermissionSlide: true,
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setOnboardingComplete } = useAppStore();
  const { colors } = useTheme();

  const handleNext = async () => {
    const slide = SLIDES[currentSlide];

    if (slide.isPermissionSlide) {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      // Continue regardless of permission choice (user can grant in settings later)
    }

    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Complete onboarding
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Skip Button */}
      {currentSlide < SLIDES.length - 1 && (
        <TouchableOpacity 
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          className="absolute top-12 right-6 z-10 py-1.5 px-4 rounded-full active:opacity-80 shadow-sm" 
          onPress={handleSkip}
        >
          <Text style={{ color: colors.textSecondary }} className="font-black text-[10px] uppercase tracking-wider">Skip</Text>
        </TouchableOpacity>
      )}

      {/* Mascot Area */}
      <View className="flex-1 items-center justify-center pt-8">
        <Mascot state={slide.mascotState} size={200} />
      </View>

      {/* Slide Content */}
      <View className="px-8 pb-12">
        <Animated.View 
          key={currentSlide}
          entering={FadeInRight.duration(400)}
          exiting={FadeOutLeft.duration(300)}
          className="min-h-[160px] justify-end"
        >
          <Text style={{ color: colors.text }} className="text-2xl font-black text-center leading-tight">
            {slide.title}
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center mt-4 leading-relaxed">
            {slide.description}
          </Text>
        </Animated.View>

        {/* Indicator dots */}
        <View className="flex-row justify-center items-center gap-2 mt-8">
          {SLIDES.map((_, idx) => (
            <View 
              key={idx}
              style={{
                width: idx === currentSlide ? 18 : 6,
                height: 6,
                backgroundColor: idx === currentSlide ? colors.primary : colors.border,
              }}
              className="rounded-full"
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={{ backgroundColor: colors.primary }}
          className="w-full py-4 rounded-2xl flex-row items-center justify-center mt-8 active:opacity-90 shadow-sm"
        >
          <Text className="text-white font-bold text-sm mr-2">
            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {currentSlide === SLIDES.length - 1 ? (
            <Check size={16} color="white" />
          ) : (
            <ArrowRight size={16} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

