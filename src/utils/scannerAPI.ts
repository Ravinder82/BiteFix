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
  totalSugarGrams?: number;
  totalSugarTeaspoons?: number;
  packageSize?: string;
  totalCalories?: number;
  totalCarbsGrams?: number;
  totalFatGrams?: number;
  totalProteinGrams?: number;
  imageUrl?: string;
  sugarPer100g?: number;
  categoryTag?: string;
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

export function extractSugarFromNutriments(n: Record<string, any>): number {
  if (!n) return 0;

  const toNum = (v: any): number | null => {
    if (v === undefined || v === null || v === '') return null;
    const num = parseFloat(String(v));
    return isNaN(num) ? null : num;
  };

  const addedSugarServing = toNum(n['added-sugars_serving']);
  if (addedSugarServing !== null) return addedSugarServing;

  const addedSugar100g = toNum(n['added-sugars_100g'] ?? n['added-sugars']);
  if (addedSugar100g !== null) return addedSugar100g;

  const sugarServing = toNum(n.sugars_serving);
  if (sugarServing !== null && sugarServing > 0) return sugarServing;

  const sugar100g = toNum(n.sugars_100g ?? n.sugars);
  if (sugar100g !== null && sugar100g > 0) return sugar100g;

  const carbs100g = toNum(n.carbohydrates_100g ?? n.carbohydrates);
  const sugarFieldExistsAsZero = sugar100g === 0;
  if (sugarFieldExistsAsZero && carbs100g !== null && carbs100g > 0) {
    return carbs100g;
  }

  return sugar100g ?? 0;
}

export function parseQuantityString(str: any): number | null {
  if (!str) return null;
  const cleaned = String(str).toLowerCase().replace(/,/g, '.');
  const match = cleaned.match(/([\d\.]+)\s*(g|ml|kg|l|cl|fl\s*oz|fl\.\s*oz|oz|ounce|ounces)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2];
  if (isNaN(val)) return null;
  if (unit === 'kg' || unit === 'l') return val * 1000;
  if (unit === 'cl') return val * 10;
  if (unit.startsWith('fl') || unit.includes('fl')) return val * 29.5735;
  if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') return val * 28.3495;
  return val;
}

