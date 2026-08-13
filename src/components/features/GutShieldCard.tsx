import React from 'react';
import { View, Text } from 'react-native';
import { ShieldAlert, ShieldCheck, Activity, Leaf, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GutInsight } from '../../utils/gutShieldEvaluator';

interface GutShieldCardProps {
  score: number;
  insights: GutInsight[];
  colors: any;
  isDark: boolean;
}

export function GutShieldCard({ score, insights, colors, isDark }: GutShieldCardProps) {
  const isHealthy = score >= 80;
  const isModerate = score >= 50 && score < 80;

  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const bgSurface = isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF';

  const themeColor = isHealthy ? '#10B981' : isModerate ? '#F59E0B' : '#EF4444';
  const gradientColors = isHealthy
    ? (isDark ? ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.02)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(240, 253, 250, 0.95)'])
    : isModerate
      ? (isDark ? ['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.02)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(254, 252, 232, 0.95)'])
      : (isDark ? ['rgba(239, 68, 68, 0.08)', 'rgba(239, 68, 68, 0.02)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(254, 242, 242, 0.95)']);

  const standingLabel = isHealthy
    ? '🟢 EXCELLENT STANDING'
    : isModerate
      ? '🟡 MODERATE GUT INTEGRITY'
      : '🔴 CRITICAL DISRUPTORS DETECTED';

  return (
    <LinearGradient
      colors={gradientColors as any}
      style={{
        borderColor: borderDivider,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.3 : 0.04,
        shadowRadius: 16,
        elevation: 5,
        marginBottom: 16,
      }}
    >
      {/* Header Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: `${themeColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isHealthy ? (
              <ShieldCheck size={20} color="#10B981" strokeWidth={2.4} />
            ) : (
              <ShieldAlert size={20} color={themeColor} strokeWidth={2.4} />
            )}
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
              Gut Shield Pro
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              {isHealthy ? 'Microbiome Friendly' : `${insights.length} Disruptor Concern${insights.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: `${themeColor}15`,
          borderColor: `${themeColor}30`,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 10,
        }}>
          <Text style={{ color: themeColor, fontSize: 13, fontWeight: '900', letterSpacing: 0.3 }}>
            {score}%
          </Text>
        </View>
      </View>

      {/* Gut Health Integrity Meter */}
      <View style={{ marginBottom: 14 }}>
        <View style={{
          height: 10,
          width: '100%',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderRadius: 5,
          overflow: 'hidden',
        }}>
          <View style={{
            height: '100%',
            width: `${Math.max(8, score)}%`,
            backgroundColor: themeColor,
            borderRadius: 5,
          }} />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, marginTop: 6, textAlign: 'center' }}>
          {standingLabel}
        </Text>
      </View>

      {/* Description */}
      <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18, marginBottom: 16, fontWeight: '600' }}>
        {isHealthy
          ? 'This product is microbiome-friendly and free from known intestinal disruptors or emulsifiers.'
          : 'Disruptive compounds detected. Regular consumption may irritate mucosal lining or alter beneficial gut flora.'}
      </Text>

      {/* Disruptor Insights & Additives Breakdown */}
      {insights.length === 0 ? (
        <View style={{
          backgroundColor: bgSurface,
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
          <Leaf size={20} color="#10B981" />
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 17 }}>
            Optimal gut compatibility. 0 disruptive synthetic gums or artificial sweeteners.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {insights.map((insight, idx) => {
            const severityColor = insight.severity === 'high' ? '#EF4444' : insight.severity === 'medium' ? '#F59E0B' : '#3B82F6';
            return (
              <View
                key={idx}
                style={{
                  backgroundColor: bgSurface,
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: borderDivider,
                  borderLeftWidth: 4,
                  borderLeftColor: severityColor,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Activity size={14} color={severityColor} />
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                      {insight.title}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: `${severityColor}15`,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{ color: severityColor, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                      {insight.severity} impact
                    </Text>
                  </View>
                </View>

                <Text style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 16, fontWeight: '500' }}>
                  {insight.description}
                </Text>

                {insight.additivesFound.length > 0 && (
                  <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {insight.additivesFound.map((a, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: `${severityColor}30`,
                          borderWidth: 1,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '700' }}>
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
    </LinearGradient>
  );
}
