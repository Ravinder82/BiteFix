// ═══════════════════════════════════════════════════════════
// BiteFix — RevenueCat In-App Purchase Service
// ═══════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { useAppStore } from '../stores/appStore';
import { scheduleRenewalReminder, cancelRenewalReminder, isRenewalReminderScheduled } from './notificationService';
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
export const ENTITLEMENT_ID = 'BiteFix Premium';
const API_KEY = Platform.select({
  ios: 'appl_sbJXeudNhKfrgWpHYRhDlppXwKt',
  android: 'test_AWlLopqUibnRlvfJTILfSwwAPzi',
});

// ── IAP Service Singleton ─────────────────────────────────
type ActiveEntitlementLike = {
  expirationDate?: string | number | null;
  periodType?: 'normal' | 'intro' | 'trial' | string;
  willRenew?: boolean;
};

class BitefixIAPService {
  private isConfigured = false;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Keeps the local renewal-reminder notification in sync with the
   * active entitlement. Best-effort — wrapped so it never breaks the
   * purchase flow. Schedules for ~2 days before renewal; cancels when
   * the subscription will not renew. Awaited at purchase/restore call
   * sites so the iOS permission dialog appears in purchase context.
   */
  private async syncRenewalReminder(entitlement: ActiveEntitlementLike | undefined): Promise<void> {
    try {
      if (!entitlement || entitlement.willRenew === false) {
        await cancelRenewalReminder();
        return;
      }
      const onTrial = entitlement.periodType === 'trial' || entitlement.periodType === 'intro';
      await scheduleRenewalReminder(
        entitlement.expirationDate != null
          ? { renewalDate: entitlement.expirationDate, trialDays: onTrial ? 7 : undefined }
          : { trialDays: 7 }
      );
    } catch {
      // reminder is best-effort only
    }
  }

