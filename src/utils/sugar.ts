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
