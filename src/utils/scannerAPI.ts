import { NOVAClass, AdditiveDetail, AdditiveRiskLevel } from '../types/app.types';
import { detectStealthSugars } from './stealthSugarDetector';

export interface ScanResultData {
  name: string;
  brand: string;
  sugarGrams?: number;
  sugarTeaspoons?: number;
  servingSize?: string;
  calories?: number;
  carbsGrams?: number;
  fatGrams?: number;
  proteinGrams?: number;
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
  novaClass?: NOVAClass;
  additives?: AdditiveDetail[];
  additiveCount?: number;
  allergens?: string[];
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  biteFixScore?: number;

  // ── Healthy Swap Telemetry ────────────────────────────
  isSwapped?: boolean;
  swappedForOriginalName?: string;
  originalNovaClass?: NOVAClass;
  originalBiteFixScore?: number;
  originalAdditiveCount?: number;
  originalSugarGrams?: number;
}

// ─────────────────────────────────────────────────────────
// Additive Parsing Helpers
// ─────────────────────────────────────────────────────────

/** Known additive function labels keyed by E-number prefix ranges */
const ADDITIVE_FUNCTION_MAP: Record<string, string> = {
  'e1': 'Colorant', 'e2': 'Preservative', 'e3': 'Antioxidant',
  'e4': 'Thickener / Stabilizer', 'e5': 'Acidity Regulator',
  'e6': 'Flavor Enhancer', 'e9': 'Glazing / Coating Agent',
  'e10': 'Sweetener', 'e11': 'Enzyme', 'e12': 'Emulsifier',
  'e14': 'Modified Starch', 'e15': 'Solvent',
};

/** Elevated-concern additive E-numbers (widely studied for caution) */
const ELEVATED_ADDITIVES = new Set([
  'e102', 'e104', 'e110', 'e122', 'e124', 'e129', 'e133', 'e150c', 'e150d',
  'e211', 'e220', 'e250', 'e251', 'e320', 'e321', 'e621', 'e951', 'e950',
  'e955',
]);

/** Moderate-concern additive E-numbers */
const MODERATE_ADDITIVES = new Set([
  'e160b', 'e171', 'e262', 'e270', 'e280', 'e282', 'e330', 'e331',
  'e338', 'e339', 'e340', 'e341', 'e407', 'e412', 'e415', 'e440',
  'e466', 'e471', 'e472', 'e500', 'e508', 'e509',
]);

function getAdditiveRiskLevel(eNumber: string): AdditiveRiskLevel {
  const clean = eNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ELEVATED_ADDITIVES.has(clean)) return 'elevated';
  if (MODERATE_ADDITIVES.has(clean)) return 'moderate';
  return 'low';
}

function getAdditiveFunctionLabel(eNumber: string): string {
  const clean = eNumber.toLowerCase().replace(/[^0-9]/g, '');
  if (!clean) return 'Food Additive';
  const num = parseInt(clean, 10);
  if (num >= 100 && num <= 199) return 'Colorant';
  if (num >= 200 && num <= 299) return 'Preservative';
  if (num >= 300 && num <= 399) return 'Antioxidant / Acidity Regulator';
  if (num >= 400 && num <= 499) return 'Thickener / Stabilizer / Emulsifier';
  if (num >= 500 && num <= 599) return 'Acidity Regulator / Anti-Caking';
  if (num >= 600 && num <= 699) return 'Flavor Enhancer';
  if (num >= 900 && num <= 999) return 'Glazing / Sweetener';
  if (num >= 1000 && num <= 1599) return 'Modified Starch / Enzyme';
  return 'Food Additive';
}

function cleanAdditiveTag(tag: string): string {
  return tag.replace(/^[a-z]+:/i, '').trim();
}

function formatAdditiveDisplayName(tag: string): string {
  const cleaned = cleanAdditiveTag(tag);
  // "e330 - citric acid" → "Citric Acid (E330)"
  const dashMatch = cleaned.match(/^(e\d+[a-z]?)\s*[-–]\s*(.+)$/i);
  if (dashMatch) {
    const eNum = dashMatch[1].toUpperCase();
    const name = dashMatch[2].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return `${name} (${eNum})`;
  }
  // Pure E-number
  const eMatch = cleaned.match(/^e\d+[a-z]?$/i);
  if (eMatch) return cleaned.toUpperCase();
  // Fallback: capitalize
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function parseAdditivesFromProduct(p: any): AdditiveDetail[] {
  const additiveTags: string[] = p.additives_tags || p.additives_original_tags || [];
  if (!Array.isArray(additiveTags) || additiveTags.length === 0) return [];

  const seen = new Set<string>();
  const results: AdditiveDetail[] = [];

  for (const rawTag of additiveTags) {
    const cleaned = cleanAdditiveTag(rawTag).toLowerCase();
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);

    const eNum = cleaned.replace(/[^a-z0-9]/g, '');
    results.push({
      tag: rawTag,
      displayName: formatAdditiveDisplayName(rawTag),
      functionLabel: getAdditiveFunctionLabel(eNum),
      riskLevel: getAdditiveRiskLevel(eNum),
    });
  }

  return results;
}

export function parseAllergensFromProduct(p: any): string[] {
  const raw = p.allergens_hierarchy || p.allergens_tags || [];
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const tag of raw) {
    const cleaned = String(tag).replace(/^[a-z]+:/i, '').trim();
    if (cleaned && !seen.has(cleaned.toLowerCase())) {
      seen.add(cleaned.toLowerCase());
      results.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase());
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────
// BiteFix Health Score (0-100)
// ─────────────────────────────────────────────────────────

/**
 * Computes a BiteFix Health Score (0-100) from product attributes.
 * Formula: Score = (0.4 × NOVA Factor) + (0.4 × Additive Cleanliness) + (0.2 × Nutrient Profile)
 */
export function computeBiteFixScore(opts: {
  novaClass?: NOVAClass;
  additiveCount: number;
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  sugarPer100g?: number;
}): number {
  // NOVA factor: NOVA 1 → 100, NOVA 2 → 75, NOVA 3 → 45, NOVA 4 → 15, unknown → 50
  const novaScores: Record<number, number> = { 1: 100, 2: 75, 3: 45, 4: 15 };
  const novaFactor = opts.novaClass ? (novaScores[opts.novaClass] ?? 50) : 50;

  // Additive cleanliness: 0 additives → 100, decays with more
  const additiveFactor = Math.max(0, 100 - (opts.additiveCount * 12));

  // Nutrient profile: based on Nutri-Score letter
  const nutriMap: Record<string, number> = { a: 100, b: 80, c: 55, d: 30, e: 10 };
  const nutrientFactor = opts.nutriScore ? (nutriMap[opts.nutriScore] ?? 50) : 50;

  const raw = (0.4 * novaFactor) + (0.4 * additiveFactor) + (0.2 * nutrientFactor);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export function isRequestTimeoutError(err: unknown): boolean {
  return err instanceof RequestTimeoutError;
}

export const API_TIMEOUT_MS = 15000;

export async function fetchWithTimeout(url: string, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromParent = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', abortFromParent, { once: true });
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BiteFixApp/1.0.0 (React Native; iOS/Android; contact@bitefixapp.com)',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    if (timedOut) {
      throw new RequestTimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    signal?.removeEventListener('abort', abortFromParent);
  }
}

/**
 * Helper to safely extract a number from an object checking multiple keys.
 */
function extractNumberFromKeys(obj: any, keys: string[]): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      const num = parseFloat(String(obj[k]));
      if (!isNaN(num) && num >= 0) {
        return num;
      }
    }
  }
  return undefined;
}

export function extractSugarFromNutriments(n: Record<string, any>): number {
  if (!n) return 0;

  // 1. Authoritative total sugars per 100g or total sugars value
  const sugar100g = extractNumberFromKeys(n, [
    'sugars_100g', 'sugars', 'sugars_value', 'sugars-total_100g', 'sugars-total'
  ]);
  if (sugar100g !== undefined && sugar100g > 0) return sugar100g;

  // 2. Serving sugars
  const sugarServing = extractNumberFromKeys(n, [
    'sugars_serving', 'sugars-total_serving'
  ]);
  if (sugarServing !== undefined && sugarServing > 0) return sugarServing;

  // 3. Added sugars (only fallback if total sugar was 0 or missing)
  const addedSugar = extractNumberFromKeys(n, [
    'added-sugars_100g', 'added-sugars', 'added-sugars_value', 'added-sugars_serving'
  ]);
  if (addedSugar !== undefined && addedSugar > 0) return addedSugar;

  // 4. Carbs fallback if sugars explicitly listed as 0 or missing
  const carbs = extractNumberFromKeys(n, [
    'carbohydrates_100g', 'carbohydrates', 'carbohydrates_value'
  ]);
  if (sugar100g === 0 && carbs !== undefined && carbs > 0) return carbs;

  return sugar100g ?? 0;
}

export function parseQuantityString(str: any): number | null {
  if (!str) return null;
  const cleaned = String(str).toLowerCase().replace(/,/g, '.');

  // Try matching multi-pack syntax common in imported Indian/US/European groceries e.g. "6 x 330 ml", "4 x 100g", "10 packs x 20 g"
  const multiMatch = cleaned.match(/(\d+)\s*[xX*]\s*([\d\.]+)\s*(g|gm|gms|gram|grams|ml|kg|ltr|litre|litres|cl|fl\s*oz|fl\.\s*oz|oz|ounce|ounces|lb|lbs|l)/);
  if (multiMatch) {
    const count = parseInt(multiMatch[1], 10);
    const val = parseFloat(multiMatch[2]);
    const unit = multiMatch[3];
    if (!isNaN(count) && !isNaN(val)) {
      let unitVal = val;
      if (unit === 'kg' || unit === 'l' || unit === 'ltr' || unit === 'litre' || unit === 'litres') unitVal = val * 1000;
      else if (unit === 'cl') unitVal = val * 10;
      else if (unit.startsWith('fl') || unit.includes('fl')) unitVal = val * 29.5735;
      else if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') unitVal = val * 28.3495;
      else if (unit === 'lb' || unit === 'lbs') unitVal = val * 453.59237;
      return count * unitVal;
    }
  }

  // Regular single quantity match (handling indian terminology like gm, gms, ltr, litre)
  const match = cleaned.match(/([\d\.]+)\s*(g|gm|gms|gram|grams|ml|kg|ltr|litre|litres|cl|fl\s*oz|fl\.\s*oz|oz|ounce|ounces|lb|lbs|l)/);
  if (!match) {
    // Fallback for raw numbers without unit strings (e.g. "140", "140.0")
    const numMatch = cleaned.match(/([\d\.]+)/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      if (!isNaN(val) && val > 0) return val;
    }
    return null;
  }
  const val = parseFloat(match[1]);
  const unit = match[2];
  if (isNaN(val)) return null;
  if (unit === 'kg' || unit === 'l' || unit === 'ltr' || unit === 'litre' || unit === 'litres') return val * 1000;
  if (unit === 'cl') return val * 10;
  if (unit.startsWith('fl') || unit.includes('fl')) return val * 29.5735;
  if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') return val * 28.3495;
  if (unit === 'lb' || unit === 'lbs') return val * 453.59237;
  return val;
}

