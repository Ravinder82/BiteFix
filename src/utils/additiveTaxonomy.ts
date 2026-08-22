// ─────────────────────────────────────────────────────────
// Additive Taxonomy — category + LED level classification.
//
// LED levels are informational indicators derived from
// published regulatory statuses (EFSA / FDA / WHO) and the
// app's own risk tiers. They are not health advice.
//
//   standard → standard technological additive
//   notable  → official review note / labelling requirement exists
//   review   → authorisation suspended or removed by a regulator
//              in at least one major market (region-dependent)
// ─────────────────────────────────────────────────────────
import { AdditiveDetail } from '../types/app.types';

export type AdditiveLedLevel = 'standard' | 'notable' | 'review';

export type AdditiveCategoryId =
  | 'colours'
  | 'preservatives'
  | 'antioxidants'
  | 'emulsifiers'
  | 'acidity'
  | 'enhancers'
  | 'sweeteners'
  | 'other';

export const ADDITIVE_CATEGORY_META: Record<AdditiveCategoryId, { id: AdditiveCategoryId; label: string }> = {
  colours: { id: 'colours', label: 'Colours' },
  preservatives: { id: 'preservatives', label: 'Preservatives' },
  antioxidants: { id: 'antioxidants', label: 'Antioxidants' },
  emulsifiers: { id: 'emulsifiers', label: 'Emulsifiers & Texturisers' },
  acidity: { id: 'acidity', label: 'Acidity & Minerals' },
  enhancers: { id: 'enhancers', label: 'Flavour Enhancers' },
  sweeteners: { id: 'sweeteners', label: 'Sweeteners' },
  other: { id: 'other', label: 'Other Functional' },
};

export const LED_STATUS_LABELS: Record<AdditiveLedLevel, string> = {
  standard: 'Standard',
  notable: 'Notable',
  review: 'Under Review',
};

export function getLedColors(level: AdditiveLedLevel, isDark: boolean): { color: string; soft: string } {
  if (level === 'review') return { color: isDark ? '#F87171' : '#DC2626', soft: '#EF4444' };
  if (level === 'notable') return { color: isDark ? '#FBBF24' : '#D97706', soft: '#F5A623' };
  return { color: isDark ? '#34D399' : '#16A34A', soft: '#22C55E' };
}

// Explicit member sets, checked before E-range grouping.
const SWEETENER_ECODES = new Set(['e420', 'e421', 'e950', 'e951', 'e952', 'e953', 'e954', 'e955', 'e956', 'e959', 'e960']);

// Official review notes: EU Annex V colour notice, nitrite/nitrate limit
// reductions (2025–26), sulphite declaration, emulsifier microbiome
// research (Nature 2015 / Gastroenterology 2022), phosphate exposure
// finding (EFSA 2019), MSG exposure note (EFSA 2017).
const NOTABLE_ECODES = new Set([
  'e102', 'e104', 'e110', 'e122', 'e124', 'e129',
  'e249', 'e250', 'e251', 'e252',
  'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228',
  'e407', 'e433', 'e466',
  'e338', 'e339', 'e340', 'e341', 'e450', 'e451', 'e452',
  'e621',
]);

// Titanium dioxide — EU suspended as a food additive in 2022
// (Regulation (EU) 2022/63); status varies by region.
const REVIEW_ECODES = new Set(['e171']);

function normalizeEcode(detail: AdditiveDetail): string | null {
  const text = `${detail.tag ?? ''} ${detail.displayName ?? ''}`.toLowerCase();
  const match = text.match(/(?:^|[^a-z0-9])(e\d{3,4}[a-z]?)(?:$|[^a-z0-9])/);
  return match ? match[1] : null;
}

function categoryFromFunctionLabel(functionLabel?: string): AdditiveCategoryId {
  const fn = (functionLabel ?? '').toLowerCase();
  if (/colour|color/.test(fn)) return 'colours';
  if (/preserv/.test(fn)) return 'preservatives';
  if (/emulsif|stabil|thicken|gelling|textur|glazing/.test(fn)) return 'emulsifiers';
  if (/sweet/.test(fn)) return 'sweeteners';
  if (/enhanc|flavour|flavor/.test(fn)) return 'enhancers';
  if (/antioxid/.test(fn)) return 'antioxidants';
  if (/acid|acidity|mineral|anti-caking|anticaking|salt/.test(fn)) return 'acidity';
  return 'other';
}

export interface ClassifiedAdditive extends AdditiveDetail {
  categoryId: AdditiveCategoryId;
  ledLevel: AdditiveLedLevel;
}

export function classifyAdditive(detail: AdditiveDetail): ClassifiedAdditive {
  const ecode = normalizeEcode(detail);
  const num = ecode ? parseInt(ecode.slice(1), 10) : NaN;

  let categoryId: AdditiveCategoryId;
  if (ecode && SWEETENER_ECODES.has(ecode)) {
    categoryId = 'sweeteners';
  } else if (!Number.isNaN(num)) {
    if (num >= 100 && num <= 199) categoryId = 'colours';
    else if (num >= 200 && num <= 299) categoryId = 'preservatives';
    else if (num >= 300 && num <= 399) categoryId = 'antioxidants';
    else if (num >= 400 && num <= 499) categoryId = 'emulsifiers';
    else if (num >= 500 && num <= 599) categoryId = 'acidity';
    else if (num >= 600 && num <= 699) categoryId = 'enhancers';
    else categoryId = 'other';
  } else {
    categoryId = categoryFromFunctionLabel(detail.functionLabel);
  }

  let ledLevel: AdditiveLedLevel = 'standard';
  if (ecode && REVIEW_ECODES.has(ecode)) ledLevel = 'review';
  else if ((ecode && NOTABLE_ECODES.has(ecode)) || detail.riskLevel === 'elevated') ledLevel = 'notable';

  return { ...detail, categoryId, ledLevel };
}

const LEVEL_RANK: Record<AdditiveLedLevel, number> = { review: 2, notable: 1, standard: 0 };
const CATEGORY_ORDER: AdditiveCategoryId[] = [
  'colours', 'preservatives', 'antioxidants', 'emulsifiers', 'acidity', 'enhancers', 'sweeteners', 'other',
];

export interface AdditiveCategoryGroup {
  category: AdditiveCategoryId;
  label: string;
  level: AdditiveLedLevel;
  items: ClassifiedAdditive[];
}

export function groupAdditivesByCategory(additives: AdditiveDetail[]): AdditiveCategoryGroup[] {
  const seen = new Set<string>();
  const buckets = new Map<AdditiveCategoryId, ClassifiedAdditive[]>();

  for (const additive of additives) {
    const classified = classifyAdditive(additive);
    const key = classified.tag || classified.displayName?.toLowerCase();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);

    const bucket = buckets.get(classified.categoryId) ?? [];
    bucket.push(classified);
    buckets.set(classified.categoryId, bucket);
  }

  return CATEGORY_ORDER
    .filter((id) => buckets.has(id))
    .map((id) => {
      const items = buckets.get(id)!;
      const level = items.reduce<AdditiveLedLevel>(
        (highest, item) => (LEVEL_RANK[item.ledLevel] > LEVEL_RANK[highest] ? item.ledLevel : highest),
        'standard',
      );
      return { category: id, label: ADDITIVE_CATEGORY_META[id].label, level, items };
    });
}
