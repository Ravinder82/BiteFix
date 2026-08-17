import {
  NOVAClass,
  AdditiveDetail,
  AdditiveRiskLevel,
  ProductDataSource,
  ProductDataStatus,
  NutritionIntelligenceData,
  NutritionInsightItem,
  NutritionInsightLevel,
} from '../types/app.types';
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
  productDataStatus?: ProductDataStatus;
  productDataSources?: ProductDataSource[];

  // ── BiteFix Extensions ──────────────────────────────
  novaClass?: NOVAClass;
  additives?: AdditiveDetail[];
  additiveCount?: number;
  allergens?: string[];
  shieldAlerts?: { id: string; type: 'allergen' | 'oil'; name: string }[];
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  biteFixScore?: number;
  
  // ── Nutrition Intelligence Extension ──────────────────
  nutritionIntelligence?: NutritionIntelligenceData;
  satFat100g?: number;
  sodiumMg100g?: number;
  fibre100g?: number;
  cholesterolMg100g?: number;
  
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
// Reusable Nutrition Signal Normalization & Intelligence Engine
// Single Source of Truth for BiteFix Intelligence Score™ & Nutrition Intelligence
// ─────────────────────────────────────────────────────────

export interface NormalizedNutritionSignals {
  signals: number[];
  nutritionScore: number;
  kcalScore?: number;
  satFatScore?: number;
  sodiumScore?: number;
  proteinScore?: number;
  fibreScore?: number;
}

export function normalizeNutritionSignals(opts: {
  kcal100g?: number;
  satFat100g?: number;
  protein100g?: number;
  sodiumMg100g?: number;
  fibre100g?: number;
  isBeverage?: boolean;
}): NormalizedNutritionSignals {
  const clamp = (v: number, min: number = 0, max: number = 100) => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.max(lo, Math.min(hi, v));
  };
  const lerp = (v: number, inLo: number, inHi: number, outLo: number, outHi: number) => {
    const clampedInput = clamp(v, inLo, inHi);
    const t = (clampedInput - inLo) / (inHi - inLo);
    return clamp(outLo + t * (outHi - outLo), 0, 100);
  };

  const signals: number[] = [];

  let kcalScore: number | undefined;
  if (opts.kcal100g !== undefined) {
    kcalScore = opts.isBeverage
      ? lerp(opts.kcal100g, 0, 100, 100, 0)
      : lerp(opts.kcal100g, 0, 600, 100, 0);
    signals.push(clamp(kcalScore, 0, 100));
  }

  let satFatScore: number | undefined;
  if (opts.satFat100g !== undefined) {
    satFatScore = lerp(opts.satFat100g, 0, 20, 100, 0);
    signals.push(satFatScore);
  }

  let sodiumScore: number | undefined;
  if (opts.sodiumMg100g !== undefined) {
    sodiumScore = lerp(opts.sodiumMg100g, 0, 900, 100, 0);
    signals.push(sodiumScore);
  }

  let proteinScore: number | undefined;
  if (opts.protein100g !== undefined) {
    proteinScore = lerp(opts.protein100g, 0, 25, 0, 100);
    signals.push(proteinScore);
  }

  let fibreScore: number | undefined;
  if (opts.fibre100g !== undefined) {
    fibreScore = lerp(opts.fibre100g, 0, 10, 0, 100);
    signals.push(fibreScore);
  }

  const nutritionScore = signals.length > 0
    ? signals.reduce((sum, v) => sum + v, 0) / signals.length
    : 50;

  return {
    signals,
    nutritionScore,
    kcalScore,
    satFatScore,
    sodiumScore,
    proteinScore,
    fibreScore,
  };
}

/**
 * Derives dynamic Nutrition Intelligence insights using the exact same
 * underlying product signals and thresholds as BiteFix Intelligence Score™.
 */
