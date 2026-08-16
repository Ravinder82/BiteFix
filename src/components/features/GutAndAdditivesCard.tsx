import React from 'react';
import { View, Text } from 'react-native';
import {
  ShieldCheck, ShieldAlert, Sparkles,
  CheckCircle2, FlaskConical, Search,
} from 'lucide-react-native';
import { AdditiveDetail } from '../../types/app.types';
import { evaluateGutHealth, parseENumber } from '../../utils/gutShieldEvaluator';

interface GutAndAdditivesCardProps {
  gutScore?: number;
  gutInsights?: any[];
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}

// ─────────────────────────────────────────────────────────
// CARD A — GUT SHIELD PRO
// Personality: Organic · Biomorphic · Living green system
// ─────────────────────────────────────────────────────────
function GutShieldCard({
  gutScore,
  gutInsights,
  colors,
  isDark,
}: {
  gutScore: number;
  gutInsights: any[];
  colors: any;
  isDark: boolean;
}) {
  const isHealthy = gutScore >= 80;
  const isModerate = gutScore >= 50 && gutScore < 80;

  const accent = isHealthy
    ? (isDark ? '#34D399' : '#16A34A')
    : isModerate
    ? (isDark ? '#FBBF24' : '#D97706')
    : (isDark ? '#F87171' : '#DC2626');

  const label = isHealthy ? '100% Integrity' : isModerate ? 'Moderate' : 'Disrupted';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(10,14,12,0.97)' : '#FFFFFF',
        borderColor: isDark ? `${accent}22` : `${accent}30`,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.18 : 0.07,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      {/* Ambient blob — organic feel */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', top: -40, right: -40,
          width: 150, height: 150, borderRadius: 75,
          backgroundColor: accent, opacity: isDark ? 0.05 : 0.08,
        }}
      />

      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: `${accent}18`,
            borderWidth: 1.5, borderColor: `${accent}35`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isHealthy
              ? <ShieldCheck size={20} color={accent} strokeWidth={2.2} />
              : <ShieldAlert size={20} color={accent} strokeWidth={2.2} />}
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
              Gut Ingredient Review
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              {gutInsights.length === 0
                ? 'Based on available ingredient information'
                : `${gutInsights.length} Ingredient${gutInsights.length !== 1 ? 's' : ''} Flagged for Review`}
            </Text>
          </View>
        </View>

        {/* Score capsule */}
        <View style={{
          backgroundColor: `${accent}15`,
          borderColor: `${accent}35`,
          borderWidth: 1,
          paddingHorizontal: 11,
          paddingVertical: 5,
          borderRadius: 20,
        }}>
          <Text style={{ color: accent, fontSize: 12, fontWeight: '900' }}>
            {isHealthy ? 'No Flags' : isModerate ? 'Review' : 'Flagged'}
          </Text>
        </View>
      </View>

      {/* Organic segmented bar — not a rectangle, but living dots */}
      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 14 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 5,
              borderRadius: 3,
              backgroundColor: i < Math.round(gutScore / 5)
                ? accent
                : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
            }}
          />
        ))}
      </View>

      {/* Insight row */}
      {gutInsights.length === 0 ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: isDark ? 'rgba(52,211,153,0.07)' : 'rgba(22,163,74,0.06)',
          paddingVertical: 9, paddingHorizontal: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(52,211,153,0.14)' : 'rgba(22,163,74,0.12)',
        }}>
          <Sparkles size={14} color={accent} />
          <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '700', flex: 1 }}>
            No ingredients were flagged in this review based on available ingredient information.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 7 }}>
          {gutInsights.map((ins: any, idx: number) => {
            const sev = ins.severity === 'high'
              ? (isDark ? '#F87171' : '#DC2626')
              : ins.severity === 'medium'
              ? (isDark ? '#FBBF24' : '#D97706')
              : (isDark ? '#22D3EE' : '#0891B2');
            return (
              <View key={idx} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                paddingVertical: 9, paddingHorizontal: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: sev }} />
                  <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{ins.title}</Text>
                    {ins.additivesFound?.length > 0 && (
                      <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600', marginTop: 1 }} numberOfLines={1}>
                        {ins.additivesFound.map((a: any) => a.displayName).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{
                  backgroundColor: `${sev}14`, borderColor: `${sev}28`,
                  borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6,
                }}>
                  <Text style={{ color: sev, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                    {ins.severity === 'high' ? 'Flagged' : 'Review'}
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

// ─────────────────────────────────────────────────────────
// CARD B — ADDITIVE DETECTIVE
// Personality: Forensic · Clinical · Lab audit report
// Dark surface, monospace E-codes, sharp pill tags
// ─────────────────────────────────────────────────────────
function AdditiveDetectiveCard({
  additives,
  colors,
  isDark,
}: {
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}) {
  const elevated = additives.filter(a => a.riskLevel === 'elevated');
  const moderate = additives.filter(a => a.riskLevel === 'moderate');
  const isClean = elevated.length === 0 && moderate.length === 0;

  const accentClean = isDark ? '#34D399' : '#16A34A';
  const accentAlert = isDark ? '#22D3EE' : '#0891B2';
  const accent = isClean ? accentClean : accentAlert;

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(4,10,16,0.97)' : '#F8FAFF',
        borderColor: isDark ? `${accent}20` : `${accent}28`,
        borderWidth: 1.5,
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.15 : 0.06,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      {/* Top strip — lab header bar */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: isDark ? `${accent}14` : `${accent}10`,
            borderWidth: 1, borderColor: `${accent}28`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isClean
              ? <CheckCircle2 size={19} color={accent} strokeWidth={2.2} />
              : <Search size={19} color={accent} strokeWidth={2.2} />}
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
              Additive Detective
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              {additives.length} Additives Identified
            </Text>
          </View>
        </View>

        {/* Verdict tag — sharp corners, uppercase */}
        <View style={{
          backgroundColor: isClean
            ? (isDark ? 'rgba(52,211,153,0.12)' : 'rgba(22,163,74,0.09)')
            : (isDark ? 'rgba(34,211,238,0.12)' : 'rgba(8,145,178,0.09)'),
          borderColor: isDark ? `${accent}30` : `${accent}28`,
          borderWidth: 1,
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 7,
        }}>
          <Text style={{ color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>
            {isClean ? 'NONE FLAGGED' : `${elevated.length + moderate.length} FLAGGED`}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ paddingHorizontal: 18, paddingVertical: 14 }}>
        {isClean ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} color={accentClean} />
            <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '700', flex: 1 }}>
              No additives were identified from the available ingredient information.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700' }}>
              Based on available ingredient information.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {additives.map((item, idx) => {
              const isEl = item.riskLevel === 'elevated';
              const isMod = item.riskLevel === 'moderate';
              const tagColor = isEl
                ? (isDark ? '#F87171' : '#DC2626')
                : isMod
                ? (isDark ? '#FBBF24' : '#D97706')
                : (isDark ? '#34D399' : '#16A34A');
              const tagBg = isEl
                ? (isDark ? 'rgba(248,113,113,0.09)' : 'rgba(239,68,68,0.05)')
                : isMod
                ? (isDark ? 'rgba(251,191,36,0.08)' : 'rgba(245,158,11,0.04)')
                : (isDark ? 'rgba(52,211,153,0.08)' : 'rgba(22,163,74,0.04)');
              const eCode = parseENumber(item.tag, item.displayName);
              const cleanName = (item.displayName || '').replace(/\s*\(e\d{3,4}[a-z]?\)/i, '');

              return (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: tagBg,
                    borderColor: isDark ? `${tagColor}28` : `${tagColor}20`,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 5,
                    gap: 5,
                  }}
                >
                  {/* Monospace E-code chip */}
                  <Text style={{ color: tagColor, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.3 }}>
                    {eCode}
                  </Text>
                  <View style={{ width: 1, height: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '700' }}>
                    {cleanName}
                  </Text>
                </View>
              );
            })}
          </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// EXPORT — backward-compatible wrapper (single import)
// ─────────────────────────────────────────────────────────
export function GutAndAdditivesCard({
  gutScore: propGutScore,
  gutInsights: propGutInsights,
  additives = [],
  colors,
  isDark,
}: GutAndAdditivesCardProps) {
  const evaluation = evaluateGutHealth(additives);
  const gutScore = propGutScore !== undefined ? propGutScore : evaluation.score;
  const gutInsights =
    propGutInsights !== undefined && propGutInsights.length > 0
      ? propGutInsights
      : evaluation.insights;

  return (
    <View>
      <GutShieldCard gutScore={gutScore} gutInsights={gutInsights} colors={colors} isDark={isDark} />
      <AdditiveDetectiveCard additives={additives} colors={colors} isDark={isDark} />
    </View>
  );
}
