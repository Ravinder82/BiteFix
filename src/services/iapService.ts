// ═══════════════════════════════════════════════════════════
// BiteFix — Native In-App Purchase Service
// ═══════════════════════════════════════════════════════════
//
// Architecture: Pure native StoreKit 2 (iOS) / Google Play
// Billing (Android) via expo-iap. Zero third-party middleware.
//
// Design principles:
//   • Single connection lifecycle: init once, reuse globally
//   • Promise-bridge over StoreKit's event-based API
//   • All errors are caught, categorised, and surfaced cleanly
//   • finishTransaction always called — no dangling transactions
//   • Defensive: never crashes the app, always returns a result
//
// Product IDs (must match App Store Connect exactly):
//   com.ravinderpoonia.bitefix.sub.monthly
//   com.ravinderpoonia.bitefix.sub.yearly
// ═══════════════════════════════════════════════════════════

import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  hasActiveSubscriptions,
  restorePurchases as nativeRestorePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type ProductSubscriptionIOS,
} from 'expo-iap';
import type { ExpoPurchaseError } from 'expo-iap';
import { useAppStore } from '../stores/appStore';

// ── Product ID Registry ───────────────────────────────────
// These MUST exactly match App Store Connect and ios/BiteFix.storekit.
export const PRODUCT_IDS = {
  MONTHLY: 'com.ravinderpoonia.bitefix.sub.monthly',
  ANNUAL:  'com.ravinderpoonia.bitefix.sub.yearly',
} as const;


// Flat array for fetching all subscriptions at once
const ALL_PRODUCT_SKUS: string[] = [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL];

// ── Types ─────────────────────────────────────────────────
export type PlanTier = 'monthly' | 'annual';

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  displayPrice: string; // Localised, e.g. "$5.99"
  price: number;        // Raw numeric price
  currency: string;     // ISO 4217, e.g. "USD"
}

export interface PurchaseResult {
  success: boolean;
  userCancelled?: boolean;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  isEntitled: boolean;
  error?: string;
}

// ── Error Classification ──────────────────────────────────
const USER_CANCELLED_CODES = new Set([
  'E_USER_CANCELLED',
  'E_USER_CANCELED',
  'SKErrorDomain:2',        // StoreKit 1 user cancel
  'storekit.userCancelled', // StoreKit 2
]);

function isUserCancellation(error: any): boolean {
  if (!error) return false;
  if (USER_CANCELLED_CODES.has(error.code)) return true;
  const msg: string = error.message ?? '';
  return msg.includes('cancelled') || msg.includes('canceled') || msg.includes('User cancelled');
}

function storeKitUnavailableMessage(sku: string): string {
  return [
    `Product ${sku} was not returned by StoreKit.`,
    'In local testing, make sure the BiteFixFoodSwapScanner scheme is using ios/BiteFix.storekit and run from Xcode.',
    'For sandbox/TestFlight, confirm the subscription exists for com.ravinderpoonia.bitefix and is cleared for sale in App Store Connect.',
  ].join(' ');
}

// ── IAP Service Singleton ─────────────────────────────────
class BitefixIAPService {
  // ── State ───────────────────────────────────────────────
  private connected = false;
  private connecting = false;
  private connectionPromise: Promise<void> | null = null;

  // Listeners registered when connected
  private purchaseUpdateUnsub: { remove: () => void } | null = null;
  private purchaseErrorUnsub:  { remove: () => void } | null = null;

  // In-flight purchase resolution — bridges event → promise
  private pendingResolve: ((r: PurchaseResult) => void) | null = null;
  private cachedProducts: IAPProduct[] = [];

  // ── Connection ───────────────────────────────────────────

  /**
   * Initialise the connection to the native store and register
   * purchase event listeners. Safe to call multiple times.
   */
  public async connect(): Promise<void> {
    // Already connected — nothing to do
    if (this.connected) return;

    // If another connect() is already in progress, wait for it
    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = this._doConnect();
    try {
      await this.connectionPromise;
    } finally {
      this.connecting = false;
      this.connectionPromise = null;
    }
  }

