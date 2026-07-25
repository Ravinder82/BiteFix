// ─────────────────────────────────────────────────────────
// BiteFix — In-App Purchase (IAP) Service (Native StoreKit)
// ─────────────────────────────────────────────────────────
// Production-ready IAP service using expo-iap (StoreKit 2).
// No third-party subscription middleware — talks directly
// to App Store Connect and Google Play.
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import { useAppStore } from '../stores/appStore';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  hasActiveSubscriptions,
  restorePurchases as nativeRestore,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
} from 'expo-iap';
import type { PurchaseError } from 'expo-iap';

// ── App Store Connect Product IDs ────────────────────────
export const IAP_PRODUCT_IDS = {
  MONTHLY: 'com.ravinderpoonia.bitefix.monthly',
  ANNUAL: 'com.ravinderpoonia.bitefix.yearly',
};

const ALL_SKUS = [IAP_PRODUCT_IDS.MONTHLY, IAP_PRODUCT_IDS.ANNUAL];

// ── Types ────────────────────────────────────────────────
export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  localizedPrice: string;
  price: string;
  currency: string;
}

class IAPService {
  private isConnected = false;
  private purchaseUpdateSub: { remove: () => void } | null = null;
  private purchaseErrorSub: { remove: () => void } | null = null;

  // Resolve/reject for the current in-flight purchase promise
  private purchaseResolve: ((value: { success: boolean; userCancelled?: boolean; error?: string }) => void) | null = null;

  /**
   * Initialize the native IAP connection.
   * Sets up purchase event listeners for StoreKit 2 event-based flow.
   */
  public async initialize(): Promise<void> {
    if (this.isConnected) return;

    try {
      await initConnection();
      this.isConnected = true;
      console.log('[IAP Service] Native StoreKit connection established.');

      // Set up purchase event listeners
      this.setupListeners();
    } catch (error) {
      console.error('[IAP Service] Failed to connect to native store:', error);
      this.isConnected = false;
    }
  }