// In-memory session cache for lightning-fast rescan and alternative format matching
const productCache = new Map<string, ScanResultData | null>();

/**
 * Converts an 8-digit UPC-E string to a standard 12-digit UPC-A string.
 * Essential for small drink cans (e.g., Coca-Cola mini cans, snack packs in US).
 */
function convertUpceToUpca(upce: string): string | null {
  if (!/^\d{8}$/.test(upce)) return null;
  const sys = upce[0];
  const mid = upce.substring(1, 7);
  const checkDigit = upce[7];
  const lastDigit = mid[5];
  let upca = "";
  if (['0', '1', '2'].includes(lastDigit)) {
    upca = `${sys}${mid[0]}${mid[1]}${lastDigit}0000${mid[2]}${mid[3]}${mid[4]}${checkDigit}`;
  } else if (lastDigit === '3') {
    upca = `${sys}${mid[0]}${mid[1]}${mid[2]}00000${mid[3]}${mid[4]}${checkDigit}`;
  } else if (lastDigit === '4') {
    upca = `${sys}${mid[0]}${mid[1]}${mid[2]}${mid[3]}00000${mid[4]}${checkDigit}`;
  } else {
    upca = `${sys}${mid[0]}${mid[1]}${mid[2]}${mid[3]}${mid[4]}0000${lastDigit}${checkDigit}`;
  }
  return upca;
}

/**
 * Generates all valid candidate representations of a scanned barcode for US/European databases.
 * Handles UPC-E (8 digits), stripped UPC-A (11 digits), standard UPC-A (12 digits),
 * EAN-13 (13 digits), and GTIN-14 (14 digits).
 */
export function generateBarcodeCandidates(rawBarcode: string): string[] {
  const cleaned = rawBarcode.trim().replace(/[^0-9]/g, '');
  if (!cleaned) return [rawBarcode.trim()];
  const candidates: string[] = [cleaned];

  if (cleaned.length === 8) {
    const upca = convertUpceToUpca(cleaned);
    if (upca) {
      candidates.push(upca);
      candidates.push(`0${upca}`);
      candidates.push(`00${upca}`);
    }
  } else if (cleaned.length === 11) {
    candidates.push(`0${cleaned}`);
    candidates.push(`00${cleaned}`);
  } else if (cleaned.length === 12) {
    candidates.push(`0${cleaned}`);
    candidates.push(`00${cleaned}`);
  } else if (cleaned.length === 13) {
    if (cleaned.startsWith('0')) {
      candidates.push(cleaned.slice(1));
    }
    candidates.push(`0${cleaned}`);
  } else if (cleaned.length === 14) {
    if (cleaned.startsWith('00')) {
      candidates.push(cleaned.slice(1));
      candidates.push(cleaned.slice(2));
    } else if (cleaned.startsWith('0')) {
      candidates.push(cleaned.slice(1));
    }
  }

  // Deduplicate preserving order
  return Array.from(new Set(candidates));
}

/**
 * Universally extracts a product name from ANY language or field in an OpenFoodFacts product object.
 */
function extractUniversalName(p: any): string {
  if (!p || typeof p !== 'object') return 'Scanned Food Item';

  // 1. Try common explicit English and default name fields first
  const primaryNames = [
    p.product_name, p.product_name_en, p.generic_name, p.generic_name_en,
    p.abbreviated_product_name, p.abbreviated_product_name_en
  ];
  for (const val of primaryNames) {
    if (typeof val === 'string' && val.trim() !== '' && val.trim().toLowerCase() !== 'unknown') {
      return val.trim();
    }
  }

  // 2. Scan all properties in the product object for any key containing 'product_name' or 'generic_name'
  for (const key of Object.keys(p)) {
    if ((key.includes('product_name') || key.includes('generic_name')) && typeof p[key] === 'string') {
      const val = p[key].trim();
      if (val !== '' && val.toLowerCase() !== 'unknown') {
        return val;
      }
    }
  }

  // 3. Try fallback to brand + category if title is completely absent
  const brandFallback = extractUniversalBrand(p);
  let categoryFallback = '';
  if (Array.isArray(p.categories_tags) && p.categories_tags.length > 0) {
    categoryFallback = String(p.categories_tags[p.categories_tags.length - 1])
      .replace(/^[a-z]+:/i, '')
      .replace(/-/g, ' ')
      .trim();
  }

  if (brandFallback !== 'Generic Brand' && categoryFallback) {
    return `${brandFallback} (${categoryFallback})`;
  } else if (brandFallback !== 'Generic Brand') {
    return `${brandFallback} Product`;
  } else if (categoryFallback) {
    return categoryFallback.charAt(0).toUpperCase() + categoryFallback.slice(1);
  }

  return 'Scanned Food Item';
}

/**
 * Universally extracts a brand name from ANY field or tag in an OpenFoodFacts product object.
 */
function extractUniversalBrand(p: any): string {
  if (!p || typeof p !== 'object') return 'Generic Brand';

  const primaryBrands = [
    p.brands, p.brand_owner, p.brand_owner_imported, p.brands_imported
  ];
  for (const val of primaryBrands) {
    if (typeof val === 'string' && val.trim() !== '') {
      return val.split(',')[0].trim();
    }
  }

  if (Array.isArray(p.brands_tags) && p.brands_tags.length > 0) {
    const raw = p.brands_tags[0];
    if (typeof raw === 'string' && raw.trim() !== '') {
      return raw.replace(/^[a-z]+:/i, '').replace(/-/g, ' ').trim();
    }
  }

  return 'Generic Brand';
}