  private async _doConnect(): Promise<void> {
    try {
      await initConnection();
      this.connected = true;
      this._registerListeners();
      console.log('[BitefixIAP] ✅ Store connection established.');
    } catch (err) {
      this.connected = false;
      // Log but don't rethrow — the rest of the app must not crash
      console.error('[BitefixIAP] ❌ Failed to connect to native store:', err);
    }
  }

  /**
   * Tear down listeners and close the store connection.
   * Call when the paywall unmounts or the app goes to the background.
   */
  public async disconnect(): Promise<void> {
    this._unregisterListeners();
    this.pendingResolve = null;

    if (!this.connected) return;
    try {
      await endConnection();
      this.connected = false;
      console.log('[BitefixIAP] Store connection closed.');
    } catch (err) {
      console.error('[BitefixIAP] Error closing store connection:', err);
    }
  }

  // ── Listeners ────────────────────────────────────────────

  private _registerListeners(): void {
    this._unregisterListeners(); // prevent duplicates

    // ── Purchase Success ─────────────────────────────────
    this.purchaseUpdateUnsub = purchaseUpdatedListener(async (purchase: Purchase) => {
      console.log('[BitefixIAP] Purchase event received:', purchase.productId);

      // Only act on our subscription products
      if (!ALL_PRODUCT_SKUS.includes(purchase.productId)) {
        console.warn('[BitefixIAP] Unknown productId in event, ignoring:', purchase.productId);
        return;
      }

      try {
        // CRITICAL: finish the transaction. If omitted:
        //   iOS → StoreKit replays the transaction on every launch
        //   Android → Google auto-refunds within 3 days
        await finishTransaction({ purchase, isConsumable: false });
        console.log('[BitefixIAP] ✅ Transaction finished:', purchase.productId);

        // Grant premium access in the app state
        useAppStore.getState().setPremium(true);

        // Resolve the in-flight purchase promise
        if (this.pendingResolve) {
          this.pendingResolve({ success: true });
          this.pendingResolve = null;
        }
      } catch (finishErr: any) {
        console.error('[BitefixIAP] ❌ finishTransaction failed:', finishErr);
        // Even if finish fails, the purchase was recorded by Apple/Google.
        // Still grant access, but notify the promise of the finish error.
        useAppStore.getState().setPremium(true);
        if (this.pendingResolve) {
          // Resolve as success because the purchase itself succeeded
          this.pendingResolve({ success: true });
          this.pendingResolve = null;
        }
      }
    });

    // ── Purchase Error ───────────────────────────────────
    this.purchaseErrorUnsub = purchaseErrorListener((error: ExpoPurchaseError) => {
      console.error('[BitefixIAP] Purchase error event:', error?.code, error?.message);

      if (this.pendingResolve) {
        this.pendingResolve({
          success: false,
          userCancelled: isUserCancellation(error),
          error: isUserCancellation(error) ? undefined : (error?.message ?? 'Purchase failed.'),
        });
        this.pendingResolve = null;
      }
    });
  }

  private _unregisterListeners(): void {
    if (this.purchaseUpdateUnsub) {
      this.purchaseUpdateUnsub.remove();
      this.purchaseUpdateUnsub = null;
    }
    if (this.purchaseErrorUnsub) {
      this.purchaseErrorUnsub.remove();
      this.purchaseErrorUnsub = null;
    }
  }

  // ── Products ─────────────────────────────────────────────

