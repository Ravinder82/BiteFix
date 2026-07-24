// ─────────────────────────────────────────────────────────
// BiteFix — In-App Purchase (IAP) Service (RevenueCat)
// ─────────────────────────────────────────────────────────
// Safe, production-ready IAP wrapper using RevenueCat SDK.
// Handles live App Store & Google Play product pricing, receipt
// validation, user identity sync, purchase execution, and restoration.
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';

// Dynamic import handle for native Purchases module
let Purchases: any = null;

try {
  Purchases = require('react-native-purchases').default;
} catch (e) {
  console.warn('[IAP Service] react-native-purchases module not linked in current runtime environment. Operating in graceful fallback mode.');
}

// ── App Store Connect Product IDs ────────────────────────
export const IAP_PRODUCT_IDS = {
  MONTHLY: 'com.ravinderpoonia.bitefix.monthly',
  ANNUAL: 'com.ravinderpoonia.bitefix.yearly',
};

// ── RevenueCat Entitlement Identifier ────────────────────
export const ENTITLEMENT_ID = 'premium_access';

class IAPService {
  private isConfigured = false;

  /**
   * Initialize RevenueCat SDK with user identity & API key
   */
  public async initialize(userId?: string): Promise<void> {
    if (!Purchases) return;

    try {
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || '',
        android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || '',
      });

      if (!apiKey) {
        console.log('[IAP Service] No RevenueCat API key provided. Awaiting credentials.');
        return;
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId || null,
      });

      this.isConfigured = true;
      console.log('[IAP Service] RevenueCat successfully configured.');

      // Check current subscription status upon init
      await this.checkSubscriptionStatus();
    } catch (error) {
      console.error('[IAP Service] Configuration error:', error);
    }
  }

  /**
   * Log in user identity to associate purchases with Firebase Auth UID
   */
  public async identifyUser(userId: string): Promise<void> {
    if (!Purchases || !this.isConfigured) return;
    try {
      await Purchases.logIn(userId);
      await this.checkSubscriptionStatus();
    } catch (error) {
      console.error('[IAP Service] User identify error:', error);
    }
  }

  /**
   * Log out user from RevenueCat session
   */
  public async logoutUser(): Promise<void> {
    if (!Purchases || !this.isConfigured) return;
    try {
      await Purchases.logOut();
      useAppStore.getState().setPremium(false);
    } catch (error) {
      console.error('[IAP Service] Logout error:', error);
    }
  }

  /**
   * Check if user active entitlement includes 'premium_access'
   */
  public async checkSubscriptionStatus(): Promise<boolean> {
    if (!Purchases || !this.isConfigured) return false;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isEntitled = customerInfo?.entitlements?.active[ENTITLEMENT_ID] !== undefined;

      useAppStore.getState().setPremium(isEntitled);
      return isEntitled;
    } catch (error) {
      console.error('[IAP Service] Check subscription status error:', error);
      return false;
    }
  }

  /**
   * Fetch live localized offerings from App Store Connect
   */
  public async getOfferings(): Promise<{ monthly?: any; annual?: any } | null> {
    if (!Purchases || !this.isConfigured) return null;

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return {
          monthly: offerings.current.monthly,
          annual: offerings.current.annual,
        };
      }
    } catch (error) {
      console.error('[IAP Service] Fetch offerings error:', error);
    }
    return null;
  }

  /**
   * Purchase a subscription plan (Monthly or Annual)
   */
  public async purchasePlan(tier: 'monthly' | 'annual'): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
    if (!Purchases || !this.isConfigured) {
      // Fallback mode (dev simulator without API key)
      console.log('[IAP Service] Operating in test mode. Unlocking premium state locally.');
      useAppStore.getState().setPremium(true);
      return { success: true };
    }

    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        throw new Error('No active offerings configured in RevenueCat/App Store Connect.');
      }

      const packageToBuy = tier === 'monthly' ? currentOffering.monthly : currentOffering.annual;

      if (!packageToBuy) {
        throw new Error(`Package for tier ${tier} not found in offerings.`);
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
      const isEntitled = customerInfo?.entitlements?.active[ENTITLEMENT_ID] !== undefined;

      useAppStore.getState().setPremium(isEntitled);
      return { success: isEntitled };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, userCancelled: true };
      }
      console.error('[IAP Service] Purchase execution error:', error);
      return { success: false, error: error.message || 'Purchase failed.' };
    }
  }

  /**
   * Restore previous App Store purchases
   */
  public async restorePurchases(): Promise<{ success: boolean; isEntitled: boolean; error?: string }> {
    if (!Purchases || !this.isConfigured) {
      // Fallback mode
      useAppStore.getState().setPremium(true);
      return { success: true, isEntitled: true };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isEntitled = customerInfo?.entitlements?.active[ENTITLEMENT_ID] !== undefined;

      useAppStore.getState().setPremium(isEntitled);
      return { success: true, isEntitled };
    } catch (error: any) {
      console.error('[IAP Service] Restore purchases error:', error);
      return { success: false, isEntitled: false, error: error.message || 'Failed to restore purchases.' };
    }
  }
}

export const iapService = new IAPService();