export async function lookupOpenFoodFacts(barcode: string, signal: AbortSignal): Promise<ScanResultData | null> {
  let resData: any = null;

  try {
    const response = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json`,
      API_TIMEOUT_MS,
      signal
    );

    if (signal.aborted) return null;

    if (response.ok) {
      try {
        resData = await response.json();
      } catch (e) {
        console.warn('OpenFoodFacts v3 returned invalid JSON', e);
      }
    }

    if (!resData?.product && !signal.aborted) {
      const fallbackResponse = await fetchWithTimeout(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
        API_TIMEOUT_MS,
        signal
      );
      if (signal.aborted) return null;
      if (fallbackResponse.ok) {
        try {
          resData = await fallbackResponse.json();
        } catch (e) {
          console.warn('OpenFoodFacts v2 returned invalid JSON', e);
        }
      }
    }

    if (!resData?.product) return null;

    const p = resData.product;
    const name = (p.product_name || p.product_name_en || 'Unknown Product').trim();
    if (name === 'Unknown Product') return null;

    const brand = (p.brands || 'Generic Brand').trim();
    const imageUrl = p.image_front_url || p.image_url || undefined;

    const toNum = (v: any): number | null => {
      if (v === undefined || v === null || v === '') return null;
      const num = parseFloat(String(v));
      return isNaN(num) ? null : num;
    };

    const n = p.nutriments ?? {};

    const addedSugar100g = toNum(n['added-sugars_100g'] ?? n['added-sugars']);
    const totalSugar100g = toNum(n.sugars_100g ?? n.sugars);
    const rawCarbs100g = toNum(n.carbohydrates_100g ?? n.carbohydrates);
    
    let sugarPer100g = 0;
    if (addedSugar100g !== null) {
      sugarPer100g = addedSugar100g;
    } else if (totalSugar100g !== null && totalSugar100g > 0) {
      sugarPer100g = totalSugar100g;
    } else if (totalSugar100g === 0 && rawCarbs100g !== null && rawCarbs100g > 0) {
      sugarPer100g = rawCarbs100g;
    }

    const kcal100g = toNum(n['energy-kcal_100g']);
    const carbs100g = toNum(n.carbohydrates_100g);
    const fat100g = toNum(n.fat_100g);
    const protein100g = toNum(n.proteins_100g);

    const addedSugarServing = toNum(n['added-sugars_serving']);
    const totalSugarServing = toNum(n.sugars_serving);
    
    let servingSugarGrams: number | undefined = undefined;
    let servingSize: string | undefined = undefined;
    
    const explicitSugarServing = addedSugarServing !== null ? addedSugarServing : (totalSugarServing !== null && totalSugarServing > 0 ? totalSugarServing : null);

    if (explicitSugarServing !== null) {
      servingSugarGrams = explicitSugarServing;
      servingSize = p.serving_size ? String(p.serving_size).trim() : '1 serving';
    }

    const getServingMacro = (servingField: string): number | undefined => {
      const sVal = toNum(n[servingField]);
      if (sVal !== null) return sVal;
      return undefined;
    };

    const calories = getServingMacro('energy-kcal_serving');
    const carbsGrams = getServingMacro('carbohydrates_serving');
    const fatGrams = getServingMacro('fat_serving');
    const proteinGrams = getServingMacro('proteins_serving');

    const sugarTeaspoons = servingSugarGrams !== undefined ? parseFloat((servingSugarGrams / 4.2).toFixed(1)) : undefined;

    const packageWeight = toNum(p.product_quantity) ?? parseQuantityString(p.quantity);
    
    let totalSugarGrams: number | undefined = undefined;
    let totalSugarTeaspoons: number | undefined = undefined;
    let packageSize: string | undefined = undefined;
    let totalCalories: number | undefined = undefined;
    let totalCarbsGrams: number | undefined = undefined;
    let totalFatGrams: number | undefined = undefined;
    let totalProteinGrams: number | undefined = undefined;

    if (packageWeight !== null && packageWeight > 0) {
      const packageScale = packageWeight / 100;
      totalSugarGrams = parseFloat((sugarPer100g * packageScale).toFixed(1));
      totalSugarTeaspoons = parseFloat((totalSugarGrams / 4.2).toFixed(1));
      packageSize = p.quantity ? String(p.quantity).trim() : `${packageWeight} g`;
      
      if (kcal100g !== null) totalCalories = parseFloat((kcal100g * packageScale).toFixed(1));
      if (carbs100g !== null) totalCarbsGrams = parseFloat((carbs100g * packageScale).toFixed(1));
      if (fat100g !== null) totalFatGrams = parseFloat((fat100g * packageScale).toFixed(1));
      if (protein100g !== null) totalProteinGrams = parseFloat((protein100g * packageScale).toFixed(1));
    }

    const categoryTag = Array.isArray(p.categories_tags) && p.categories_tags.length > 0
        ? p.categories_tags[p.categories_tags.length - 1]
        : undefined;

    return {
      name,
      brand,
      sugarGrams: servingSugarGrams ?? sugarPer100g,
      sugarTeaspoons,
      sugarPer100g,
      imageUrl,
      servingSize,
      calories,
      carbsGrams,
      fatGrams,
      proteinGrams,
      categoryTag,
      totalSugarGrams,
      totalSugarTeaspoons,
      packageSize,
      totalCalories,
      totalCarbsGrams,
      totalFatGrams,
      totalProteinGrams,
    };
  } catch (err: any) {
    if (signal.aborted || isAbortError(err)) return null;
    throw err; // Let caller handle timeout vs network error
  }
}

export async function lookupUSDA(barcode: string, apiKey: string, signal: AbortSignal): Promise<ScanResultData | null> {
  if (!apiKey) return null;

  try {
    const response = await fetchWithTimeout(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(barcode)}&api_key=${apiKey}&pageSize=1`,
      API_TIMEOUT_MS,
      signal
    );

    if (signal.aborted) return null;

    if (!response.ok) return null;

    let resData: any = null;
    try {
      resData = await response.json();
    } catch (e) {
      console.warn('USDA API returned invalid JSON', e);
      return null;
    }

    if (resData?.foods && resData.foods.length > 0) {
      const food = resData.foods[0];
      const name = food.description || 'Unknown Product';
      const brand = food.brandOwner || food.brandName || 'Generic Brand';
      
      const addedSugarsNutrient = food.foodNutrients?.find((n: any) => 
        n.nutrientName?.toLowerCase().includes('sugars, added') || 
        n.nutrientName?.toLowerCase() === 'added sugar' ||
        n.nutrientName?.toLowerCase() === 'added sugars'
      );
      
      let sugarGrams = 0;
      if (addedSugarsNutrient && addedSugarsNutrient.value !== undefined) {
          sugarGrams = parseFloat(addedSugarsNutrient.value);
      } else {
        const sugarsNutrient = food.foodNutrients?.find((n: any) => 
          n.nutrientName?.toLowerCase().includes('sugars, total') || 
          n.nutrientName?.toLowerCase() === 'sugars'
        );
        if (sugarsNutrient && sugarsNutrient.value !== undefined) {
            sugarGrams = parseFloat(sugarsNutrient.value);
        }
      }

      const sugarTeaspoons = parseFloat((sugarGrams / 4.2).toFixed(1));
      const servingSize = food.servingSize ? `${food.servingSize} ${food.servingSizeUnit || ''}`.trim() : undefined;

      return {
        name,
        brand,
        sugarGrams,
        sugarTeaspoons,
        servingSize,
      };
    }
  } catch (err: any) {
    if (signal.aborted || isAbortError(err)) return null;
    throw err;
  }
  return null;
}
