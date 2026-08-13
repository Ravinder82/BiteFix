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
  'e211', 'e220', 'e250', 'e251', 'e320', 'e321', 'e407', 'e621', 'e951', 'e950',
  'e955',
]);

/** Moderate-concern additive E-numbers */
const MODERATE_ADDITIVES = new Set([
  'e160b', 'e171', 'e202', 'e262', 'e270', 'e280', 'e282', 'e330', 'e331',
  'e338', 'e339', 'e340', 'e341', 'e412', 'e415', 'e440',
  'e461', 'e466', 'e471', 'e472', 'e500', 'e508', 'e509',
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
 * Scans raw ingredient text for INS numbers, E numbers, parenthetical numbers, and chemical names.
 */
export function extractAdditivesFromText(ingredientsText?: string): AdditiveDetail[] {
  if (!ingredientsText || typeof ingredientsText !== 'string') return [];
  const text = ingredientsText;
  const results: AdditiveDetail[] = [];
  const seen = new Set<string>();

  // 1. Match INS / E number patterns (e.g. INS 211, E211, INS-260, E 415, INS 1422, INS 330, E461)
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
    { keywords: ['methylcellulose', 'methyl cellulose', 'e461'], tag: 'en:e461', name: 'Methylcellulose (E461)', fn: 'Thickener / Stabilizer', risk: 'moderate' },
    { keywords: ['sodium benzoate', 'benzoate'], tag: 'en:e211', name: 'Sodium Benzoate (E211)', fn: 'Preservative', risk: 'elevated' },
    { keywords: ['potassium sorbate', 'sorbate'], tag: 'en:e202', name: 'Potassium Sorbate (E202)', fn: 'Preservative', risk: 'moderate' },
    { keywords: ['sodium metabisulfite', 'potassium metabisulfite', 'metabisulfite'], tag: 'en:e224', name: 'Sodium Metabisulfite (E224)', fn: 'Preservative', risk: 'elevated' },
    { keywords: ['acetic acid', 'acidifying agent (260)'], tag: 'en:e260', name: 'Acetic Acid (E260)', fn: 'Acidity Regulator', risk: 'low' },
    { keywords: ['citric acid'], tag: 'en:e330', name: 'Citric Acid (E330)', fn: 'Acidity Regulator', risk: 'moderate' },
    { keywords: ['modified starch', 'modified food starch', 'thickening agent (1422)'], tag: 'en:e1422', name: 'Modified Starch (E1422)', fn: 'Thickener / Stabilizer', risk: 'moderate' },
    { keywords: ['xanthan gum', 'stabilizer (415)'], tag: 'en:e415', name: 'Xanthan Gum (E415)', fn: 'Thickener / Stabilizer', risk: 'moderate' },
    { keywords: ['guar gum'], tag: 'en:e412', name: 'Guar Gum (E412)', fn: 'Thickener', risk: 'moderate' },
    { keywords: ['carrageenan'], tag: 'en:e407', name: 'Carrageenan (E407)', fn: 'Thickener / Emulsifier', risk: 'elevated' },
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
// Algorithmic Nutri-Score Engine (EU 2023 Standard Formula)
// ─────────────────────────────────────────────────────────
export function calculateAlgorithmicNutriScore(opts: {
  kcal100g?: number;
  satFat100g?: number;
  sugar100g?: number;
  sodiumMg100g?: number;
  protein100g?: number;
  isBeverage?: boolean;
}): 'a' | 'b' | 'c' | 'd' | 'e' {
  const kcal = opts.kcal100g ?? 0;
  const satFat = opts.satFat100g ?? 0;
  const sugar = opts.sugar100g ?? 0;
  const sodium = opts.sodiumMg100g ?? 0;
  const protein = opts.protein100g ?? 0;

  // Negative points (0 to 10 each)
  let nEnergy = 0;
  if (kcal > 3350) nEnergy = 10;
  else if (kcal > 3015) nEnergy = 9;
  else if (kcal > 2680) nEnergy = 8;
  else if (kcal > 2345) nEnergy = 7;
  else if (kcal > 2010) nEnergy = 6;
  else if (kcal > 1675) nEnergy = 5;
  else if (kcal > 1340) nEnergy = 4;
  else if (kcal > 1005) nEnergy = 3;
  else if (kcal > 670) nEnergy = 2;
  else if (kcal > 335) nEnergy = 1;

  let nSatFat = 0;
  if (satFat > 10) nSatFat = 10;
  else if (satFat > 9) nSatFat = 9;
  else if (satFat > 8) nSatFat = 8;
  else if (satFat > 7) nSatFat = 7;
  else if (satFat > 6) nSatFat = 6;
  else if (satFat > 5) nSatFat = 5;
  else if (satFat > 4) nSatFat = 4;
  else if (satFat > 3) nSatFat = 3;
  else if (satFat > 2) nSatFat = 2;
  else if (satFat > 1) nSatFat = 1;

  let nSugar = 0;
  if (sugar > 45) nSugar = 10;
  else if (sugar > 40) nSugar = 9;
  else if (sugar > 36) nSugar = 8;
  else if (sugar > 31) nSugar = 7;
  else if (sugar > 27) nSugar = 6;
  else if (sugar > 22.5) nSugar = 5;
  else if (sugar > 18) nSugar = 4;
  else if (sugar > 13.5) nSugar = 3;
  else if (sugar > 9) nSugar = 2;
  else if (sugar > 4.5) nSugar = 1;

  let nSodium = 0;
  if (sodium > 900) nSodium = 10;
  else if (sodium > 810) nSodium = 9;
  else if (sodium > 720) nSodium = 8;
  else if (sodium > 630) nSodium = 7;
  else if (sodium > 540) nSodium = 6;
  else if (sodium > 450) nSodium = 5;
  else if (sodium > 360) nSodium = 4;
  else if (sodium > 270) nSodium = 3;
  else if (sodium > 180) nSodium = 2;
  else if (sodium > 90) nSodium = 1;

  // Positive points
  let pProtein = 0;
  if (protein > 8) pProtein = 5;
  else if (protein > 6.4) pProtein = 4;
  else if (protein > 4.8) pProtein = 3;
  else if (protein > 3.2) pProtein = 2;
  else if (protein > 1.6) pProtein = 1;

  const totalNegative = nEnergy + nSatFat + nSugar + nSodium;
  const score = totalNegative - pProtein;

  if (opts.isBeverage) {
    if (score <= 1) return 'a';
    if (score <= 5) return 'b';
    if (score <= 9) return 'c';
    if (score <= 12) return 'd';
    return 'e';
  }

  if (score <= -1) return 'a';
  if (score <= 2) return 'b';
  if (score <= 10) return 'c';
  if (score <= 18) return 'd';
  return 'e';
}

// ─────────────────────────────────────────────────────────
// Algorithmic Eco-Score & Carbon Footprint Estimator
// ─────────────────────────────────────────────────────────
export function estimateEcoScoreFromCategory(categoryStr?: string, isVegan?: boolean, isVegetarian?: boolean): { grade: 'a' | 'b' | 'c' | 'd' | 'e'; co2Grams100g: number } {
  const cat = (categoryStr || '').toLowerCase();
  
  if (cat.includes('water') || cat.includes('plant-based') || isVegan) {
    return { grade: 'b', co2Grams100g: 185 }; // Low carbon impact (~1.85 kg CO2 eq / kg)
  }
  if (cat.includes('dairy') || cat.includes('milk') || cat.includes('cheese') || isVegetarian) {
    return { grade: 'c', co2Grams100g: 320 }; // Moderate carbon impact
  }
  if (cat.includes('meat') || cat.includes('beef') || cat.includes('pork')) {
    return { grade: 'e', co2Grams100g: 1400 }; // High carbon impact
  }
  return { grade: 'c', co2Grams100g: 250 };
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

  // Try matching multi-pack syntax e.g. "6 x 330 ml", "2 x 113 g"
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

  // Regular single quantity match
  const match = cleaned.match(/([\d\.]+)\s*(g|gm|gms|gram|grams|ml|kg|ltr|litre|litres|cl|fl\s*oz|fl\.\s*oz|oz|ounce|ounces|lb|lbs|l)/);
  if (!match) {
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


/**
 * Converts an 8-digit UPC-E string to a standard 12-digit UPC-A string.
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

  return Array.from(new Set(candidates));
}

function extractUniversalName(p: any): string {
  if (!p || typeof p !== 'object') return 'Scanned Food Item';

  const primaryNames = [
    p.product_name, p.product_name_en, p.generic_name, p.generic_name_en,
    p.abbreviated_product_name, p.abbreviated_product_name_en, p.description
  ];
  for (const val of primaryNames) {
    if (typeof val === 'string' && val.trim() !== '' && val.trim().toLowerCase() !== 'unknown') {
      return val.trim();
    }
  }

  for (const key of Object.keys(p)) {
    if ((key.includes('product_name') || key.includes('generic_name')) && typeof p[key] === 'string') {
      const val = p[key].trim();
      if (val !== '' && val.toLowerCase() !== 'unknown') {
        return val;
      }
    }
  }

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

function extractUniversalBrand(p: any): string {
  if (!p || typeof p !== 'object') return 'Generic Brand';

  const primaryBrands = [
    p.brands, p.brand_owner, p.brand_owner_imported, p.brands_imported, p.brandName
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

// ─────────────────────────────────────────────────────────
// USDA FoodData Central Multi-Source Fallback
// ─────────────────────────────────────────────────────────
async function fetchUsdaFoodData(barcode: string, signal: AbortSignal): Promise<any | null> {
  try {
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(barcode)}&pageSize=1`;
    const resp = await fetchWithTimeout(usdaUrl, API_TIMEOUT_MS, signal);
    if (!signal.aborted && resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.foods) && data.foods.length > 0) {
        const item = data.foods[0];
        const nutrimentsMap: Record<string, number> = {};
        if (Array.isArray(item.foodNutrients)) {
          for (const fn of item.foodNutrients) {
            const name = (fn.nutrientName || '').toLowerCase();
            if (name.includes('energy')) nutrimentsMap['energy-kcal_100g'] = fn.value;
            else if (name.includes('sugars, total')) nutrimentsMap['sugars_100g'] = fn.value;
            else if (name.includes('carbohydrate')) nutrimentsMap['carbohydrates_100g'] = fn.value;
            else if (name.includes('total lipid (fat)')) nutrimentsMap['fat_100g'] = fn.value;
            else if (name.includes('fatty acids, total saturated')) nutrimentsMap['saturated-fat_100g'] = fn.value;
            else if (name.includes('protein')) nutrimentsMap['proteins_100g'] = fn.value;
            else if (name.includes('sodium')) nutrimentsMap['sodium_100g'] = fn.value;
          }
        }
        return {
          product_name: item.description,
          brands: item.brandOwner || item.brandName,
          ingredients_text: item.ingredients,
          serving_size: item.servingSize ? `${item.servingSize} ${item.servingSizeUnit || 'g'}` : undefined,
          nutriments: nutrimentsMap,
        };
      }
    }
  } catch (e) {
    if (isAbortError(e)) return null;
    console.warn('[BiteFix] USDA lookup skipped:', e);
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// UNIVERSAL DATA NORMALIZATION ENGINE
// ─────────────────────────────────────────────────────────
export function normalizeProductPayload(p: any): ScanResultData {
  const name = extractUniversalName(p);
  const brand = extractUniversalBrand(p);
  const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url || undefined;

  let n = p.nutriments ?? p.nutrition_grades ?? p.nutrition_data ?? {};

  // Authoritative total sugar per 100g (Carbs are NEVER promoted to sugar)
  let sugarPer100g = extractNumberFromKeys(n, [
    'sugars_100g', 'sugars', 'sugars_value', 'sugars-total_100g', 'sugars-total'
  ]) ?? 0;

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
  const satFat100g = extractNumberFromKeys(n, ['saturated-fat_100g', 'saturated-fat', 'saturated-fat_value']);
  const protein100g = extractNumberFromKeys(n, ['proteins_100g', 'proteins', 'proteins_value']);
  const sodiumMg100g = extractNumberFromKeys(n, ['sodium_100g', 'sodium', 'sodium_value']) ? (extractNumberFromKeys(n, ['sodium_100g', 'sodium', 'sodium_value'])! * 1000) : (extractNumberFromKeys(n, ['salt_100g', 'salt']) ? Math.round((extractNumberFromKeys(n, ['salt_100g', 'salt'])! / 2.5) * 1000) : undefined);

  const rawQuantityStr = String(p.quantity || p.product_quantity || '').toLowerCase();
  const rawCategoryStr = String((Array.isArray(p.categories_tags) ? p.categories_tags.join(' ') : p.categories) || '').toLowerCase();
  const isLiquid = isProductLiquid(rawQuantityStr, rawCategoryStr);
  const defaultUnitLabel = isLiquid ? '100 ml' : '100 g';

  const totalWeightGrams = parseQuantityString(rawQuantityStr);
  let totalSugarGrams: number | undefined;
  if (totalWeightGrams !== null && totalWeightGrams > 0 && sugarPer100g !== undefined) {
    totalSugarGrams = parseFloat(((sugarPer100g * totalWeightGrams) / 100).toFixed(1));
  }

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

  const categoryTag = Array.isArray(p.categories_tags) && p.categories_tags.length > 0
    ? p.categories_tags[p.categories_tags.length - 1]
    : undefined;

  const ingredientsText = p.ingredients_text_en || p.ingredients_text || undefined;
  const stealthAnalysis = detectStealthSugars(ingredientsText);

  // NOVA Group Determination
  const rawNova = p.nova_group ?? p.nova_groups ?? undefined;
  let novaClass: NOVAClass | undefined = (rawNova && [1, 2, 3, 4].includes(Number(rawNova))) ? Number(rawNova) as NOVAClass : undefined;

  const additives = parseAdditivesFromProduct(p);
  const additiveCount = additives.length;
  const allergens = parseAllergensFromProduct(p);

  // Nutri-Score Resolution with Algorithmic Fallback Proxy
  const rawNutriScore = String(p.nutriscore_grade ?? p.nutrition_grades ?? p.ecoscore_data?.previous_data?.nutriscore_grade ?? '').toLowerCase();
  let nutriScore: ScanResultData['nutriScore'] = ['a', 'b', 'c', 'd', 'e'].includes(rawNutriScore) ? rawNutriScore as ScanResultData['nutriScore'] : undefined;

  if (!nutriScore) {
    nutriScore = calculateAlgorithmicNutriScore({
      kcal100g,
      satFat100g,
      sugar100g: sugarPer100g,
      sodiumMg100g,
      protein100g,
      isBeverage: isLiquid,
    });
  }

  const biteFixScore = computeBiteFixScore({ name, brand, novaClass, additiveCount, nutriScore, sugarPer100g, ingredientsText });

  // Eco-Score & Carbon Footprint Resolution with Fallback Estimator
  const analysisTags = (p.ingredients_analysis_tags || []).map((t: string) => t.toLowerCase());
  const isVegan = analysisTags.includes('en:vegan');
  const isVegetarian = analysisTags.includes('en:vegetarian') || isVegan;

  const rawEcoScore = String(p.ecoscore_grade ?? p.ecoscore_data?.previous_data?.grade ?? p.ecoscore_data?.grade ?? '').toLowerCase();
  let ecoscoreGrade: ScanResultData['ecoscoreGrade'] = ['a', 'b', 'c', 'd', 'e'].includes(rawEcoScore) ? rawEcoScore as ScanResultData['ecoscoreGrade'] : undefined;

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

  if (!ecoscoreGrade || ecoscoreGrade === 'unknown') {
    const est = estimateEcoScoreFromCategory(rawCategoryStr, isVegan, isVegetarian);
    ecoscoreGrade = est.grade;
    if (!carbonFootprint100g) carbonFootprint100g = est.co2Grams100g;
  }

  const labelTags = (p.labels_tags || []).map((t: string) => t.toLowerCase());
  const isOrganic = labelTags.includes('en:organic') || labelTags.includes('en:usda-organic') || labelTags.includes('en:eu-organic') || labelTags.includes('en:bio');

  return {
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
}

export async function lookupOpenFoodFacts(barcode: string, signal: AbortSignal): Promise<ScanResultData | null> {
  const candidates = generateBarcodeCandidates(barcode);
  let resData: any = null;

  try {
    // ─── PASS 1: OpenFoodFacts v3 in Parallel ───
    if (signal.aborted) return null;
    const offPromises = candidates.map(async (cand) => {
      try {
        const responseV3 = await fetchWithTimeout(
          `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(cand)}.json`,
          6000,
          signal
        );
        if (signal.aborted) return null;
        if (responseV3.ok) {
          const data = await responseV3.json();
          if (data?.product) {
            return data;
          }
        }
      } catch (e) {
        // ignore candidate failures
      }
      return null;
    });

    const offResults = await Promise.all(offPromises);
    resData = offResults.find((r) => r?.product);

    // ─── PASS 2: USDA Fallback in Parallel (If OFF returned no product) ───
    if (!resData?.product) {
      if (signal.aborted) return null;
      const usdaPromises = candidates.map(async (cand) => {
        return fetchUsdaFoodData(cand, signal);
      });
      const usdaResults = await Promise.all(usdaPromises);
      const usdaFound = usdaResults.find((r) => r);
      if (usdaFound) {
        resData = { product: usdaFound };
      }
    }

    if (!resData?.product) {
      return null;
    }

    // ─── PASS 3: Hybrid Merge — Enrich OFF Product with USDA Verified Nutrition & Ingredients ───
    if (resData?.product) {
      let p = resData.product;
      const offNutriments = p.nutriments ?? p.nutrition_grades ?? p.nutrition_data ?? {};
      const hasNutrimentData = offNutriments && typeof offNutriments === 'object' && Object.keys(offNutriments).length > 0 &&
        (offNutriments.sugars_100g !== undefined || offNutriments.sugars !== undefined || offNutriments['energy-kcal_100g'] !== undefined ||
         offNutriments.carbohydrates_100g !== undefined || offNutriments.fat_100g !== undefined || offNutriments.proteins_100g !== undefined);

      const hasIngredients = typeof (p.ingredients_text_en || p.ingredients_text) === 'string' && (p.ingredients_text_en || p.ingredients_text).trim().length > 0;

      if ((!hasNutrimentData || !hasIngredients) && !signal.aborted) {
        const usdaPromises = candidates.map(async (cand) => {
          return fetchUsdaFoodData(cand, signal);
        });
        const usdaResults = await Promise.all(usdaPromises);
        const usdaData = usdaResults.find((r) => r);
        if (usdaData) {
          console.log(`[BiteFix] Hybrid Merge: Enriched product "${p.product_name}" with official USDA nutrition/ingredients specs.`);
          p.nutriments = { ...(usdaData.nutriments || {}), ...(p.nutriments || {}) };
          if (!hasIngredients && usdaData.ingredients_text) {
            p.ingredients_text_en = usdaData.ingredients_text;
            p.ingredients_text = usdaData.ingredients_text;
          }
          if (!p.serving_size && usdaData.serving_size) {
            p.serving_size = usdaData.serving_size;
          }
        }
      }
      resData.product = p;
    }

    // Normalize raw payload through Universal Normalizer Pipeline
    return normalizeProductPayload(resData.product);
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