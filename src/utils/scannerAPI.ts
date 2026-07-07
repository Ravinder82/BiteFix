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
        'User-Agent': 'CutSugarApp/1.0.0 (React Native; iOS/Android; contact@cutsugarapp.com)',
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
  const multiMatch = cleaned.match(/(\d+)\s*[xX*]\s*([\d\.]+)\s*(g|gm|gms|gram|grams|ml|kg|l|ltr|litre|litres|cl|fl\s*oz|fl\.\s*oz|oz|ounce|ounces)/);
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
      return count * unitVal;
    }
  }

  // Regular single quantity match (handling indian terminology like gm, gms, ltr, litre)
  const match = cleaned.match(/([\d\.]+)\s*(g|gm|gms|gram|grams|ml|kg|l|ltr|litre|litres|cl|fl\s*oz|fl\.\s*oz|oz|ounce|ounces)/);
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

export async function lookupAlternatives(categoryTag: string, maxSugarPer100g: number, signal: AbortSignal): Promise<ScanResultData[]> {
  try {
    // ─── Try modern OpenAPI v3 search first ───
    let data: any = null;
    try {
      const responseV3 = await fetchWithTimeout(
        `https://world.openfoodfacts.org/api/v3/search?categories_tags=${encodeURIComponent(categoryTag)}&sort_by=nutriments.sugars_value&page_size=24`,
        API_TIMEOUT_MS,
        signal
      );
      if (!signal.aborted && responseV3.ok) {
        const json = await responseV3.json();
        if (json?.products && json.products.length > 0) {
          data = json;
        }
      }
    } catch (e) {
      if (isAbortError(e)) return [];
      console.warn('OFF v3 alternatives search failed, falling back to v2:', e);
    }

    // ─── Fallback to legacy v2 search ONLY if v3 returned no alternatives ───
    if (!data?.products || data.products.length === 0) {
      const responseV2 = await fetchWithTimeout(
        `https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(categoryTag)}&sort_by=nutriments.sugars_value&page_size=24`,
        API_TIMEOUT_MS,
        signal
      );
      if (signal.aborted || !responseV2.ok) return [];
      data = await responseV2.json();
    }

    if (!data?.products || data.products.length === 0) return [];

    const results: ScanResultData[] = [];
    for (const p of data.products) {
      const sugarPer100g = extractNumberFromKeys(p.nutriments ?? {}, [
        'sugars_100g', 'sugars', 'sugars_value', 'sugars-total_100g', 'sugars-total'
      ]) ?? 0;
      
      const name = extractUniversalName(p);
      if (sugarPer100g < maxSugarPer100g && name !== 'Scanned Food Item') {
        const brand = extractUniversalBrand(p);
        const imageUrl = p.image_front_url || p.image_url || undefined;
        
        const sugarGrams = extractNumberFromKeys(p.nutriments ?? {}, [
          'sugars_serving', 'sugars-total_serving'
        ]) ?? sugarPer100g;
        const sugarTeaspoons = parseFloat((sugarGrams / 4.2).toFixed(1));

        results.push({
          name,
          brand,
          sugarGrams,
          sugarTeaspoons,
          sugarPer100g,
          imageUrl,
          servingSize: p.serving_size,
          calories: extractNumberFromKeys(p.nutriments ?? {}, ['energy-kcal_serving', 'energy-kcal', 'energy-kcal_value']),
          categoryTag,
        });
      }
      // Return top 1 healthiest alternative as requested
      if (results.length >= 1) break;
    }
    return results;
  } catch (err) {
    console.warn('Error fetching alternatives:', err);
    return [];
  }
}
