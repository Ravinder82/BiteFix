import { AdditiveDetail } from '../types/app.types';

export type GutDisruptorType = 'emulsifier' | 'sweetener' | 'preservative' | 'dye';
export type VectorStatus = 'clean' | 'caution' | 'disrupted';

export interface GutVectorDetail {
  id: GutDisruptorType;
  title: string;
  shortLabel: string;
  icon: string;
  status: VectorStatus;
  additivesFound: AdditiveDetail[];
  description: string;
  clinicalImpact: string;
}

export interface GutInsight {
  type: GutDisruptorType;
  title: string;
  description: string;
  additivesFound: AdditiveDetail[];
  severity: 'high' | 'medium' | 'low';
}

const DISRUPTOR_KEYWORDS: Record<GutDisruptorType, string[]> = {
  emulsifier: ['carrageenan', 'polysorbate', 'carboxymethylcellulose', 'methylcellulose', 'cellulose', 'cmc', 'guar gum', 'xanthan gum', 'soy lecithin', 'emulsifier', 'thickener', 'stabilizer', 'e407', 'e466', 'e433'],
  sweetener: ['sucralose', 'aspartame', 'saccharin', 'acesulfame', 'erythritol', 'sweetener', 'e955', 'e951', 'e950', 'e954'],
  preservative: ['sodium benzoate', 'potassium sorbate', 'nitrite', 'nitrate', 'bha', 'bht', 'preservative', 'e211', 'e202', 'e250', 'e251'],
  dye: ['red 40', 'yellow 5', 'yellow 6', 'blue 1', 'caramel color', 'synthetic colorant', 'dye', 'color', 'e102', 'e110', 'e129', 'e133', 'e150']
};

/** Helper to extract E-number like E407, E955, E330 or return clean fallback code */
export function parseENumber(tag?: string, displayName?: string): string {
  const textToScan = `${tag ?? ''} ${displayName ?? ''}`;
  const match = textToScan.match(/e\d{3,4}[a-z]?/i);
  if (match) {
    return match[0].toUpperCase();
  }
  // Fallback: extract short alphanumeric tag
  const cleanedTag = (tag || '').replace(/^en:/i, '').toUpperCase();
  if (cleanedTag && cleanedTag.length <= 6) {
    return cleanedTag;
  }
  return 'ADDITIVE';
}

export function evaluateGutHealth(additives: AdditiveDetail[]): {
  score: number;
  insights: GutInsight[];
  vectors: GutVectorDetail[];
  statusLabel: string;
  statusColor: string;
} {
  const vectorMap: Record<GutDisruptorType, GutVectorDetail> = {
    emulsifier: {
      id: 'emulsifier',
      title: 'Emulsifiers / Stabilizers',
      shortLabel: 'Emulsifiers',
      icon: 'ShieldAlert',
      status: 'clean',
      additivesFound: [],
      description: 'Ingredient review for emulsifiers and stabilizers.',
      clinicalImpact: 'Identified emulsifiers or stabilizers in the available ingredient information.'
    },
    sweetener: {
      id: 'sweetener',
      title: 'Sweeteners / Sugar Alternatives',
      shortLabel: 'Sweeteners',
      icon: 'Heart',
      status: 'clean',
      additivesFound: [],
      description: 'Ingredient review for sweeteners and sugar alternatives.',
      clinicalImpact: 'Identified sweeteners or sugar alternatives in the available ingredient information.'
    },
    preservative: {
      id: 'preservative',
      title: 'Additives / Acidity Regulators',
      shortLabel: 'Additives',
      icon: 'Activity',
      status: 'clean',
      additivesFound: [],
      description: 'Ingredient review for preservatives and acidity regulators.',
      clinicalImpact: 'Identified preservatives or acidity regulators in the available ingredient information.'
    },
    dye: {
      id: 'dye',
      title: 'Colours / Additives',
      shortLabel: 'Colours',
      icon: 'Sparkles',
      status: 'clean',
      additivesFound: [],
      description: 'Ingredient review for colours and related additives.',
      clinicalImpact: 'Identified colours or related additives in the available ingredient information.'
    }
  };

  if (!additives || additives.length === 0) {
    const defaultVectors = Object.values(vectorMap);
    return {
      score: 100,
      insights: [],
      vectors: defaultVectors,
      statusLabel: 'No Ingredients Flagged',
      statusColor: '#10B981',
    };
  }

  // Match additives to biological vectors
  additives.forEach(additive => {
    const nameLower = (additive.displayName || '').toLowerCase();
    const funcLower = (additive.functionLabel || '').toLowerCase();
    const tagLower = (additive.tag || '').toLowerCase();

    let matched = false;

    Object.entries(DISRUPTOR_KEYWORDS).forEach(([type, keywords]) => {
      const disruptorType = type as GutDisruptorType;
      if (keywords.some(k => nameLower.includes(k) || funcLower.includes(k) || tagLower.includes(k))) {
        if (!vectorMap[disruptorType].additivesFound.some(a => a.displayName === additive.displayName)) {
          vectorMap[disruptorType].additivesFound.push(additive);
        }
        matched = true;
      }
    });

    if (!matched && additive.riskLevel === 'elevated') {
      if (!vectorMap.preservative.additivesFound.some(a => a.displayName === additive.displayName)) {
        vectorMap.preservative.additivesFound.push(additive);
      }
    }
  });

  // Calculate statuses and scoring
  let score = 100;
  Object.values(vectorMap).forEach(vector => {
    if (vector.additivesFound.length > 0) {
      const hasElevated = vector.additivesFound.some(a => a.riskLevel === 'elevated');
      if (hasElevated) {
        vector.status = 'disrupted';
        score -= 22;
      } else {
        vector.status = 'caution';
        score -= 10;
      }
    }
  });

  score = Math.max(0, Math.min(100, score));

  // Build legacy insights array for compatibility
  const activeInsights: GutInsight[] = Object.values(vectorMap)
    .filter(v => v.additivesFound.length > 0)
    .map(v => ({
      type: v.id,
      title: v.title,
      description: v.clinicalImpact,
      additivesFound: v.additivesFound,
      severity: v.status === 'disrupted' ? 'high' : 'medium'
    }));

  let statusLabel = 'No Ingredients Flagged';
  let statusColor = '#10B981';

  if (score < 50) {
    statusLabel = 'Flagged';
    statusColor = '#EF4444';
  } else if (score < 80) {
    statusLabel = 'Review';
    statusColor = '#F59E0B';
  }

  return {
    score,
    insights: activeInsights,
    vectors: Object.values(vectorMap),
    statusLabel,
    statusColor
  };
}
