# Future Premium Features: Technical Implementation Plan (v1.1.0+)

This blueprint outlines the detailed technical specifications, database logic, and UI architectures for implementing our two premium features (**Feature A: My Collections & Basket Health Score** and **Feature B: Detailed Product Analysis & Sweetener/Additive Warnings**) in future versions.

---

## 🛠️ Feature A: My Collections & Basket Health Score

### 1. The UX Friction Gate (Blurred Dashboard)
To encourage free users to upgrade, the *My Collections* tab will render in a partially blurred/locked state.

* **UI Layout**:
  - The dashboard container will have a absolute overlay of a `BlurView` (intensity: 50) when `isPro === false`.
  - A lock icon and a CTA button ("Unlock Basket Health Score") will be centered on top of the blurred dashboard.
* **Friction Points**:
  - If a free user taps the **Save/Bookmark** button on a scan history card, it blocks the action and pops up the `PaywallSheet`.

### 2. The Basket Health Score Algorithm
The score aggregates the user's saved items to compute an overall grade out of 100:

$$Score_{Basket} = (0.7 \times Score_{Serving}) + (0.3 \times Score_{Package})$$

* **Serving Score**: Based on average sugar teaspoons per serving.
  $$Score_{Serving} = \max\left(0, 100 - (AvgServingSugarTsp \times 12)\right)$$
  *(An average of 8.3 tsp per serving results in a serving score of 0)*
* **Package Score**: Based on average total sugar teaspoons per package.
  $$Score_{Package} = \max\left(0, 100 - (AvgPackageSugarTsp \times 4)\right)$$
  *(An average of 25 tsp total package sugar results in a package score of 0)*

### 3. Draft Implementation (TypeScript)
```typescript
interface StatsSummary {
  basketHealthScore: number;
  ratingLabel: 'Excellent' | 'Fair' | 'Poor';
  ratingColor: string;
}

export function calculateBasketHealth(collection: CollectionItem[]): StatsSummary {
  if (collection.length === 0) {
    return { basketHealthScore: 100, ratingLabel: 'Excellent', ratingColor: '#34C759' };
  }

  const totalServingSugar = collection.reduce((sum, item) => sum + (item.sugarTeaspoons ?? 0), 0);
  const totalPackageSugar = collection.reduce((sum, item) => {
    return sum + (item.totalSugarTeaspoons !== undefined ? item.totalSugarTeaspoons : (item.sugarTeaspoons ?? 0));
  }, 0);

  const avgServing = totalServingSugar / collection.length;
  const avgPackage = totalPackageSugar / collection.length;

  const servingScore = Math.max(0, 100 - (avgServing * 12));
  const packageScore = Math.max(0, 100 - (avgPackage * 4));

  const score = Math.round((servingScore * 0.7) + (packageScore * 0.3));

  let label: 'Excellent' | 'Fair' | 'Poor' = 'Poor';
  let color = '#FF3B30';

  if (score >= 80) {
    label = 'Excellent';
    color = '#34C759';
  } else if (score >= 50) {
    label = 'Fair';
    color = '#FF9500';
  }

  return { basketHealthScore: score, ratingLabel: label, ratingColor: color };
}
```

---

## 🔬 Feature B: Detailed Product Analysis & Sweetener/Additive Warnings

Identify products marketed as "Sugar-Free" or "Low Calorie" that contain industrial synthetic sweeteners or gut-irritating additives.

### 1. Sweetener Detector Engine
We cross-reference the ingredient text against a dictionary of known sweeteners.

```typescript
const ARTIFICIAL_SWEETENERS = [
  'aspartame', 'sucralose', 'saccharin', 'neotame', 'advantame', 
  'acesulfame potassium', 'acesulfame k', 'splenda', 'equal'
];

const SUGAR_ALCOHOLS = [
  'erythritol', 'xylitol', 'sorbitol', 'maltitol', 'mannitol', 
  'isomalt', 'lactitol', 'hydrogenated starch hydrolysates'
];

const NATURAL_SWEETENERS = [
  'stevia', 'steviol glycosides', 'monk fruit', 'luo han guo', 
  'allulose', 'thaumatin'
];

export interface SweetenerDetection {
  detected: boolean;
  matches: string[];
  type?: 'Artificial' | 'Sugar Alcohol' | 'Natural Sweetener';
}

export function detectSweeteners(ingredientsText?: string): SweetenerDetection {
  if (!ingredientsText) return { detected: false, matches: [] };
  
  const text = ingredientsText.toLowerCase();
  const found: string[] = [];
  
  // Check artificial
  ARTIFICIAL_SWEETENERS.forEach(s => {
    if (text.includes(s)) found.push(s);
  });
  
  // Check sugar alcohols
  SUGAR_ALCOHOLS.forEach(s => {
    if (text.includes(s)) found.push(s);
  });

  return {
    detected: found.length > 0,
    matches: found,
  };
}
```

### 2. Additive Safety Parser
We parse OpenFoodFacts `additives_tags` (e.g. `e322`, `e415`) or scan the ingredients list for stabilizers and emulsifiers known to affect gut microbiota.

* **High-Risk Additives to Warn**:
  - Emulsifiers: `Polysorbate 80` (E433), `Carboxymethylcellulose` (E466).
  - Thickeners/Stabilizers: `Carrageenan` (E407).
  - Preservatives: `Sodium Benzoate` (E211), `Potassium Sorbate` (E202).

### 3. UI Presentation (Clean Label Bento Grid)
* **Gated State**:
  - Free users scan a diet soda $\rightarrow$ The app shows "0g Sugar (0 Teaspoons)".
  - A blurred locked container sits underneath: **"Unlock Clean Label Breakdown"**.
  - Premium users scan $\rightarrow$ The bento container flashes orange: **"Sweeteners Detected: Aspartame, Acesulfame K"** with a brief warning tip.
