import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, ShieldAlert, CheckCircle2, Search, Sparkles } from 'lucide-react-native';
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
// CARD A — INGREDIENT REVIEW
// Minimalist · clean · neutral language
// ─────────────────────────────────────────────────────────
function GutIngredientReviewCard({
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
  const isClean = gutScore >= 80;
  const isReview = gutScore >= 50 && gutScore < 80;
  const accent = isClean
    ? (isDark ? '#34D399' : '#16A34A')
    : isReview
    ? (isDark ? '#FBBF24' : '#D97706')
    : (isDark ? '#F87171' : '#DC2626');

  const badge = isClean ? 'No Flags' : isReview ? 'Review' : 'Flagged';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(12,14,13,0.97)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
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
      {/* Header */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isClean
              ? <ShieldCheck size={18} color={accent} strokeWidth={2.2} />
              : <ShieldAlert size={18} color={accent} strokeWidth={2.2} />}
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={2}>
              Ingredient Review
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', marginTop: 1 }} numberOfLines={2}>
              {gutInsights.length === 0
                ? 'Based on available data'
                : `${gutInsights.length} categor${gutInsights.length !== 1 ? 'ies' : 'y'} identified`}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: `${accent}12`,
          borderColor: `${accent}28`,
          borderWidth: 1,
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>{badge}</Text>
        </View>
      </View>

      {/* Segment dots bar */}
      <View style={{ flexDirection: 'row', gap: 2.5, marginBottom: 12 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              backgroundColor: i < Math.round(gutScore / 5)
                ? accent
                : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
            }}
          />
        ))}
      </View>

      {/* Findings */}
      {gutInsights.length === 0 ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 8, paddingHorizontal: 10,
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(52,211,153,0.06)' : 'rgba(22,163,74,0.05)',
        }}>
          <Sparkles size={13} color={accent} />
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', flex: 1 }}>
            No ingredients flagged based on available product data.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {gutInsights.map((ins: any, idx: number) => {
            const rowColor = ins.severity === 'high'
              ? (isDark ? '#F87171' : '#DC2626')
              : (isDark ? '#FBBF24' : '#D97706');
            return (
              <View key={idx} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: 8, paddingHorizontal: 10,
                borderRadius: 10,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: rowColor }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{ins.title}</Text>
                    {ins.additivesFound?.length > 0 && (
                      <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', marginTop: 1 }} numberOfLines={1}>
                        {ins.additivesFound.map((a: any) => a.displayName).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{
                  backgroundColor: `${rowColor}12`,
                  borderColor: `${rowColor}22`,
                  borderWidth: 1,
                  paddingHorizontal: 6, paddingVertical: 2,
                  borderRadius: 5,
                }}>
                  <Text style={{ color: rowColor, fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase' }}>
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
// CARD B — ADDITIVES IDENTIFIED
// Minimalist · neutral · chip layout
// ─────────────────────────────────────────────────────────
function AdditivesIdentifiedCard({
  additives,
  colors,
  isDark,
}: {
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}) {
  // De-duplicate additives
  const uniqueAdditives = React.useMemo(() => {
    const map = new Map<string, AdditiveDetail & { _eCode: string; _cleanName: string }>();
    additives.forEach(item => {
      const eCode = parseENumber(item.tag, item.displayName);
      // Remove any trailing/inline E-number from the display name
      let cleanName = (item.displayName || '')
        .replace(new RegExp(`\\s*\\(?${eCode}\\)?`, 'i'), '')
        .replace(/\s*\(e\d{3,4}[a-z]?\)/i, '')
        .replace(/\s*-\s*$/, '') // remove trailing dash
        .trim();
      
      if (!cleanName && eCode) cleanName = `Additive`;
      if (!cleanName) cleanName = 'Unknown Additive';

      const key = eCode ? eCode.toLowerCase() : cleanName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...item, _eCode: eCode, _cleanName: cleanName });
      }
    });
    return Array.from(map.values());
  }, [additives]);

  const elevated = uniqueAdditives.filter(a => a.riskLevel === 'elevated');
  const moderate = uniqueAdditives.filter(a => a.riskLevel === 'moderate');
  const flaggedCount = elevated.length + moderate.length;
  const isClean = flaggedCount === 0;

  const accent = isDark ? '#94A3B8' : '#64748B';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(10,12,16,0.97)' : '#F9FAFB',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        borderRadius: 20,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.1 : 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header strip */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 34, height: 34, borderRadius: 9,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isClean
              ? <CheckCircle2 size={17} color={isDark ? '#34D399' : '#16A34A'} strokeWidth={2.2} />
              : <Search size={17} color={accent} strokeWidth={2.2} />}
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }}>
              Additives Identified
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', marginTop: 1 }} numberOfLines={2}>
              {uniqueAdditives.length === 0 ? 'None in available data' : `${uniqueAdditives.length} total · ${flaggedCount} for review`}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
          borderWidth: 1,
          paddingHorizontal: 9, paddingVertical: 3,
          borderRadius: 6,
        }}>
          <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 }}>
            {isClean ? 'NONE FLAGGED' : `${flaggedCount} FOR REVIEW`}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        {uniqueAdditives.length === 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={13} color={isDark ? '#34D399' : '#16A34A'} />
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', flex: 1 }}>
              No additives identified from the available ingredient data.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
              Based on available ingredient information.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {uniqueAdditives.map((item, idx) => {
                const isEl = item.riskLevel === 'elevated';
                const isMod = item.riskLevel === 'moderate';
                // neutral color unless explicitly flagged
                const chipColor = isEl
                  ? (isDark ? '#F87171' : '#DC2626')
                  : isMod
                  ? (isDark ? '#FBBF24' : '#D97706')
                  : (isDark ? '#94A3B8' : '#64748B');
                const chipBg = isEl
                  ? (isDark ? 'rgba(248,113,113,0.08)' : 'rgba(239,68,68,0.05)')
                  : isMod
                  ? (isDark ? 'rgba(251,191,36,0.07)' : 'rgba(245,158,11,0.04)')
                  : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');
                
                const eCode = item._eCode;
                const cleanName = item._cleanName;

                return (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: chipBg,
                      borderColor: isDark ? `${chipColor}20` : `${chipColor}18`,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 8, paddingVertical: 5,
                      gap: 4,
                      flexShrink: 1, // Let chip shrink if screen is extremely narrow
                    }}
                  >
                    {eCode ? (
                      <>
                        <Text style={{ color: chipColor, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.2 }}>
                          {eCode}
                        </Text>
                        <View style={{ width: 1, height: 9, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
                      </>
                    ) : null}
                    <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '700', flexShrink: 1 }} numberOfLines={2}>
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
// EXPORT — backward-compatible wrapper
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
      <GutIngredientReviewCard gutScore={gutScore} gutInsights={gutInsights} colors={colors} isDark={isDark} />
      <AdditivesIdentifiedCard additives={additives} colors={colors} isDark={isDark} />
    </View>
  );
}
