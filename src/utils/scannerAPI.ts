import { NOVAClass, AdditiveDetail, AdditiveRiskLevel } from '../types/app.types';
import { detectStealthSugars } from './stealthSugarDetector';

export interface ScanResultData {
  name: string;
  brand: string;
  sugarGrams?: number;
  sugarTeaspoons?: number;
  totalWeightGrams?: number;
  totalSugarGrams?: number;
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
  shieldAlerts?: { id: string; type: 'allergen' | 'oil'; name: string }[];
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  biteFixScore?: number;
  
  // ── Sustainability & Dietary Extensions ──────────────
  ecoscoreGrade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
  carbonFootprint100g?: number;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isOrganic?: boolean;

  // ── Healthy Swap Telemetry ────────────────────────────
  isSwapped?: boolean;
  swappedForOriginalName?: string;
  originalNovaClass?: NOVAClass;
  originalBiteFixScore?: number;
  originalAdditiveCount?: number;
  originalSugarGrams?: number;
}

// ─────────────────────────────────────────────────────────
// Shield Detection Helper
// ─────────────────────────────────────────────────────────
export function detectShieldAlerts(ingredientsText: string | undefined, allergenFilters: string[]): { id: string; type: 'allergen' | 'oil'; name: string }[] {
  if (!ingredientsText) return [];
  const text = ingredientsText.toLowerCase();
  const alerts: { id: string; type: 'allergen' | 'oil'; name: string }[] = [];

  // Proactive Palm Oil Check (Always Active)
  if (text.includes('palm oil') || text.includes('palm kernel') || text.includes('fractionated palm') || text.includes('palmolein')) {
    alerts.push({ id: 'palm_oil', type: 'oil', name: 'Palm Oil' });
  }

  // Allergen mapping (simple keyword matching)
  const allergenKeywords: Record<string, string[]> = {
    'Gluten': ['wheat', 'barley', 'rye', 'oat', 'malt', 'gluten'],
    'Dairy': ['milk', 'whey', 'casein', 'butter', 'cheese', 'cream', 'lactose'],
    'Soy': ['soy', 'edamame', 'miso', 'tempeh', 'tofu'],
    'Nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'macadamia', 'hazelnut', 'nut'],
    'Peanuts': ['peanut'],
    'Eggs': ['egg', 'albumen', 'globulin', 'livetin', 'lysozyme', 'vitellin'],
    'Fish': ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'anchov'],
    'Shellfish': ['crab', 'lobster', 'shrimp', 'prawn', 'crawfish', 'krill']
  };

  for (const filter of allergenFilters) {
    if (filter === 'Palm Oil') continue; // Handled globally above

    const keywords = allergenKeywords[filter] || [filter.toLowerCase()];
    if (keywords.some(kw => text.includes(kw))) {
      alerts.push({ id: filter.toLowerCase(), type: 'allergen', name: filter });
    }
  }

  return alerts;
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

/**
 * Comprehensive Regex & Dictionary Additive Extractor.
 * Scans raw ingredient text for INS numbers, E numbers, parenthetical numbers, and chemical names
 * to ensure products without pre-populated additives_tags in OpenFoodFacts are never incorrectly marked as Clean Label.
 */
