export const PRODUCT_IDS = {
  MONTHLY: 'com.ravinderpoonia.bitefix.sub.monthly',
  ANNUAL: 'com.ravinderpoonia.bitefix.sub.yearly',
} as const;

export const ALL_PRODUCT_SKUS: string[] = [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL];

export type PlanTier = 'monthly' | 'annual';

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  displayPrice: string;
  price: number;
  currency: string;
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