  /**
   * Fetch subscription product details from App Store Connect.
   * Returns an empty array — not an error — if the store is unavailable.
   *
   * Root causes of an empty return:
   *   1. App Store Connect subscriptions are not in "Ready to Submit" status
   *   2. Product IDs in the code don't match App Store Connect exactly
   *   3. The app binary is missing the "In-App Purchase" capability (add expo-iap plugin to app.json)
   *   4. Sandbox propagation delay — wait up to 24h after creating products
   *   5. Device not signed in to an App Store / Sandbox account
   *   6. Testing on iOS Simulator (must use physical device for IAP)
   */
  public async fetchSubscriptions(): Promise<IAPProduct[]> {
    await this.connect();
    if (!this.connected) {
      console.warn('[BitefixIAP] fetchSubscriptions: not connected to store.');
      return [];
    }

    try {
      console.log('[BitefixIAP] Fetching subscription products:', ALL_PRODUCT_SKUS);

      // type: 'subs' tells StoreKit we want subscriptions, not one-time products
      const rawProducts = await fetchProducts({ skus: ALL_PRODUCT_SKUS, type: 'subs' });
      console.log('[BitefixIAP] Raw products returned:', rawProducts?.length ?? 0);

      if (!rawProducts || !Array.isArray(rawProducts) || rawProducts.length === 0) {
        console.warn('[BitefixIAP] No products returned. Check App Store Connect status and product IDs.');
        return [];
      }

      const products: IAPProduct[] = rawProducts.map((p: any) => ({
        productId:    p.id ?? p.productId ?? '',
        title:        p.displayNameIOS ?? p.title ?? p.displayName ?? p.id ?? '',
        description:  p.description ?? '',
        displayPrice: p.displayPrice ?? `${p.price}`,
        price:        typeof p.price === 'number' ? p.price : parseFloat(p.price ?? '0'),
        currency:     p.currency ?? 'USD',
      })).filter(product => ALL_PRODUCT_SKUS.includes(product.productId));

      this.cachedProducts = products;
      console.log('[BitefixIAP] ✅ Products fetched:', products.map(p => `${p.productId} (${p.displayPrice})`));
      return products;
    } catch (err: any) {
      console.error('[BitefixIAP] ❌ fetchSubscriptions error:', err?.message ?? err);
      return [];
    }
  }

  // ── Purchase ─────────────────────────────────────────────