export function extractAdditivesFromText(ingredientsText?: string): AdditiveDetail[] {
  if (!ingredientsText || typeof ingredientsText !== 'string') return [];
  const text = ingredientsText;
  const results: AdditiveDetail[] = [];
  const seen = new Set<string>();

  // 1. Match INS / E number patterns (e.g. INS 211, E211, INS-260, E 415, INS 1422, INS 330)
  const codeRegex = /\b(INS|E)\s*[-–]?\s*(\d{3,4}[a-z]?)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = codeRegex.exec(text)) !== null) {
    const rawTag = `en:e${match[2].toLowerCase()}`;
    const cleanTag = `e${match[2].toLowerCase()}`;
    if (!seen.has(cleanTag)) {
      seen.add(cleanTag);
      results.push({
        tag: rawTag,
        displayName: formatAdditiveDisplayName(rawTag),
        functionLabel: getAdditiveFunctionLabel(cleanTag),
        riskLevel: getAdditiveRiskLevel(cleanTag),
      });
    }
  }

  // 2. Match parenthetical additive codes (e.g. "Preservative (211)", "Acidity Regulator (260)", "Thickening agent (1422)", "Stabilizer (415)", "Color (150c)")
  const parenRegex = /\b(Preservative|Acidity Regulator|Acidifying Agent|Thickener|Thickening Agent|Stabilizer|Color|Colour|Emulsifier|Flavor Enhancer|Sweetener|Anti-caking Agent)\s*\(\s*(?:INS|E)?\s*(\d{3,4}[a-z]?)\s*\)/gi;
  while ((match = parenRegex.exec(text)) !== null) {
    const fnName = match[1];
    const numStr = match[2].toLowerCase();
    const cleanTag = `e${numStr}`;
    if (!seen.has(cleanTag)) {
      seen.add(cleanTag);
      results.push({
        tag: `en:e${numStr}`,
        displayName: `${fnName} (E${numStr.toUpperCase()})`,
        functionLabel: getAdditiveFunctionLabel(cleanTag),
        riskLevel: getAdditiveRiskLevel(cleanTag),
      });
    }
  }

  // 3. Match known chemical names in ingredient text
  const chemicalDictionary: { keywords: string[]; tag: string; name: string; fn: string; risk: AdditiveRiskLevel }[] = [
    { keywords: ['sodium benzoate', 'benzoate'], tag: 'en:e211', name: 'Sodium Benzoate (E211)', fn: 'Preservative', risk: 'elevated' },
    { keywords: ['potassium sorbate', 'sorbate'], tag: 'en:e202', name: 'Potassium Sorbate (E202)', fn: 'Preservative', risk: 'moderate' },
    { keywords: ['sodium metabisulfite', 'potassium metabisulfite', 'metabisulfite'], tag: 'en:e224', name: 'Sodium Metabisulfite (E224)', fn: 'Preservative', risk: 'elevated' },
    { keywords: ['acetic acid', 'acidifying agent (260)'], tag: 'en:e260', name: 'Acetic Acid (E260)', fn: 'Acidity Regulator', risk: 'low' },
    { keywords: ['citric acid'], tag: 'en:e330', name: 'Citric Acid (E330)', fn: 'Acidity Regulator', risk: 'moderate' },
    { keywords: ['modified starch', 'modified food starch', 'thickening agent (1422)'], tag: 'en:e1422', name: 'Modified Starch (E1422)', fn: 'Thickener / Stabilizer', risk: 'moderate' },
    { keywords: ['xanthan gum', 'stabilizer (415)'], tag: 'en:e415', name: 'Xanthan Gum (E415)', fn: 'Thickener / Stabilizer', risk: 'moderate' },
    { keywords: ['guar gum'], tag: 'en:e412', name: 'Guar Gum (E412)', fn: 'Thickener', risk: 'moderate' },
    { keywords: ['carrageenan'], tag: 'en:e407', name: 'Carrageenan (E407)', fn: 'Thickener', risk: 'elevated' },
    { keywords: ['monosodium glutamate', 'msg'], tag: 'en:e621', name: 'Monosodium Glutamate (E621)', fn: 'Flavor Enhancer', risk: 'elevated' },
    { keywords: ['high fructose corn syrup', 'hfcs'], tag: 'en:hfcs', name: 'High Fructose Corn Syrup', fn: 'Refined Sweetener', risk: 'elevated' },
    { keywords: ['caramel color', 'caramel colour'], tag: 'en:e150c', name: 'Caramel Color (E150c)', fn: 'Colorant', risk: 'elevated' },
    { keywords: ['tartrazine'], tag: 'en:e102', name: 'Tartrazine (E102)', fn: 'Synthetic Dye', risk: 'elevated' },
    { keywords: ['sucralose'], tag: 'en:e955', name: 'Sucralose (E955)', fn: 'Artificial Sweetener', risk: 'elevated' },
    { keywords: ['aspartame'], tag: 'en:e951', name: 'Aspartame (E951)', fn: 'Artificial Sweetener', risk: 'elevated' },
    { keywords: ['acesulfame'], tag: 'en:e950', name: 'Acesulfame Potassium (E950)', fn: 'Artificial Sweetener', risk: 'elevated' },
    { keywords: ['sodium nitrite'], tag: 'en:e250', name: 'Sodium Nitrite (E250)', fn: 'Preservative', risk: 'elevated' },
    { keywords: ['calcium propionate'], tag: 'en:e282', name: 'Calcium Propionate (E282)', fn: 'Preservative', risk: 'moderate' },
    { keywords: ['tbhq'], tag: 'en:tbhq', name: 'TBHQ Preservative', fn: 'Preservative', risk: 'elevated' },
  ];

  const lowerText = text.toLowerCase();
  for (const entry of chemicalDictionary) {
    const cleanTag = entry.tag.replace(/^en:/, '');
    if (seen.has(cleanTag)) continue;
    for (const kw of entry.keywords) {
      if (lowerText.includes(kw)) {
        seen.add(cleanTag);
        results.push({
          tag: entry.tag,
          displayName: entry.name,
          functionLabel: entry.fn,
          riskLevel: entry.risk,
        });
        break;
      }
    }
  }

  return results;
}

