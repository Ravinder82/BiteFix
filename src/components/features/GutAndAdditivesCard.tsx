import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, ShieldAlert, Activity, Search, AlertTriangle, CheckCircle2, Zap, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdditiveDetail } from '../../types/app.types';
import { GutInsight } from '../../utils/gutShieldEvaluator';

interface GutAndAdditivesCardProps {
  gutScore: number;
  gutInsights: GutInsight[];
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}

export function GutAndAdditivesCard({
  gutScore,
  gutInsights,
  additives,
  colors,
  isDark,
}: GutAndAdditivesCardProps) {
  const isGutHealthy = gutScore >= 80;
  const isGutModerate = gutScore >= 50 && gutScore < 80;
  const gutColor = isGutHealthy ? '#10B981' : isGutModerate ? '#F59E0B' : '#EF4444';

  const elevatedAdditives = additives.filter((a) => a.riskLevel === 'elevated');
  const moderateAdditives = additives.filter((a) => a.riskLevel === 'moderate');
  const isCleanAdditives = elevatedAdditives.length === 0 && moderateAdditives.length === 0;

  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const innerBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(5, 10, 6, 0.96)' : '#FFFFFF',
        borderColor: isDark ? `${gutColor}30` : `${gutColor}20`,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 18,
        shadowColor: gutColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.18 : 0.06,
        shadowRadius: 18,
        elevation: 6,
        marginBottom: 16,
        gap: 14,
        overflow: 'hidden',
      }}
    >
      {/* ── SECTION 1: Gut Shield Pro ── */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              backgroundColor: `${gutColor}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isGutHealthy ? (
                <ShieldCheck size={17} color="#10B981" strokeWidth={2.4} />
              ) : (
                <ShieldAlert size={17} color={gutColor} strokeWidth={2.4} />
              )}
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '900', letterSpacing: -0.3 }}>
                Gut Shield Pro
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700' }}>
                {isGutHealthy ? 'Microbiome Friendly' : `${gutInsights.length} Disruption Concern${gutInsights.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>

          <View style={{
            backgroundColor: `${gutColor}15`,
            borderColor: `${gutColor}30`,
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}>
            <Text style={{ color: gutColor, fontSize: 11.5, fontWeight: '900' }}>
              {gutScore}% Integrity
            </Text>
          </View>
        </View>

        {/* Sleek Integrity Bar */}
        <View style={{
          height: 6,
          width: '100%',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          <View style={{
            height: '100%',
            width: `${Math.max(8, gutScore)}%`,
            backgroundColor: gutColor,
            borderRadius: 3,
          }} />
        </View>

        {/* Compact Disruptors List (if any) */}
        {gutInsights.length === 0 ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: innerBg,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
          }}>
            <Sparkles size={13} color="#10B981" />
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
              0 gut disruptors detected • Safe for digestive lining
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {gutInsights.map((insight, idx) => {
              const severityColor = insight.severity === 'high' ? (isDark ? '#F87171' : '#DC2626') : insight.severity === 'medium' ? (isDark ? '#FBBF24' : '#D97706') : (isDark ? '#22D3EE' : '#0891B2');
              return (
                <View
                  key={idx}
                  style={{
                    backgroundColor: innerBg,
                    padding: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderDivider,
                    borderLeftWidth: 3,
                    borderLeftColor: severityColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>
                      {insight.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
                      {insight.additivesFound.map(a => a.displayName).join(', ')}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: `${severityColor}15`,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{ color: severityColor, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                      {insight.severity}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: borderDivider }} />

      {/* ── SECTION 2: Additive Detective ── */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              backgroundColor: isCleanAdditives ? (isDark ? 'rgba(52,211,153,0.12)' : 'rgba(34,197,94,0.10)') : (isDark ? 'rgba(34,211,238,0.12)' : 'rgba(8,145,178,0.10)'),
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isCleanAdditives ? (
                <CheckCircle2 size={17} color={isDark ? '#34D399' : '#16A34A'} strokeWidth={2.4} />
              ) : (
                <Search size={17} color={isDark ? '#22D3EE' : '#0891B2'} strokeWidth={2.4} />
              )}
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '900', letterSpacing: -0.3 }}>
                Additive Detective
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700' }}>
                {additives.length} Total Additive{additives.length !== 1 ? 's' : ''} Logged
              </Text>
            </View>
          </View>

          <View style={{
            backgroundColor: isCleanAdditives ? (isDark ? 'rgba(52,211,153,0.12)' : 'rgba(34,197,94,0.10)') : (isDark ? 'rgba(34,211,238,0.12)' : 'rgba(8,145,178,0.10)'),
            borderColor: isCleanAdditives ? (isDark ? 'rgba(52,211,153,0.28)' : 'rgba(34,197,94,0.25)') : (isDark ? 'rgba(34,211,238,0.28)' : 'rgba(8,145,178,0.25)'),
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}>
            <Text style={{ color: isCleanAdditives ? (isDark ? '#34D399' : '#16A34A') : (isDark ? '#22D3EE' : '#0891B2'), fontSize: 11, fontWeight: '900', letterSpacing: 0.3 }}>
              {isCleanAdditives ? 'CLEAN LABEL' : `${elevatedAdditives.length + moderateAdditives.length} DETECTED`}
            </Text>
          </View>
        </View>

        {/* Additives Badges */}
        {isCleanAdditives ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: innerBg,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
          }}>
            <CheckCircle2 size={13} color="#22C55E" />
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
              No artificial preservatives, dyes, or high-risk chemical emulsifiers
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {elevatedAdditives.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 }}>
                  <AlertTriangle size={12} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                    Watch List:
                  </Text>
                </View>
                {elevatedAdditives.map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(239,68,68,0.10)',
                      borderColor: isDark ? 'rgba(248,113,113,0.28)' : 'rgba(239,68,68,0.22)',
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 2.5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: isDark ? '#F87171' : '#DC2626', fontSize: 10.5, fontWeight: '800' }}>
                      {item.displayName}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {moderateAdditives.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 }}>
                  <Zap size={12} color="#F59E0B" />
                  <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                    Standard:
                  </Text>
                </View>
                {moderateAdditives.map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: 'rgba(245, 158, 11, 0.2)',
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 2.5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '700' }}>
                      {item.displayName}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