export function deriveNutritionIntelligence(opts: {
  protein100g?: number;
  fibre100g?: number;
  satFat100g?: number;
  sodiumMg100g?: number;
  cholesterolMg100g?: number;
  micronutrientCount?: number;
}): NutritionIntelligenceData {
  const insights: NutritionInsightItem[] = [];

  let proteinItem: NutritionInsightItem | undefined;
  if (opts.protein100g !== undefined) {
    const p = opts.protein100g;
    const level: NutritionInsightLevel = p >= 15 ? 'Strong' : p >= 6 ? 'Good Source' : p >= 2 ? 'Moderate' : 'Lower';
    const tone = p >= 6 ? 'positive' : 'neutral';
    proteinItem = { id: 'protein', label: 'Protein', value: `${p}g`, level, tone };
    insights.push(proteinItem);
  }

  let fibreItem: NutritionInsightItem | undefined;
  if (opts.fibre100g !== undefined) {
    const f = opts.fibre100g;
    const level: NutritionInsightLevel = f >= 6 ? 'Strong' : f >= 3 ? 'Good Source' : f >= 1 ? 'Moderate' : 'Lower';
    const tone = f >= 3 ? 'positive' : 'neutral';
    fibreItem = { id: 'fibre', label: 'Fibre', value: `${f}g`, level, tone };
    insights.push(fibreItem);
  }

  let satFatItem: NutritionInsightItem | undefined;
  if (opts.satFat100g !== undefined) {
    const sf = opts.satFat100g;
    const level: NutritionInsightLevel = sf <= 1.5 ? 'Lower' : sf <= 5 ? 'Moderate' : 'Higher';
    const tone = sf <= 1.5 ? 'positive' : sf <= 5 ? 'neutral' : 'caution';
    satFatItem = { id: 'saturated_fat', label: 'Saturated Fat', value: `${sf}g`, level, tone };
    insights.push(satFatItem);
  }

  let sodiumItem: NutritionInsightItem | undefined;
  if (opts.sodiumMg100g !== undefined) {
    const sod = opts.sodiumMg100g;
    const level: NutritionInsightLevel = sod <= 120 ? 'Lower' : sod <= 600 ? 'Moderate' : 'Higher';
    const tone = sod <= 120 ? 'positive' : sod <= 600 ? 'neutral' : 'caution';
    sodiumItem = { id: 'sodium', label: 'Sodium', value: `${Math.round(sod)}mg`, level, tone };
    insights.push(sodiumItem);
  }

  let cholesterolItem: NutritionInsightItem | undefined;
  if (opts.cholesterolMg100g !== undefined) {
    const chol = opts.cholesterolMg100g;
    const level: NutritionInsightLevel = chol <= 20 ? 'Lower' : chol <= 60 ? 'Moderate' : 'Higher';
    const tone = chol <= 20 ? 'positive' : chol <= 60 ? 'neutral' : 'caution';
    cholesterolItem = { id: 'cholesterol', label: 'Cholesterol', value: `${Math.round(chol)}mg`, level, tone };
    insights.push(cholesterolItem);
  }

  let microItem: NutritionInsightItem | undefined;
  if (opts.micronutrientCount !== undefined) {
    const count = opts.micronutrientCount;
    const level: NutritionInsightLevel = count >= 3 ? 'Available' : count >= 1 ? 'Partial' : 'Not Available';
    const tone = count >= 3 ? 'positive' : 'neutral';
    microItem = { id: 'micronutrients', label: 'Vitamin & Mineral Profile', level, tone };
    insights.push(microItem);
  }

  return {
    protein: proteinItem,
    fibre: fibreItem,
    saturatedFat: satFatItem,
    sodium: sodiumItem,
    cholesterol: cholesterolItem,
    micronutrients: microItem,
    insights,
  };
}

// ─────────────────────────────────────────────────────────
// BiteFix Intelligence Score™ (0-100)
// ─────────────────────────────────────────────────────────

/**
 * BiteFix Intelligence Score™
 *
 * A proprietary, explainable, deterministic composite score (0–100) computed
 * from six independent weighted components. The score is informational only —
 * it is not a health, safety, medical, or purity score.
 *
 * Components (sum = 100%):
 *   Nutrition Profile    30%  — calorie density, sat fat, sodium, protein, fibre signals
 *   Sugar Profile        20%  — continuous penalty on sugar/100g; beverage-aware
 *   Processing Profile   15%  — NOVA as a major signal but NOT a hard bound
 *   Ingredient/Additive  15%  — weighted by additive risk tier, not flat count
 *   Food Composition     10%  — ingredient complexity, whole-food vs refined signals
 *   Data Confidence      10%  — how many of the above inputs are actually available
 *
 * NOVA is a signal, not a ceiling/floor: the final score is free to vary within
 * any range regardless of NOVA class. A NOVA 4 product with good nutrition can
 * score higher than a data-poor NOVA 1 product.
 *
 * Missing data lowers the Data Confidence component rather than fabricating values.
 * Each missing major input is treated conservatively (neutral fallback for that
 * component) and reduces confidence.
 */
