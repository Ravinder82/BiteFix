/**
 * Stealth Sugar Detection Utility
 * Identifies hidden, alternative, and stealth names for sugar in ingredient lists.
 */

export const STEALTH_SUGARS = [
  'high fructose corn syrup',
  'maltodextrin',
  'dextrose',
  'sucrose',
  'agave nectar',
  'agave syrup',
  'barley malt',
  'malt syrup',
  'brown rice syrup',
  'cane juice',
  'evaporated cane juice',
  'corn syrup',
  'corn syrup solids',
  'fructose',
  'fruit juice concentrate',
  'apple juice concentrate',
  'grape juice concentrate',
  'glucose',
  'glucose syrup',
  'honey',
  'maple syrup',
  'molasses',
  'invert sugar',
  'maltose',
  'crystalline fructose',
  'caramel',
  'dextrin',
  'ethyl maltol',
  'saccharose',
  'sorghum syrup',
  'sorghum',
  'cane sugar',
  'beet sugar',
  'coconut sugar',
  'palm sugar',
  'turbinado',
  'demerara',
  'rapadura',
  'panela',
  'isomaltulose',
  'maltodextrose'
];

export interface StealthSugarDetectionResult {
  hasHiddenSugars: boolean;
  matches: string[];
  hiddenSugarCount: number;
}

/**
 * Checks an ingredients list string for matches against our stealth sugars list.
 * Normalizes casing and formatting to prevent bypasses.
 */
export function detectStealthSugars(ingredientsText?: string): StealthSugarDetectionResult {
  if (!ingredientsText || typeof ingredientsText !== 'string') {
    return {
      hasHiddenSugars: false,
      matches: [],
      hiddenSugarCount: 0,
    };
  }

  const normalizedText = ingredientsText.toLowerCase();
  const matchedSet = new Set<string>();

  for (const sugar of STEALTH_SUGARS) {
    // Word boundary pattern to avoid matching partial words (e.g. "honey" inside "honeydew")
    // Use simple character boundaries since standard JS regex boundaries \b can sometimes misbehave with non-alphanumeric chars in ingredients
    const regex = new RegExp(`\\b${sugar}\\b`, 'i');
    if (regex.test(normalizedText) || normalizedText.includes(sugar)) {
      // Capitalize first letter of each word for user display
      const displayName = sugar
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      matchedSet.add(displayName);
    }
  }

  const matches = Array.from(matchedSet);

  return {
    hasHiddenSugars: matches.length > 0,
    matches,
    hiddenSugarCount: matches.length,
  };
}
