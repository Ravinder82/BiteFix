import React from 'react';
import { View, Text } from 'react-native';
import { ShieldAlert, ShieldCheck, Activity, CheckCircle } from 'lucide-react-native';
import { GutInsight } from '../../utils/gutShieldEvaluator';

interface GutShieldCardProps {
  score: number;
  insights: GutInsight[];
  colors: any;
  isDark: boolean;
}

export function GutShieldCard({ score, insights, colors, isDark }: GutShieldCardProps) {
  const isClean = score >= 80;
  const isReview = score >= 50 && score < 80;

  const accent = isClean
    ? (isDark ? '#34D399' : '#16A34A')
    : isReview
    ? (isDark ? '#FBBF24' : '#D97706')
    : (isDark ? '#F87171' : '#DC2626');

  const statusLabel = isClean
    ? 'No Ingredients Flagged'
    : isReview
    ? 'Ingredients for Review'
    : 'Ingredients Flagged';

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(12,14,13,0.97)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.12 : 0.04,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isClean
              ? <ShieldCheck size={18} color={accent} strokeWidth={2.2} />
              : <ShieldAlert size={18} color={accent} strokeWidth={2.2} />}
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }}>
              Ingredient Review
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', marginTop: 1 }}>
              {insights.length === 0
                ? 'Based on available data'
                : `${insights.length} categor${insights.length !== 1 ? 'ies' : 'y'} identified`}
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
          <Text style={{ color: accent, fontSize: 10, fontWeight: '900' }}>
            {isClean ? 'Clear' : isReview ? 'Review' : 'Flagged'}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{
        height: 5, borderRadius: 3, overflow: 'hidden',
        backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        marginBottom: 4,
      }}>
        <View style={{
          height: '100%', width: `${Math.max(8, score)}%`,
          backgroundColor: accent, borderRadius: 3,
        }} />
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '700', marginBottom: 12 }}>
        {statusLabel}
      </Text>

      {/* Findings */}
      {insights.length === 0 ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: isDark ? 'rgba(52,211,153,0.06)' : 'rgba(22,163,74,0.04)',
          padding: 10, borderRadius: 10,
        }}>
          <CheckCircle size={14} color={accent} />
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', flex: 1 }}>
            No ingredients flagged based on available product data.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 7 }}>
          {insights.map((insight, idx) => {
            const rowColor = insight.severity === 'high'
              ? (isDark ? '#F87171' : '#DC2626')
              : insight.severity === 'medium'
              ? (isDark ? '#FBBF24' : '#D97706')
              : (isDark ? '#94A3B8' : '#64748B');
            return (
              <View
                key={idx}
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  padding: 10, borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: insight.additivesFound.length > 0 ? 5 : 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Activity size={12} color={rowColor} />
                    <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>
                      {insight.title}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: `${rowColor}12`,
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
                  }}>
                    <Text style={{ color: rowColor, fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase' }}>
                      {insight.severity === 'high' ? 'Flagged' : 'Review'}
                    </Text>
                  </View>
                </View>

                {insight.additivesFound.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                    {insight.additivesFound.map((a, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>
                          {a.displayName}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