export function computeBiteFixScore(opts: {
  name?: string;
  brand?: string;
  novaClass?: NOVAClass;
  additiveCount?: number;
  additives?: AdditiveDetail[];
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  sugarPer100g?: number;
  ingredientsText?: string;
  // Extended nutrition signals (per 100g / 100ml)
  kcal100g?: number;
  satFat100g?: number;
  protein100g?: number;
  sodiumMg100g?: number;
  fibre100g?: number;
  isBeverage?: boolean;
}): number {
  // ── Helpers ──────────────────────────────────────────────
  const clamp = (v: number, min: number = 0, max: number = 100) => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.max(lo, Math.min(hi, v));
  };
  const lerp = (v: number, inLo: number, inHi: number, outLo: number, outHi: number) => {
    const clampedInput = clamp(v, inLo, inHi);
    const t = (clampedInput - inLo) / (inHi - inLo);
    return clamp(outLo + t * (outHi - outLo), 0, 100);
  };

  // Availability flags (used by confidence component)
  const hasNova      = opts.novaClass !== undefined;
  // hasSugar: any number including 0 is a valid known value (0g sugar = perfect sugar score).
  // Only undefined means 'unknown'.
  const hasSugar     = opts.sugarPer100g !== undefined;
  const hasKcal      = opts.kcal100g !== undefined;
  const hasSatFat    = opts.satFat100g !== undefined;
  const hasProtein   = opts.protein100g !== undefined;
  const hasSodium    = opts.sodiumMg100g !== undefined;
  const hasFibre     = opts.fibre100g !== undefined;
  const hasIngreds   = typeof opts.ingredientsText === 'string' && opts.ingredientsText.trim().length > 0;
  const hasAdditives = opts.additives !== undefined;
  const hasNutriScore = opts.nutriScore !== undefined;

  // ────────────────────────────────────────────────────────
  // 1. NUTRITION PROFILE (0–100), weight 30%
  //    Uses normalized nutrition signals — single source of truth.
  // ────────────────────────────────────────────────────────
  const normNutrition = normalizeNutritionSignals({
    kcal100g: opts.kcal100g,
    satFat100g: opts.satFat100g,
    protein100g: opts.protein100g,
    sodiumMg100g: opts.sodiumMg100g,
    fibre100g: opts.fibre100g,
    isBeverage: opts.isBeverage,
  });

  let nutritionScore = normNutrition.nutritionScore;
  if (normNutrition.signals.length === 0 && hasNutriScore) {
    // Nutri-Score as supporting signal only when raw data is unavailable
    const nsMap: Record<string, number> = { a: 88, b: 72, c: 52, d: 32, e: 15 };
    nutritionScore = nsMap[opts.nutriScore!] ?? 50;
  }

  // ────────────────────────────────────────────────────────
  // 2. SUGAR PROFILE (0–100), weight 20%
  //    Continuous penalty — NOT a binary threshold.
  //    Beverage-aware: 10g/100ml already flags significantly.
  // ────────────────────────────────────────────────────────
  let sugarScore = 50; // neutral fallback when no data
  if (hasSugar) {
    const s = opts.sugarPer100g!;
    if (opts.isBeverage) {
      // For beverages: 0g/100ml → 100, 15g/100ml → 0
      sugarScore = clamp(lerp(s, 0, 15, 100, 0), 0, 100);
    } else {
      // For solids: 0g → 100, 60g → 0 (e.g. pure sugar = 100g/100g)
      sugarScore = clamp(lerp(s, 0, 60, 100, 0), 0, 100);
    }

    // Stealth-sugar bonus penalty: if ingredients text contains known
    // added-sugar aliases at high prominence, apply a small signal reduction
    if (hasIngreds) {
      const ingLower = opts.ingredientsText!.toLowerCase();
      const addedSugarAliases = [
        'high fructose corn syrup', 'corn syrup', 'glucose-fructose syrup',
        'glucose syrup', 'fructose syrup', 'dextrose', 'maltose',
        'invert sugar', 'sugar syrup', 'cane sugar',
      ];
      const aliasCount = addedSugarAliases.filter(a => ingLower.includes(a)).length;
      if (aliasCount > 0) {
        // Each alias reduces subscore by up to 8 points (max 3 aliases penalised)
        sugarScore = Math.max(0, sugarScore - Math.min(3, aliasCount) * 8);
      }
    }
  }

  // ────────────────────────────────────────────────────────
  // 3. PROCESSING PROFILE (0–100), weight 15%
  //    NOVA is the main signal, but is NOT a hard bound.
  //    Missing NOVA → defensible neutral fallback.
  // ────────────────────────────────────────────────────────
  let processingScore = 45; // conservative neutral when NOVA unknown
  if (hasNova) {
    const novaBaseScores: Record<number, number> = { 1: 92, 2: 72, 3: 46, 4: 22 };
    processingScore = novaBaseScores[opts.novaClass!] ?? 45;
  } else if (hasIngreds) {
    // Heuristic processing inference from ingredients when NOVA is missing
    const ingLower = opts.ingredientsText!.toLowerCase();
    const ultraSignals = [
      'high fructose corn syrup', 'corn syrup', 'modified starch', 'emulsifier',
      'artificial flavor', 'artificial colour', 'caramel color', 'phosphoric acid',
    ];
    const ultraCount = ultraSignals.filter(s => ingLower.includes(s)).length;
    if (ultraCount >= 3) {
      processingScore = 25;
    } else if (ultraCount >= 1) {
      processingScore = 42;
    } else {
      processingScore = 60; // simple ingredient list → likely less processed
    }
  }

  // ────────────────────────────────────────────────────────
  // 4. INGREDIENT / ADDITIVE PROFILE (0–100), weight 15%
  //    Weighted by risk tier, not flat count.
  //    elevated > moderate > unclassified.
  // ────────────────────────────────────────────────────────
  let ingredientScore = 75; // optimistic neutral when no additive data

  if (hasAdditives) {
    const allAdditives = opts.additives!;
    const elevated = allAdditives.filter(a => a.riskLevel === 'elevated').length;
    const moderate = allAdditives.filter(a => a.riskLevel === 'moderate').length;
    const low      = allAdditives.filter(a => a.riskLevel === 'low').length;
    const unclassified = (opts.additiveCount ?? allAdditives.length) - elevated - moderate - low;

    // Penalty per tier — calibrated to give meaningful differentiation.
    //
    // Elevated additives (e.g. aspartame, sodium benzoate, tartrazine):
    //   - 1 elevated  → −22 → score 78  (notable but not catastrophic alone)
    //   - 2 elevated  → −44 → score 56  (significant concern)
    //   - 3+ elevated → capped at −66 → score 34  (floor — multiple red-flag additives)
    //
    // Moderate additives (e.g. carrageenan, carboxymethylcellulose, TiO2):
    //   - 1 moderate  → −8  → score 92
    //   - 3 moderate  → −24 → score 76 (capped)
    //
    // Low/unclassified additives (e.g. citric acid, ascorbic acid, lecithin):
    //   - small progressive reduction, max −10
    const elevatedPenalty  = Math.min(66, elevated * 22);
    const moderatePenalty  = Math.min(24, moderate * 8);
    const lowPenalty       = Math.min(10, (low + Math.max(0, unclassified)) * 2);

    ingredientScore = clamp(100 - elevatedPenalty - moderatePenalty - lowPenalty, 0, 100);
  } else if ((opts.additiveCount ?? 0) > 0) {
    // Fallback: flat count available but no detail → moderate assumption
    const count = opts.additiveCount!;
    ingredientScore = clamp(100 - count * 8, 20, 85);
  }

  // ────────────────────────────────────────────────────────
  // 5. FOOD COMPOSITION (0–100), weight 10%
  //    Ingredient-list signals: complexity, whole-food presence,
  //    refined-ingredient patterns.
  // ────────────────────────────────────────────────────────
  let compositionScore = 50; // neutral when no ingredients

  if (hasIngreds) {
    const ingText = opts.ingredientsText!;
    const ingLower = ingText.toLowerCase();

    // Ingredient count proxy from comma count
    const ingCount = (ingText.match(/,/g) || []).length + 1;

    // Start at 75, reduce for complexity
    let comp = 75;

    // Complexity penalty: very long lists indicate more processing
    if (ingCount > 20) comp -= 25;
    else if (ingCount > 10) comp -= 15;
    else if (ingCount > 5) comp -= 8;

    // Refined/ultra patterns (penalty)
    const refinedPatterns = [
      'modified', 'hydrogenated', 'partially hydrogenated', 'fractionated',
      'corn syrup', 'high fructose', 'glucose syrup', 'artificial',
      'acesulfame', 'aspartame', 'sucralose', 'saccharin',
    ];
    const refinedHits = refinedPatterns.filter(p => ingLower.includes(p)).length;
    comp -= Math.min(30, refinedHits * 10);

    // Whole-food signals (bonus — limited to +15)
    const wholeFoodPatterns = [
      'whole wheat', 'whole grain', 'rolled oats', 'brown rice', 'quinoa',
      'lentils', 'chickpeas', 'almonds', 'walnuts', 'seeds', 'flaxseed',
      'sunflower seed', 'pumpkin seed',
    ];
    const wholeFoodHits = wholeFoodPatterns.filter(p => ingLower.includes(p)).length;
    comp += Math.min(15, wholeFoodHits * 5);

    // Protein/fibre-dense first ingredient bonus
    const firstIngredient = ingLower.split(',')[0].trim();
    const proteinFirst = ['chicken', 'beef', 'fish', 'turkey', 'egg', 'lentil', 'chickpea', 'tofu', 'tempeh'];
    if (proteinFirst.some(p => firstIngredient.includes(p))) comp += 8;

    compositionScore = clamp(comp, 0, 100);
  } else if (hasNova) {
    // Impute a rough composition estimate from NOVA if no ingredients text
    const novaCompMap: Record<number, number> = { 1: 75, 2: 60, 3: 42, 4: 28 };
    compositionScore = novaCompMap[opts.novaClass!] ?? 50;
  }

  // ────────────────────────────────────────────────────────
  // 6. DATA CONFIDENCE (0–100), weight 10%
  //    Reflects how much evidence the above components have.
  //    Does NOT directly penalise the product for missing data —
  //    it reduces the contribution of the confidence component.
  // ────────────────────────────────────────────────────────
  const totalSignals = 10;
  const availableSignals = [
    hasNova, hasSugar, hasKcal, hasSatFat, hasProtein,
    hasSodium, hasIngreds, hasAdditives, hasFibre, hasNutriScore,
  ].filter(Boolean).length;

  const confidenceScore = clamp((availableSignals / totalSignals) * 100, 10, 100);

  // ────────────────────────────────────────────────────────
  // FINAL WEIGHTED SCORE
  // ────────────────────────────────────────────────────────
  const raw =
    nutritionScore  * 0.30 +
    sugarScore      * 0.20 +
    processingScore * 0.15 +
    ingredientScore * 0.15 +
    compositionScore * 0.10 +
    confidenceScore * 0.10;

  return clamp(Math.round(raw), 0, 100);
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

