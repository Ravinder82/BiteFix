import type { PurchasesPackage } from 'react-native-purchases';

export const PRODUCT_IDS = {
  MONTHLY: 'com.ravinderpoonia.bitefix.sub.monthly',
  ANNUAL: 'com.ravinderpoonia.bitefix.sub.yearly',
} as const;

export const ALL_PRODUCT_SKUS: string[] = [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL];

// Fallback prices shown when RevenueCat/Apple sandbox network times out.
// These match the prices set in App Store Connect. Update here if you change pricing.
export const FALLBACK_PRICES: Record<'monthly' | 'annual', { displayPrice: string; price: number; currency: string }> = {
  monthly: { displayPrice: '₹499/mo', price: 499, currency: 'INR' },
  annual:  { displayPrice: '₹2,999/yr', price: 2999, currency: 'INR' },
};

export type PlanTier = 'monthly' | 'annual';

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  displayPrice: string;
  price: number;
  currency: string;
  rcPackage?: PurchasesPackage;
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
