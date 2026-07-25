// ─────────────────────────────────────────────────────────
// BiteFix — Mocked In-App Purchase (IAP) Service
// ─────────────────────────────────────────────────────────
// This file has been completely stubbed out to eliminate ALL native
// payment dependencies. It just immediately unlocks the app locally.
// ─────────────────────────────────────────────────────────

import { useAppStore } from '../stores/appStore';

export const IAP_PRODUCT_IDS = {
  MONTHLY: 'com.ravinderpoonia.bitefix.monthly',
  ANNUAL: 'com.ravinderpoonia.bitefix.yearly',
};

export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  localizedPrice: string;
  price: string;
  currency: string;
}

class IAPService {
  public async initialize(): Promise<void> {
    console.log('[IAP Service] Initialized mocked IAP service.');
  }

  public async disconnect(): Promise<void> {
    console.log('[IAP Service] Disconnected mocked IAP service.');
  }

  public async getSubscriptions(): Promise<SubscriptionProduct[]> {
    return [
      {
        productId: IAP_PRODUCT_IDS.MONTHLY,
        title: 'Monthly Pass',
        description: 'Billed monthly • Flexible',
        localizedPrice: '$5.99',
        price: '5.99',
        currency: 'USD',
      },
      {
        productId: IAP_PRODUCT_IDS.ANNUAL,
        title: 'Yearly Pass',
        description: '$1.50 / month • Billed yearly',
        localizedPrice: '$17.99',
        price: '17.99',
        currency: 'USD',
      },
    ];
  }

  public async purchasePlan(tier: 'monthly' | 'annual'): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
    console.log('[IAP Service] Mock purchase executed for tier:', tier);
    // Instantly unlock the app in the local store
    useAppStore.getState().setPremium(true);
    return { success: true };
  }

  public async restorePurchases(): Promise<{ success: boolean; isEntitled: boolean; error?: string }> {
    console.log('[IAP Service] Mock restore executed.');
    useAppStore.getState().setPremium(true);
    return { success: true, isEntitled: true };
  }

  public async checkSubscriptionStatus(): Promise<boolean> {
    const isPremium = useAppStore.getState().isPremium;
    console.log('[IAP Service] Mock status check. Current premium state:', isPremium);
    return isPremium;
  }
}

export const iapService = new IAPService();