  /**
   * Set up purchase event listeners for the StoreKit 2 event-based purchase flow.
   */
  private setupListeners(): void {
    // Remove existing listeners to prevent duplicates
    this.removeListeners();

    // Listen for successful purchase events
    this.purchaseUpdateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      console.log('[IAP Service] Purchase updated:', purchase.productId);

      try {
        // Finish the transaction — CRITICAL for StoreKit 2
        // Unfinished transactions replay on every app launch (iOS)
        // Android auto-refunds after 3 days if not finished
        await finishTransaction({ purchase, isConsumable: false });
        console.log('[IAP Service] Transaction finished for:', purchase.productId);

        // Grant premium access
        useAppStore.getState().setPremium(true);

        // Resolve the purchase promise if one is pending
        if (this.purchaseResolve) {
          this.purchaseResolve({ success: true });
          this.purchaseResolve = null;
        }
      } catch (finishError) {
        console.error('[IAP Service] Failed to finish transaction:', finishError);
        if (this.purchaseResolve) {
          this.purchaseResolve({ success: false, error: 'Failed to finalize transaction.' });
          this.purchaseResolve = null;
        }
      }
    });

    // Listen for purchase error events
    this.purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
      console.error('[IAP Service] Purchase error event:', error);

      const isUserCancelled =
        error.code === 'E_USER_CANCELLED' ||
        error.code === 'E_USER_CANCELED' ||
        error.message?.includes('cancelled') ||
        error.message?.includes('canceled');

      if (this.purchaseResolve) {
        this.purchaseResolve({
          success: false,
          userCancelled: isUserCancelled,
          error: isUserCancelled ? undefined : (error.message || 'Purchase failed.'),
        });
        this.purchaseResolve = null;
      }
    });
  }

  /**
   * Remove purchase event listeners.
   */
  private removeListeners(): void {
    if (this.purchaseUpdateSub) {
      this.purchaseUpdateSub.remove();
      this.purchaseUpdateSub = null;
    }
    if (this.purchaseErrorSub) {
      this.purchaseErrorSub.remove();
      this.purchaseErrorSub = null;
    }
  }

  /**
   * Disconnect from the native store. Call on cleanup.
   */
  public async disconnect(): Promise<void> {
    this.removeListeners();
    this.purchaseResolve = null;

    try {
      await endConnection();
      this.isConnected = false;
      console.log('[IAP Service] Store connection closed.');
    } catch (error) {
      console.error('[IAP Service] Disconnect error:', error);
    }
  }

  /**
   * Fetch subscription products from App Store Connect / Google Play.
   */
  public async getSubscriptions(): Promise<SubscriptionProduct[]> {
    if (!this.isConnected) await this.initialize();

    try {
      const products = await fetchProducts({ skus: ALL_SKUS, type: 'subs' });
      console.log('[IAP Service] Fetched subscription products:', products?.length || 0);

      if (!products || !Array.isArray(products)) return [];

      return products.map((product: any) => ({
        productId: product.productId,
        title: product.title || product.name || product.productId,
        description: product.description || '',
        localizedPrice: product.localizedPrice || product.displayPrice || `$${product.price}`,
        price: product.price || '0',
        currency: product.currency || 'USD',
      }));
    } catch (error) {
      console.error('[IAP Service] Failed to fetch subscriptions:', error);
      return [];
    }
  }

  /**
   * Purchase a subscription plan (Monthly or Annual).
   * Uses the event-based StoreKit 2 flow — result arrives via purchaseUpdatedListener.
   */
  public async purchasePlan(tier: 'monthly' | 'annual'): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
    if (!this.isConnected) await this.initialize();

    const sku = tier === 'monthly' ? IAP_PRODUCT_IDS.MONTHLY : IAP_PRODUCT_IDS.ANNUAL;

    return new Promise(async (resolve) => {
      // Store the resolve function so the event listener can resolve the promise
      this.purchaseResolve = resolve;

      // Set a timeout to prevent hanging indefinitely
      const timeout = setTimeout(() => {
        if (this.purchaseResolve === resolve) {
          this.purchaseResolve = null;
          resolve({ success: false, error: 'Purchase timed out. Please try again.' });
        }
      }, 120000); // 2 minute timeout

      try {
        await requestPurchase({
          request: {
            apple: { sku },
            google: { skus: [sku] },
          },
          type: 'subs',
        });
      } catch (error: any) {
        clearTimeout(timeout);
        this.purchaseResolve = null;

        const isUserCancelled =
          error.code === 'E_USER_CANCELLED' ||
          error.code === 'E_USER_CANCELED' ||
          error.message?.includes('cancelled') ||
          error.message?.includes('canceled');

        resolve({
          success: false,
          userCancelled: isUserCancelled,
          error: isUserCancelled ? undefined : (error.message || 'Purchase failed.'),
        });
      }

      // Clear timeout when promise resolves (via event listener)
      const originalResolve = this.purchaseResolve;
      this.purchaseResolve = (result) => {
        clearTimeout(timeout);
        if (originalResolve) originalResolve(result);
      };
    });
  }

  /**
   * Restore previous purchases from App Store / Google Play.
   */
  public async restorePurchases(): Promise<{ success: boolean; isEntitled: boolean; error?: string }> {
    if (!this.isConnected) await this.initialize();

    try {
      // Trigger platform-native restore flow
      await nativeRestore();

      // Then check what purchases are available
      const purchases = await getAvailablePurchases();
      console.log('[IAP Service] Restored purchases:', purchases?.length || 0);

      const hasActive = purchases?.some((purchase: any) =>
        ALL_SKUS.includes(purchase.productId)
      );

      if (hasActive) {
        // Finish any unfinished transactions
        for (const purchase of (purchases || [])) {
          if (ALL_SKUS.includes(purchase.productId)) {
            try {
              await finishTransaction({ purchase, isConsumable: false });
            } catch {
              // Already finished — ignore
            }
          }
        }
        useAppStore.getState().setPremium(true);
        return { success: true, isEntitled: true };
      }

      useAppStore.getState().setPremium(false);
      return { success: true, isEntitled: false };
    } catch (error: any) {
      console.error('[IAP Service] Restore purchases error:', error);
      return { success: false, isEntitled: false, error: error.message || 'Failed to restore purchases.' };
    }
  }

  /**
   * Check if user has active subscription.
   */
  public async checkSubscriptionStatus(): Promise<boolean> {
    if (!this.isConnected) await this.initialize();

    try {
      // Use the built-in hasActiveSubscriptions API
      const isActive = await hasActiveSubscriptions(ALL_SKUS);
      useAppStore.getState().setPremium(!!isActive);
      console.log('[IAP Service] Subscription status:', isActive ? 'ACTIVE' : 'NONE');
      return !!isActive;
    } catch (error) {
      console.error('[IAP Service] Check subscription status error:', error);

      // Fallback: check available purchases
      try {
        const purchases = await getAvailablePurchases();
        const hasActive = purchases?.some((p: any) => ALL_SKUS.includes(p.productId));
        useAppStore.getState().setPremium(!!hasActive);
        return !!hasActive;
      } catch {
        return false;
      }
    }
  }
}

export const iapService = new IAPService();
