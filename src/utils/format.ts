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
