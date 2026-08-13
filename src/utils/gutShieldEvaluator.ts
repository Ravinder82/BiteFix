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
      title: 'Mucosal Barrier Integrity',
      shortLabel: 'Mucus Barrier',
      icon: 'ShieldAlert',
      status: 'clean',
      additivesFound: [],
      description: 'Disrupts protective gut lining mucus layers.',
      clinicalImpact: 'Synthetic emulsifiers like Carrageenan & CMC strip protective mucin layers, allowing bacterial translocation & low-grade intestinal inflammation.'
    },
    sweetener: {
      id: 'sweetener',
      title: 'Microbiome Balance & Glycemic',
      shortLabel: 'Microbiome Balance',
      icon: 'Heart',
      status: 'clean',
      additivesFound: [],
      description: 'Alters beneficial flora diversity and glucose signaling.',
      clinicalImpact: 'Non-nutritive artificial sweeteners (Sucralose, Saccharin) alter Bacteroidetes/Firmicutes ratios and disrupt glycemic homeostatic signals.'
    },
    preservative: {
      id: 'preservative',
      title: 'Bacterial Flora Preservation',
      shortLabel: 'Bacterial Flora',
      icon: 'Activity',
      status: 'clean',
      additivesFound: [],
      description: 'Antimicrobial chemicals inhibit beneficial probiotics.',
      clinicalImpact: 'Industrial food preservatives designed to inhibit mold & bacteria in packaging also act as broad-spectrum antimicrobial agents against gut probiotics.'
    },
    dye: {
      id: 'dye',
      title: 'Cellular Sensitivities & Dyes',
      shortLabel: 'Cellular Sensitivity',
      icon: 'Sparkles',
      status: 'clean',
      additivesFound: [],
      description: 'Synthetic colorants with potential immune hypersensitivity.',
      clinicalImpact: 'Azo-dyes and petroleum-derived colorants offer zero nutrition and are linked to mast cell degranulation & histamine responses in sensitive guts.'
    }
  };

  if (!additives || additives.length === 0) {
    const defaultVectors = Object.values(vectorMap);
    return {
      score: 100,
      insights: [],
      vectors: defaultVectors,
      statusLabel: 'Pristine Microbiome Safe',
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

  let statusLabel = 'Pristine Microbiome Safe';
  let statusColor = '#10B981';

  if (score < 50) {
    statusLabel = 'HIGH INFLAMMATION RISK';
    statusColor = '#EF4444';
  } else if (score < 80) {
    statusLabel = 'MODERATE DISRUPTION';
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

