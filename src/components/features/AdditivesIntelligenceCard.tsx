import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { FlaskConical, CheckCircle2, AlertCircle } from 'lucide-react-native';
import {
  groupAdditivesByCategory,
  getLedColors,
  LED_STATUS_LABELS,
} from '../../utils/additiveTaxonomy';
import { AdditiveDetail } from '../../types/app.types';

interface AdditivesIntelligenceCardProps {
  additives?: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}

// ─────────────────────────────────────────────────────────
// Additives Intelligence — one card for every additive on
// the ingredient list. Categories are grouped by what the
// additive does in the food; the LED level is a neutral,
// research-backed indicator (Standard / Notable / Under Review).
// ─────────────────────────────────────────────────────────
export function AdditivesIntelligenceCard({
  additives = [],
  colors,
  isDark,
}: AdditivesIntelligenceCardProps) {
  const groups = useMemo(() => groupAdditivesByCategory(additives), [additives]);
  const hasGroups = groups.length > 0;

  const accent = isDark ? '#A78BFA' : '#7C3AED'; // Neutral analytical violet accent
  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(12, 14, 13, 0.97)' : '#FFFFFF',
        borderColor: borderDivider,
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.12 : 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(167, 139, 250, 0.12)' : 'rgba(124, 58, 237, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FlaskConical size={18} color={accent} strokeWidth={2.2} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={1}>
              Additives Intelligence
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', marginTop: 1 }} numberOfLines={2}>
              From the available ingredient data
            </Text>
          </View>
        </View>

        {hasGroups && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(167, 139, 250, 0.12)' : 'rgba(124, 58, 237, 0.08)',
              borderColor: isDark ? 'rgba(167, 139, 250, 0.28)' : 'rgba(124, 58, 237, 0.22)',
              borderWidth: 1,
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 8,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: accent, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 }}>
              {additives.length} LISTED · {groups.length} CATEGORIES
            </Text>
          </View>
        )}
      </View>

      {/* ── Content ────────────────────────────────────────── */}
      {!hasGroups ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          {additives.length > 0 ? (
            <AlertCircle size={14} color={colors.textMuted || '#71717A'} />
          ) : (
            <CheckCircle2 size={14} color={isDark ? '#34D399' : '#16A34A'} />
          )}
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1 }}>
            {additives.length > 0
              ? 'Ingredient data could not be categorised for this product.'
              : 'No additives identified from the available ingredient data.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 7 }}>
          {groups.map((group) => {
            const led = getLedColors(group.level, isDark);
            return (
              <View
                key={group.category}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                {/* Category LED */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: led.color,
                    shadowColor: led.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 4,
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800', flex: 1 }} numberOfLines={1}>
                  {group.label}
                </Text>
                <Text style={{ color: colors.textMuted || '#71717A', fontSize: 11, fontWeight: '600' }}>
                  ({group.items.length})
                </Text>
                {/* Level badge — neutral wording only */}
                <View
                  style={{
                    backgroundColor: `${led.soft}15`,
                    borderColor: `${led.soft}35`,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: led.color, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 }}>
                    {LED_STATUS_LABELS[group.level]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