export function parseAdditivesFromProduct(p: any): AdditiveDetail[] {
  const additiveTags: string[] = p.additives_tags || p.additives_original_tags || [];
  const seen = new Set<string>();
  const results: AdditiveDetail[] = [];

  if (Array.isArray(additiveTags) && additiveTags.length > 0) {
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
  }

  // Complement or fallback using raw ingredient text scanning
  const ingredientsText = p.ingredients_text_en || p.ingredients_text || '';
  if (ingredientsText) {
    const textExtracted = extractAdditivesFromText(ingredientsText);
    for (const add of textExtracted) {
      const tagKey = cleanAdditiveTag(add.tag).toLowerCase();
      if (!seen.has(tagKey)) {
        seen.add(tagKey);
        results.push(add);
      }
    }
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
 * Computes a BiteFix Health Score (0-100) from product attributes, strictly calibrated with NOVA Classification bounds:
 * - NOVA 1 (Unprocessed / Minimally Processed): Score 81 – 100
 * - NOVA 2 (Processed Culinary Ingredient):     Score 61 – 80
 * - NOVA 3 (Processed Food):                    Score 36 – 60
 * - NOVA 4 (Ultra-Processed):                   Score 0 – 35
 */
export function computeBiteFixScore(opts: {
  name?: string;
  brand?: string;
  novaClass?: NOVAClass;
  additiveCount: number;
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  sugarPer100g?: number;
  ingredientsText?: string;
}): number {
  let inferredNova = opts.novaClass;

  const text = `${opts.name || ''} ${opts.brand || ''} ${opts.ingredientsText || ''}`.toLowerCase();
  const isSodaOrUltraProcessedDrink = 
    text.includes('coca') || 
    text.includes('cola') || 
    text.includes('soda') || 
    text.includes('carbonated') || 
    text.includes('soft drink') || 
    text.includes('energy drink') || 
    text.includes('high fructose corn syrup') || 
    text.includes('corn syrup') || 
    text.includes('caramel color') || 
    text.includes('phosphoric acid') || 
    text.includes('aspartame') || 
    text.includes('sucralose') || 
    text.includes('acesulfame') || 
    (opts.sugarPer100g !== undefined && opts.sugarPer100g > 5 && (text.includes('drink') || text.includes('beverage') || text.includes('syrup')));

  if (isSodaOrUltraProcessedDrink) {
    inferredNova = 4;
  }

  if (!inferredNova) {
    if (opts.additiveCount >= 4) {
      inferredNova = 4;
    } else if (opts.additiveCount >= 2) {
      inferredNova = 3;
    } else {
      // 0 or 1 additives: check if it's a pure processed culinary ingredient
      const ing = opts.ingredientsText ? opts.ingredientsText.toLowerCase().trim() : '';
      const isCulinary = ing === 'sugar' || ing === 'salt' || ing === 'honey' || ing === 'maple syrup' || ing === 'butter' || ing === 'vegetable oil' || ing === 'olive oil' || ing === 'coconut oil';
      
      const hasHighSugar = opts.sugarPer100g !== undefined && opts.sugarPer100g > 5;
      if (isCulinary) {
        inferredNova = 2;
      } else if (hasHighSugar) {
        inferredNova = 3;
      } else {
        inferredNova = 1; // Default to whole food / unprocessed for clean profile
      }
    }
  }

  // Base NOVA factor values centered in each NOVA group bracket
  const novaScores: Record<number, number> = { 1: 90, 2: 70, 3: 48, 4: 18 };
  const novaFactor = inferredNova ? (novaScores[inferredNova] ?? 50) : 50;

  // Additive cleanliness: 0 additives → 100, decays with more additives
  const additiveFactor = Math.max(0, 100 - (opts.additiveCount * 15));

  // Nutrient profile: based on Nutri-Score letter grade
  const nutriMap: Record<string, number> = { a: 100, b: 80, c: 55, d: 30, e: 10 };
  const nutrientFactor = opts.nutriScore ? (nutriMap[opts.nutriScore] ?? 50) : 50;

  const raw = (0.5 * novaFactor) + (0.3 * additiveFactor) + (0.2 * nutrientFactor);
  let score = Math.round(raw);

  // Strict NOVA group bounding to guarantee 100% calibration between NOVA class and BiteFix Score
  if (inferredNova === 1) {
    score = Math.max(81, Math.min(100, score));
  } else if (inferredNova === 2) {
    score = Math.max(61, Math.min(80, score));
  } else if (inferredNova === 3) {
    score = Math.max(36, Math.min(60, score));
  } else if (inferredNova === 4) {
    score = Math.max(0, Math.min(35, score));
  } else {
    score = Math.max(0, Math.min(100, score));
  }

  return score;
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
        'User-Agent': 'BiteFixApp/1.0.0 (React Native; iOS/Android; bitefixapp@gmail.com)',
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

    let p = resData.product;
    const name = extractUniversalName(p);
    const brand = extractUniversalBrand(p);
    const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url || undefined;

    let n = p.nutriments ?? p.nutrition_grades ?? p.nutrition_data ?? {};

    // ─── NUTRIMENT ENRICHMENT FALLBACK ───────────────────────────
    // Many products (especially Indian/regional brands) exist in OpenFoodFacts
    // under multiple barcodes. Often one barcode has name+image but empty nutriments,
    // while another barcode for the same product has full nutritional data.
    // This fallback searches by product name to find enriched data.
    const hasNutrimentData = n && typeof n === 'object' && Object.keys(n).length > 0 &&
      (n.sugars_100g !== undefined || n.sugars !== undefined || n['energy-kcal_100g'] !== undefined ||
       n.carbohydrates_100g !== undefined || n.fat_100g !== undefined || n.proteins_100g !== undefined);

    if (!hasNutrimentData && !signal.aborted) {
      console.log(`[BiteFix] Barcode product "${name}" has empty nutriments — attempting text search enrichment...`);
      try {
        const searchTerms = name.replace(/[^\w\s]/g, ' ').trim();
        const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&search_simple=1&json=1&page_size=10&fields=product_name,brands,nutriments,nova_group,nutriscore_grade,nutrition_grades,additives_tags,additives_original_tags,allergens_hierarchy,allergens_tags,ingredients_text,ingredients_text_en,serving_size,serving_quantity,serving_quantity_unit,quantity,categories_tags,image_front_url,image_url`;
        const searchResp = await fetchWithTimeout(searchUrl, API_TIMEOUT_MS, signal);
        if (!signal.aborted && searchResp.ok) {
          const searchData = await searchResp.json();
          const searchProducts = searchData?.products;
          if (Array.isArray(searchProducts) && searchProducts.length > 0) {
            // Find the best match: same product name (fuzzy) with actual nutriment data
            const nameNorm = name.toLowerCase().replace(/[^\w\s]/g, '').trim();
            const enrichedProduct = searchProducts.find((sp: any) => {
              const spName = extractUniversalName(sp).toLowerCase().replace(/[^\w\s]/g, '').trim();
              const spN = sp.nutriments;
              const spHasData = spN && typeof spN === 'object' && Object.keys(spN).length > 0 &&
                (spN.sugars_100g !== undefined || spN['energy-kcal_100g'] !== undefined || spN.carbohydrates_100g !== undefined);
              // Check for name similarity: at least 60% word overlap
              const nameWords = new Set(nameNorm.split(/\s+/).filter((w: string) => w.length > 2));
              const spWords = new Set(spName.split(/\s+/).filter((w: string) => w.length > 2));
              if (nameWords.size === 0) return false;
              let overlap = 0;
              nameWords.forEach((w: string) => { if (spWords.has(w)) overlap++; });
              const similarity = overlap / Math.max(nameWords.size, 1);
              return spHasData && similarity >= 0.5;
            });

            if (enrichedProduct) {
              console.log(`[BiteFix] Found enriched nutriment data from "${extractUniversalName(enrichedProduct)}" — merging...`);
              n = enrichedProduct.nutriments;
              // Also merge in any missing metadata from the enriched product
              if (!p.nova_group && enrichedProduct.nova_group) p = { ...p, nova_group: enrichedProduct.nova_group };
              if (!p.nutriscore_grade && !p.nutrition_grades && (enrichedProduct.nutriscore_grade || enrichedProduct.nutrition_grades)) {
                p = { ...p, nutriscore_grade: enrichedProduct.nutriscore_grade, nutrition_grades: enrichedProduct.nutrition_grades };
              }
              if ((!p.additives_tags || p.additives_tags.length === 0) && enrichedProduct.additives_tags) {
                p = { ...p, additives_tags: enrichedProduct.additives_tags };
              }
              if ((!p.allergens_hierarchy || p.allergens_hierarchy.length === 0) && enrichedProduct.allergens_hierarchy) {
                p = { ...p, allergens_hierarchy: enrichedProduct.allergens_hierarchy };
              }
              if (!p.ingredients_text && !p.ingredients_text_en) {
                p = { ...p, ingredients_text: enrichedProduct.ingredients_text, ingredients_text_en: enrichedProduct.ingredients_text_en };
              }
              if (!p.serving_size && enrichedProduct.serving_size) {
                p = { ...p, serving_size: enrichedProduct.serving_size };
              }
              if ((!p.categories_tags || p.categories_tags.length === 0) && enrichedProduct.categories_tags) {
                p = { ...p, categories_tags: enrichedProduct.categories_tags };
              }
              // Preserve original image if enriched product doesn't have one
              if (!p.image_front_url && enrichedProduct.image_front_url) {
                p = { ...p, image_front_url: enrichedProduct.image_front_url };
              }
            }
          }
        }
      } catch (enrichErr) {
        if (isAbortError(enrichErr)) return null;
        console.warn('[BiteFix] Nutriment enrichment fallback failed:', enrichErr);
        // Continue with whatever data we have — this is a best-effort enrichment
      }
    }

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

    const kcal100g = extractNumberFromKeys(n, ['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value', 'energy_100g']) ??
      (extractNumberFromKeys(n, ['energy-kj_100g', 'energy-kj', 'energy_100g']) ? Math.round((extractNumberFromKeys(n, ['energy-kj_100g', 'energy-kj', 'energy_100g']) as number) / 4.184) : undefined);
    const carbs100g = extractNumberFromKeys(n, ['carbohydrates_100g', 'carbohydrates', 'carbohydrates_value']);
    const fat100g = extractNumberFromKeys(n, ['fat_100g', 'fat', 'fat_value']);
    const protein100g = extractNumberFromKeys(n, ['proteins_100g', 'proteins', 'proteins_value']);

    // Determine if product is liquid or solid for accurate "100 g/ml" default serving label
    const rawQuantityStr = String(p.quantity || p.product_quantity || '').toLowerCase();
    const rawCategoryStr = String((Array.isArray(p.categories_tags) ? p.categories_tags.join(' ') : p.categories) || '').toLowerCase();
    const isLiquid = isProductLiquid(rawQuantityStr, rawCategoryStr);
    const defaultUnitLabel = isLiquid ? '100 ml' : '100 g';

    // ─── WHOLE PACK CALCULATION ───
    const totalWeightGrams = parseQuantityString(rawQuantityStr);
    let totalSugarGrams: number | undefined;
    if (totalWeightGrams !== null && totalWeightGrams > 0 && sugarPer100g !== undefined) {
      totalSugarGrams = parseFloat(((sugarPer100g * totalWeightGrams) / 100).toFixed(1));
    }

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

    const rawNutriScore = String(p.nutriscore_grade ?? p.nutrition_grades ?? p.ecoscore_data?.previous_data?.nutriscore_grade ?? '').toLowerCase();
    const nutriScore: ScanResultData['nutriScore'] = ['a', 'b', 'c', 'd', 'e'].includes(rawNutriScore) ? rawNutriScore as ScanResultData['nutriScore'] : undefined;

    const biteFixScore = computeBiteFixScore({ name, brand, novaClass, additiveCount, nutriScore, sugarPer100g, ingredientsText });

    // ── Sustainability & Dietary Tags ──
    const rawEcoScore = String(p.ecoscore_grade ?? p.ecoscore_data?.previous_data?.grade ?? p.ecoscore_data?.grade ?? '').toLowerCase();
    const ecoscoreGrade: ScanResultData['ecoscoreGrade'] = ['a', 'b', 'c', 'd', 'e'].includes(rawEcoScore) ? rawEcoScore as ScanResultData['ecoscoreGrade'] : undefined;
    
    let carbonFootprint100g: number | undefined = undefined;
    if (p.ecoscore_data?.agribalyse?.co2_total) {
      carbonFootprint100g = p.ecoscore_data.agribalyse.co2_total;
    } else if (p.ecoscore_data?.agribalyse?.co2_eq) {
      carbonFootprint100g = p.ecoscore_data.agribalyse.co2_eq;
    } else if (p.ecoscore_data?.previous_data?.agribalyse?.co2_total) {
      carbonFootprint100g = p.ecoscore_data.previous_data.agribalyse.co2_total;
    } else if (p.ecoscore_data?.previous_data?.agribalyse?.co2_eq) {
      carbonFootprint100g = p.ecoscore_data.previous_data.agribalyse.co2_eq;
    } else if (p.ecoscore_data?.carbon_footprint_100g) {
      carbonFootprint100g = p.ecoscore_data.carbon_footprint_100g;
    } else if (p.carbon_footprint_from_known_ingredients_100g) {
      carbonFootprint100g = p.carbon_footprint_from_known_ingredients_100g;
    } else {
      carbonFootprint100g = extractNumberFromKeys(n, ['carbon-footprint-from-known-ingredients_100g', 'carbon-footprint_100g']);
    }
    
    const analysisTags = (p.ingredients_analysis_tags || []).map((t: string) => t.toLowerCase());
    const isVegan = analysisTags.includes('en:vegan');
    const isVegetarian = analysisTags.includes('en:vegetarian') || isVegan;
    
    const labelTags = (p.labels_tags || []).map((t: string) => t.toLowerCase());
    const isOrganic = labelTags.includes('en:organic') || labelTags.includes('en:usda-organic') || labelTags.includes('en:eu-organic') || labelTags.includes('en:bio');

    const resultData: ScanResultData = {
      name,
      brand,
      sugarGrams: finalSugarGrams,
      sugarTeaspoons,
      totalWeightGrams: totalWeightGrams ?? undefined,
      totalSugarGrams,
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
      ecoscoreGrade,
      carbonFootprint100g,
      isVegan,
      isVegetarian,
      isOrganic,
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

export function isProductLiquid(quantityStr?: string, categoryStr?: string): boolean {
  const q = String(quantityStr || '').toLowerCase();
  const c = String(categoryStr || '').toLowerCase();
  
  return q.includes('ml') || q.includes(' l') || q.includes('cl') || q.includes('fl oz') ||
    c.includes('beverage') || c.includes('drink') || c.includes('juice') || 
    c.includes('soda') || c.includes('water') || c.includes('milk') ||
    c.includes('sauce') || c.includes('ketchup') || c.includes('dressing') || c.includes('syrup') || c.includes('oil');
}