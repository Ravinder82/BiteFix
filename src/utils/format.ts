export function getSmartServingText(serving?: string, pack?: string): string | null {
  const isPack = !serving && !!pack;
  const rawText = serving || pack;
  if (!rawText) return null;

  // Regex to find metric weights or volumes
  const metricRegex = /([\d.,]+)\s*(g|gram|grams|ml|milliliter|milliliters|l|liter|liters|kg|oz|fl\s*oz)\b/i;
  
  // Match the first valid quantity and unit
  const match = rawText.match(metricRegex);

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

  // Match the first valid quantity and unit in the string
  const match = cleaned.match(/([\d.,]+)\s*(g|gram|grams|kg|oz|ounce|ounces|lb|lbs|ml|milliliter|milliliters|l|liter|liters|cl|fl\s*oz|fl\.\s*oz|floz)\b/i);
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
    if (isVolume) {
      const baseImperial = baseMetric / 29.5735;
      const formattedVal = parseFloat(baseImperial.toFixed(2)).toString();
      return `${formattedVal} fl oz`;
    } else {
      const baseImperial = baseMetric / 28.349523125;
      if (baseImperial >= 16) {
        const lbs = baseImperial / 16;
        const formattedLbs = parseFloat(lbs.toFixed(2)).toString();
        return `${formattedLbs} lb`;
      } else {
        const formattedVal = parseFloat(baseImperial.toFixed(2)).toString();
        return `${formattedVal} oz`;
      }
    }
  }
}

// ─────────────────────────────────────────────────────────
// BiteFix Formatting Helpers
// ─────────────────────────────────────────────────────────

import { NOVAClass, NOVA_LABELS, NOVA_SHORT_LABELS, AdditiveRiskLevel } from '../types/app.types';

/** Returns the full NOVA label e.g. "Whole & Unprocessed" */
export function getNovaLabel(novaClass?: NOVAClass): string {
  if (!novaClass) return 'Not Classified';
  return NOVA_LABELS[novaClass] ?? 'Not Classified';
}

/** Returns a short NOVA label e.g. "Whole" */
export function getNovaShortLabel(novaClass?: NOVAClass): string {
  if (!novaClass) return 'N/A';
  return NOVA_SHORT_LABELS[novaClass] ?? 'N/A';
}

/** Returns a color for the NOVA class (for badges and indicators) */
export function getNovaColor(novaClass?: NOVAClass): string {
  switch (novaClass) {
    case 1: return '#22C55E'; // green
    case 2: return '#3BB5A0'; // teal
    case 3: return '#F5A623'; // amber/warning
    case 4: return '#EF4444'; // red
    default: return '#8E8E93'; // neutral grey
  }
}

/** Returns a user-friendly description for an additive risk level */
export function getAdditiveRiskDescription(riskLevel: AdditiveRiskLevel): string {
  switch (riskLevel) {
    case 'low': return 'Generally Recognized as Safe';
    case 'moderate': return 'Accepted with Moderate Scrutiny';
    case 'elevated': return 'Widely Studied for Caution';
    default: return 'No Data Available';
  }
}

/** Returns the risk level indicator color */
export function getAdditiveRiskColor(riskLevel: AdditiveRiskLevel): string {
  switch (riskLevel) {
    case 'low': return '#22C55E';
    case 'moderate': return '#F5A623';
    case 'elevated': return '#EF4444';
    default: return '#8E8E93';
  }
}

/** Returns a BiteFix score level label synchronized with NOVA classification */
export function getBiteFixScoreLabel(score?: number, novaClass?: NOVAClass): string {
  if (novaClass) return getNovaLabel(novaClass);
  if (score === undefined || score === null) return 'Not Rated';
  if (score >= 81) return 'Unprocessed / Minimally Processed';
  if (score >= 61) return 'Processed Culinary Ingredient';
  if (score >= 36) return 'Processed Food';
  return 'Ultra-Processed';
}

/** Returns a color for the BiteFix score synchronized with NOVA class colors */
export function getBiteFixScoreColor(score?: number, novaClass?: NOVAClass): string {
  if (novaClass) return getNovaColor(novaClass);
  if (score === undefined || score === null) return '#8E8E93';
  if (score >= 81) return '#22C55E';
  if (score >= 61) return '#3BB5A0';
  if (score >= 36) return '#F5A623';
  return '#EF4444';
}

/** Returns processing group key for pantry categorization */
export type ProcessingGroup = 'whole' | 'minimal' | 'processed' | 'ultra';

export function getProcessingGroup(novaClass?: NOVAClass): ProcessingGroup {
  switch (novaClass) {
    case 1: return 'whole';
    case 2: return 'minimal';
    case 3: return 'processed';
    case 4: return 'ultra';
    default: return 'processed'; // default for unknown
  }
}

export const PROCESSING_GROUP_LABELS: Record<ProcessingGroup, string> = {
  whole: 'Unprocessed / Minimally Processed',
  minimal: 'Processed Culinary Ingredient',
  processed: 'Processed Food',
  ultra: 'Ultra-Processed',
};

export function calculateJoggingMinutes(calories: number): number {
  if (!calories || isNaN(calories) || calories <= 0) return 0;
  return Math.round(calories / 10);
}

export function formatJogTime(totalMinutes: number): string {
  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