export async function lookupOpenFoodFacts(barcode: string, signal: AbortSignal): Promise<ScanResultData | null> {
  const candidates = generateBarcodeCandidates(barcode);

  // 1. Check in-memory session cache first for zero-latency rescan
  for (const cand of candidates) {
    if (productCache.has(cand)) {
      return productCache.get(cand)!;
    }
  }

  let resData: any = null;

  try {
    // ─── PASS 1: Strict OpenFoodFacts v3 Priority across ALL candidates ───
    for (const cand of candidates) {
      if (signal.aborted) return null;

      try {
        const responseV3 = await fetchWithTimeout(
          `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(cand)}.json`,
          API_TIMEOUT_MS,
          signal
        );
        if (signal.aborted) return null;
        if (responseV3.ok) {
          const data = await responseV3.json();
          if (data?.product) {
            resData = data;
            break;
          }
        }
      } catch (e) {
        if (isAbortError(e)) return null;
        console.warn(`OFF v3 query failed for candidate ${cand}`, e);
      }
    }

    // ─── PASS 2: Fallback to OpenFoodFacts v2 ONLY if v3 returned no data ───
    if (!resData?.product) {
      for (const cand of candidates) {
        if (signal.aborted) return null;

        try {
          const responseV2 = await fetchWithTimeout(
            `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cand)}.json`,
            API_TIMEOUT_MS,
            signal
          );
          if (signal.aborted) return null;
          if (responseV2.ok) {
            const data = await responseV2.json();
            if (data?.product) {
              resData = data;
              break;
            }
          }
        } catch (e) {
          if (isAbortError(e)) return null;
          console.warn(`OFF v2 query failed for candidate ${cand}`, e);
        }
      }
    }

    if (!resData?.product) {
      for (const cand of candidates) {
        productCache.set(cand, null);
      }
      return null;
    }

    const p = resData.product;
    const name = extractUniversalName(p);
    const brand = extractUniversalBrand(p);
    const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url || undefined;

    const n = p.nutriments ?? p.nutrition_grades ?? p.nutrition_data ?? {};

    // Authoritative total sugar per 100g
    let sugarPer100g = extractNumberFromKeys(n, [
      'sugars_100g', 'sugars', 'sugars_value', 'sugars-total_100g', 'sugars-total'
    ]) ?? 0;

    // If total sugars is 0 or missing, check added sugars
    if (sugarPer100g === 0) {
      const added = extractNumberFromKeys(n, [
        'added-sugars_100g', 'added-sugars', 'added-sugars_value'
      ]);
      if (added !== undefined && added > 0) sugarPer100g = added;
    }

    // If still 0 or missing, check carbohydrates
    if (sugarPer100g === 0) {
      const carbs = extractNumberFromKeys(n, [
        'carbohydrates_100g', 'carbohydrates', 'carbohydrates_value'
      ]);
      if (carbs !== undefined && carbs > 0) sugarPer100g = carbs;
    }

    const kcal100g = extractNumberFromKeys(n, ['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value', 'energy_100g']) ??
      (extractNumberFromKeys(n, ['energy-kj_100g', 'energy-kj', 'energy_100g']) ? Math.round((extractNumberFromKeys(n, ['energy-kj_100g', 'energy-kj', 'energy_100g']) as number) / 4.184) : undefined);
    const carbs100g = extractNumberFromKeys(n, ['carbohydrates_100g', 'carbohydrates', 'carbohydrates_value']);
    const fat100g = extractNumberFromKeys(n, ['fat_100g', 'fat', 'fat_value']);
    const protein100g = extractNumberFromKeys(n, ['proteins_100g', 'proteins', 'proteins_value']);

    // Determine if product is liquid or solid for accurate "100 g/ml" default serving label
    const rawQuantityStr = String(p.quantity || '').toLowerCase();
    const rawCategoryStr = String((Array.isArray(p.categories_tags) ? p.categories_tags.join(' ') : p.categories) || '').toLowerCase();
    const isLiquid = rawQuantityStr.includes('ml') || rawQuantityStr.includes(' l') || rawQuantityStr.includes('cl') || rawQuantityStr.includes('fl oz') ||
      rawCategoryStr.includes('beverage') || rawCategoryStr.includes('drink') || rawCategoryStr.includes('juice') || rawCategoryStr.includes('soda') || rawCategoryStr.includes('water') || rawCategoryStr.includes('milk') || rawCategoryStr.includes('cola') || rawCategoryStr.includes('beer');
    const defaultUnitLabel = isLiquid ? '100 ml' : '100 g';

    // ─── STEP 1: PER SERVING CALCULATION (Per Serving if not then 100 g/ml must be considered Per serving size) ───
    let servingSugarGrams = extractNumberFromKeys(n, [
      'sugars_serving', 'sugars-total_serving', 'added-sugars_serving'
    ]);
    let calories = extractNumberFromKeys(n, ['energy-kcal_serving']);
    let carbsGrams = extractNumberFromKeys(n, ['carbohydrates_serving']);
    let fatGrams = extractNumberFromKeys(n, ['fat_serving']);
    let proteinGrams = extractNumberFromKeys(n, ['proteins_serving']);

    let servingSize: string | undefined = typeof p.serving_size === 'string' && p.serving_size.trim() !== '' && p.serving_size.trim().toLowerCase() !== 'unknown'
      ? p.serving_size.trim()
      : (typeof p.serving_quantity === 'number' && p.serving_quantity > 0 ? `${p.serving_quantity} ${p.serving_quantity_unit || defaultUnitLabel.split(' ')[1]}` : undefined);

    let isDefaultServing = false;
    const servingWeight = servingSize ? parseQuantityString(servingSize) : null;

    if (servingSize && servingWeight !== null && servingWeight > 0) {
      // Valid explicit serving size! Recalculate serving macros from 100g/ml baseline for 100% mathematical consistency
      if (sugarPer100g !== undefined && sugarPer100g >= 0) {
        servingSugarGrams = parseFloat(((sugarPer100g * servingWeight) / 100).toFixed(1));
      }
      if (kcal100g !== undefined) {
        calories = Math.round((kcal100g * servingWeight) / 100);
      }
      if (carbs100g !== undefined) {
        carbsGrams = parseFloat(((carbs100g * servingWeight) / 100).toFixed(1));
      }
      if (fat100g !== undefined) {
        fatGrams = parseFloat(((fat100g * servingWeight) / 100).toFixed(1));
      }
      if (protein100g !== undefined) {
        proteinGrams = parseFloat(((protein100g * servingWeight) / 100).toFixed(1));
      }
    } else {
      // Per user rule: if not then 100 g/ml must be considered Per serving size, same with per serving sugar, total energy and serving energy!
      isDefaultServing = true;
      servingSize = `${defaultUnitLabel} (Standard)`;
      servingSugarGrams = sugarPer100g;
      calories = kcal100g;
      carbsGrams = carbs100g;
      fatGrams = fat100g;
      proteinGrams = protein100g;
    }

    const finalSugarGrams = servingSugarGrams ?? sugarPer100g;
    const sugarTeaspoons = parseFloat((finalSugarGrams / 4.2).toFixed(1));

    // ─── STEP 3: WHO DAILY LIMIT USAGE (Per Serving Method) ───
    // WHO adult upper daily limit = 50g (approx 12 tsp). Safe/ideal daily limit = 25g (approx 6 tsp).
    const whoLimitServingPercent = Math.min(500, Math.round((sugarTeaspoons / 12) * 100));
    const whoLimitIdealServingPercent = Math.min(500, Math.round((sugarTeaspoons / 6) * 100));

    const categoryTag = Array.isArray(p.categories_tags) && p.categories_tags.length > 0
      ? p.categories_tags[p.categories_tags.length - 1]
      : undefined;

    const ingredientsText = p.ingredients_text_en || p.ingredients_text || undefined;
    const stealthAnalysis = detectStealthSugars(ingredientsText);

    // ── BiteFix: Parse NOVA, Additives, Allergens, Nutri-Score ──
    const rawNova = p.nova_group ?? p.nova_groups ?? undefined;
    const novaClass: NOVAClass | undefined = (rawNova && [1, 2, 3, 4].includes(Number(rawNova))) ? Number(rawNova) as NOVAClass : undefined;

    const additives = parseAdditivesFromProduct(p);
    const additiveCount = additives.length;
    const allergens = parseAllergensFromProduct(p);

    const rawNutriScore = String(p.nutriscore_grade ?? p.nutrition_grades ?? '').toLowerCase();
    const nutriScore: ScanResultData['nutriScore'] = ['a', 'b', 'c', 'd', 'e'].includes(rawNutriScore) ? rawNutriScore as ScanResultData['nutriScore'] : undefined;

    const biteFixScore = computeBiteFixScore({ novaClass, additiveCount, nutriScore, sugarPer100g });

    const resultData: ScanResultData = {
      name,
      brand,
      sugarGrams: finalSugarGrams,
      sugarTeaspoons,
      sugarPer100g,
      imageUrl,
      servingSize,
      calories,
      carbsGrams,
      fatGrams,
      proteinGrams,
      categoryTag,
      isDefaultServing,
      whoLimitServingPercent,
      whoLimitIdealServingPercent,
      ingredientsText,
      hasHiddenSugars: stealthAnalysis.hasHiddenSugars,
      hiddenSugars: stealthAnalysis.matches,
      hiddenSugarCount: stealthAnalysis.hiddenSugarCount,
      novaClass,
      additives,
      additiveCount,
      allergens,
      nutriScore,
      biteFixScore,
    };

    for (const cand of candidates) {
      productCache.set(cand, resultData);
    }

    return resultData;
  } catch (err: any) {
    if (signal.aborted || isAbortError(err)) return null;
    throw err;
  }
}
// ─────────────────────────────────────────────────────────
// Intelligent Substitute Engine (World's Most Advanced Healthy Swaps)
// ─────────────────────────────────────────────────────────

/**
 * Functional archetypes for exact semantic matching across global food categories.
 */
export type FunctionalArchetype =
  | 'soda_cola'
  | 'soda_flavored'
  | 'energy_drink'
  | 'fruit_juice'
  | 'hazelnut_spread'
  | 'nut_butter'
  | 'potato_chips'
  | 'tortilla_chips'
  | 'ketchup_condiment'
  | 'mayo_dressing'
  | 'chocolate_milk'
  | 'chocolate_dark'
  | 'yogurt_greek'
  | 'yogurt_flavored'
  | 'breakfast_cereal'
  | 'granola_bar'
  | 'protein_bar'
  | 'ice_cream'
  | 'plant_milk'
  | 'instant_noodles'
  | 'pasta'
  | 'cookie_biscuit'
  | 'candy_sweet'
  | 'bread_bakery'
  | 'general_snack'
  | 'general_beverage'
  | 'general_pantry'
  | 'no_match';

/**
 * Curated Gold-Standard Branded Healthy Swaps.
 * Ensures that when users scan popular branded items (e.g. Nutella, Coca-Cola, Heinz, Doritos, Cadbury),
 * the system instantly evaluates widely available, best-in-class low-sugar, NOVA 1/2 whole-food/clean-label benchmarks.
 */
