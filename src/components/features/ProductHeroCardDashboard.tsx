import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { OrbMascot as Mascot } from './OrbMascot';
import { useAppStore } from '../../stores/appStore';
import { formatWeight } from '../../utils/format';
import { formatSugar, getConsistentNutritionalMetrics } from '../../utils/sugar';

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
  const { sugarUnit } = useAppStore();

  const isUnknown =
    scanResult.sugarTeaspoons === undefined &&
    scanResult.sugarPer100g === undefined;

  const metrics = getConsistentNutritionalMetrics(scanResult);
  const servingSugarG = metrics.servingSugarG;
  const servingSugarTsp = metrics.servingTsp;
  const servingCalories = metrics.servingCalories;

  const currentTsp = servingSugarTsp ?? 0;
  const servingTsp = servingSugarTsp ?? 0;

  const displayLabel = 'SUGAR PER SERVING';
  const displaySubLabel = scanResult.servingSize
    ? `(${formatWeight(scanResult.servingSize, sugarUnit)})`
    : '';

  let cardBg: [string, string];
  let ledColor: string;
  let ledLabel: string;
  let ratingColor: string;
  let ratingDesc: string;


  if (isUnknown) {
    cardBg = isDark ? [colors.surface, colors.surface] : [colors.surface, colors.surface];
    ledColor = '#8E8E93';
    ledLabel = 'Unknown';
    ratingDesc = 'No sugar data available';
  } else if (currentTsp > 6) {
    cardBg = isDark ? [colors.surface, colors.surface] : [colors.surface, colors.surface];
    ledColor = '#FF3B30';
    ledLabel = 'High Sugar';
    ratingDesc = 'Exceeds daily recommendation';
  } else if (currentTsp > 3) {
    cardBg = isDark ? [colors.surface, colors.surface] : [colors.surface, colors.surface];
    ledColor = '#FF9500';
    ledLabel = 'Moderate';
    ratingDesc = 'Approach with caution';
  } else {
    cardBg = isDark ? [colors.surface, colors.surface] : [colors.surface, colors.surface];
    ledColor = '#34C759';
    ledLabel = 'Low Sugar';
    ratingDesc = 'Safe to consume';
  }

  ratingColor = isUnknown ? colors.textMuted : colors.primary;

  const cardContent = (
    <LinearGradient
      colors={cardBg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderColor: colors.border,
        borderWidth: 1.5,
        borderRadius: 30,
        padding: 22,
        width: (width as any) || '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 24,
        elevation: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Row: Product Image, Name, Brand */}
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', zIndex: 2 }}>
        <View
          style={{
            width: 86,
            height: 86,
            borderRadius: 18,
            backgroundColor: '#FFFFFF',
            padding: 6,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          }}
        >
          {scanResult.imageUrl ? (
            <Image
              source={{ uri: scanResult.imageUrl }}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <Mascot
              state={currentTsp > 6 ? 'shocked' : currentTsp > 3 ? 'dizzy' : 'happy'}
              size={56}
            />
          )}
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 99,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 10,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              numberOfLines={1}
            >
              {scanResult.brand || 'Generic Brand'}
            </Text>
          </View>
          <Text
            style={{ color: colors.text, fontSize: 18, fontWeight: '900', lineHeight: 23 }}
            numberOfLines={2}
          >
            {scanResult.name}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 1.5,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          marginVertical: 18,
          zIndex: 2,
        }}
      />

      {/* Body Section: The Teaspoon Display and Safety LED Indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text
              style={{ color: ratingColor, fontSize: 56, fontWeight: '900', letterSpacing: -1 }}
            >
              {isUnknown ? '--' : currentTsp.toFixed(1).replace(/\.0$/, '')}
            </Text>
            {!isUnknown && (
              <Text
                style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '800', marginLeft: 4 }}
              >
                tsp
              </Text>
            )}
          </View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {displayLabel}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}>
            {displaySubLabel}
          </Text>
        </View>

        {/* Safety LED Indicator Bulb */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }}
          >
            {/* Glowing LED Circle */}
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: ledColor,
                shadowColor: ledColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 4,
              }}
            />
            <Text
              style={{ color: colors.text, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}
            >
              {ledLabel}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'right' }}>
            {ratingDesc}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 1.5,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          marginVertical: 16,
          zIndex: 2,
        }}
      />

      {/* Serving Breakdown Card */}
      <View style={{ flexDirection: 'column', gap: 14, marginBottom: 20, zIndex: 2 }}>
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
            borderRadius: 24,
            padding: 16,
            borderWidth: 1.2,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.15 : 0.03,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          {/* Top Header Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 1.0,
                }}
              >
                Serving Details
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.primary + '15',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: colors.primary + '25',
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>
                {formatWeight(scanResult.servingSize, sugarUnit) || '100g Standard'}
              </Text>
            </View>
          </View>

          {/* Metrics Columns with Vertical Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
            {/* Left Column: Sugar Content */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                Sugar Content
              </Text>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
                {formatSugar(servingSugarG ?? 0, sugarUnit)}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 2 }}>
                ({servingSugarTsp.toFixed(1).replace(/\.0$/, '')} tsp)
              </Text>
            </View>

            {/* Vertical Divider */}
            <View
              style={{
                width: 1,
                height: 48,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                marginHorizontal: 12,
              }}
            />

            {/* Right Column: Energy */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                Energy
              </Text>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
                {servingCalories !== undefined ? Math.round(servingCalories) : '—'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                kcal
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Measuring Progress Bar (WHO Guidelines - Per Serving Method) */}
      <View style={{ gap: 8, zIndex: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 11,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            WHO Daily Limit (Per Serving)
          </Text>
          <Text style={{ color: ratingColor, fontSize: 12, fontWeight: '900' }}>
            {isUnknown
              ? '0%'
              : `${scanResult.whoLimitServingPercent ?? Math.round((servingTsp / 12) * 100)}%`}
          </Text>
        </View>

        {/* Progress Bar Track */}
        <View
          style={{
            height: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            borderRadius: 5,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Active Fill */}
          <View
            style={{
              width: isUnknown
                ? '0%'
                : `${Math.min(
                  100,
                  scanResult.whoLimitServingPercent ?? Math.round((servingTsp / 12) * 100)
                )}%`,
              height: '100%',
              backgroundColor: ledColor,
              borderRadius: 5,
            }}
          />
        </View>

        {/* Gauge labels below progress bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>0 tsp</Text>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>6 tsp (safe limit)</Text>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>12 tsp (max limit)</Text>
        </View>
      </View>

      {/* Watermark & Optional Action Buttons for History Cards */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 18,
          paddingTop: 12,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          zIndex: 2,
        }}
      >
        <View>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
            CUT SUGAR APP
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}>
            Scan & Discover Hidden Sugars
          </Text>
        </View>

        {showActions && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
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
                    ? `${colors.primary}25`
                    : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isSaved ? colors.primary : colors.border,
                  borderWidth: isSaved ? 1.5 : 1,
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
                  size={15}
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
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255, 59, 48, 0.1)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255, 59, 48, 0.2)',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Trash2 size={15} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
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
