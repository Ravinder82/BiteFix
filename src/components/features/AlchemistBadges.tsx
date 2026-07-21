import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface BadgeProps {
  size?: number;
  active?: boolean;
}

// 🟢 Pure Essence Badge (NOVA 1)
export function PureEssenceBadge({ size = 28, active = true }: BadgeProps) {
  const opacity = active ? 1 : 0.28;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="essenceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#3BB5A0" />
        </LinearGradient>
      </Defs>
      <G opacity={opacity}>
        <Circle cx="16" cy="16" r="14" fill="url(#essenceGrad)" />
        {/* Apple-style sparkles and leaf */}
        <Path
          d="M16 8C12 8 10 11 10 15C10 19 13 22 16 22C19 22 22 19 22 15C22 11 20 8 16 8ZM17.5 14C17.5 15.5 16 16.5 14.5 15.5C13.5 14.8 13.5 13.2 14.5 12.5C16 11.5 17.5 12.5 17.5 14Z"
          fill="#FFFFFF"
        />
        <Path
          d="M16 6C16 6 17.5 3.5 20.5 4C19.5 6 17.5 7.5 16 7.5V6Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
}

// 🔍 Stealth Match Badge (Stealth additives/sugars audit)
export function StealthMatchBadge({ size = 28, active = true }: BadgeProps) {
  const opacity = active ? 1 : 0.28;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="stealthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
      </Defs>
      <G opacity={opacity}>
        <Circle cx="16" cy="16" r="14" fill="url(#stealthGrad)" />
        {/* Detective Magnifying Glass & Eye mark */}
        <Path
          d="M16 10C12.7 10 10 12.7 10 16C10 19.3 12.7 22 16 22C17.4 22 18.7 21.5 19.7 20.7L23 24L24 23L20.7 19.7C21.5 18.7 22 17.4 22 16C22 12.7 19.3 10 16 10ZM16 20C13.8 20 12 18.2 12 16C12 13.8 13.8 12 16 12C18.2 12 20 13.8 20 16C20 18.2 18.2 20 16 20Z"
          fill="#FFFFFF"
        />
        <Circle cx="16" cy="16" r="2" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

// 🛡️ Gut Guardian Badge (Microbiome safe)
export function GutGuardianBadge({ size = 28, active = true }: BadgeProps) {
  const opacity = active ? 1 : 0.28;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="gutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6366F1" />
          <Stop offset="100%" stopColor="#4F46E5" />
        </LinearGradient>
      </Defs>
      <G opacity={opacity}>
        <Circle cx="16" cy="16" r="14" fill="url(#gutGrad)" />
        {/* Shield with biome leaf detail */}
        <Path
          d="M16 8C11.5 8.5 10 12 10 16C10 20.5 13.5 23.5 16 24.5C18.5 23.5 22 20.5 22 16C22 12 20.5 8.5 16 8ZM15.5 19.5L12.5 16.5L13.7 15.3L15.5 17.1L18.8 13.8L20 15L15.5 19.5Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
}