type ProductDataCoverage = {
  hasIdentity: boolean;
  hasIngredients: boolean;
  hasSugar: boolean;
  hasCalories: boolean;
  hasCarbs: boolean;
  hasFat: boolean;
  hasProtein: boolean;
};

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function getNutritionPayload(p: any): Record<string, any> {
  if (!p || typeof p !== 'object') return {};
  const nutriments = p.nutriments ?? p.nutrition_grades ?? p.nutrition_data ?? {};
  return nutriments && typeof nutriments === 'object' ? nutriments : {};
}

function hasNumericValue(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function getProductDataCoverage(p: any): ProductDataCoverage {
  const nutriments = getNutritionPayload(p);
  const caloriesKj = extractNumberFromKeys(nutriments, ['energy-kj_100g', 'energy-kj', 'energy_100g']);

  return {
    hasIdentity: hasNonEmptyString(p?.product_name) ||
      hasNonEmptyString(p?.description) ||
      hasNonEmptyString(p?.brands) ||
      hasNonEmptyString(p?.brandOwner) ||
      hasNonEmptyString(p?.brandName) ||
      hasNonEmptyString(p?.image_front_url) ||
      hasNonEmptyString(p?.image_url),
    hasIngredients: hasNonEmptyString(p?.ingredients_text_en) || hasNonEmptyString(p?.ingredients_text) || hasNonEmptyString(p?.ingredients),
    hasSugar: hasNumericValue(extractNumberFromKeys(nutriments, ['sugars_100g', 'sugars', 'sugars_value', 'sugars-total_100g', 'sugars-total', 'added-sugars_100g', 'added-sugars', 'added-sugars_value'])),
    hasCalories: hasNumericValue(extractNumberFromKeys(nutriments, ['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value', 'energy-kcal_serving'])) || hasNumericValue(caloriesKj),
    hasCarbs: hasNumericValue(extractNumberFromKeys(nutriments, ['carbohydrates_100g', 'carbohydrates', 'carbohydrates_value', 'carbohydrates_serving'])),
    hasFat: hasNumericValue(extractNumberFromKeys(nutriments, ['fat_100g', 'fat', 'fat_value', 'fat_serving'])),
    hasProtein: hasNumericValue(extractNumberFromKeys(nutriments, ['proteins_100g', 'proteins', 'proteins_value', 'proteins_serving'])),
  };
}

function hasMeaningfulProductDataContribution(coverage: ProductDataCoverage): boolean {
  return coverage.hasIdentity ||
    coverage.hasIngredients ||
    coverage.hasSugar ||
    coverage.hasCalories ||
    coverage.hasCarbs ||
    coverage.hasFat ||
    coverage.hasProtein;
}

function didUsdaContributeEnrichment(offCoverage: ProductDataCoverage, usdaCoverage: ProductDataCoverage): boolean {
  return (!offCoverage.hasIngredients && usdaCoverage.hasIngredients) ||
    (!offCoverage.hasSugar && usdaCoverage.hasSugar) ||
    (!offCoverage.hasCalories && usdaCoverage.hasCalories) ||
    (!offCoverage.hasCarbs && usdaCoverage.hasCarbs) ||
    (!offCoverage.hasFat && usdaCoverage.hasFat) ||
    (!offCoverage.hasProtein && usdaCoverage.hasProtein);
}

function resolveProductDataStatus(coverage: ProductDataCoverage): ProductDataStatus {
  return coverage.hasIdentity &&
    coverage.hasIngredients &&
    coverage.hasSugar &&
    coverage.hasCalories &&
    coverage.hasCarbs &&
    coverage.hasFat &&
    coverage.hasProtein
    ? 'complete'
    : 'partial';
}

// ─────────────────────────────────────────────────────────
// UNIVERSAL DATA NORMALIZATION ENGINE
// ─────────────────────────────────────────────────────────
export function normalizeProductPayload(
  p: any,
  metadata?: {
    productDataStatus?: ProductDataStatus;
    productDataSources?: ProductDataSource[];
  }
): ScanResultData {
  const name = extractUniversalName(p);
  const brand = extractUniversalBrand(p);
  const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url || undefined;

  let n = p.nutriments ?? p.nutrition_grades ?? p.nutrition_data ?? {};

  // Authoritative total sugar per 100g (Carbs are NEVER promoted to sugar)
  // rawSugarPer100g: undefined when the field is genuinely absent from the database.
  // sugarPer100g: falls back to 0 for all display/calculation code that follows.
  const rawSugarPer100g = extractNumberFromKeys(n, [
    'sugars_100g', 'sugars', 'sugars_value', 'sugars-total_100g', 'sugars-total'
  ]);
  let sugarPer100g = rawSugarPer100g ?? 0;

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

  // Fibre per 100g (not previously used in scoring, now available)
  const fibre100g = extractNumberFromKeys(n, ['fiber_100g', 'fibers_100g', 'fiber', 'fibers_value', 'fiber-dietary_100g', 'fiber-dietary']) ?? undefined;

  const biteFixScore = computeBiteFixScore({
    novaClass,
    additiveCount,
    additives,
    nutriScore,
    // rawSugarPer100g: undefined = field absent (unknown data), number (incl. 0) = confirmed value.
    // 0g sugar is a real, known result (e.g. plain water, unseasoned chicken) and should
    // score 100 on the sugar component, not fall back to the neutral 50.
    sugarPer100g: rawSugarPer100g !== undefined ? sugarPer100g : undefined,
    ingredientsText,
    kcal100g,
    satFat100g,
    protein100g,
    sodiumMg100g,
    fibre100g,
    isBeverage: isLiquid,
  });

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

  // Cholesterol per 100g in mg (convert if in grams)
  const rawCholesterol = extractNumberFromKeys(n, [
    'cholesterol_100g', 'cholesterol', 'cholesterol_value'
  ]);
  let cholesterolMg100g: number | undefined = undefined;
  if (rawCholesterol !== undefined) {
    cholesterolMg100g = rawCholesterol > 1.0 ? rawCholesterol : Math.round(rawCholesterol * 1000);
  }

  // Detect actual available vitamins & minerals
  const micronutrientKeys = [
    'vitamin-a_100g', 'vitamin-a', 'vitamin-c_100g', 'vitamin-c', 'vitamin-d_100g', 'vitamin-d',
    'vitamin-e_100g', 'vitamin-e', 'vitamin-k_100g', 'vitamin-k', 'vitamin-b1_100g', 'vitamin-b1',
    'vitamin-b2_100g', 'vitamin-b2', 'vitamin-b6_100g', 'vitamin-b6', 'vitamin-b9_100g', 'vitamin-b9',
    'vitamin-b12_100g', 'vitamin-b12', 'calcium_100g', 'calcium', 'iron_100g', 'iron',
    'magnesium_100g', 'magnesium', 'potassium_100g', 'potassium', 'zinc_100g', 'zinc',
    'phosphorus_100g', 'phosphorus', 'iodine_100g', 'iodine', 'selenium_100g', 'selenium',
    'folates_100g', 'folates', 'pantothenic-acid_100g', 'biotin_100g'
  ];
  const detectedMicroKeys = micronutrientKeys.filter(k => {
    const val = extractNumberFromKeys(n, [k]);
    return val !== undefined && val > 0;
  });
  const uniqueMicros = new Set(detectedMicroKeys.map(k => k.replace(/_100g$/, '')));
  const micronutrientCount = uniqueMicros.size;

  // Derive dynamic Nutrition Intelligence analysis
  const nutritionIntelligence = deriveNutritionIntelligence({
    protein100g,
    fibre100g,
    satFat100g,
    sodiumMg100g,
    cholesterolMg100g,
    micronutrientCount,
  });

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
    productDataStatus: metadata?.productDataStatus,
    productDataSources: metadata?.productDataSources,
    novaClass,
    additives,
    additiveCount,
    allergens,
    nutriScore,
    biteFixScore,
    nutritionIntelligence,
    satFat100g,
    sodiumMg100g,
    fibre100g,
    cholesterolMg100g,
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
  const productDataSources = new Set<ProductDataSource>();
  let offCoverage: ProductDataCoverage | null = null;

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
    if (resData?.product) {
      offCoverage = getProductDataCoverage(resData.product);
      if (hasMeaningfulProductDataContribution(offCoverage)) {
        productDataSources.add('open_food_facts');
      }
    }

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
        const usdaCoverage = getProductDataCoverage(usdaFound);
        if (hasMeaningfulProductDataContribution(usdaCoverage)) {
          productDataSources.add('usda_fooddata_central');
        }
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
          const usdaCoverage = getProductDataCoverage(usdaData);
          if (!offCoverage || didUsdaContributeEnrichment(offCoverage, usdaCoverage)) {
            productDataSources.add('usda_fooddata_central');
          }
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
    const finalCoverage = getProductDataCoverage(resData.product);
    return normalizeProductPayload(resData.product, {
      productDataStatus: resolveProductDataStatus(finalCoverage),
      productDataSources: Array.from(productDataSources),
    });
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
