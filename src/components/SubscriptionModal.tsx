import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/appStore';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getIapService, getLoadedIapService } from '../services/iapLoader';
import { PRODUCT_IDS, type IAPProduct, type PlanTier } from '../services/iapProducts';

export interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
}

export function SubscriptionModal({ visible, onClose, showCloseButton = true }: SubscriptionModalProps) {
  const { colors, isDark } = useTheme();
  const { isPremium, freeScansUsed } = useAppStore();

  const remainingFreeScans = Math.max(0, 5 - (freeScansUsed || 0));
  const hasFreeScansAvailable = !isPremium && remainingFreeScans > 0;

  const { width: screenWidth } = useWindowDimensions();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  // ── Component State ─────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('annual');
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [fetchPricesFailed, setFetchPricesFailed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mountedRef = useRef(true);

  // ── Helpers ─────────────────────────────────────────────
  const getProduct = (tier: PlanTier): IAPProduct | undefined =>
    products.find(p => p.productId === PRODUCT_IDS[tier === 'monthly' ? 'MONTHLY' : 'ANNUAL']);

  // Show live price from RevenueCat. While loading show 'Loading...'.
  // Never show hardcoded prices — prices differ by country (India vs international).
  const getDisplayPrice = (tier: PlanTier): string => {
    if (isFetchingProducts) return 'Loading...';
    return getProduct(tier)?.displayPrice ?? '—';
  };

  const getSubtitle = (tier: PlanTier): string =>
    tier === 'monthly'
      ? 'Billed monthly · Cancel Anytime'
      : 'Billed yearly · Cancel Anytime';

  // ── Lifecycle ────────────────────────────────────────────
  const initialise = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetchingProducts(true);
    setFetchPricesFailed(false);
    try {
      const service = await getIapService();
      if (!service) {
        if (mountedRef.current) setFetchPricesFailed(true);
        return;
      }

      const fetched = await service.fetchSubscriptions();

      if (mountedRef.current) {
        setProducts(fetched);
        // If RevenueCat timed out / returned nothing, mark as failed so user can retry
        if (fetched.length === 0) setFetchPricesFailed(true);
      }
    } catch (error) {
      console.error('[SubscriptionModal] Failed to initialize IAP:', error);
      if (mountedRef.current) setFetchPricesFailed(true);
    } finally {
      if (mountedRef.current) {
        setIsFetchingProducts(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (visible) {
      initialise();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialise, visible]);

  useEffect(() => {
    if (isPremium && visible) {
      onClose();
    }
  }, [isPremium, visible, onClose]);

  // ── Handlers ─────────────────────────────────────────────
  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    try {
      const service = await getIapService();
      if (!service) {
        Alert.alert('Store Unavailable', 'Unable to load the App Store purchase system. Please restart the app and try again.');
        return;
      }

      const result = await service.purchasePlan(selectedPlan);
      if (!mountedRef.current) return;

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        useAppStore.getState().setPremium(true);
        onClose();
        router.replace('/(tabs)');
      } else if (!result.userCancelled) {
        Alert.alert('Purchase Unsuccessful', result.error ?? 'Something went wrong. Please try again.', [{ text: 'OK' }]);
      }
    } catch (unexpectedErr: any) {
      if (!mountedRef.current) return;
      Alert.alert('Purchase Error', unexpectedErr?.message ?? 'An unexpected error occurred.');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    try {
      const service = await getIapService();
      if (!service) {
        Alert.alert('Store Unavailable', 'Unable to load the App Store purchase system. Please restart the app and try again.');
        return;
      }

      const result = await service.restorePurchases();
      if (!mountedRef.current) return;

      if (result.isEntitled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        useAppStore.getState().setPremium(true);
        onClose();
        router.replace('/(tabs)');
      } else if (result.success) {
        Alert.alert('No Subscription Found', 'No active subscription was found for your Apple ID. If you believe this is an error, contact support.');
      } else {
        Alert.alert('Restore Failed', result.error ?? 'Could not restore purchases. Please try again.');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      Alert.alert('Restore Error', err?.message ?? 'Failed to restore purchases.');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL('https://ravinder82.github.io/BiteFix/privacy.html');
    } catch (e) {
      Alert.alert('Privacy Policy', 'Privacy Policy is available at: https://ravinder82.github.io/BiteFix/privacy.html');
    }
  };

  const handleOpenTermsOfUse = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL('https://ravinder82.github.io/BiteFix/eula.html');
    } catch (e) {
      Alert.alert('Terms of Use', 'EULA is available at: https://ravinder82.github.io/BiteFix/eula.html');
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              maxHeight: '90%',
            }}>
              {/* Grab Handle */}
              <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 20 }} />

              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 }}>
                    Unlock Unlimited Scanning
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '500' }}>
                    {hasFreeScansAvailable
                      ? 'Get full access to all premium features without any limits.'
                      : "That was your last free scan. Keep the streak going with unlimited scanning."}
                  </Text>
                </View>
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={{ padding: 8, backgroundColor: colors.surfaceRaised, borderRadius: 20 }}
                  >
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Plan Selection */}
              <View style={{ gap: 12, marginBottom: 24 }}>
                {isFetchingProducts ? (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 10 }}>
                      Loading prices from App Store...
                    </Text>
                  </View>
                ) : fetchPricesFailed ? (
                  // ─ Price fetch failed: show retry banner ─
                  <View style={{
                    backgroundColor: colors.surfaceRaised,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 18,
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                      Could not load prices from the App Store.{`\n`}Check your internet connection and try again.
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        initialise();
                      }}
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: 20,
                        paddingVertical: 10,
                        paddingHorizontal: 28,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // ─ Prices loaded: show plan cards ─
                  <>
                    <PlanCard
                      tier="monthly"
                      title="Monthly Pass"
                      displayPrice={getDisplayPrice('monthly')}
                      subtitle={getSubtitle('monthly')}
                      badge={null}
                      isSelected={selectedPlan === 'monthly'}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPlan('monthly');
                      }}
                      colors={colors}
                    />
                    <PlanCard
                      tier="annual"
                      title="Yearly Pass"
                      displayPrice={getDisplayPrice('annual')}
                      subtitle={getSubtitle('annual')}
                      badge={null}
                      isSelected={selectedPlan === 'annual'}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPlan('annual');
                      }}
                      colors={colors}
                    />
                  </>
                )}
              </View>

              {/* Subscribe CTA */}
              <TouchableOpacity
                onPress={handleSubscribe}
                disabled={isProcessing || isFetchingProducts || fetchPricesFailed}
                activeOpacity={0.88}
                style={{
                  borderRadius: 24,
                  minHeight: 56,
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  borderWidth: 1.5,
                  borderColor: (isProcessing || isFetchingProducts || fetchPricesFailed) ? 'transparent' : 'rgba(20, 174, 151, 0.38)',
                  shadowColor: (isProcessing || isFetchingProducts || fetchPricesFailed) ? 'transparent' : (isDark ? '#000000' : '#0A2B14'),
                  shadowOffset: { width: 0, height: (isProcessing || isFetchingProducts || fetchPricesFailed) ? 2 : 8 },
                  shadowOpacity: (isProcessing || isFetchingProducts || fetchPricesFailed) ? 0.05 : 0.35,
                  shadowRadius: (isProcessing || isFetchingProducts || fetchPricesFailed) ? 6 : 16,
                  elevation: (isProcessing || isFetchingProducts || fetchPricesFailed) ? 1 : 6,
                }}
              >
                <LinearGradient
                  colors={(isProcessing || isFetchingProducts || fetchPricesFailed)
                    ? [colors.text + '55', colors.text + '55']
                    : (isDark ? ['#157d53ff', '#062618ff'] : ['#1ed988ff', '#000000ff'])}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                  }}
                >
                  {!(isProcessing || isFetchingProducts || fetchPricesFailed) && (
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 190,
                        transform: [
                          {
                            translateX: shimmerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-190, screenWidth + 60],
                            }),
                          },
                          { skewX: '-22deg' },
                        ],
                      }}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.08)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Animated.View>
                  )}
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                      Subscribe
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Trust microcopy — renewal reminder reassurance */}
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginTop: 12,
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '600', letterSpacing: 0.1 }}>
                  We will remind you 2 days before your renewal
                </Text>
              </View>

              {/* Legal Links */}
              <View style={{ marginTop: 24, gap: 10 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 14 }}>
                  Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period.
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 }}>
                  <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', borderBottomWidth: 1, paddingBottom: 1 }}>Restore Purchases</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOpenTermsOfUse}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', borderBottomWidth: 1, paddingBottom: 1 }}>Terms</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOpenPrivacyPolicy}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', borderBottomWidth: 1, paddingBottom: 1 }}>Privacy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Plan Card sub-component ───────────────────────────────
interface PlanCardProps {
  tier: PlanTier;
  title: string;
  displayPrice: string;
  subtitle: string;
  badge: string | null;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}

function PlanCard({ title, displayPrice, subtitle, badge, isSelected, onPress, colors }: PlanCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: isSelected ? colors.success + '0A' : colors.surfaceRaised,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: isSelected ? colors.success : colors.border,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isSelected && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.success, opacity: 0.05 }]} />}

      {/* Discount badge */}
      {badge && (
        <View style={{
          position: 'absolute',
          top: 0,
          right: 14,
          backgroundColor: colors.success,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}>
          <Text style={{ color: '#FFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 }}>
            {badge}
          </Text>
        </View>
      )}

      {/* Left: radio + label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 20, height: 20, borderRadius: 10,
          borderWidth: 2,
          borderColor: isSelected ? colors.success : colors.textMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />}
        </View>

        <View style={{ marginTop: badge ? 6 : 0 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 1 }}>{subtitle}</Text>
        </View>
      </View>

      {/* Right: price */}
      <View style={{ alignItems: 'flex-end', marginTop: badge ? 8 : 0 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{displayPrice}</Text>
      </View>
    </TouchableOpacity>
  );
}
