import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Layers,
  FlaskConical
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { AdditiveDetail } from '../../types/app.types';
import {
  evaluateGutHealth,
  parseENumber,
} from '../../utils/gutShieldEvaluator';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GutAndAdditivesCardProps {
  gutScore?: number;
  gutInsights?: any[];
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}

export function GutAndAdditivesCard({
  gutScore: propGutScore,
  gutInsights,
  additives,
  colors,
  isDark,
}: GutAndAdditivesCardProps) {
  const [expandedVector, setExpandedVector] = useState<string | null>(null);
  const [showAllAdditives, setShowAllAdditives] = useState<boolean>(false);

  const evaluation = evaluateGutHealth(additives);
  const gutScore = propGutScore !== undefined ? propGutScore : evaluation.score;

  const isHealthy = gutScore >= 80;
  const isModerate = gutScore >= 50 && gutScore < 80;

  const statusColor = isHealthy
    ? (isDark ? '#34D399' : '#16A34A')
    : isModerate
    ? (isDark ? '#FBBF24' : '#D97706')
    : (isDark ? '#F87171' : '#DC2626');

  const statusLabel = isHealthy
    ? 'PRISTINE MICROBIOME SAFE'
    : isModerate
    ? 'MODERATE GUT DISRUPTION'
    : 'HIGH INFLAMMATION RISK';

  const elevatedAdditives = (additives || []).filter((a) => a.riskLevel === 'elevated');
  const moderateAdditives = (additives || []).filter((a) => a.riskLevel === 'moderate');
  const lowAdditives = (additives || []).filter((a) => a.riskLevel === 'low');
  const isCleanAdditives = elevatedAdditives.length === 0 && moderateAdditives.length === 0;

  const toggleVectorExpand = (vectorId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedVector(expandedVector === vectorId ? null : vectorId);
  };

  const toggleShowAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllAdditives(!showAllAdditives);
  };

  const cardBg = isDark ? 'rgba(5, 12, 7, 0.96)' : '#FFFFFF';
  const cardBorder = isDark ? `${statusColor}30` : `${statusColor}20`;
  const innerBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(248, 250, 248, 0.95)';
  const innerBorder = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: statusColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.20 : 0.06,
        shadowRadius: 20,
        elevation: 6,
        marginBottom: 16,
        gap: 16,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: `${statusColor}0D`,
        }}
        pointerEvents="none"
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: `${statusColor}18`,
              borderWidth: 1,
              borderColor: `${statusColor}30`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isHealthy ? (
              <ShieldCheck size={22} color={statusColor} strokeWidth={2.2} />
            ) : (
              <ShieldAlert size={22} color={statusColor} strokeWidth={2.2} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.4 }}>
              Gut Shield Pro
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              Biological Microbiome Audit
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Svg width={44} height={44} viewBox="0 0 50 50">
              <Circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
                strokeWidth="4"
              />
              <Circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke={statusColor}
                strokeWidth="4"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - Math.max(5, gutScore) / 100)}
                strokeLinecap="round"
                transform="rotate(-90 25 25)"
              />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: statusColor, fontSize: 13, fontWeight: '900' }}>
                {gutScore}%
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: `${statusColor}14`,
              borderColor: `${statusColor}30`,
              borderWidth: 1,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 10,
              maxWidth: 120,
            }}
          >
            <Text
              style={{ color: statusColor, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 }}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Biological Pathways Audit (4 Vectors)
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {evaluation.vectors.map((vector: any) => {
            const isClean = vector.status === 'clean';
            const isDisrupted = vector.status === 'disrupted';
            const vecColor = isClean
              ? (isDark ? '#34D399' : '#16A34A')
              : isDisrupted
              ? (isDark ? '#F87171' : '#DC2626')
              : (isDark ? '#FBBF24' : '#D97706');

            const isExpanded = expandedVector === vector.id;

            return (
              <View
                key={vector.id}
                style={{
                  width: '48.5%',
                  backgroundColor: innerBg,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isExpanded ? `${vecColor}40` : innerBorder,
                  padding: 10,
                  gap: 6,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleVectorExpand(vector.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: vecColor,
                      }}
                    />
                    <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }} numberOfLines={1}>
                      {vector.shortLabel}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={14} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={14} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>
                    {vector.additivesFound.length === 0
                      ? 'Safe'
                      : `${vector.additivesFound.length} Flagged`}
                  </Text>

                  <View
                    style={{
                      backgroundColor: `${vecColor}14`,
                      borderColor: `${vecColor}25`,
                      borderWidth: 1,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: vecColor, fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase' }}>
                      {vector.status}
                    </Text>
                  </View>
                </View>

                {isExpanded && (
                  <View
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTopWidth: 1,
                      borderTopColor: innerBorder,
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', lineHeight: 14 }}>
                      {vector.clinicalImpact}
                    </Text>
                    {vector.additivesFound.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {vector.additivesFound.map((add: any, idx: number) => (
                          <View
                            key={idx}
                            style={{
                              backgroundColor: `${vecColor}15`,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ color: vecColor, fontSize: 9, fontWeight: '800' }}>
                              [{parseENumber(add.tag, add.displayName)}] {add.displayName}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: innerBorder }} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isCleanAdditives
                  ? (isDark ? 'rgba(52,211,153,0.14)' : 'rgba(22,163,74,0.10)')
                  : (isDark ? 'rgba(34,211,238,0.14)' : 'rgba(8,145,178,0.10)'),
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isCleanAdditives
                  ? (isDark ? 'rgba(52,211,153,0.25)' : 'rgba(22,163,74,0.18)')
                  : (isDark ? 'rgba(34,211,238,0.25)' : 'rgba(8,145,178,0.18)'),
              }}
            >
              {isCleanAdditives ? (
                <CheckCircle2 size={18} color={isDark ? '#34D399' : '#16A34A'} strokeWidth={2.2} />
              ) : (
                <FlaskConical size={18} color={isDark ? '#22D3EE' : '#0891B2'} strokeWidth={2.2} />
              )}
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.3 }}>
                Additive Detective
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700' }}>
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
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: isCleanAdditives
                  ? (isDark ? '#34D399' : '#16A34A')
                  : (isDark ? '#22D3EE' : '#0891B2'),
                fontSize: 10,
                fontWeight: '900',
                letterSpacing: 0.5,
              }}
            >
              {isCleanAdditives ? 'CLEAN LABEL' : `${elevatedAdditives.length + moderateAdditives.length} FLAGGED`}
            </Text>
          </View>
        </View>

        {isCleanAdditives ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: innerBg,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(22, 163, 74, 0.14)',
            }}
          >
            <Sparkles size={16} color={isDark ? '#34D399' : '#16A34A'} />
            <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '700', flex: 1 }}>
              No high-risk emulsifiers, artificial preservatives, or synthetic azo dyes detected in this formulation.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {elevatedAdditives.length > 0 && (
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} color={isDark ? '#F87171' : '#DC2626'} />
                  <Text
                    style={{
                      color: isDark ? '#F87171' : '#DC2626',
                      fontSize: 10.5,
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                  >
                    High Risk Disruption Watchlist ({elevatedAdditives.length})
                  </Text>
                </View>

                <View style={{ gap: 6 }}>
                  {elevatedAdditives.map((item, idx) => {
                    const eCode = parseENumber(item.tag, item.displayName);
                    return (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(239,68,68,0.06)',
                          borderColor: isDark ? 'rgba(248,113,113,0.22)' : 'rgba(239,68,68,0.18)',
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <View
                            style={{
                              backgroundColor: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(239,68,68,0.12)',
                              paddingHorizontal: 7,
                              paddingVertical: 3,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(248,113,113,0.30)' : 'rgba(239,68,68,0.25)',
                            }}
                          >
                            <Text style={{ color: isDark ? '#F87171' : '#DC2626', fontSize: 10, fontWeight: '900' }}>
                              {eCode}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
                              {item.displayName}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>
                              {item.functionLabel || 'Food Additive'}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.10)',
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: isDark ? '#F87171' : '#DC2626', fontSize: 9, fontWeight: '900' }}>
                            HIGH RISK
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {moderateAdditives.length > 0 && (
              <View style={{ gap: 6, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} color={isDark ? '#FBBF24' : '#D97706'} />
                  <Text
                    style={{
                      color: isDark ? '#FBBF24' : '#D97706',
                      fontSize: 10.5,
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                  >
                    Moderate Caution ({moderateAdditives.length})
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {moderateAdditives.map((item, idx) => {
                    const eCode = parseENumber(item.tag, item.displayName);
                    return (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(245,158,11,0.06)',
                          borderColor: isDark ? 'rgba(251,191,36,0.22)' : 'rgba(245,158,11,0.18)',
                          borderWidth: 1,
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Text style={{ color: isDark ? '#FBBF24' : '#D97706', fontSize: 9.5, fontWeight: '900' }}>
                          [{eCode}]
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
                          {item.displayName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {lowAdditives.length > 0 && (
              <View style={{ gap: 6, marginTop: 4 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleShowAll}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Layers size={13} color={isDark ? '#34D399' : '#16A34A'} />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 10.5,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                    }}
                  >
                    Low Risk / Neutral ({lowAdditives.length}) {showAllAdditives ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showAllAdditives && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                    {lowAdditives.map((item, idx) => {
                      const eCode = parseENumber(item.tag, item.displayName);
                      return (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: innerBg,
                            borderColor: innerBorder,
                            borderWidth: 1,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Text style={{ color: isDark ? '#34D399' : '#16A34A', fontSize: 9, fontWeight: '800' }}>
                            [{eCode}]
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600' }}>
                            {item.displayName}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
