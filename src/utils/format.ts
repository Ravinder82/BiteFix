export function getSmartServingText(serving?: string, pack?: string): string | null {
  const isPack = !serving && !!pack;
  const rawText = serving || pack;
  if (!rawText) return null;

  // Regex to find metric weights or volumes
  const metricRegex = /([\d.,]+)\s*(g|gram|grams|ml|milliliter|milliliters|l|liter|liters|kg|oz|fl\s*oz)\b/i;
  
  // Prefer values inside parentheses, e.g. "1 bottle (1000 ml)"
  let match = rawText.match(/\(([\d.,]+)\s*(g|gram|grams|ml|milliliter|milliliters|l|liter|liters|kg|oz|fl\s*oz)\b.*?\)/i);
  if (!match) {
    match = rawText.match(metricRegex);
  }

  let result = rawText;

  if (match) {
    let value = parseFloat(match[1].replace(',', ''));
    let unit = match[2].toLowerCase();

    // Normalize unit strings
    if (unit.startsWith('g')) unit = 'g';
    if (unit === 'kg') unit = 'kg';
    if (unit.startsWith('m')) unit = 'ml';
    if (unit.startsWith('l')) unit = 'L';
    if (unit === 'oz') unit = 'oz';
    if (unit.replace(/\s/g, '') === 'floz') unit = 'fl oz';

    // Smart conversions
    if (unit === 'ml' && value >= 1000) {
      value = value / 1000;
      unit = 'L';
    } else if (unit === 'g' && value >= 1000) {
      value = value / 1000;
      unit = 'kg';
    }

    const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, '');
    result = `${formattedValue} ${unit}`;
  } else {
    // Fallback: strip common noise words
    result = result
      .replace(/^1 serving is /i, '')
      .replace(/^1 serve is /i, '')
      .replace(/^about /i, '')
      .replace(/^approx\.? /i, '')
      .trim();
      
    if (result.length > 15) {
      result = result.substring(0, 15) + '...';
    }
  }

  return `Per ${isPack ? 'Pack' : 'Serving'}: ${result}`;
}

export function formatWeight(valStr: string | undefined, targetUnit: 'g' | 'oz'): string {
  if (!valStr) return '';
  const cleaned = String(valStr).trim();
  if (!cleaned) return '';

  // Check if there is a match inside parentheses first, e.g. "1 serving (140 g)"
  let match = cleaned.match(/\(([\d.,]+)\s*(g|gram|grams|kg|oz|ounce|ounces|lb|lbs|ml|milliliter|milliliters|l|liter|liters|cl|fl\s*oz|fl\.\s*oz|floz)\b.*?\)/i);
  if (!match) {
    match = cleaned.match(/([\d.,]+)\s*(g|gram|grams|kg|oz|ounce|ounces|lb|lbs|ml|milliliter|milliliters|l|liter|liters|cl|fl\s*oz|fl\.\s*oz|floz)\b/i);
  }
  if (!match) return cleaned;

  let val = parseFloat(match[1].replace(/,/g, ''));
  if (isNaN(val)) return cleaned;

  const unitStr = match[2].toLowerCase().replace(/\s+/g, '');

  const isVolume = ['ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'cl', 'floz', 'fl.oz'].includes(unitStr);

  // Convert everything to base metric (grams or ml)
  let baseMetric = val;
  if (unitStr === 'kg' || unitStr === 'l' || unitStr === 'liter' || unitStr === 'liters') baseMetric = val * 1000;
  else if (unitStr === 'cl') baseMetric = val * 10;
  else if (unitStr === 'lb' || unitStr === 'lbs') baseMetric = val * 453.59237;
  else if (unitStr === 'oz' || unitStr === 'ounce' || unitStr === 'ounces') baseMetric = val * 28.349523125;
  else if (unitStr === 'floz' || unitStr === 'fl.oz') baseMetric = val * 29.5735;

  if (targetUnit === 'g') {
    let outUnit = isVolume ? 'ml' : 'g';
    let displayVal = baseMetric;
    if (outUnit === 'ml' && baseMetric >= 1000) {
      displayVal = baseMetric / 1000;
      outUnit = 'L';
    } else if (outUnit === 'g' && baseMetric >= 1000) {
      displayVal = baseMetric / 1000;
      outUnit = 'kg';
    }
    const formattedVal = displayVal >= 10 ? Math.round(displayVal).toString() : parseFloat(displayVal.toFixed(1)).toString();
    return `${formattedVal} ${outUnit}`;
  } else {
    const outUnit = isVolume ? 'fl oz' : 'oz';
    const baseImperial = isVolume ? baseMetric / 29.5735 : baseMetric / 28.349523125;
    const formattedVal = parseFloat(baseImperial.toFixed(2)).toString();
    return `${formattedVal} ${outUnit}`;
  }
}
