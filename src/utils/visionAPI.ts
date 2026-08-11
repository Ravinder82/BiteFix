import { NOVAClass, AdditiveDetail } from '../types/app.types';
import { ScanResultData, computeBiteFixScore } from './scannerAPI';
import { detectStealthSugars } from './stealthSugarDetector';

const VERCEL_VISION_API_URL = 'https://bite-fix.vercel.app/api/scan';

/**
 * Sends a base64 encoded image to the Vercel Proxy to be analyzed by Gemini Vision AI.
 * Parses the structured JSON and maps it to our strict ScanResultData interface.
 */
export async function analyzeImageWithVision(base64Image: string): Promise<ScanResultData> {
  try {
    const response = await fetch(VERCEL_VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: [base64Image] }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Vision API] Proxy Error:', errText);
      throw new Error('Failed to analyze image');
    }

    const { success, data, error } = await response.json();

    if (!success || !data) {
      throw new Error(error || 'Invalid response from Vision API');
    }

    // data should match the structure requested in our Vercel proxy prompt
    const {
      name,
      brand,
      calories,
      sugarGrams,
      carbsGrams,
      fatGrams,
      proteinGrams,
      ingredientsText,
      additives,
      allergens,
      novaClass,
      categoryTag
    } = data;

    // Format Additives
    const parsedAdditives: AdditiveDetail[] = (additives || []).map((add: string) => ({
      tag: add.toLowerCase().replace(/[^a-z0-9]/g, ''),
      displayName: add,
      functionLabel: 'Identified via AI',
      riskLevel: 'moderate' // Default risk level if AI finds it
    }));

    // Detect stealth sugars from ingredients text
    const stealthAnalysis = ingredientsText 
      ? detectStealthSugars(ingredientsText)
      : { hasHiddenSugars: false, matches: [], hiddenSugarCount: 0 };

    // Calculate sugar teaspoons and BiteFix Score
    const sugarPer100g = sugarGrams; // Assuming AI gives us per 100g or serving.
    const finalSugarGrams = sugarGrams || 0;
    const sugarTeaspoons = parseFloat((finalSugarGrams / 4.2).toFixed(1));

    const finalNovaClass: NOVAClass | undefined = (novaClass && [1, 2, 3, 4].includes(Number(novaClass))) ? Number(novaClass) as NOVAClass : undefined;

    const biteFixScore = computeBiteFixScore({
      novaClass: finalNovaClass,
      additiveCount: parsedAdditives.length,
      nutriScore: undefined, // Gemini might not give nutri-score reliably
      sugarPer100g,
      ingredientsText
    });

    const result: ScanResultData = {
      name: name || 'Unknown Product',
      brand: brand || 'Unknown Brand',
      sugarGrams: finalSugarGrams,
      sugarTeaspoons,
      sugarPer100g,
      calories,
      carbsGrams,
      fatGrams,
      proteinGrams,
      servingSize: '100 g / 100 ml (Estimated)', // Vision AI might struggle to extract exact serving size without context
      categoryTag,
      ingredientsText,
      hasHiddenSugars: stealthAnalysis.hasHiddenSugars,
      hiddenSugars: stealthAnalysis.matches,
      hiddenSugarCount: stealthAnalysis.hiddenSugarCount,
      novaClass: finalNovaClass,
      additives: parsedAdditives,
      additiveCount: parsedAdditives.length,
      allergens: allergens || [],
      biteFixScore,
      isDefaultServing: true, // We default to 100g logic for AI scans
      whoLimitServingPercent: Math.min(500, Math.round((sugarTeaspoons / 12) * 100)),
      whoLimitIdealServingPercent: Math.min(500, Math.round((sugarTeaspoons / 6) * 100)),
    };

    return result;

  } catch (error) {
    console.error('[Vision API] Fatal error:', error);
    throw error;
  }
}