  /**
   * Initiate a subscription purchase for the given tier.
   *
   * StoreKit 2 is fully event-driven; requestPurchase() dispatches the
   * native payment sheet and returns immediately. The actual result
   * arrives via purchaseUpdatedListener or purchaseErrorListener.
   * We bridge this into a clean Promise using pendingResolve.
   */
  public async purchasePlan(tier: PlanTier): Promise<PurchaseResult> {
    await this.connect();
    if (!this.connected) {
      return { success: false, error: 'Unable to connect to the App Store. Check your internet connection.' };
    }

    const sku = tier === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;

    const products = this.cachedProducts.length > 0 ? this.cachedProducts : await this.fetchSubscriptions();
    if (!products.some(product => product.productId === sku)) {
      console.warn('[BitefixIAP] Refusing purchase because StoreKit did not return SKU:', sku);
      return { success: false, error: storeKitUnavailableMessage(sku) };
    }

    return new Promise<PurchaseResult>((resolve) => {
      // Cancel any previously dangling resolve (safety guard)
      if (this.pendingResolve) {
        this.pendingResolve({ success: false, error: 'Superseded by a new purchase request.' });
      }

      // 2-minute guard — prevents the UI from hanging forever
      const timeoutId = setTimeout(() => {
        if (this.pendingResolve === wrappedResolve) {
          console.warn('[BitefixIAP] Purchase timed out after 2 minutes.');
          this.pendingResolve = null;
          resolve({ success: false, error: 'Purchase timed out. Please try again.' });
        }
      }, 120_000);

      const wrappedResolve = (result: PurchaseResult) => {
        clearTimeout(timeoutId);
        resolve(result);
      };

      this.pendingResolve = wrappedResolve;

      // Dispatch the native payment sheet
      requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku] },
        },
        type: 'subs',
      }).then(async (purchaseOrPurchases) => {
        const purchases = Array.isArray(purchaseOrPurchases)
          ? purchaseOrPurchases
          : purchaseOrPurchases
            ? [purchaseOrPurchases]
            : [];
        const purchase = purchases.find((item: Purchase) => item.productId === sku);

        if (!purchase || this.pendingResolve !== wrappedResolve) {
          return;
        }

        try {
          await finishTransaction({ purchase, isConsumable: false });
          useAppStore.getState().setPremium(true);
          clearTimeout(timeoutId);
          this.pendingResolve = null;
          resolve({ success: true });
        } catch (finishErr: any) {
          console.error('[BitefixIAP] ❌ finishTransaction failed after direct purchase return:', finishErr);
          useAppStore.getState().setPremium(true);
          clearTimeout(timeoutId);
          this.pendingResolve = null;
          resolve({ success: true });
        }
      }).catch((err: any) => {
        // requestPurchase() itself throws for synchronous rejections
        // (e.g., store not reachable, product not found).
        // The async result is delivered through the listeners.
        if (this.pendingResolve === wrappedResolve) {
          clearTimeout(timeoutId);
          this.pendingResolve = null;
          resolve({
            success: false,
            userCancelled: isUserCancellation(err),
            error: isUserCancellation(err) ? undefined : (err?.message ?? 'Purchase initiation failed.'),
          });
        }
      });
    });
  }

  // ── Restore ──────────────────────────────────────────────

  /**
   * Restore previously purchased subscriptions.
   * Triggers App Store's restore flow, then verifies available purchases.
   */
  public async restorePurchases(): Promise<RestoreResult> {
    await this.connect();
    if (!this.connected) {
      return { success: false, isEntitled: false, error: 'Unable to connect to the App Store.' };
    }

    try {
      // On iOS this triggers a lightweight StoreKit sync
      await nativeRestorePurchases();

      // Now check what active purchases we have
      const available = await getAvailablePurchases();
      console.log('[BitefixIAP] Available purchases after restore:', available?.length ?? 0);

      const entitled = available?.some((p: any) => ALL_PRODUCT_SKUS.includes(p.productId)) ?? false;

      if (entitled) {
        // Finish any unfinished restored transactions
        for (const p of (available ?? [])) {
          if (ALL_PRODUCT_SKUS.includes(p.productId)) {
            try {
              await finishTransaction({ purchase: p, isConsumable: false });
            } catch {
              // Already finished — silently ignore
            }
          }
        }
        useAppStore.getState().setPremium(true);
        return { success: true, isEntitled: true };
      }

      useAppStore.getState().setPremium(false);
      return { success: true, isEntitled: false };
    } catch (err: any) {
      console.error('[BitefixIAP] ❌ restorePurchases error:', err?.message ?? err);
      return { success: false, isEntitled: false, error: err?.message ?? 'Failed to restore purchases.' };
    }
  }

  // ── Subscription Status ──────────────────────────────────

  /**
   * Check whether the user currently has an active subscription.
   * Updates the global premium state and returns the result.
   *
   * Call this on app launch and whenever the app returns to the foreground.
   */
  public async checkSubscriptionStatus(): Promise<boolean> {
    await this.connect();
    if (!this.connected) {
      console.warn('[BitefixIAP] checkSubscriptionStatus: not connected.');
      return false;
    }

    try {
      // hasActiveSubscriptions uses native StoreKit 2 / Play Billing APIs
      // for the most accurate subscription state — no server round-trip needed.
      const isActive = await hasActiveSubscriptions(ALL_PRODUCT_SKUS);
      useAppStore.getState().setPremium(!!isActive);
      console.log('[BitefixIAP] Subscription status:', isActive ? '✅ ACTIVE' : '⛔ NONE');
      return !!isActive;
    } catch (primaryErr: any) {
      console.warn('[BitefixIAP] hasActiveSubscriptions failed, falling back:', primaryErr?.message);

      // Fallback: manually inspect available purchases
      try {
        const available = await getAvailablePurchases();
        const isActive = available?.some((p: any) => ALL_PRODUCT_SKUS.includes(p.productId)) ?? false;
        useAppStore.getState().setPremium(isActive);
        return isActive;
      } catch (fallbackErr: any) {
        console.error('[BitefixIAP] ❌ Fallback subscription check failed:', fallbackErr?.message);
        return false;
      }
    }
  }
}

// Export a single shared instance
export const iapService = new BitefixIAPService();
