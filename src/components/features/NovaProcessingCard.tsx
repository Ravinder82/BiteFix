import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { Cog } from 'lucide-react-native';
import { getNovaLabel, getNovaShortLabel, getNovaColor } from '@/utils/format';
import type { NOVAClass } from '@/types/app.types';

export interface NovaProcessingCardProps {
  novaClass?: NOVAClass;
  colors: any;
  isDark: boolean;
}

const NOVA_TIERS: { group: NOVAClass; short: string }[] = [
  { group: 1, short: 'Group 1' },
  { group: 2, short: 'Group 2' },
  { group: 3, short: 'Group 3' },
  { group: 4, short: 'Group 4' },
];

const NOVA_DESCRIPTIONS: Record<NOVAClass, string> = {
  1: 'Unprocessed or minimally processed foods — edible plants, animals and fungi kept close to their natural state. No added sugar, salt, fats or industrial additives.',
  2: 'Pressed, refined or fermented culinary ingredients such as oils, butter, sugar and salt — extracted from whole foods and used to prepare Group 1 dishes.',
  3: 'Processed foods made by adding salt, oil or sugar to whole foods — such as canned vegetables, cheese or fresh bread. Modest industrial intervention.',
  4: 'Ultra-processed formulations manufactured mostly from substances extracted from foods or synthesized in labs — flavors, colors, emulsifiers and sweeteners dominate the recipe.',
};

/** Standalone NOVA classification card — 4-tier processing spectrum + research-backed context. */
export function NovaProcessingCard({ novaClass, colors, isDark }: NovaProcessingCardProps) {
  const activeColor = getNovaColor(novaClass);
  const isClassified = novaClass !== undefined && novaClass !== null;

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(5, 10, 6, 0.96)' : '#FFFFFF',
        borderColor: isDark ? `${activeColor}38` : `${activeColor}26`,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: activeColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.18 : 0.07,
        shadowRadius: 18,
        elevation: 6,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: `${activeColor}1A`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: `${activeColor}30`,
            }}
          >
            <Cog size={18} color={activeColor} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
              {isClassified ? `NOVA Group ${novaClass}` : 'NOVA Classification'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              {getNovaLabel(novaClass)}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: `${activeColor}18`,
            borderColor: `${activeColor}40`,
            borderWidth: 1.5,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: activeColor, fontSize: 12.5, fontWeight: '900', letterSpacing: 0.3 }}>
            {isClassified ? getNovaShortLabel(novaClass) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* 4-Tier Processing Spectrum */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {NOVA_TIERS.map((tier) => {
          const tierColor = getNovaColor(tier.group);
          const isActive = novaClass === tier.group;
          return (
            <View
              key={tier.group}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 9,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isActive ? tierColor : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                backgroundColor: isActive
                  ? isDark ? `${tierColor}20` : `${tierColor}12`
                  : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                shadowColor: isActive ? tierColor : 'transparent',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isActive ? 0.35 : 0,
                shadowRadius: 8,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isActive ? tierColor : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  marginBottom: 5,
                }}
              />
              <Text style={{ color: isActive ? tierColor : colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
                {tier.short}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Research-backed explanation */}
      <View
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,248,0.95)',
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>
          What This Means
        </Text>
        <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '600', lineHeight: 19 }}>
          {isClassified ? NOVA_DESCRIPTIONS[novaClass] : 'This product has not been assigned a NOVA classification in published food databases yet.'}
        </Text>
      </View>
    </View>
  );
}
