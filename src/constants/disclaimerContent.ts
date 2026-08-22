export interface DisclaimerSection {
  title: string;
  body: string;
  links?: { label: string; url: string }[];
}

export const DISCLAIMER_SECTIONS: DisclaimerSection[] = [
  {
    title: 'Informational Purpose',
    body: 'BiteFix provides general food and nutrition information for informational purposes only.',
  },
  {
    title: 'Product & Barcode Data',
    body: 'Product identification and nutrition information are based on available barcode and product data from supported third-party food databases.',
  },
  {
    title: 'Data Sources & Attribution',
    body: 'Product and nutrition data are powered by Open Food Facts (Open Database License) and USDA FoodData Central, where applicable. We thank the contributors who maintain these open public databases.',
    links: [
      { label: 'Visit Open Food Facts', url: 'https://openfoodfacts.org' },
      { label: 'Visit USDA FoodData Central', url: 'https://fooddatacentral.usda.gov/' },
    ],
  },
  {
    title: 'Ingredient Flags — Informational Only',
    body: "Allergen Shield and Oil Watchlist flags are simple indicators of whether a selected ingredient or oil appears in a product's published ingredient data. They are not judgments about any product or brand, are not health advice, and do not measure how much of an ingredient a product contains.",
  },
  {
    title: 'Data Limitations',
    body: 'Information may be incomplete, outdated, or differ by country, product formulation, package size, serving size, or database updates.',
  },
  {
    title: 'Sugar Estimates',
    body: 'Sugar-to-teaspoon values are calculated estimates and conversions based on available nutrition data and do not represent physically measured teaspoons.',
  },
  {
    title: 'Scores & Analysis',
    body: "BiteFix scores, classifications, ingredient analysis, environmental estimates, and activity equivalents are informational estimates based on the app's available data and methodology and are not guaranteed measurements.",
  },
  {
    title: 'Medical Disclaimer',
    body: 'BiteFix does not diagnose, treat, cure, or prevent any disease and does not provide medical advice. It is not a substitute for a qualified healthcare professional.',
  },
  {
    title: 'Allergens',
    body: 'Allergen information is based on available ingredient and product data and should not replace checking the physical package label or professional advice for serious allergies.',
  },
  {
    title: 'User Verification',
    body: 'Always verify the physical package label for the most current product and nutrition information.',
  },
  {
    title: 'Third-Party Sources',
    body: 'BiteFix may rely on third-party databases and does not control their completeness, accuracy, or availability.',
  },
];