const BRANDED_HEALTHY_SWAPS_CATALOG: Record<FunctionalArchetype, ScanResultData[]> = {
  soda_cola: [
    {
      name: 'Zero Calorie Cola (Naturally Sweetened with Stevia)',
      brand: 'Zevia',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/008/527/670/0104/front_en.6.400.jpg',
      servingSize: '355 ml (1 Can)',
      calories: 0,
      carbsGrams: 0,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:colas',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Carbonated Water, Organic Stevia Leaf Extract, Natural Flavors, Citric Acid, Tartaric Acid, Caffeine.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [
        { tag: 'en:e330', displayName: 'Citric Acid (E330)', functionLabel: 'Acidity Regulator', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: [],
      nutriScore: 'b',
      biteFixScore: 92,
    },
    {
      name: 'Prebiotic Vintage Cola (Plant Fiber & Botanical Infusion)',
      brand: 'Olipop',
      sugarGrams: 2,
      sugarTeaspoons: 0.5,
      sugarPer100g: 0.6,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/001/640/0185/front_en.13.400.jpg',
      servingSize: '355 ml (1 Can)',
      calories: 35,
      carbsGrams: 16,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:colas',
      isDefaultServing: false,
      whoLimitServingPercent: 4,
      whoLimitIdealServingPercent: 8,
      ingredientsText: 'Carbonated Water, Olipop Prebiotic Blend (Cassia Root Fiber, Chicory Root, Jerusalem Artichoke, Nopal Cactus, Calendula, Kudzu Root, Marshmallow Root), Cassava Root Syrup, Apple Juice Concentrate, Stevia Leaf, Green Tea Caffeine, Natural Spice Flavors.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 94,
    }
  ],
  soda_flavored: [
    {
      name: 'Prebiotic Strawberry Lemon Soda (Real Juice & Fiber)',
      brand: 'Poppi',
      sugarGrams: 5,
      sugarTeaspoons: 1.2,
      sugarPer100g: 1.4,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/886/900/7133/front_en.16.400.jpg',
      servingSize: '355 ml (1 Can)',
      calories: 25,
      carbsGrams: 7,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:sodas',
      isDefaultServing: false,
      whoLimitServingPercent: 10,
      whoLimitIdealServingPercent: 20,
      ingredientsText: 'Sparkling Water, Organic Apple Cider Vinegar, Organic Strawberry Juice, Organic Lemon Juice, Organic Agave Inulin, Stevia.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 91,
    },
    {
      name: 'Zero Sugar Ginger Ale (Real Botanical Extract)',
      brand: 'Zevia',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/008/527/670/0159/front_en.7.400.jpg',
      servingSize: '355 ml (1 Can)',
      calories: 0,
      carbsGrams: 0,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:sodas',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Carbonated Water, Organic Stevia Leaf Extract, Natural Flavors, Citric Acid, Ginger Extract.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [
        { tag: 'en:e330', displayName: 'Citric Acid (E330)', functionLabel: 'Acidity Regulator', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: [],
      nutriScore: 'b',
      biteFixScore: 92,
    }
  ],
  hazelnut_spread: [
    {
      name: 'Organic Hazelnut & Cocoa Spread (No Palm Oil, Reduced Sugar)',
      brand: 'Rigoni di Asiago Nocciolata',
      sugarGrams: 8.5,
      sugarTeaspoons: 2.0,
      sugarPer100g: 28,
      imageUrl: 'https://images.openfoodfacts.org/images/products/800/150/500/5808/front_en.52.400.jpg',
      servingSize: '30 g (2 tbsp)',
      calories: 162,
      carbsGrams: 15,
      fatGrams: 10,
      proteinGrams: 2.5,
      categoryTag: 'en:hazelnut-spreads',
      isDefaultServing: false,
      whoLimitServingPercent: 17,
      whoLimitIdealServingPercent: 34,
      ingredientsText: 'Cane Sugar, Hazelnut Paste (18.5%), Sunflower Oil, Skimmed Milk Powder, Low-fat Cocoa Powder (6.5%), Cocoa Butter, Vanilla Extract.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: ['Milk', 'Hazelnuts'],
      nutriScore: 'c',
      biteFixScore: 78,
    },
    {
      name: 'Keto Chocolate Hazelnut Spread (No Added Sugar)',
      brand: 'Good Good',
      sugarGrams: 1.2,
      sugarTeaspoons: 0.3,
      sugarPer100g: 4.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/569/058/400/0309/front_en.11.400.jpg',
      servingSize: '30 g (2 tbsp)',
      calories: 140,
      carbsGrams: 14,
      fatGrams: 11,
      proteinGrams: 2.0,
      categoryTag: 'en:hazelnut-spreads',
      isDefaultServing: false,
      whoLimitServingPercent: 2,
      whoLimitIdealServingPercent: 5,
      ingredientsText: 'Sweeteners (Maltitol, Steviol Glycosides), Vegetable Oil (Shea, Rapeseed), Hazelnuts (13%), Low-fat Cocoa Powder (6%), Skimmed Milk Powder, Sunflower Lecithin.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 3,
      additives: [
        { tag: 'en:e322i', displayName: 'Sunflower Lecithin (E322i)', functionLabel: 'Emulsifier', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: ['Hazelnuts', 'Milk'],
      nutriScore: 'b',
      biteFixScore: 84,
    }
  ],
  nut_butter: [
    {
      name: 'Only 2 Ingredients Peanut Butter (100% Roasted Peanuts & Sea Salt)',
      brand: 'Crazy Richard\'s / Whole Food Pure',
      sugarGrams: 1.0,
      sugarTeaspoons: 0.2,
      sugarPer100g: 3.5,
      imageUrl: 'https://images.openfoodfacts.org/images/products/007/800/011/3342/front_en.12.400.jpg',
      servingSize: '32 g (2 tbsp)',
      calories: 190,
      carbsGrams: 5,
      fatGrams: 16,
      proteinGrams: 8,
      categoryTag: 'en:peanut-butters',
      isDefaultServing: false,
      whoLimitServingPercent: 2,
      whoLimitIdealServingPercent: 4,
      ingredientsText: 'Dry Roasted Peanuts, Sea Salt.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: ['Peanuts'],
      nutriScore: 'a',
      biteFixScore: 98,
    }
  ],
  potato_chips: [
    {
      name: 'Avocado Oil Kettle Cooked Potato Chips (Sea Salt)',
      brand: 'Good Health / Boulder Canyon',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0.5,
      imageUrl: 'https://images.openfoodfacts.org/images/products/002/836/800/1271/front_en.14.400.jpg',
      servingSize: '28 g (1 oz)',
      calories: 150,
      carbsGrams: 16,
      fatGrams: 8,
      proteinGrams: 2,
      categoryTag: 'en:potato-crisps',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Potatoes, Pure Avocado Oil, Sea Salt.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'b',
      biteFixScore: 90,
    }
  ],
  tortilla_chips: [
    {
      name: 'Grain Free Cassava & Avocado Oil Tortilla Chips (Sea Salt)',
      brand: 'Siete',
      sugarGrams: 0.5,
      sugarTeaspoons: 0.1,
      sugarPer100g: 1.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/916/000/6016/front_en.21.400.jpg',
      servingSize: '28 g (1 oz)',
      calories: 130,
      carbsGrams: 19,
      fatGrams: 6,
      proteinGrams: 1,
      categoryTag: 'en:tortilla-chips',
      isDefaultServing: false,
      whoLimitServingPercent: 1,
      whoLimitIdealServingPercent: 2,
      ingredientsText: 'Cassava Flour, Avocado Oil, Coconut Flour, Chia Seed, Sea Salt.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'b',
      biteFixScore: 93,
    }
  ],
  ketchup_condiment: [
    {
      name: 'Organic Unsweetened Ketchup (No Added Sugar or HFCS)',
      brand: 'Primal Kitchen',
      sugarGrams: 1.0,
      sugarTeaspoons: 0.2,
      sugarPer100g: 6.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/528/000/6325/front_en.16.400.jpg',
      servingSize: '15 g (1 tbsp)',
      calories: 10,
      carbsGrams: 2,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:ketchups',
      isDefaultServing: false,
      whoLimitServingPercent: 2,
      whoLimitIdealServingPercent: 4,
      ingredientsText: 'Organic Tomato Puree, Organic Balsamic Vinegar, Organic Apple Cider Vinegar, Organic Sea Salt, Organic Onion Powder, Organic Garlic Powder, Organic Spices.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 97,
    }
  ],
  mayo_dressing: [
    {
      name: '100% Avocado Oil Mayonnaise (Real Eggs, No Seed Oils)',
      brand: 'Chosen Foods / Primal Kitchen',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/528/000/6011/front_en.24.400.jpg',
      servingSize: '14 g (1 tbsp)',
      calories: 100,
      carbsGrams: 0,
      fatGrams: 11,
      proteinGrams: 0,
      categoryTag: 'en:mayonnaises',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Avocado Oil, Organic Cage-Free Eggs, Organic Egg Yolks, Organic Vinegar, Sea Salt, Organic Rosemary Extract.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: ['Eggs'],
      nutriScore: 'b',
      biteFixScore: 91,
    }
  ],
  chocolate_dark: [
    {
      name: '85% Cocoa Extra Dark Pure Chocolate (Super Low Sugar)',
      brand: 'Lindt Excellence / Hu Kitchen',
      sugarGrams: 2.2,
      sugarTeaspoons: 0.5,
      sugarPer100g: 11,
      imageUrl: 'https://images.openfoodfacts.org/images/products/304/692/002/8363/front_en.64.400.jpg',
      servingSize: '20 g (2 Squares)',
      calories: 120,
      carbsGrams: 4,
      fatGrams: 10,
      proteinGrams: 2.5,
      categoryTag: 'en:dark-chocolates',
      isDefaultServing: false,
      whoLimitServingPercent: 4,
      whoLimitIdealServingPercent: 9,
      ingredientsText: 'Chocolate Mass, Cocoa Butter, Fat-Reduced Cocoa Powder, Raw Cane Sugar, Bourbon Vanilla.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'c',
      biteFixScore: 88,
    },
    {
      name: 'No Sugar Added Dark Chocolate Squares (Monk Fruit Sweetened)',
      brand: 'ChocZero',
      sugarGrams: 0.2,
      sugarTeaspoons: 0,
      sugarPer100g: 1.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/846/100/7010/front_en.11.400.jpg',
      servingSize: '20 g',
      calories: 80,
      carbsGrams: 10,
      fatGrams: 7,
      proteinGrams: 1,
      categoryTag: 'en:dark-chocolates',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 1,
      ingredientsText: 'Dark Chocolate (Cocoa Liquor, Cocoa Butter), Soluble Corn Fiber, Monk Fruit Extract, Vanilla Bean.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 3,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'b',
      biteFixScore: 86,
    }
  ],
  chocolate_milk: [
    {
      name: 'No Sugar Added Creamy Milk Chocolate Style Bar',
      brand: 'Lily\'s Sweets',
      sugarGrams: 0.5,
      sugarTeaspoons: 0.1,
      sugarPer100g: 1.8,
      imageUrl: 'https://images.openfoodfacts.org/images/products/081/444/002/0064/front_en.18.400.jpg',
      servingSize: '28 g (1/3 Bar)',
      calories: 130,
      carbsGrams: 16,
      fatGrams: 11,
      proteinGrams: 2,
      categoryTag: 'en:milk-chocolates',
      isDefaultServing: false,
      whoLimitServingPercent: 1,
      whoLimitIdealServingPercent: 2,
      ingredientsText: 'Unsweetened Cocoa, Cocoa Butter, Erythritol, Chicory Root Fiber, Dextrin, Whole Milk Powder, Milk Fat, Sunflower Lecithin, Stevia Extract, Vanilla.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 3,
      additives: [
        { tag: 'en:e322i', displayName: 'Sunflower Lecithin (E322i)', functionLabel: 'Emulsifier', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: ['Milk'],
      nutriScore: 'b',
      biteFixScore: 85,
    }
  ],
  yogurt_greek: [
    {
      name: 'Total 0% Pure Greek Strained Yogurt (Plain, No Added Sugar)',
      brand: 'Fage / Chobani Zero',
      sugarGrams: 3.0,
      sugarTeaspoons: 0.7,
      sugarPer100g: 3.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/520/105/401/1018/front_en.44.400.jpg',
      servingSize: '150 g',
      calories: 80,
      carbsGrams: 4.5,
      fatGrams: 0,
      proteinGrams: 15,
      categoryTag: 'en:greek-yogurts',
      isDefaultServing: false,
      whoLimitServingPercent: 6,
      whoLimitIdealPercent: 12,
      whoLimitIdealServingPercent: 12,
      ingredientsText: 'Pasteurized Skimmed Milk, Live Active Yogurt Cultures (L. Bulgaricus, S. Thermophilus, L. Acidophilus, Bifidus).',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: ['Milk'],
      nutriScore: 'a',
      biteFixScore: 98,
    } as any
  ],
  yogurt_flavored: [
    {
      name: 'Zero Sugar Vanilla / Berry Greek Yogurt (No Artificial Sweeteners)',
      brand: 'Two Good / Chobani Zero Sugar',
      sugarGrams: 2.0,
      sugarTeaspoons: 0.5,
      sugarPer100g: 1.5,
      imageUrl: 'https://images.openfoodfacts.org/images/products/003/663/203/8354/front_en.14.400.jpg',
      servingSize: '150 g',
      calories: 80,
      carbsGrams: 3,
      fatGrams: 2,
      proteinGrams: 12,
      categoryTag: 'en:yogurts',
      isDefaultServing: false,
      whoLimitServingPercent: 4,
      whoLimitIdealServingPercent: 8,
      ingredientsText: 'Cultured Reduced Fat Milk, Water, Less than 1% of Natural Flavors, Tapioca Starch, Lemon Juice Concentrate, Stevia Leaf Extract.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: ['Milk'],
      nutriScore: 'a',
      biteFixScore: 92,
    }
  ],
  breakfast_cereal: [
    {
      name: 'Zero Sugar Cinnamon Toast / Dark Chocolate Keto Cereal',
      brand: 'Catalina Crunch',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/001/818/0017/front_en.11.400.jpg',
      servingSize: '36 g (1/2 Cup)',
      calories: 110,
      carbsGrams: 14,
      fatGrams: 5,
      proteinGrams: 11,
      categoryTag: 'en:breakfast-cereals',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Catalina Flour (Pea Protein, Potato Fiber, Non-GMO Corn Fiber, Chicory Root Fiber, Guar Gum), High Oleic Sunflower Oil, Cinnamon, Baking Powder, Natural Flavors, Stevia Extract.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 3,
      additives: [
        { tag: 'en:e412', displayName: 'Guar Gum (E412)', functionLabel: 'Thickener', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 89,
    }
  ],
  granola_bar: [
    {
      name: 'Whole Food Fruit & Nut Bar (No Added Sugar, Simple Ingredients)',
      brand: 'LÄRABAR / Autumn\'s Gold',
      sugarGrams: 16,
      sugarTeaspoons: 3.8,
      sugarPer100g: 35,
      imageUrl: 'https://images.openfoodfacts.org/images/products/008/410/500/0316/front_en.21.400.jpg',
      servingSize: '45 g (1 Bar)',
      calories: 200,
      carbsGrams: 24,
      fatGrams: 11,
      proteinGrams: 5,
      categoryTag: 'en:cereal-bars',
      isDefaultServing: false,
      whoLimitServingPercent: 32,
      whoLimitIdealServingPercent: 64,
      ingredientsText: 'Dates, Peanuts, Sea Salt. (No refined sugar, sweetened only with real dates).',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: ['Peanuts'],
      nutriScore: 'b',
      biteFixScore: 88,
    }
  ],
  protein_bar: [
    {
      name: 'Real Food Egg White & Nut Protein Bar (No Refined Sugars)',
      brand: 'RXBAR',
      sugarGrams: 13,
      sugarTeaspoons: 3.1,
      sugarPer100g: 25,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/777/700/4232/front_en.36.400.jpg',
      servingSize: '52 g (1 Bar)',
      calories: 210,
      carbsGrams: 23,
      fatGrams: 8,
      proteinGrams: 12,
      categoryTag: 'en:protein-bars',
      isDefaultServing: false,
      whoLimitServingPercent: 26,
      whoLimitIdealServingPercent: 52,
      ingredientsText: 'Dates, Egg Whites, Almonds, Cashews, Cocoa, Natural Flavors, Sea Salt.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: ['Eggs', 'Almonds', 'Cashews'],
      nutriScore: 'b',
      biteFixScore: 92,
    }
  ],
  energy_drink: [
    {
      name: 'Zero Sugar Clean Natural Caffeine Energy Drink',
      brand: 'CELSIUS / Zevia Energy',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/088/936/400/1826/front_en.16.400.jpg',
      servingSize: '355 ml (1 Can)',
      calories: 10,
      carbsGrams: 2,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:energy-drinks',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Carbonated Water, Green Tea Extract, Guarana Extract, Ginger Root, Natural Flavors, Citric Acid, Stevia Leaf Extract.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [
        { tag: 'en:e330', displayName: 'Citric Acid (E330)', functionLabel: 'Acidity Regulator', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: [],
      nutriScore: 'b',
      biteFixScore: 89,
    }
  ],
  fruit_juice: [
    {
      name: 'Organic Pressed Pure Tart Cherry / Lemon Infused Mineral Water',
      brand: 'Lakewood / Spindrift',
      sugarGrams: 1,
      sugarTeaspoons: 0.2,
      sugarPer100g: 0.3,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/819/200/2153/front_en.15.400.jpg',
      servingSize: '355 ml',
      calories: 15,
      carbsGrams: 3,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:fruit-juices',
      isDefaultServing: false,
      whoLimitServingPercent: 2,
      whoLimitIdealServingPercent: 4,
      ingredientsText: 'Carbonated Water, Real Squeezed Fruit Juice (Lemon/Berry/Cherry). No added sugar, concentrates, or artificial flavors.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 96,
    }
  ],
  ice_cream: [
    {
      name: 'No Sugar Added Vanilla & Almond Keto Ice Cream Bar',
      brand: 'Nick\'s / Rebel',
      sugarGrams: 1.5,
      sugarTeaspoons: 0.4,
      sugarPer100g: 3.5,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/888/800/6249/front_en.18.400.jpg',
      servingSize: '70 g (1 Bar)',
      calories: 140,
      carbsGrams: 11,
      fatGrams: 11,
      proteinGrams: 3,
      categoryTag: 'en:ice-creams',
      isDefaultServing: false,
      whoLimitServingPercent: 3,
      whoLimitIdealServingPercent: 6,
      ingredientsText: 'Cream, Water, Almonds, Soluble Corn Fiber, Allulose, Erythritol, Egg Yolks, Natural Vanilla Flavor, Guar Gum, Stevia.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 3,
      additives: [
        { tag: 'en:e412', displayName: 'Guar Gum (E412)', functionLabel: 'Thickener', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: ['Milk', 'Eggs', 'Almonds'],
      nutriScore: 'b',
      biteFixScore: 84,
    }
  ],
  plant_milk: [
    {
      name: 'Organic Unsweetened Almond / Oat Milk (Only 3 Ingredients)',
      brand: 'Malk / Elmhurst 1925',
      sugarGrams: 1,
      sugarTeaspoons: 0.2,
      sugarPer100g: 0.4,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/688/500/5049/front_en.11.400.jpg',
      servingSize: '240 ml (1 Cup)',
      calories: 40,
      carbsGrams: 2,
      fatGrams: 3.5,
      proteinGrams: 2,
      categoryTag: 'en:plant-milks',
      isDefaultServing: false,
      whoLimitServingPercent: 2,
      whoLimitIdealServingPercent: 4,
      ingredientsText: 'Filtered Water, Organic Almonds (or Oats), Sea Salt. (No gums, oils, or added sugars).',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: ['Almonds'],
      nutriScore: 'a',
      biteFixScore: 97,
    }
  ],
  general_snack: [
    {
      name: 'Dry Roasted Light Sea Salted Mixed Nuts (100% Whole Food)',
      brand: 'Kirkland Signature / Pure Whole Foods',
      sugarGrams: 1.5,
      sugarTeaspoons: 0.4,
      sugarPer100g: 4.5,
      imageUrl: 'https://images.openfoodfacts.org/images/products/009/661/992/6401/front_en.44.400.jpg',
      servingSize: '30 g (1 Handful)',
      calories: 180,
      carbsGrams: 6,
      fatGrams: 16,
      proteinGrams: 6,
      categoryTag: 'en:nuts',
      isDefaultServing: false,
      whoLimitServingPercent: 3,
      whoLimitIdealServingPercent: 6,
      ingredientsText: 'Almonds, Cashews, Pecans, Macadamia Nuts, Sea Salt.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: ['Tree Nuts'],
      nutriScore: 'a',
      biteFixScore: 96,
    }
  ],
  general_beverage: [
    {
      name: 'Sparkling Infused Botanical Water (Zero Calories, No Sugar)',
      brand: 'Spindrift / Waterloo',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/819/200/2153/front_en.15.400.jpg',
      servingSize: '355 ml',
      calories: 0,
      carbsGrams: 0,
      fatGrams: 0,
      proteinGrams: 0,
      categoryTag: 'en:waters',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Purified Carbonated Water, Real Fruit Puree & Extracts.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 98,
    }
  ],
  general_pantry: [
    {
      name: 'Cold Pressed Extra Virgin Olive Oil / Avocado Oil (100% Pure)',
      brand: 'California Olive Ranch / Chosen Foods',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/176/600/1018/front_en.16.400.jpg',
      servingSize: '15 ml (1 tbsp)',
      calories: 120,
      carbsGrams: 0,
      fatGrams: 14,
      proteinGrams: 0,
      categoryTag: 'en:olive-oils',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: '100% First Cold Pressed Olive Oil.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 98,
    }
  ],
  instant_noodles: [
    {
      name: 'Organic Brown Rice Ramen Noodles (No MSG, Whole Grain)',
      brand: 'Lotus Foods',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0.5,
      imageUrl: 'https://images.openfoodfacts.org/images/products/002/311/900/3193/front_en.34.400.jpg',
      servingSize: '85 g (1 Block)',
      calories: 300,
      carbsGrams: 64,
      fatGrams: 1.5,
      proteinGrams: 7,
      categoryTag: 'en:instant-noodles',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 1,
      ingredientsText: 'Organic Brown Rice Flour, Organic Rice Bran, Water. No MSG, No Artificial Flavors.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'b',
      biteFixScore: 88,
    },
    {
      name: 'Konjac Shirataki Noodles (Zero Calories, Zero Carbs)',
      brand: 'Miracle Noodle / Skinny Pasta',
      sugarGrams: 0,
      sugarTeaspoons: 0,
      sugarPer100g: 0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/999/700/0201/front_en.9.400.jpg',
      servingSize: '113 g (1 Serving)',
      calories: 10,
      carbsGrams: 2,
      fatGrams: 0,
      proteinGrams: 1,
      categoryTag: 'en:pasta',
      isDefaultServing: false,
      whoLimitServingPercent: 0,
      whoLimitIdealServingPercent: 0,
      ingredientsText: 'Purified Water, Konjac Flour (Glucomannan), Calcium Hydroxide. No MSG, No Gluten.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 96,
    },
    {
      name: 'Miso Broth Ramen With Brown Rice Noodles (No Preservatives)',
      brand: 'Koyo',
      sugarGrams: 2,
      sugarTeaspoons: 0.5,
      sugarPer100g: 2.5,
      imageUrl: 'https://images.openfoodfacts.org/images/products/004/099/100/0132/front_en.12.400.jpg',
      servingSize: '64 g (1 Pack)',
      calories: 220,
      carbsGrams: 45,
      fatGrams: 2.5,
      proteinGrams: 7,
      categoryTag: 'en:instant-noodles',
      isDefaultServing: false,
      whoLimitServingPercent: 4,
      whoLimitIdealServingPercent: 8,
      ingredientsText: 'Organic Brown Rice Noodles, Organic Miso Paste, Organic Kombu, Organic Ginger, Sea Vegetables, Organic Tamari Soy Sauce. No MSG.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: ['Soy', 'Wheat'],
      nutriScore: 'b',
      biteFixScore: 84,
    },
  ],
  pasta: [
    {
      name: 'Organic Whole Wheat Spaghetti (100% Whole Grain)',
      brand: 'Barilla / DeLallo',
      sugarGrams: 0.5,
      sugarTeaspoons: 0.1,
      sugarPer100g: 2.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/007/680/402/0139/front_en.34.400.jpg',
      servingSize: '56 g (2 oz dry)',
      calories: 180,
      carbsGrams: 38,
      fatGrams: 1.5,
      proteinGrams: 7,
      categoryTag: 'en:pastas',
      isDefaultServing: false,
      whoLimitServingPercent: 1,
      whoLimitIdealServingPercent: 2,
      ingredientsText: 'Organic Whole Durum Wheat Semolina.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: ['Wheat'],
      nutriScore: 'a',
      biteFixScore: 92,
    },
    {
      name: 'Red Lentil Pasta (High Protein, Grain Free, Single Ingredient)',
      brand: 'Tolerant / Banza',
      sugarGrams: 1,
      sugarTeaspoons: 0.2,
      sugarPer100g: 3.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/668/300/1023/front_en.26.400.jpg',
      servingSize: '57 g (2 oz dry)',
      calories: 190,
      carbsGrams: 32,
      fatGrams: 1.5,
      proteinGrams: 14,
      categoryTag: 'en:pastas',
      isDefaultServing: false,
      whoLimitServingPercent: 2,
      whoLimitIdealServingPercent: 4,
      ingredientsText: 'Organic Red Lentil Flour. Single ingredient, high fiber, high protein.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 1,
      additives: [],
      additiveCount: 0,
      allergens: [],
      nutriScore: 'a',
      biteFixScore: 95,
    },
  ],
  cookie_biscuit: [
    {
      name: 'Almond Flour Shortbread Cookies (No Refined Sugar)',
      brand: 'Simple Mills',
      sugarGrams: 5,
      sugarTeaspoons: 1.2,
      sugarPer100g: 18,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/817/600/5018/front_en.31.400.jpg',
      servingSize: '28 g (4 Cookies)',
      calories: 130,
      carbsGrams: 15,
      fatGrams: 7,
      proteinGrams: 2,
      categoryTag: 'en:cookies',
      isDefaultServing: false,
      whoLimitServingPercent: 10,
      whoLimitIdealServingPercent: 20,
      ingredientsText: 'Almond Flour, Arrowroot, Coconut Sugar, Coconut Oil, Sea Salt, Baking Soda.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: ['Almonds'],
      nutriScore: 'c',
      biteFixScore: 82,
    },
    {
      name: 'Dark Chocolate Hazelnut Keto Cookies (No Sugar Added)',
      brand: 'Catalina Crunch / HighKey',
      sugarGrams: 1,
      sugarTeaspoons: 0.2,
      sugarPer100g: 4.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/085/001/818/0072/front_en.4.400.jpg',
      servingSize: '28 g',
      calories: 100,
      carbsGrams: 9,
      fatGrams: 7,
      proteinGrams: 5,
      categoryTag: 'en:cookies',
      isDefaultServing: false,
      whoLimitServingPercent: 2,
      whoLimitIdealServingPercent: 4,
      ingredientsText: 'Almond Flour, Pea Protein, Whey Protein Isolate, Sunflower Oil, Natural Flavors, Stevia, Monk Fruit.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 3,
      additives: [],
      additiveCount: 0,
      allergens: ['Milk', 'Tree Nuts'],
      nutriScore: 'b',
      biteFixScore: 80,
    },
  ],
  candy_sweet: [
    {
      name: 'No Sugar Added Dark Chocolate Almonds (Keto Friendly)',
      brand: 'Lily\'s Sweets',
      sugarGrams: 0.5,
      sugarTeaspoons: 0.1,
      sugarPer100g: 2.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/081/444/002/0132/front_en.10.400.jpg',
      servingSize: '28 g',
      calories: 160,
      carbsGrams: 12,
      fatGrams: 13,
      proteinGrams: 4,
      categoryTag: 'en:candies',
      isDefaultServing: false,
      whoLimitServingPercent: 1,
      whoLimitIdealServingPercent: 2,
      ingredientsText: 'Almonds, Cocoa Butter, Milk Fat, Erythritol, Inulin, Cocoa Powder, Stevia Extract, Sunflower Lecithin, Vanilla.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 3,
      additives: [
        { tag: 'en:e322i', displayName: 'Sunflower Lecithin (E322i)', functionLabel: 'Emulsifier', riskLevel: 'low' }
      ],
      additiveCount: 1,
      allergens: ['Milk', 'Almonds'],
      nutriScore: 'b',
      biteFixScore: 82,
    },
  ],
  bread_bakery: [
    {
      name: 'Organic Sourdough Whole Grain Bread (Live Cultures, No Additives)',
      brand: 'Dave\'s Killer Bread / Base Culture',
      sugarGrams: 3,
      sugarTeaspoons: 0.7,
      sugarPer100g: 6.0,
      imageUrl: 'https://images.openfoodfacts.org/images/products/001/310/096/9519/front_en.36.400.jpg',
      servingSize: '45 g (2 Slices)',
      calories: 120,
      carbsGrams: 22,
      fatGrams: 1.5,
      proteinGrams: 5,
      categoryTag: 'en:breads',
      isDefaultServing: false,
      whoLimitServingPercent: 6,
      whoLimitIdealServingPercent: 12,
      ingredientsText: 'Organic Whole Wheat Flour, Water, Organic Cane Sugar, Organic Rye Flour, Sea Salt, Organic Sourdough Culture. No artificial preservatives or additives.',
      hasHiddenSugars: false,
      hiddenSugars: [],
      hiddenSugarCount: 0,
      novaClass: 2,
      additives: [],
      additiveCount: 0,
      allergens: ['Wheat'],
      nutriScore: 'b',
      biteFixScore: 84,
    },
  ],
  no_match: [],
};

/**
 * Deduce functional archetype from semantic keywords and category tags.
 */
export function deduceFunctionalArchetype(name: string, brand: string, categoryTag?: string): { archetype: FunctionalArchetype; searchKeywords: string } {
  const combined = `${name} ${brand} ${categoryTag || ''}`.toLowerCase();

  // Juices — MUST come before soda checks (Tropicana is owned by PepsiCo!)
  if (combined.includes('juice') || combined.includes('lemonade') || combined.includes('cider') || combined.includes('nectar') ||
    categoryTag?.includes('juice') || categoryTag?.includes('lemonade') || categoryTag?.includes('cider')) {
    return { archetype: 'fruit_juice', searchKeywords: 'organic pressed fruit water unsweetened' };
  }

  // Sodas & Beverages
  if (combined.includes('cola') || combined.includes('coke') || combined.includes('pepsi') || combined.includes('dr pepper') || combined.includes('en:colas')) {
    return { archetype: 'soda_cola', searchKeywords: 'zero sugar cola stevia olipop zevia' };
  }
  if (combined.includes('soda') || combined.includes('sprite') || combined.includes('fanta') || combined.includes('7up') || combined.includes('sparkling water') || combined.includes('carbonated drink')) {
    return { archetype: 'soda_flavored', searchKeywords: 'prebiotic soda zero sugar sparkling poppi' };
  }
  if (combined.includes('energy') || combined.includes('red bull') || combined.includes('monster') || combined.includes('celsius') || combined.includes('en:energy-drinks')) {
    return { archetype: 'energy_drink', searchKeywords: 'clean natural energy drink zero sugar' };
  }

  // Spreads & Nut Butters
  if (combined.includes('nutella') || combined.includes('hazelnut spread') || combined.includes('chocolate spread') || combined.includes('nocciolata')) {
    return { archetype: 'hazelnut_spread', searchKeywords: 'no sugar hazelnut cocoa spread rigoni good good' };
  }
  if (combined.includes('peanut butter') || combined.includes('almond butter') || combined.includes('cashew butter') || combined.includes('jif') || combined.includes('skippy')) {
    return { archetype: 'nut_butter', searchKeywords: 'pure organic peanut butter only peanuts sea salt' };
  }

  // Snacks & Chips
  if (combined.includes('potato chip') || combined.includes('crisp') || combined.includes('lays') || combined.includes('ruffles') || combined.includes('pringles') || combined.includes('en:potato-crisps')) {
    return { archetype: 'potato_chips', searchKeywords: 'avocado oil kettle cooked potato chips sea salt' };
  }
  if (combined.includes('tortilla') || combined.includes('nacho') || combined.includes('doritos') || combined.includes('tostitos') || combined.includes('corn chip')) {
    return { archetype: 'tortilla_chips', searchKeywords: 'grain free cassava avocado oil tortilla chips' };
  }

  // Condiments & Dressings
  if (combined.includes('ketchup') || combined.includes('catsup') || combined.includes('tomato sauce') || combined.includes('heinz')) {
    return { archetype: 'ketchup_condiment', searchKeywords: 'unsweetened organic ketchup primal kitchen' };
  }
  if (combined.includes('mayo') || combined.includes('mayonnaise') || combined.includes('hellmann') || combined.includes('miracle whip') || combined.includes('ranch')) {
    return { archetype: 'mayo_dressing', searchKeywords: 'avocado oil organic mayo chosen foods' };
  }

  // Chocolates & Sweets
  if (combined.includes('milk chocolate') || combined.includes('dairy milk') || combined.includes('hershey') || combined.includes('m&m') || combined.includes('snickers')) {
    return { archetype: 'chocolate_milk', searchKeywords: 'no sugar added milk chocolate stevia erythritol' };
  }
  if (combined.includes('dark chocolate') || combined.includes('cocoa bar') || combined.includes('lindt') || combined.includes('ghirardelli')) {
    return { archetype: 'chocolate_dark', searchKeywords: '85% extra dark pure chocolate no sugar' };
  }

  // Yogurts & Dairy
  if (combined.includes('greek yogurt') || combined.includes('chobani') || combined.includes('fage') || combined.includes('oikos') || combined.includes('skyr')) {
    return { archetype: 'yogurt_greek', searchKeywords: 'total 0% plain greek yogurt no added sugar' };
  }
  if (combined.includes('yogurt') || combined.includes('yoplait') || combined.includes('dannon') || combined.includes('kefir')) {
    return { archetype: 'yogurt_flavored', searchKeywords: 'zero sugar berry vanilla yogurt two good' };
  }

  // Instant Noodles & Ramen (MUST come before generic pasta check)
  if (
    combined.includes('noodle') || combined.includes('ramen') || combined.includes('ramyun') ||
    combined.includes('ramyeon') || combined.includes('ramyon') || combined.includes('instant soup') ||
    combined.includes('nongshim') || combined.includes('nissin') || combined.includes('maruchan') ||
    combined.includes('shin ramyun') || combined.includes('cup noodle') || combined.includes('top ramen') ||
    combined.includes('mi goreng') || combined.includes('indomie') || combined.includes('samyang') ||
    combined.includes('ottogi') || combined.includes('buldak') || combined.includes('kimchi ramen') ||
    combined.includes('spicy noodle') || combined.includes('vermicelli') ||
    categoryTag?.includes('instant-noodle') || categoryTag?.includes('ramen') || categoryTag?.includes('noodle')
  ) {
    return { archetype: 'instant_noodles', searchKeywords: 'organic brown rice ramen noodles no msg konjac shirataki' };
  }

  // Pasta
  if (
    combined.includes('pasta') || combined.includes('spaghetti') || combined.includes('penne') ||
    combined.includes('fettuccine') || combined.includes('linguine') || combined.includes('macaroni') ||
    combined.includes('lasagna') || combined.includes('rigatoni') || combined.includes('fusilli') ||
    categoryTag?.includes('pasta')
  ) {
    return { archetype: 'pasta', searchKeywords: 'organic whole wheat pasta red lentil chickpea high fiber' };
  }

  // Cookies & Biscuits
  if (
    combined.includes('cookie') || combined.includes('biscuit') || combined.includes('oreo') ||
    combined.includes('digestive') || combined.includes('wafer') || combined.includes('crackers') ||
    combined.includes('shortbread') || combined.includes('nabisco') ||
    categoryTag?.includes('cookie') || categoryTag?.includes('biscuit')
  ) {
    return { archetype: 'cookie_biscuit', searchKeywords: 'almond flour no sugar cookie simple mills' };
  }

  // Candy & Sweets
  if (
    combined.includes('candy') || combined.includes('gummy') || combined.includes('lollipop') ||
    combined.includes('toffee') || combined.includes('caramel candy') || combined.includes('haribo') ||
    combined.includes('skittles') || combined.includes('starburst') || combined.includes('jelly bean') ||
    categoryTag?.includes('candies') || categoryTag?.includes('confection')
  ) {
    return { archetype: 'candy_sweet', searchKeywords: 'no sugar dark chocolate keto candy stevia erythritol' };
  }

  // Bread & Bakery
  if (
    combined.includes('bread') || combined.includes('loaf') || combined.includes('bagel') ||
    combined.includes('muffin') || combined.includes('roll') || combined.includes('bun') ||
    combined.includes('sourdough') || combined.includes('white bread') || combined.includes('wonder bread') ||
    categoryTag?.includes('bread') || categoryTag?.includes('bakery')
  ) {
    return { archetype: 'bread_bakery', searchKeywords: 'organic sourdough whole grain bread no additives' };
  }

  // Breakfast Cereals & Bars
  if (combined.includes('cereal') || combined.includes('granola') || combined.includes('corn flakes') || combined.includes('frosted') || combined.includes('cheerios') || combined.includes('froot loops')) {
    return { archetype: 'breakfast_cereal', searchKeywords: 'keto zero sugar cereal catalina crunch' };
  }
  if (combined.includes('protein bar') || combined.includes('quest') || combined.includes('rxbar') || combined.includes('clif bar')) {
    return { archetype: 'protein_bar', searchKeywords: 'whole food egg white nut protein bar rxbar' };
  }
  if (combined.includes('bar') || combined.includes('nutri-grain') || combined.includes('snack bar') || combined.includes('larabar')) {
    return { archetype: 'granola_bar', searchKeywords: 'fruit and nut bar simple ingredients larabar' };
  }

  // Ice Cream & Desserts
  if (combined.includes('ice cream') || combined.includes('gelato') || combined.includes('sorbet') || combined.includes('haagen-dazs') || combined.includes('ben & jerry')) {
    return { archetype: 'ice_cream', searchKeywords: 'no sugar added keto ice cream rebel nicks' };
  }

  // Plant Milks & Dairy Alternatives
  if (combined.includes('almond milk') || combined.includes('oat milk') || combined.includes('soy milk') || combined.includes('coconut milk') || combined.includes('oatly')) {
    return { archetype: 'plant_milk', searchKeywords: 'organic unsweetened 3 ingredient almond oat milk' };
  }

  // Category Tag fallbacks (only for items that clearly match the category)
  if (categoryTag?.includes('beverage') || categoryTag?.includes('drink') || categoryTag?.includes('water')) {
    return { archetype: 'general_beverage', searchKeywords: 'unsweetened botanical sparkling water' };
  }
  if (categoryTag?.includes('snack') || categoryTag?.includes('crisp') || categoryTag?.includes('nut')) {
    return { archetype: 'general_snack', searchKeywords: 'dry roasted mixed nuts sea salt pure' };
  }

  // CRITICAL: Return no_match instead of unrelated category catch-all.
  // It is better to say "no substitute found" than to suggest a completely wrong food (e.g. olive oil for noodles).
  return { archetype: 'no_match', searchKeywords: '' };
}

/**
 * Computes an advanced Superiority Index for ranking candidate alternatives against an unhealthy original.
 * Rewards major step-downs in NOVA classification, elimination of sugar, purging of chemical additives,
 * absence of stealth sugars, and strong commercial brand presence.
 */
export function computeSuperiorityIndex(original: Partial<ScanResultData>, candidate: ScanResultData): number {
  const origSugar = original.sugarPer100g ?? original.sugarGrams ?? 30;
  const origNova = original.novaClass ?? 4;
  const origAdditives = original.additiveCount ?? (original.additives?.length || 5);
  const origElevated = (original.additives || []).filter(a => a.riskLevel === 'elevated').length;
  const origScore = original.biteFixScore ?? 45;

  const candSugar = candidate.sugarPer100g ?? candidate.sugarGrams ?? 0;
  const candNova = candidate.novaClass ?? 2;
  const candAdditives = candidate.additiveCount ?? (candidate.additives?.length || 0);
  const candElevated = (candidate.additives || []).filter(a => a.riskLevel === 'elevated').length;
  const candScore = candidate.biteFixScore ?? 85;

  // 1. BiteFix Score Differential (Weight: x1.5)
  const deltaScore = (candScore - origScore) * 1.5;

  // 2. NOVA Processing Transformation (Weight: +35 pts per tier improved towards NOVA 1)
  const deltaNova = (origNova - candNova) * 35;

  // 3. Sugar Reduction Boost (Weight: +3 pts per gram of sugar eliminated per 100g)
  const sugarReduced = Math.max(0, origSugar - candSugar);
  const deltaSugar = sugarReduced * 3.0;

  // 4. Additive & Chemical Purge (Weight: +12 pts per additive eliminated, +45 pts per elevated chemical eliminated)
  const deltaAdditives = (origAdditives - candAdditives) * 12;
  const deltaElevated = (origElevated - candElevated) * 45;

  // 5. Stealth Sugar Penalty / Bonus
  const stealthBonus = candidate.hasHiddenSugars ? -35 : 25;

  // 6. Brand Quality & Visual Telemetry Bonus
  const hasRecognizedBrand = candidate.brand && candidate.brand !== 'Generic Brand' && candidate.brand !== 'Scanned Food Item';
  const hasImage = !!candidate.imageUrl;
  const telemetryBonus = (hasRecognizedBrand ? 15 : 0) + (hasImage ? 15 : 0);

  return deltaScore + deltaNova + deltaSugar + deltaAdditives + deltaElevated + stealthBonus + telemetryBonus;
}

/**
 * World's Most Advanced Algorithm for finding genuine, commercially available healthy substitutes (`lookupAlternatives`).
 * Combines semantic functional archetype deduction, gold-standard curated branded benchmarks,
 * multi-strategy prioritized OpenFoodFacts queries, and strict superiority ranking.
 */
export async function lookupAlternatives(
  categoryTag: string,
  currentProductOrSugar: ScanResultData | number,
  signal: AbortSignal
): Promise<ScanResultData[]> {
  try {
    const original: Partial<ScanResultData> =
      typeof currentProductOrSugar === 'number'
        ? { sugarPer100g: currentProductOrSugar, name: 'Scanned Item', brand: 'Unknown', novaClass: 4, additiveCount: 5, biteFixScore: 40 }
        : currentProductOrSugar;

    const origName = original.name || 'Scanned Food Item';
    const origBrand = original.brand || 'Generic Brand';
    const origSugar = original.sugarPer100g ?? original.sugarGrams ?? 999;
    const origNova = original.novaClass ?? 4;
    const origAdditives = original.additiveCount ?? (original.additives?.length || 99);
    const origElevated = (original.additives || []).filter(a => a.riskLevel === 'elevated').length;

    // ── STEP 1: Semantic Archetype Deduction ──
    const { archetype, searchKeywords } = deduceFunctionalArchetype(origName, origBrand, categoryTag || original.categoryTag);

    // ── CRITICAL GATE: If we cannot match a sensible archetype, do NOT suggest cross-category foods.
    // Return empty — the UI will show "No substitute found" gracefully instead of confusing the user.
    if (archetype === 'no_match') {
      return [];
    }

    // ── STEP 2: Collect Gold-Standard Curated Branded Benchmarks for this Archetype ──
    const candidatePool = new Map<string, ScanResultData>();
    const curatedSwaps = BRANDED_HEALTHY_SWAPS_CATALOG[archetype] || [];

    for (const item of curatedSwaps) {
      // Ensure we don't suggest the exact item currently being scanned
      if (item.name.toLowerCase() !== origName.toLowerCase() && item.brand?.toLowerCase() !== origBrand.toLowerCase()) {
        const key = `${item.name.toLowerCase()}:::${item.brand?.toLowerCase()}`;
        candidatePool.set(key, item);
      }
    }

    const candidates: { product: ScanResultData; superiorityScore: number }[] = [];

    // Populate candidates with curated benchmarks immediately so they are prioritized
    for (const item of candidatePool.values()) {
      const score = computeSuperiorityIndex({
        name: origName,
        brand: origBrand,
        sugarPer100g: origSugar,
        novaClass: origNova,
        additiveCount: origAdditives,
        additives: (original.additives || []) as any,
        biteFixScore: original.biteFixScore ?? 40
      }, item);
      candidates.push({ product: item, superiorityScore: score + 100 }); // +100 boost for gold-standard curated benchmark
    }

    // ── STEP 3: Multi-Strategy Dynamic OpenFoodFacts Queries ──
    const offCandidates: any[] = [];

    // Strategy A: Query by specific Category Tag sorted by popularity/scan volume
    if (categoryTag && categoryTag !== 'unknown') {
      try {
        const resA = await fetchWithTimeout(
          `https://world.openfoodfacts.org/api/v3/search?categories_tags=${encodeURIComponent(categoryTag)}&sort_by=unique_scans_n&page_size=40`,
          API_TIMEOUT_MS,
          signal
        );
        if (!signal.aborted && resA.ok) {
          const jsonA = await resA.json();
          if (Array.isArray(jsonA?.products)) {
            offCandidates.push(...jsonA.products);
          }
        }
      } catch (e) {
        if (isAbortError(e)) return candidates.map(c => c.product);
        console.warn('OFF Strategy A (Category search) failed:', e);
      }
    }

    // Strategy B: Query by Semantic Keywords to discover high-quality branded alternatives
    if (!signal.aborted && searchKeywords) {
      try {
        const resB = await fetchWithTimeout(
          `https://world.openfoodfacts.org/api/v3/search?search_terms=${encodeURIComponent(searchKeywords)}&sort_by=unique_scans_n&page_size=30`,
          API_TIMEOUT_MS,
          signal
        );
        if (!signal.aborted && resB.ok) {
          const jsonB = await resB.json();
          if (Array.isArray(jsonB?.products)) {
            offCandidates.push(...jsonB.products);
          }
        }
      } catch (e) {
        if (isAbortError(e)) return candidates.map(c => c.product);
        console.warn('OFF Strategy B (Keyword search) failed:', e);
      }
    }

    // ── STEP 4: Process and Sanitize Dynamic OpenFoodFacts Candidates ──
    for (const p of offCandidates) {
      if (!p || typeof p !== 'object') continue;
      const name = extractUniversalName(p);
      const brand = extractUniversalBrand(p);

      // Skip generic entries or exact match of scanned item
      if (name === 'Scanned Food Item' || (name.toLowerCase() === origName.toLowerCase() && brand.toLowerCase() === origBrand.toLowerCase())) {
        continue;
      }

      const n = p.nutriments ?? p.nutrition_grades ?? p.nutrition_data ?? {};
      const sugarPer100g = extractNumberFromKeys(n, [
        'sugars_100g', 'sugars', 'sugars_value', 'sugars-total_100g', 'sugars-total'
      ]) ?? 0;

      // Filter out implausible zero entries if product has no nutrition data or brand
      if (sugarPer100g === 0 && (!p.nutriments || Object.keys(p.nutriments).length < 2) && brand === 'Generic Brand') {
        continue;
      }

      const kcal100g = extractNumberFromKeys(n, ['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value', 'energy_100g']) ??
        (extractNumberFromKeys(n, ['energy-kj_100g', 'energy-kj', 'energy_100g']) ? Math.round((extractNumberFromKeys(n, ['energy-kj_100g', 'energy-kj', 'energy_100g']) as number) / 4.184) : undefined);
      const carbs100g = extractNumberFromKeys(n, ['carbohydrates_100g', 'carbohydrates', 'carbohydrates_value']);
      const fat100g = extractNumberFromKeys(n, ['fat_100g', 'fat', 'fat_value']);
      const protein100g = extractNumberFromKeys(n, ['proteins_100g', 'proteins', 'proteins_value']);

      const rawQuantityStr = String(p.quantity || '').toLowerCase();
      const rawCategoryStr = String((Array.isArray(p.categories_tags) ? p.categories_tags.join(' ') : p.categories) || '').toLowerCase();
      const isLiquid = rawQuantityStr.includes('ml') || rawQuantityStr.includes(' l') || rawQuantityStr.includes('cl') || rawQuantityStr.includes('fl oz') ||
        rawCategoryStr.includes('beverage') || rawCategoryStr.includes('drink') || rawCategoryStr.includes('juice') || rawCategoryStr.includes('soda') || rawCategoryStr.includes('water') || rawCategoryStr.includes('milk');
      const defaultUnitLabel = isLiquid ? '100 ml' : '100 g';

      let servingSugarGrams = extractNumberFromKeys(n, ['sugars_serving', 'sugars-total_serving', 'added-sugars_serving']);
      let calories = extractNumberFromKeys(n, ['energy-kcal_serving']);
      let carbsGrams = extractNumberFromKeys(n, ['carbohydrates_serving']);
      let fatGrams = extractNumberFromKeys(n, ['fat_serving']);
      let proteinGrams = extractNumberFromKeys(n, ['proteins_serving']);

      let servingSize: string | undefined = typeof p.serving_size === 'string' && p.serving_size.trim() !== '' && p.serving_size.trim().toLowerCase() !== 'unknown'
        ? p.serving_size.trim()
        : (typeof p.serving_quantity === 'number' && p.serving_quantity > 0 ? `${p.serving_quantity} ${p.serving_quantity_unit || defaultUnitLabel.split(' ')[1]}` : undefined);

      let isDefaultServing = false;
      const servingWeight = servingSize ? parseQuantityString(servingSize) : null;

      if (servingSize && servingWeight !== null && servingWeight > 0) {
        if (sugarPer100g !== undefined && sugarPer100g >= 0) servingSugarGrams = parseFloat(((sugarPer100g * servingWeight) / 100).toFixed(1));
        if (kcal100g !== undefined) calories = Math.round((kcal100g * servingWeight) / 100);
        if (carbs100g !== undefined) carbsGrams = parseFloat(((carbs100g * servingWeight) / 100).toFixed(1));
        if (fat100g !== undefined) fatGrams = parseFloat(((fat100g * servingWeight) / 100).toFixed(1));
        if (protein100g !== undefined) proteinGrams = parseFloat(((protein100g * servingWeight) / 100).toFixed(1));
      } else {
        isDefaultServing = true;
        servingSize = `${defaultUnitLabel} (Standard)`;
        servingSugarGrams = sugarPer100g;
        calories = kcal100g;
        carbsGrams = carbs100g;
        fatGrams = fat100g;
        proteinGrams = protein100g;
      }

      const finalSugarGrams = servingSugarGrams ?? sugarPer100g;
      const sugarTeaspoons = parseFloat((finalSugarGrams / 4.2).toFixed(1));
      const whoLimitServingPercent = Math.min(500, Math.round((sugarTeaspoons / 12) * 100));
      const whoLimitIdealServingPercent = Math.min(500, Math.round((sugarTeaspoons / 6) * 100));

      const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url || undefined;
      const ingredientsText = p.ingredients_text_en || p.ingredients_text || undefined;
      const stealthAnalysis = detectStealthSugars(ingredientsText);

      const rawNova = p.nova_group ?? p.nova_groups ?? undefined;
      const novaClass: NOVAClass | undefined = (rawNova && [1, 2, 3, 4].includes(Number(rawNova))) ? Number(rawNova) as NOVAClass : undefined;

      const additives = parseAdditivesFromProduct(p);
      const additiveCount = additives.length;
      const allergens = parseAllergensFromProduct(p);

      const rawNutriScore = String(p.nutriscore_grade ?? p.nutrition_grades ?? '').toLowerCase();
      const nutriScore: ScanResultData['nutriScore'] = ['a', 'b', 'c', 'd', 'e'].includes(rawNutriScore) ? rawNutriScore as ScanResultData['nutriScore'] : undefined;

      const biteFixScore = computeBiteFixScore({ novaClass, additiveCount, nutriScore, sugarPer100g });
      const candElevatedCount = additives.filter(a => a.riskLevel === 'elevated').length;

      const candidateObj: ScanResultData = {
        name,
        brand,
        sugarGrams: finalSugarGrams,
        sugarTeaspoons,
        sugarPer100g,
        imageUrl,
        servingSize,
        calories,
        carbsGrams,
        fatGrams,
        proteinGrams,
        categoryTag: (Array.isArray(p.categories_tags) && p.categories_tags[0]) || categoryTag || undefined,
        isDefaultServing,
        whoLimitServingPercent,
        whoLimitIdealServingPercent,
        ingredientsText,
        hasHiddenSugars: stealthAnalysis.hasHiddenSugars,
        hiddenSugars: stealthAnalysis.matches,
        hiddenSugarCount: stealthAnalysis.hiddenSugarCount,
        novaClass,
        additives,
        additiveCount,
        allergens,
        nutriScore,
        biteFixScore,
      };

      const superiorityScore = computeSuperiorityIndex({
        name: origName,
        brand: origBrand,
        sugarPer100g: origSugar,
        novaClass: origNova,
        additiveCount: origAdditives,
        additives: (original.additives || []) as any,
        biteFixScore: original.biteFixScore ?? 40
      }, candidateObj);

      // Require strictly positive superiority OR clear improvement in chemicals/sugar
      if (superiorityScore > 0 || (candElevatedCount < origElevated && sugarPer100g < origSugar)) {
        const key = `${name.toLowerCase()}:::${brand.toLowerCase()}`;
        if (!candidatePool.has(key)) {
          candidatePool.set(key, candidateObj);
          candidates.push({
            product: candidateObj,
            superiorityScore,
          });
        }
      }
    }

    // Sort by superiority score descending
    candidates.sort((a, b) => b.superiorityScore - a.superiorityScore);

    return candidates.slice(0, 10).map(c => c.product);
  } catch (err) {
    console.warn('Error fetching alternatives:', err);
    return [];
  }
}
