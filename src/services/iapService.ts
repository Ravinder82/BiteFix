// ═══════════════════════════════════════════════════════════
// BiteFix — RevenueCat In-App Purchase Service
// ═══════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { useAppStore } from '../stores/appStore';
import {
  PRODUCT_IDS,
  ALL_PRODUCT_SKUS,
  type IAPProduct,
  type PlanTier,
  type PurchaseResult,
  type RestoreResult,
} from './iapProducts';

export { PRODUCT_IDS, ALL_PRODUCT_SKUS };
export type { IAPProduct, PlanTier, PurchaseResult, RestoreResult };

// ── Configuration ──────────────────────────────────────────
const ENTITLEMENT_ID = 'BiteFix Premium';
const API_KEY = Platform.select({
  ios: 'test_AWlLopqUibnRlvfJTILfSwwAPzi',
  android: 'test_AWlLopqUibnRlvfJTILfSwwAPzi',
});

// ── IAP Service Singleton ─────────────────────────────────
class BitefixIAPService {
  private connected = false;
  private connectionPromise: Promise<void> | null = null;

  public async connect(): Promise<void> {
    if (this.connected) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      try {
        console.log('[RevenueCat] Initialising connection...');
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        if (API_KEY) {
          Purchases.configure({ apiKey: API_KEY });
        }
        
        await this.checkSubscriptionStatus();
        this.connected = true;
        console.log('[RevenueCat] ✅ Successfully configured.');
      } catch (err: any) {
        console.error('[RevenueCat] ❌ Failed to configure:', err);
      }
    })();

    return this.connectionPromise;
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
    this.connectionPromise = null;
  }

  public async fetchSubscriptions(): Promise<IAPProduct[]> {
    if (!this.connected) await this.connect();

    try {
      console.log('[RevenueCat] Fetching offerings...');
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const products: IAPProduct[] = offerings.current.availablePackages.map(pkg => {
          return {
            productId: pkg.product.identifier,
            title: pkg.product.title,
            description: pkg.product.description,
            displayPrice: pkg.product.priceString,
            price: pkg.product.price,
            currency: pkg.product.currencyCode,
            rcPackage: pkg,
          };
        });
        
        console.log('[RevenueCat] ✅ Offerings fetched successfully.');
        return products;
      }
      return [];
    } catch (err: any) {
      console.error('[RevenueCat] ❌ Error fetching offerings:', err.message ?? err);
      return [];
    }
  }

  public async purchasePlan(planOrProduct: PlanTier | IAPProduct): Promise<PurchaseResult> {
    if (!this.connected) await this.connect();
    
    let targetProduct: IAPProduct | undefined;

    if (typeof planOrProduct === 'string') {
      const products = await this.fetchSubscriptions();
      const targetType = planOrProduct === 'monthly' ? 'MONTHLY' : 'ANNUAL';
      const targetId = PRODUCT_IDS[targetType];
      targetProduct = products.find(
        p => p.rcPackage?.packageType === targetType || p.productId === targetId
      );
      if (!targetProduct) {
        return { success: false, error: `Subscription plan '${planOrProduct}' is currently unavailable.` };
      }
    } else {
      targetProduct = planOrProduct;
    }

    if (!targetProduct.rcPackage) {
      return { success: false, error: 'Product is missing the underlying RC Package.' };
    }

    try {
      console.log(`[RevenueCat] Attempting purchase of ${targetProduct.productId}...`);
      const { customerInfo } = await Purchases.purchasePackage(targetProduct.rcPackage);
      
      const isEntitled = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      
      if (isEntitled) {
        console.log(`[RevenueCat] ✅ Purchase successful and entitled!`);
        useAppStore.getState().setPremium(true);
        return { success: true };
      } else {
        console.log(`[RevenueCat] ⚠️ Purchase completed, but entitlement was not granted.`);
        return { success: false, error: 'Purchase completed but entitlement not granted.' };
      }
    } catch (e: any) {
      if (e.userCancelled) {
        console.log(`[RevenueCat] User cancelled purchase.`);
        return { success: false, userCancelled: true };
      }
      console.error('[RevenueCat] ❌ Purchase failed:', e.message);
      return { success: false, error: e.message };
    }
  }

  public async restorePurchases(): Promise<RestoreResult> {
    if (!this.connected) await this.connect();

    try {
      console.log('[RevenueCat] Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      const isEntitled = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      
      console.log(`[RevenueCat] Restore complete. Is Premium: ${isEntitled}`);
      useAppStore.getState().setPremium(isEntitled);
      
      return { success: true, isEntitled };
    } catch (e: any) {
      console.error('[RevenueCat] ❌ Restore failed:', e.message);
      return { success: false, isEntitled: false, error: e.message };
    }
  }

  public async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isEntitled = typeof customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== 'undefined';
      
      useAppStore.getState().setPremium(isEntitled);
      return isEntitled;
    } catch (e: any) {
      console.warn('[RevenueCat] Subscription check bypassed/offline:', e?.message || e);
      // Preserve current local premium state if network or store SDK fails
      return useAppStore.getState().isPremium;
    }
  }

  public async getActiveSubscriptionDetails(): Promise<{ planType: string; purchaseDate: string; autoRenew: boolean } | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (!entitlement) return null;
      return {
        planType: entitlement.productIdentifier.includes('yearly') ? 'Yearly Pass' : 'Monthly Pass',
        purchaseDate: entitlement.latestPurchaseDate ? new Date(entitlement.latestPurchaseDate).toLocaleDateString() : 'Active',
        autoRenew: entitlement.willRenew,
      };
    } catch {
      return null;
    }
  }
}

export const iapService = new BitefixIAPService();
