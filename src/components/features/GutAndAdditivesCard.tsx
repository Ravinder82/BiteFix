import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, Zap, FlaskConical } from 'lucide-react-native';
import { AdditiveDetail } from '../../types/app.types';
import { evaluateGutHealth, parseENumber } from '../../utils/gutShieldEvaluator';

interface GutAndAdditivesCardProps {
  gutScore?: number;
  gutInsights?: any[];
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}

export function GutAndAdditivesCard({
  gutScore: propGutScore,
  gutInsights: propGutInsights,
  additives = [],
  colors,
  isDark,
}: GutAndAdditivesCardProps) {
  const evaluation = evaluateGutHealth(additives);
  const gutScore = propGutScore !== undefined ? propGutScore : evaluation.score;
  const gutInsights = propGutInsights !== undefined && propGutInsights.length > 0 ? propGutInsights : evaluation.insights;

  const isHealthy = gutScore >= 80;
  const isModerate = gutScore >= 50 && gutScore < 80;

  const gutColor = isHealthy
    ? (isDark ? '#34D399' : '#16A34A')
    : isModerate
    ? (isDark ? '#FBBF24' : '#D97706')
    : (isDark ? '#F87171' : '#DC2626');

  const elevatedAdditives = additives.filter((a) => a.riskLevel === 'elevated');
  const moderateAdditives = additives.filter((a) => a.riskLevel === 'moderate');
  const isCleanAdditives = elevatedAdditives.length === 0 && moderateAdditives.length === 0;

  const cardBg = isDark ? 'rgba(5, 12, 7, 0.96)' : '#FFFFFF';
  const cardBorder = isDark ? `${gutColor}25` : `${gutColor}18`;
  const innerBg = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(248, 250, 248, 0.95)';
  const innerBorder = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: gutColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.18 : 0.05,
        shadowRadius: 18,
        elevation: 5,
        marginBottom: 16,
        gap: 16,
        overflow: 'hidden',
      }}
    >
      {/* ── SECTION 1: Gut Shield Pro ── */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: `${gutColor}14`,
                borderWidth: 1,
                borderColor: `${gutColor}28`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isHealthy ? (
                <ShieldCheck size={19} color={gutColor} strokeWidth={2.2} />
              ) : (
                <ShieldAlert size={19} color={gutColor} strokeWidth={2.2} />
              )}
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                Gut Shield Pro
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
                {isHealthy ? 'Microbiome Friendly' : `${gutInsights.length} Biological Disruption${gutInsights.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>

          {/* Minimal Translucent Status Badge (NO SVG Rings) */}
          <View
            style={{
              backgroundColor: `${gutColor}14`,
              borderColor: `${gutColor}30`,
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: gutColor, fontSize: 12, fontWeight: '900', letterSpacing: 0.2 }}>
              {gutScore}% Integrity
            </Text>
          </View>
        </View>

        {/* Minimal 4px Integrity Progress Bar */}
        <View
          style={{
            height: 4,
            width: '100%',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${Math.max(6, gutScore)}%`,
              backgroundColor: gutColor,
              borderRadius: 2,
            }}
          />
        </View>

        {/* Insights / Disruptors List */}
        {gutInsights.length === 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: innerBg,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: innerBorder,
            }}
          >
            <Sparkles size={14} color={isDark ? '#34D399' : '#16A34A'} />
            <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '700' }}>
              No gut barrier disruptors detected • Safe for intestinal lining
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6, marginTop: 2 }}>
            {gutInsights.map((insight: any, idx: number) => {
              const severityColor =
                insight.severity === 'high'
                  ? (isDark ? '#F87171' : '#DC2626')
                  : insight.severity === 'medium'
                  ? (isDark ? '#FBBF24' : '#D97706')
                  : (isDark ? '#22D3EE' : '#0891B2');

              return (
                <View
                  key={idx}
                  style={{
                    backgroundColor: innerBg,
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: innerBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: severityColor,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
                        {insight.title}
                      </Text>
                      {insight.additivesFound && insight.additivesFound.length > 0 && (
                        <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600', marginTop: 1 }} numberOfLines={1}>
                          {insight.additivesFound.map((a: any) => a.displayName).join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: `${severityColor}14`,
                      borderColor: `${severityColor}25`,
                      borderWidth: 1,
                      paddingHorizontal: 7,
                      paddingVertical: 2.5,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: severityColor, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                      {insight.severity || 'Caution'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Thin Divider */}
      <View style={{ height: 1, backgroundColor: innerBorder }} />

      {/* ── SECTION 2: Additive Detective ── */}
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: isCleanAdditives
                  ? (isDark ? 'rgba(52,211,153,0.14)' : 'rgba(22,163,74,0.10)')
                  : (isDark ? 'rgba(34,211,238,0.14)' : 'rgba(8,145,178,0.10)'),
                borderWidth: 1,
                borderColor: isCleanAdditives
                  ? (isDark ? 'rgba(52,211,153,0.25)' : 'rgba(22,163,74,0.18)')
                  : (isDark ? 'rgba(34,211,238,0.25)' : 'rgba(8,145,178,0.18)'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCleanAdditives ? (
                <CheckCircle2 size={19} color={isDark ? '#34D399' : '#16A34A'} strokeWidth={2.2} />
              ) : (
                <FlaskConical size={19} color={isDark ? '#22D3EE' : '#0891B2'} strokeWidth={2.2} />
              )}
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                Additive Detective
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
                {additives.length} Total Additives Audited
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: isCleanAdditives
                ? (isDark ? 'rgba(52,211,153,0.12)' : 'rgba(22,163,74,0.10)')
                : (isDark ? 'rgba(34,211,238,0.12)' : 'rgba(8,145,178,0.10)'),
              borderColor: isCleanAdditives
                ? (isDark ? 'rgba(52,211,153,0.28)' : 'rgba(22,163,74,0.22)')
                : (isDark ? 'rgba(34,211,238,0.28)' : 'rgba(8,145,178,0.22)'),
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: isCleanAdditives
                  ? (isDark ? '#34D399' : '#16A34A')
                  : (isDark ? '#22D3EE' : '#0891B2'),
                fontSize: 10.5,
                fontWeight: '900',
                letterSpacing: 0.4,
              }}
            >
              {isCleanAdditives ? 'CLEAN LABEL' : `${elevatedAdditives.length + moderateAdditives.length} DETECTED`}
            </Text>
          </View>
        </View>

        {/* Clean Label OR Minimal Pill Tag Cloud */}
        {isCleanAdditives ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: innerBg,
              paddingVertical: 9,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: innerBorder,
            }}
          >
            <CheckCircle2 size={15} color={isDark ? '#34D399' : '#16A34A'} />
            <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '700', flex: 1 }}>
              No artificial dyes, chemical preservatives, or high-risk emulsifiers detected.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {additives.map((item, idx) => {
                const isElevated = item.riskLevel === 'elevated';
                const isModerate = item.riskLevel === 'moderate';
                const eCode = parseENumber(item.tag, item.displayName);
                
                // Clean displayName by removing redundant (E...) suffix
                const cleanName = (item.displayName || '').replace(/\s*\(e\d{3,4}[a-z]?\)/i, '');

                const tagColor = isElevated
                  ? (isDark ? '#F87171' : '#DC2626')
                  : isModerate
                  ? (isDark ? '#FBBF24' : '#D97706')
                  : (isDark ? '#34D399' : '#16A34A');

                const bgStyle = isElevated
                  ? (isDark ? 'rgba(248,113,113,0.10)' : 'rgba(239,68,68,0.05)')
                  : isModerate
                  ? (isDark ? 'rgba(251,191,36,0.08)' : 'rgba(245,158,11,0.04)')
                  : (isDark ? 'rgba(52,211,153,0.08)' : 'rgba(22,163,74,0.04)');

                const borderStyle = isElevated
                  ? (isDark ? 'rgba(248,113,113,0.22)' : 'rgba(239,68,68,0.14)')
                  : isModerate
                  ? (isDark ? 'rgba(251,191,36,0.18)' : 'rgba(245,158,11,0.12)')
                  : (isDark ? 'rgba(52,211,153,0.18)' : 'rgba(22,163,74,0.12)');

                return (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: bgStyle,
                      borderColor: borderStyle,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      gap: 6,
                    }}
                  >
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: tagColor }} />
                    <Text style={{ color: tagColor, fontSize: 10, fontWeight: '900', letterSpacing: 0.2 }}>
                      {eCode}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
                      {cleanName}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Very short caution warnings mapped to clinical impact */}
            {(() => {
              const flagged = additives.filter(
                (a) => a.riskLevel === 'elevated' || a.riskLevel === 'moderate'
              );
              if (flagged.length === 0) return null;

              return (
                <View
                  style={{
                    marginTop: 4,
                    padding: 10,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    borderColor: innerBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    gap: 5,
                  }}
                >
                  {flagged.map((item, idx) => {
                    const nameLower = (item.displayName || '').toLowerCase();
                    const tag = parseENumber(item.tag, item.displayName);
                    let caution = 'Gut irritant';

                    if (
                      nameLower.includes('carrageenan') ||
                      nameLower.includes('polysorbate') ||
                      nameLower.includes('cmc') ||
                      nameLower.includes('cellulose') ||
                      nameLower.includes('emulsifier')
                    ) {
                      caution = 'May compromise gut lining barrier';
                    } else if (
                      nameLower.includes('sucralose') ||
                      nameLower.includes('aspartame') ||
                      nameLower.includes('sweetener') ||
                      nameLower.includes('acesulfame') ||
                      nameLower.includes('saccharin')
                    ) {
                      caution = 'Alters healthy microbiome balance';
                    } else if (
                      nameLower.includes('benzoate') ||
                      nameLower.includes('sorbate') ||
                      nameLower.includes('preservative')
                    ) {
                      caution = 'Antimicrobial to beneficial bacteria';
                    } else if (
                      nameLower.includes('dye') ||
                      nameLower.includes('color') ||
                      nameLower.includes('yellow') ||
                      nameLower.includes('red') ||
                      nameLower.includes('blue')
                    ) {
                      caution = 'Potential immune/histamine trigger';
                    }

                    const itemColor =
                      item.riskLevel === 'elevated'
                        ? (isDark ? '#F87171' : '#DC2626')
                        : (isDark ? '#FBBF24' : '#D97706');

                    return (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: itemColor, fontSize: 10.5, fontWeight: '900' }}>
                          {tag}:
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                          {caution}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        )}
      </View>
    </View>
  );
}

