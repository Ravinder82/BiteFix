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
  TouchableWithoutFeedback
} from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/appStore';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getIapService, getLoadedIapService } from '../services/iapLoader';
import { PRODUCT_IDS, type IAPProduct, type PlanTier } from '../services/iapProducts';

const FALLBACK_PRICES: Record<PlanTier, { displayPrice: string; subtitle: string }> = {
  monthly: { displayPrice: '$5.99', subtitle: 'Billed monthly · Cancel Anytime' },
  annual: { displayPrice: '$17.99', subtitle: '$1.50 / month · Billed yearly · Cancel Anytime' },
};

export interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
}

export function SubscriptionModal({ visible, onClose, showCloseButton = true }: SubscriptionModalProps) {
  const { colors } = useTheme();
  const { isPremium, freeScansUsed } = useAppStore();

  const remainingFreeScans = Math.max(0, 5 - (freeScansUsed || 0));
  const hasFreeScansAvailable = !isPremium && remainingFreeScans > 0;

  // ── Component State ─────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('annual');
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const mountedRef = useRef(true);

  // ── Helpers ─────────────────────────────────────────────
  const getProduct = (tier: PlanTier): IAPProduct | undefined =>
    products.find(p => p.productId === PRODUCT_IDS[tier === 'monthly' ? 'MONTHLY' : 'ANNUAL']);

  const getDisplayPrice = (tier: PlanTier): string =>
    getProduct(tier)?.displayPrice ?? FALLBACK_PRICES[tier].displayPrice;

  const getSubtitle = (tier: PlanTier): string =>
    FALLBACK_PRICES[tier].subtitle;

  // ── Lifecycle ────────────────────────────────────────────
  const initialise = useCallback(async () => {
    if (!mountedRef.current) return;
    if (mountedRef.current) {
      setIsFetchingProducts(true);
    }
    try {
      const service = await getIapService();
      if (!service) return;

      await service.connect();
      const fetched = await service.fetchSubscriptions();
      
      if (mountedRef.current) {
        setProducts(fetched);
      }
    } catch (error) {
      console.error('[SubscriptionModal] Failed to initialize IAP:', error);
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
        Alert.alert(
          '✨ Premium Unlocked!',
          'Welcome to BiteFix Premium. You now have full access to Gut Shield, Smart Swaps, and all premium features.',
          [{ text: 'Start Scanning', onPress: () => {
            onClose();
            router.replace('/(tabs)');
          } }],
        );
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
        Alert.alert(
          'Purchase Restored ✅',
          'Your BiteFix Premium subscription has been restored.',
          [{ text: 'Continue', onPress: () => {
            onClose();
            router.replace('/(tabs)');
          } }],
        );
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
            {isFetchingProducts && (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

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
              badge="75% DISCOUNT"
              isSelected={selectedPlan === 'annual'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPlan('annual');
              }}
              colors={colors}
            />
          </View>

          {/* Subscribe CTA */}
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isProcessing}
            activeOpacity={0.88}
            style={{
              backgroundColor: isProcessing ? colors.text + 'AA' : colors.text,
              borderRadius: 24,
              paddingVertical: 18,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {isProcessing
              ? <ActivityIndicator color={colors.background} size="small" />
              : <Text style={{ color: colors.background, fontSize: 16, fontWeight: '800' }}>
                Subscribe
              </Text>
            }
          </TouchableOpacity>

          {/* Legal Links */}
          <View style={{ marginTop: 24, gap: 10 }}>
            <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 14 }}>
              Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 }}>
              <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' }}>Restore Purchases</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenTermsOfUse}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' }}>Terms</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenPrivacyPolicy}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' }}>Privacy</Text>
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
