import React from 'react';
import { View, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { Text } from '../Text';
import { Image } from 'expo-image';
import { Bookmark, Trash2, Droplets, AlertOctagon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { OrbMascot as Mascot } from './OrbMascot';
import { useAppStore } from '../../stores/appStore';
import { getNovaColor, getNovaShortLabel, getBiteFixScoreColor } from '../../utils/format';
import { AdditiveDetail } from '../../types/app.types';
import { NutriScoreTrafficLight } from './NutriScoreTrafficLight';
import { ProductDataSourcePill, ProductDataStatusPill } from './ProductDataPills';
import Svg, { Circle, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import AnimatedReanimated, {
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedProps,
  useAnimatedStyle,
  Easing,
  withDelay,
} from 'react-native-reanimated';

const AnimatedCircle = AnimatedReanimated.createAnimatedComponent(Circle);

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
    productDataStatus?: 'complete' | 'partial';
    productDataSources?: ('open_food_facts' | 'usda_fooddata_central')[];
    analysis?: {
      summary?: string;
    };
    [key: string]: any;
  };
  alerts?: { id: string; type: 'allergen' | 'oil'; name: string }[];
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
  alerts,
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
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const shimmerAnim = React.useRef(new RNAnimated.Value(0.3)).current;

  React.useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [scanResult.imageUrl]);

  const progressVal = useSharedValue(0);
  const mascotScale = useSharedValue(0.1);

  React.useEffect(() => {
    // Delay slightly to let the card slide up first, then animate
    const targetScore = scanResult.biteFixScore !== undefined ? scanResult.biteFixScore : 0;
    progressVal.value = withDelay(
      300,
      withTiming(Math.max(5, targetScore), { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
    mascotScale.value = withDelay(
      500,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  }, [scanResult.biteFixScore]);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: 301.6 * (1 - progressVal.value / 100),
    };
  });

  const mascotAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: mascotScale.value }],
    };
  });

  // Shimmer pulse animation (like Instagram/social media skeleton loading)
  React.useEffect(() => {
    if (!imageLoaded && scanResult.imageUrl && !imageError) {
      const loop = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(shimmerAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
          RNAnimated.timing(shimmerAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [imageLoaded, imageError, scanResult.imageUrl]);

  const isUnknown =
    scanResult.sugarTeaspoons === undefined &&
    scanResult.sugarPer100g === undefined;

  const biteFixScore = scanResult.biteFixScore ?? 50;
  const novaClass = scanResult.novaClass;
  const additiveCount = scanResult.additiveCount ?? 0;
  const nutriScore = scanResult.nutriScore;
  
  // LED label — purely score-driven, independent of NOVA class
  let ledColor: string;
  let ledLabel: string;
  let ratingDesc: string;

  if (isUnknown && scanResult.biteFixScore === undefined) {
    ledColor = '#8E8E93';
    ledLabel = 'Unknown';
    ratingDesc = 'No product data available';
  } else if (biteFixScore >= 85) {
    ledColor = '#22C55E';
    ledLabel = 'Strong Profile';
    ratingDesc = 'Strong nutrition, sugar, and ingredient signals';
  } else if (biteFixScore >= 70) {
    ledColor = '#3BB5A0';
    ledLabel = 'Good Profile';
    ratingDesc = 'Generally favorable product signals';
  } else if (biteFixScore >= 55) {
    ledColor = '#F5A623';
    ledLabel = 'Mixed Profile';
    ratingDesc = 'Mixed signals across product categories';
  } else if (biteFixScore >= 40) {
    ledColor = '#E07B39';
    ledLabel = 'Review Profile';
    ratingDesc = 'Some signals warrant closer review';
  } else {
    ledColor = '#EF4444';
    ledLabel = 'Lower Profile';
    ratingDesc = 'Lower signals across most product categories';
  }

  const ratingColor = (isUnknown && scanResult.biteFixScore === undefined)
    ? colors.textMuted
    : getBiteFixScoreColor(biteFixScore);

  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const bentoBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

  const cardContent = (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(5, 10, 6, 0.96)' : '#FFFFFF',
        borderColor: isDark ? `${ratingColor}28` : `${ratingColor}18`,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        width: (width as any) || '100%',
        shadowColor: ratingColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.22 : 0.06,
        shadowRadius: 20,
        elevation: 6,
        overflow: 'hidden',
      }}
    >
      {/* ── Status & Source Pills Row ── */}
      {(scanResult.productDataStatus || (scanResult.productDataSources && scanResult.productDataSources.length > 0)) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, width: '100%' }}>
          <ProductDataStatusPill
            status={scanResult.productDataStatus}
            colors={colors}
            isDark={isDark}
          />
          <ProductDataSourcePill
            sources={scanResult.productDataSources}
            colors={colors}
            isDark={isDark}
          />
        </View>
      )}

      {/* ── Header: Identity Panel ── */}
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start', width: '100%' }}>
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
            <View style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Shimmer skeleton placeholder — visible until image loads */}
              {!imageLoaded && (
                <RNAnimated.View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#2C2C2E' : '#E8E8ED',
                    opacity: shimmerAnim,
                    zIndex: 1,
                  }}
                />
              )}
              <Image
                source={{ uri: scanResult.imageUrl }}
                style={{ width: '100%', height: '100%', borderRadius: 12, opacity: imageLoaded ? 1 : 0 }}
                contentFit="contain"
                transition={300}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </View>
          ) : (
            <Mascot
              state={biteFixScore >= 70 ? 'happy' : biteFixScore >= 40 ? 'idle' : 'shocked'}
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
                flexShrink: 1,
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
            {scanResult.isOrganic && (
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(0, 194, 136, 0.15)',
                  borderColor: 'rgba(0, 194, 136, 0.3)',
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 99,
                }}
              >
                <Text style={{ color: '#00C288', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                  ORGANIC
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{ color: colors.text, fontSize: 18, fontWeight: '900', lineHeight: 22, letterSpacing: -0.3, marginTop: 4 }}
            numberOfLines={3}
          >
            {scanResult.name}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: borderDivider, marginVertical: 18 }} />

      {/* Mascot Ring above Nutri-Score in place of score bar */}
      {(() => {
        const lighterScoreColor = biteFixScore >= 85
          ? '#4ADE80'
          : biteFixScore >= 70
            ? '#2DD4BF'
            : biteFixScore >= 55
              ? '#FBBF24'
              : '#F87171';

        const mascotState = biteFixScore >= 70
          ? 'happy'
          : biteFixScore >= 40
            ? 'idle'
            : 'shocked';

        return (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            {/* Centered Mascot Ring */}
            <View style={{ width: 180, height: 180, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Svg width={180} height={180} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                <Defs>
                  <RadialGradient id="ringGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor={ratingColor} stopOpacity="0.4" />
                    <Stop offset="70%" stopColor={ratingColor} stopOpacity="0.1" />
                    <Stop offset="100%" stopColor={ratingColor} stopOpacity="0" />
                  </RadialGradient>
                  <SvgLinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={ratingColor} />
                    <Stop offset="100%" stopColor={lighterScoreColor} />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="60" cy="60" r="54" fill="url(#ringGlow)" />
                <Circle cx="60" cy="60" r="48" fill="none" stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'} strokeWidth="12" />
                <Circle cx="60" cy="60" r="56" fill="none" stroke={ratingColor} strokeWidth="1.5" opacity="0.25" />
                <Circle cx="60" cy="60" r="40" fill="none" stroke={ratingColor} strokeWidth="1.5" opacity="0.15" />
                <AnimatedCircle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="301.6"
                  animatedProps={animatedCircleProps}
                  transform="rotate(-90 60 60)"
                />
              </Svg>

              <AnimatedReanimated.View style={[{ marginTop: 20 }, mascotAnimatedStyle]}>
                <Mascot state={mascotState} size={96} />
              </AnimatedReanimated.View>

              <View style={{
                position: 'absolute',
                bottom: -18,
                width: 230,
                left: '50%',
                marginLeft: -115,
                backgroundColor: isDark ? 'rgba(31, 41, 55, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                borderWidth: 1.5,
                borderRadius: 14,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
                zIndex: 10,
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ratingColor, flexShrink: 0 }} />
                <Text 
                  style={{ color: colors.text, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4, flexShrink: 0 }}
                  numberOfLines={1}
                >
                  BITEFIX INTELLIGENCE SCORE™: {biteFixScore}
                </Text>
              </View>
            </View>

            {/* Horizontal NOVA Score Component below Mascot */}
            {novaClass ? (
              <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(248, 250, 248, 0.95)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginTop: 18,
                marginBottom: 10,
                width: '100%',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <View style={{
                    backgroundColor: getNovaColor(novaClass) + '20',
                    borderColor: getNovaColor(novaClass) + '40',
                    borderWidth: 1,
                    paddingHorizontal: 7,
                    paddingVertical: 2.5,
                    borderRadius: 6,
                  }}>
                    <Text style={{ color: getNovaColor(novaClass), fontSize: 9.5, fontWeight: '900', letterSpacing: 0.3 }}>
                      NOVA {novaClass}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', flexShrink: 1 }} numberOfLines={2}>
                    {getNovaShortLabel(novaClass)}
                  </Text>
                </View>

                {/* 4 Horizontal Capsule Street Lights */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {[1, 2, 3, 4].map((level) => {
                    const isActive = novaClass === level;
                    const isPast = novaClass >= level;
                    const levelColor = level === 4 ? '#EF4444' : level === 3 ? '#F59E0B' : level === 2 ? '#3BB5A0' : '#22C55E';
                    return (
                      <View
                        key={level}
                        style={{
                          width: 20,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: isPast ? levelColor : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                          opacity: isActive ? 1 : isPast ? 0.6 : 0.25,
                          borderWidth: isActive ? 1 : 0,
                          borderColor: '#FFFFFF',
                          shadowColor: isActive ? levelColor : 'transparent',
                          shadowRadius: 4,
                          shadowOpacity: 0.5,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        );
      })()}

      {/* ── Allergen Shield & Oil Watchlist — compact status mini-cards ── */}
      {alerts && alerts.length > 0 && (() => {
        const allergenHits = alerts.filter((a) => a.type === 'allergen');
        const oilHits = alerts.filter((a) => a.type === 'oil');
        const groups = [
          { key: 'allergen', title: 'Allergen Shield', items: allergenHits, color: '#EF4444', Icon: AlertOctagon, tag: 'ON ALERT' },
          { key: 'oil', title: 'Oil Watchlist', items: oilHits, color: '#F59E0B', Icon: Droplets, tag: 'DETECTED' },
        ].filter((g) => g.items.length > 0);
        if (groups.length === 0) return null;

        return (
          <View style={{ marginBottom: 16, gap: 8 }}>
            {groups.map(({ key, title, items, color, Icon, tag }) => (
              <View
                key={key}
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark ? `${color}35` : `${color}28`,
                  borderWidth: 1.2,
                  borderRadius: 18,
                  overflow: 'hidden',
                  shadowColor: color,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.22 : 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* LED status strip */}
                <View style={{ height: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(100, items.length * 34)}%`,
                      backgroundColor: color,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.9,
                      shadowRadius: 4,
                    }}
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 13, gap: 10 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      backgroundColor: `${color}18`,
                      borderWidth: 1,
                      borderColor: `${color}30`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={17} color={color} strokeWidth={2.4} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '900', letterSpacing: -0.2 }}>
                      {title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 1 }} numberOfLines={2}>
                      Listed: {items.map((a) => a.name).join(' · ')}
                    </Text>
                  </View>

                  {/* LED tag */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: `${color}15`,
                      borderColor: `${color}35`,
                      borderWidth: 1,
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 9,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: color,
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 1,
                        shadowRadius: 3,
                      }}
                    />
                    <Text style={{ color: color, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 }}>
                      {tag}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      })()}

      {/* ── EU Nutri-Score Traffic Light ── */}
      {nutriScore ? (
        <NutriScoreTrafficLight grade={nutriScore} isDark={isDark} colors={colors} />
      ) : null}


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