  /**
   * Public re-sync for the Settings toggle: reads the live entitlement
   * from RevenueCat and schedules or clears the renewal reminder.
   * Returns true when a reminder is currently scheduled.
   */
  public async refreshRenewalReminder(): Promise<boolean> {
    const ready = this.isConfigured || (await Purchases.isConfigured()) || (await this.initialize());
    if (!ready) return false;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
      await this.syncRenewalReminder(entitlement);
      return isRenewalReminderScheduled();
    } catch {
      return false;
    }
  }

  /**
   * Initializes RevenueCat Purchases EXACTLY ONCE per application lifecycle.
   * Checks both local JS state and native Purchases.isConfigured() before
   * attempting any configuration.
   */
  public async initialize(): Promise<boolean> {
    if (this.isConfigured) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const nativeConfigured = await Purchases.isConfigured();
        if (nativeConfigured) {
          console.log('[RevenueCat] Native Purchases SDK is already configured. Reusing instance.');
          this.isConfigured = true;
          return true;
        }

        if (!API_KEY) {
          console.warn('[RevenueCat] No API key available for current platform:', Platform.OS);
          return false;
        }

        console.log('[RevenueCat] Configuring Purchases SDK (canonical single init)...');
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey: API_KEY });
        this.isConfigured = true;
        console.log('[RevenueCat] ✅ Purchases SDK successfully configured.');
        return true;
      } catch (err: any) {
        console.error('[RevenueCat] ❌ Failed to initialize Purchases SDK:', err?.message ?? err);
        return false;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Backward-compatible alias for initialize().
   * Guaranteed to be idempotent and never reconfigures.
   */
  public async connect(): Promise<void> {
    await this.initialize();
  }

  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Pure offering fetch: Only requests offerings from the configured SDK.
   * Does NOT configure or reconfigure RevenueCat.
   */
  public async fetchSubscriptions(): Promise<IAPProduct[]> {
    const ready = this.isConfigured || (await Purchases.isConfigured()) || (await this.initialize());
    if (!ready) {
      console.warn('[RevenueCat] Cannot fetch offerings: SDK is not configured.');
      return [];
    }

    try {
      console.log('[RevenueCat] Fetching offerings...');

      // Wrap in a 10-second timeout — Apple sandbox frequently times out (especially
      // in India / on beta iOS). On timeout we return [] and the UI shows fallback prices.
      const offeringsPromise = Purchases.getOfferings();
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('RevenueCat offerings fetch timed out after 10s')), 10_000)
      );

      const offerings = await Promise.race([offeringsPromise, timeoutPromise]);

      if (offerings && offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const products: IAPProduct[] = offerings.current.availablePackages.map(pkg => ({
          productId: pkg.product.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          displayPrice: pkg.product.priceString,
          price: pkg.product.price,
          currency: pkg.product.currencyCode,
          rcPackage: pkg,
        }));

        console.log('[RevenueCat] ✅ Offerings fetched successfully.');
        return products;
      }
      return [];
    } catch (err: any) {
      console.warn('[RevenueCat] ⚠️ Could not fetch live offerings (Apple sandbox may be slow):', err.message ?? err);
      return [];
    }
  }

  /**
   * Pure purchase flow: Executes purchase package via StoreKit/Google Play.
   * Does NOT configure or reconfigure RevenueCat.
   */
  public async purchasePlan(planOrProduct: PlanTier | IAPProduct): Promise<PurchaseResult> {
    const ready = this.isConfigured || (await Purchases.isConfigured()) || (await this.initialize());
    if (!ready) {
      return { success: false, error: 'Store purchase service is not available.' };
    }

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
        await this.syncRenewalReminder(customerInfo.entitlements.active[ENTITLEMENT_ID]);
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

  /**
   * Pure restore flow: Restores purchases and checks entitlement.
   * Does NOT configure or reconfigure RevenueCat.
   */
  public async restorePurchases(): Promise<RestoreResult> {
    const ready = this.isConfigured || (await Purchases.isConfigured()) || (await this.initialize());
    if (!ready) {
      return { success: false, isEntitled: false, error: 'Store purchase service is not available.' };
    }

    try {
      console.log('[RevenueCat] Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      const isEntitled = typeof customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== 'undefined';

      console.log(`[RevenueCat] Restore complete. Is Premium: ${isEntitled}`);
      useAppStore.getState().setPremium(isEntitled);
      if (isEntitled) {
        await this.syncRenewalReminder(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
      } else {
        void cancelRenewalReminder();
      }

      return { success: true, isEntitled };
    } catch (e: any) {
      console.error('[RevenueCat] ❌ Restore failed:', e.message);
      return { success: false, isEntitled: false, error: e.message };
    }
  }

  /**
   * Pure entitlement status check: Reads CustomerInfo from RevenueCat cache/server.
   * Does NOT configure or reconfigure RevenueCat.
   */
  public async checkSubscriptionStatus(): Promise<boolean> {
    const ready = this.isConfigured || (await Purchases.isConfigured()) || (await this.initialize());
    if (!ready) {
      console.warn('[RevenueCat] Cannot check subscription status: SDK is not configured.');
      useAppStore.getState().setPremium(false);
      return false;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isEntitled = typeof customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== 'undefined';

      console.log(`[RevenueCat] Entitlement check: ${isEntitled ? 'ACTIVE' : 'INACTIVE'}`);
      useAppStore.getState().setPremium(isEntitled);
      if (!isEntitled) {
        // Subscription expired or cancelled — drop the pending reminder.
        void cancelRenewalReminder();
      }
      return isEntitled;
    } catch (e: any) {
      console.warn('[RevenueCat] Subscription check error:', e?.message || e);
      // Safe fallback: Do not falsely grant premium on error
      useAppStore.getState().setPremium(false);
      return false;
    }
  }

  public async getActiveSubscriptionDetails(): Promise<{ planType: string; purchaseDate: string; autoRenew: boolean } | null> {
    const ready = this.isConfigured || (await Purchases.isConfigured());
    if (!ready) return null;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
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
