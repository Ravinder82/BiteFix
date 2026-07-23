import { AdditiveDetail } from '../types/app.types';

export type GutDisruptorType = 'emulsifier' | 'sweetener' | 'preservative' | 'dye';

export interface GutInsight {
  type: GutDisruptorType;
  title: string;
  description: string;
  additivesFound: AdditiveDetail[];
  severity: 'high' | 'medium' | 'low';
}

const DISRUPTOR_KEYWORDS: Record<GutDisruptorType, string[]> = {
  emulsifier: ['carrageenan', 'polysorbate 80', 'carboxymethylcellulose', 'cmc', 'guar gum', 'xanthan gum', 'soy lecithin', 'emulsifier'],
  sweetener: ['sucralose', 'aspartame', 'saccharin', 'acesulfame', 'erythritol', 'sweetener'],
  preservative: ['sodium benzoate', 'potassium sorbate', 'nitrite', 'nitrate', 'bha', 'bht', 'preservative'],
  dye: ['red 40', 'yellow 5', 'yellow 6', 'blue 1', 'caramel color', 'synthetic colorant', 'dye', 'color']
};

export function evaluateGutHealth(additives: AdditiveDetail[]): {
  score: number;
  insights: GutInsight[];
} {
  if (!additives || additives.length === 0) {
    return { score: 100, insights: [] };
  }

  const insightsMap: Record<GutDisruptorType, GutInsight> = {
    emulsifier: { type: 'emulsifier', title: 'Mucosal Lining Integrity', description: 'Emulsifiers can disrupt the intestinal mucus layer, potentially leading to inflammation.', additivesFound: [], severity: 'low' },
    sweetener: { type: 'sweetener', title: 'Microbiome Balance', description: 'Certain artificial sweeteners can alter the composition of gut bacteria and affect glucose tolerance.', additivesFound: [], severity: 'low' },
    preservative: { type: 'preservative', title: 'Bacterial Inhibition', description: 'Preservatives designed to kill bacteria in food can also negatively impact beneficial gut microbes.', additivesFound: [], severity: 'low' },
    dye: { type: 'dye', title: 'Synthetic Compounds', description: 'Synthetic dyes offer no nutritional value and may cause sensitivities in some individuals.', additivesFound: [], severity: 'low' }
  };

  additives.forEach(additive => {
    const nameLower = additive.displayName.toLowerCase();
    const funcLower = additive.functionLabel.toLowerCase();

    let matched = false;

    Object.entries(DISRUPTOR_KEYWORDS).forEach(([type, keywords]) => {
      const disruptorType = type as GutDisruptorType;
      if (keywords.some(k => nameLower.includes(k) || funcLower.includes(k))) {
        insightsMap[disruptorType].additivesFound.push(additive);
        insightsMap[disruptorType].severity = additive.riskLevel === 'elevated' ? 'high' : 'medium';
        matched = true;
      }
    });

    // If it's an additive but doesn't match our specific keywords, it might still have a risk level.
    if (!matched && additive.riskLevel === 'elevated') {
       // Just put it in preservatives for a fallback if it's elevated but unknown
       if (!insightsMap.preservative.additivesFound.includes(additive)) {
           insightsMap.preservative.additivesFound.push(additive);
           insightsMap.preservative.severity = 'high';
       }
    }
  });

  const activeInsights = Object.values(insightsMap).filter(i => i.additivesFound.length > 0);

  // Calculate score based on findings
  let score = 100;
  activeInsights.forEach(insight => {
    if (insight.severity === 'high') score -= 20;
    else if (insight.severity === 'medium') score -= 10;
    else score -= 5;
  });

  return {
    score: Math.max(0, score),
    insights: activeInsights
  };
}
