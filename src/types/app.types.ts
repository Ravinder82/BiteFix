// ─────────────────────────────────────────────────────────
// NOVA Classification (1–4)
// ─────────────────────────────────────────────────────────
export type NOVAClass = 1 | 2 | 3 | 4;

export const NOVA_LABELS: Record<NOVAClass, string> = {
  1: 'Unprocessed / Minimally Processed',
  2: 'Processed Culinary Ingredient',
  3: 'Processed Food',
  4: 'Ultra-Processed',
};

export const NOVA_SHORT_LABELS: Record<NOVAClass, string> = {
  1: 'Whole Food',
  2: 'Culinary Ingredient',
  3: 'Processed',
  4: 'Ultra-Processed',
};

// ─────────────────────────────────────────────────────────
// Additive Audit
// ─────────────────────────────────────────────────────────
export type AdditiveRiskLevel = 'low' | 'moderate' | 'elevated';

export interface AdditiveDetail {
  /** E-number or additive tag e.g. "en:e330" */
  tag: string;
  /** Cleaned display name e.g. "Citric Acid (E330)" */
  displayName: string;
  /** Function e.g. "Acidity Regulator", "Emulsifier", "Synthetic Colorant" */
  functionLabel: string;
  /** Neutral risk assessment */
  riskLevel: AdditiveRiskLevel;
}

// ─────────────────────────────────────────────────────────
// Scan History Item (BiteFix-aware)
// ─────────────────────────────────────────────────────────
export interface ScanHistoryItem {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;

  // Serving-based values (retained for backward compat)
  sugarGrams: number;
  sugarTeaspoons: number;
  servingSize?: string;
  totalWeightGrams?: number;
  totalSugarGrams?: number;
  calories?: number;
  carbsGrams?: number;
  fatGrams?: number;
  proteinGrams?: number;

  timestamp: number;
  imageUrl?: string;
  sugarPer100g?: number;
  categoryTag?: string;
  isDefaultServing?: boolean;
  whoLimitServingPercent?: number;
  whoLimitIdealServingPercent?: number;
  ingredientsText?: string;
  hasHiddenSugars?: boolean;
  hiddenSugars?: string[];
  hiddenSugarCount?: number;

  // ── BiteFix Extensions ──────────────────────────────
  /** NOVA processing class (1-4). undefined = unknown */
  novaClass?: NOVAClass;
  /** Additives audit list parsed from OFF */
  additives?: AdditiveDetail[];
  /** Total count of additives */
  additiveCount?: number;
  /** Allergen tags e.g. ["en:gluten", "en:milk"] */
  allergens?: string[];
  /** Nutri-Score letter grade (a–e). undefined = unavailable */
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  /** BiteFix Health Score (0-100). Computed post-scan. */
  biteFixScore?: number;

  // ── Healthy Swap Telemetry ────────────────────────────
  /** Whether this item was saved as a healthy swap alternative */
  isSwapped?: boolean;
  /** Name of the original unhealthy item this was swapped for */
  swappedForOriginalName?: string;
  /** Original item's NOVA class before swap */
  originalNovaClass?: NOVAClass;
  /** Original item's BiteFix score before swap */
  originalBiteFixScore?: number;
  /** Original item's additive count before swap */
  originalAdditiveCount?: number;
  /** Original item's sugar in grams before swap */
  originalSugarGrams?: number;
}

// ─────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────
export type BiteFixCategory =
  | 'All'
  | 'Beverages'
  | 'Breakfast'
  | 'Snacks'
  | 'Dairy & Alternatives'
  | 'Condiments & Sauces'
  | 'Pantry & Other';

// ─────────────────────────────────────────────────────────
// Collection (Pantry) Item
// ─────────────────────────────────────────────────────────
export interface CollectionItem extends ScanHistoryItem {
  addedAt: number;
  biteFixCategory: BiteFixCategory;
  notes?: string;
  isFavorite?: boolean;
}
