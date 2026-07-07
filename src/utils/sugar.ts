import { parseQuantityString } from './scannerAPI';

export const GRAMS_PER_OUNCE = 28.349523125;

export interface ConvertedSugar {
  value: number;
  unit: 'g' | 'oz';
}

/**
 * Converts sugar from grams to the specified target unit.
 * For grams, it preserves up to 1 decimal place (stripping trailing .0).
 * For ounces, it uses 2 decimal places to give precise metrics for small weights.
 */
export function convertSugar(grams: number, unit: 'g' | 'oz'): ConvertedSugar {
  if (unit === 'oz') {
    const val = grams / GRAMS_PER_OUNCE;
    return {
      value: parseFloat(val.toFixed(2)),
      unit: 'oz',
    };
  }
  return {
    value: parseFloat(grams.toFixed(1)),
    unit: 'g',
  };
}

/**
 * Formats a sugar weight in grams into the target unit string, e.g. "12 g" or "0.42 oz".
 */
export function formatSugar(grams: number, unit: 'g' | 'oz'): string {
  const converted = convertSugar(grams, unit);
  return `${converted.value} ${converted.unit}`;
}

export interface ConsistentNutritionalMetrics {
  servingSugarG: number;
  totalSugarG: number | undefined;
  servingTsp: number;
  totalTsp: number | undefined;
  whoLimitPercent: number;
  servingCalories: number | undefined;
  totalCalories: number | undefined;
}

/**
 * Universally recalculates serving and total package nutritional metrics on the fly
 * from the 100g/ml baseline and package/serving weights. This guarantees that every
 * UI component, card, gauge, and table in the app exhibits 100% mathematical consistency
 * and eliminates conflicting values between old scans and new calculations.
 */
export function getConsistentNutritionalMetrics(item: any): ConsistentNutritionalMetrics {
  // Derive baseline 100g/ml sugar rate, falling back to sugarGrams for legacy stored items
  const sugarPer100 = (item?.sugarPer100g !== undefined && item?.sugarPer100g >= 0)
    ? item.sugarPer100g
    : (item?.sugarGrams !== undefined && item?.sugarGrams >= 0 ? item.sugarGrams : 0);

  const packageWeight = item?.packageSize ? parseQuantityString(item.packageSize) : null;
  const servingWeight = item?.servingSize ? parseQuantityString(item.servingSize) : null;
  const isDefaultServing = item?.isDefaultServing === true;

  // 1. Calculate serving sugar (grams and tsp)
  let servingSugarG = item?.sugarGrams ?? 0;
  if (!isDefaultServing && servingWeight !== null && servingWeight > 0) {
    servingSugarG = parseFloat(((sugarPer100 * servingWeight) / 100).toFixed(1));
  } else if (isDefaultServing || (servingWeight === null && sugarPer100 > 0)) {
    servingSugarG = sugarPer100;
  }
  const servingTsp = parseFloat((servingSugarG / 4.2).toFixed(1));

  // 2. Calculate total package sugar (grams and tsp)
  let totalSugarG: number | undefined = item?.totalSugarGrams;
  if (packageWeight !== null && packageWeight > 0) {
    totalSugarG = parseFloat(((sugarPer100 * packageWeight) / 100).toFixed(1));
  } else if (totalSugarG === undefined && servingSugarG > 0 && servingWeight !== null && servingWeight > 0) {
    totalSugarG = parseFloat(((servingSugarG * (packageWeight || servingWeight)) / servingWeight).toFixed(1));
  }
  const totalTsp = totalSugarG !== undefined ? parseFloat((totalSugarG / 4.2).toFixed(1)) : undefined;

  // 3. WHO limit percentage (based on per serving method: max 12 tsp / 50g per day)
  const whoLimitPercent = Math.min(500, Math.round((servingTsp / 12) * 100));

  // 4. Energy calculations
  let servingCalories = item?.calories;
  let totalCalories = item?.totalCalories;
  if (servingCalories !== undefined && packageWeight !== null && packageWeight > 0 && servingWeight !== null && servingWeight > 0) {
    totalCalories = Math.round((servingCalories * packageWeight) / servingWeight);
  } else if (totalCalories !== undefined && (servingCalories === undefined || servingCalories === 0) && packageWeight !== null && packageWeight > 0 && servingWeight !== null && servingWeight > 0) {
    servingCalories = Math.round((totalCalories * servingWeight) / packageWeight);
  }

  return {
    servingSugarG,
    totalSugarG,
    servingTsp,
    totalTsp,
    whoLimitPercent,
    servingCalories,
    totalCalories,
  };
}
