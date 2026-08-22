import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { LucideIcon } from 'lucide-react-native';

export interface KnowledgeSectionHeaderProps {
  /** 1-based step number, rendered as "STEP 01" */
  step: number;
  /** Short category label shown next to the step number, e.g. "SAFETY & VERDICT" */
  category: string;
  /** Bold narrative headline for this audit layer */
  title: string;
  /** 1–2 sentence guidance explaining why this metric matters */
  subtitle: string;
  /** Themed accent color for the pill border and icon */
  accentColor: string;
  icon: LucideIcon;
  isDark: boolean;
}

/**
 * Knowledge & Intelligence Layer header — a narrative step marker rendered
 * above each card of the scan audit, guiding the user top-to-bottom.
 */
export function KnowledgeSectionHeader({
  step,
  category,
  title,
  subtitle,
  accentColor,
  icon: Icon,
  isDark,
}: KnowledgeSectionHeaderProps) {
  return (
    <View style={{ paddingHorizontal: 4, marginTop: 6 }}>
      {/* Step Pill Badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: `${accentColor}55`,
          backgroundColor: isDark ? `${accentColor}14` : `${accentColor}0D`,
          marginBottom: 8,
        }}
      >
        <Icon size={13} color={accentColor} strokeWidth={2.4} />
        <Text style={{ color: accentColor, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }}>
          {`STEP ${String(step).padStart(2, '0')} · ${category.toUpperCase()}`}
        </Text>
      </View>

      {/* Section Flow Title */}
      <Text style={{ color: isDark ? '#FFFFFF' : '#111827', fontSize: 19, fontWeight: '900', letterSpacing: -0.5, marginBottom: 3 }}>
        {title}
      </Text>

      {/* Guidance Subtitle */}
      <Text style={{ color: isDark ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.55)', fontSize: 12, fontWeight: '600', lineHeight: 17.5 }}>
        {subtitle}
      </Text>
    </View>
  );
}
