import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Bookmark, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { OrbMascot as Mascot } from './OrbMascot';
import { useAppStore } from '../../stores/appStore';
import { getNovaColor, getNovaShortLabel, getBiteFixScoreColor } from '../../utils/format';
import { AdditiveDetail } from '../../types/app.types';

export interface ProductHeroCardDashboardProps {
  scanResult: {
    id?: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    sugarTeaspoons?: number;
    calories?: number;
    sugarPer100g?: number;
    sugarGrams?: number;
    servingSize?: string;
    whoLimitServingPercent?: number;
    isDefaultServing?: boolean;
    analysis?: {
      summary?: string;
    };
    [key: string]: any;
  };
  colors: any;
  isDark: boolean;
  width?: number | string;
  showActions?: boolean;
  isSaved?: boolean;
  onSave?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}

export default function ProductHeroCardDashboard({
  scanResult,
  colors,
  isDark,
  width,
  showActions = false,
  isSaved = false,
  onSave,
  onDelete,
  onPress,
}: ProductHeroCardDashboardProps) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [scanResult.imageUrl]);

  const isUnknown =
    scanResult.sugarTeaspoons === undefined &&
    scanResult.sugarPer100g === undefined;

  const biteFixScore = scanResult.biteFixScore ?? 50;
  const novaClass = scanResult.novaClass;
  const additiveCount = scanResult.additiveCount ?? 0;
  const additives: AdditiveDetail[] = scanResult.additives ?? [];

  let ledColor: string;
  let ledLabel: string;
  let ratingDesc: string;

  if (isUnknown && scanResult.biteFixScore === undefined) {
    ledColor = '#8E8E93';
    ledLabel = 'Unknown';
    ratingDesc = 'No processing data available';
  } else if (biteFixScore >= 76) {
    ledColor = '#22C55E';
    ledLabel = 'Clean Choice';
    ratingDesc = 'Minimal processing & whole ingredients';
  } else if (biteFixScore >= 51) {
    ledColor = '#3BB5A0';
    ledLabel = 'Moderate';
    ratingDesc = 'Approach with awareness';
  } else if (biteFixScore >= 26) {
    ledColor = '#F5A623';
    ledLabel = 'Processed';
    ratingDesc = 'Contains industrial refinement';
  } else {
    ledColor = '#EF4444';
    ledLabel = 'Highly Refined';
    ratingDesc = 'Ultra-processed formulation';
  }

  const ratingColor = (isUnknown && scanResult.biteFixScore === undefined)
    ? colors.textMuted
    : getBiteFixScoreColor(biteFixScore);

  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const bentoBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

  const cardContent = (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: borderDivider,
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        width: (width as any) || '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.35 : 0.04,
        shadowRadius: 18,
        elevation: 5,
        overflow: 'hidden',
      }}
    >
      {/* ── Header: Identity Panel ── */}
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 16,
            backgroundColor: isDark ? '#1C1C1E' : '#F9F9FB',
            padding: 4,
            borderWidth: 1,
            borderColor: borderDivider,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            {scanResult.imageUrl && !imageError ? (
            <Image
              source={{ uri: scanResult.imageUrl }}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              contentFit="contain"
              transition={150}
              onError={() => setImageError(true)}
            />
          ) : (
            <Mascot
              state={biteFixScore >= 76 ? 'happy' : biteFixScore >= 41 ? 'idle' : 'shocked'}
              size={40}
            />
          )}
        </View>
 
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', width: '100%' }}>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 99,
                maxWidth: '65%',
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {scanResult.brand || 'Generic Brand'}
              </Text>
            </View>
            {novaClass && (
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: getNovaColor(novaClass) + '15',
                  borderColor: getNovaColor(novaClass) + '30',
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 99,
                }}
              >
                <Text style={{ color: getNovaColor(novaClass), fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                  NOVA {novaClass}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{ color: colors.text, fontSize: 18, fontWeight: '900', lineHeight: 22, letterSpacing: -0.3 }}
            numberOfLines={2}
          >
            {scanResult.name}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: borderDivider, marginVertical: 18 }} />

      {/* ── BiteFix Telemetry Gauge ── */}
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ color: ratingColor, fontSize: 44, fontWeight: '900', letterSpacing: -1.5 }}>
              {biteFixScore}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '800', marginLeft: 2 }}>
              /100
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: ledColor + '15',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: ledColor + '30',
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: ledColor,
                }}
              />
              <Text
                style={{ color: colors.text, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {ledLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar Track */}
        <View
          style={{
            height: 6,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <View
            style={{
              width: `${Math.min(100, Math.max(0, biteFixScore))}%`,
              height: '100%',
              backgroundColor: ratingColor,
              borderRadius: 3,
            }}
          />
          {/* Halfway indicator mark (50 points) */}
          <View
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
            }}
          />
        </View>

        {/* Gauge Ticks */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>0 Refined</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>50 Moderate</Text>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>100 Pure</Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: borderDivider, marginVertical: 18 }} />

      {(() => {
        const hasAdditives = additives.length > 0;
        const elevatedAdditives = additives.filter(a => a.riskLevel === 'elevated');
        const isAlert = elevatedAdditives.length > 0;

        if (!hasAdditives) {
          return (
            <View
              style={{
                backgroundColor: bentoBg,
                borderColor: borderDivider,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#22C55E',
                    shadowColor: '#22C55E',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  NO ADDITIVES
                </Text>
              </View>
            </View>
          );
        }

        return (
          <View
            style={{
              backgroundColor: bentoBg,
              borderColor: borderDivider,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                ADDITIVES
              </Text>
              <Text style={{ color: isAlert ? '#EF4444' : '#F5A623', fontSize: 11, fontWeight: '800' }}>
                {additives.length} Found
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {additives.map((item, idx) => {
                const ledColor = item.riskLevel === 'elevated' ? '#EF4444' : item.riskLevel === 'moderate' ? '#F5A623' : '#22C55E';
                return (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: ledColor,
                        shadowColor: ledColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 4,
                      }}
                    />
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                      {item.displayName}{' '}
                      <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 12 }}>
                        ({item.functionLabel})
                      </Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })()}

      {/* ── Action Bar ── */}
      {showActions && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: 18,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: borderDivider,
            gap: 8,
          }}
        >
          {onSave && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSave();
              }}
              disabled={isSaved}
              style={{
                backgroundColor: isSaved
                  ? `${colors.primary}20`
                  : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                borderColor: isSaved ? colors.primary : borderDivider,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
              activeOpacity={0.8}
            >
              <Bookmark
                size={14}
                color={colors.primary}
                fill={isSaved ? colors.primary : 'transparent'}
              />
              <Text
                style={{
                  color: isSaved ? colors.primary : colors.text,
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete();
              }}
              style={{
                backgroundColor: isDark ? 'rgba(255,59,48,0.12)' : 'rgba(255,59,48,0.08)',
                borderColor: 'rgba(255,59,48,0.2)',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
              activeOpacity={0.8}
            >
              <Trash2 size={14} color="#FF3B30" />
              <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: '800' }}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}
