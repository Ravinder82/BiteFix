import { BiteFixCategory } from '../types/app.types';

/**
 * Automatically categorizes a product into a BiteFix category based on its name, brand, and categoryTag.
 */
export function mapToBiteFixCategory(
  name: string = '',
  brand: string = '',
  categoryTag: string = ''
): BiteFixCategory {
  const combinedText = `${name} ${brand} ${categoryTag}`.toLowerCase();

  // Beverages
  const beverageKeywords = [
    'drink', 'beverage', 'tea', 'coffee', 'juice', 'soda', 'water', 'cola',
    'energy', 'smoothie', 'shake', 'kombucha', 'refresher', 'lemonade', 'cider',
    'brew', 'latte', 'espresso', 'cappuccino', 'mocha', 'matcha', 'nectar'
  ];
  if (beverageKeywords.some(kw => combinedText.includes(kw))) {
    // Exclude if it's explicitly a food item like "coffee cake" or "tea biscuit" unless it's a liquid
    if (!combinedText.includes('cake') && !combinedText.includes('biscuit') && !combinedText.includes('cookie')) {
      return 'Beverages';
    }
  }

  // Breakfast
  const breakfastKeywords = [
    'cereal', 'oatmeal', 'granola', 'oats', 'waffle', 'pancake', 'syrup',
    'toast', 'muesli', 'pop-tart', 'muffin', 'bagel', 'breakfast', 'croissant',
    'porridge', 'grits'
  ];
  if (breakfastKeywords.some(kw => combinedText.includes(kw))) {
    return 'Breakfast';
  }

  // Dairy & Alternatives
  const dairyKeywords = [
    'yogurt', 'yoghurt', 'cheese', 'butter', 'cream', 'kefir', 'curd',
    'almond milk', 'oat milk', 'soy milk', 'coconut milk', 'dairy', 'greek',
    'cheddar', 'mozzarella', 'parmesan', 'ricotta', 'cottage', 'ghee', 'milk'
  ];
  if (dairyKeywords.some(kw => combinedText.includes(kw))) {
    return 'Dairy & Alternatives';
  }

  // Condiments & Sauces
  const condimentKeywords = [
    'sauce', 'ketchup', 'mayo', 'mayonnaise', 'dressing', 'jam', 'jelly',
    'peanut butter', 'almond butter', 'spread', 'salsa', 'dip', 'chutney',
    'vinegar', 'mustard', 'marinade', 'relish', 'bbq', 'barbecue', 'pesto',
    'hummus', 'guacamole', 'syrup', 'honey', 'hot sauce', 'sriracha'
  ];
  if (condimentKeywords.some(kw => combinedText.includes(kw))) {
    return 'Condiments & Sauces';
  }

  // Snacks
  const snackKeywords = [
    'chip', 'crisp', 'cracker', 'cookie', 'bar', 'chocolate', 'candy',
    'biscuit', 'nut', 'almond', 'cashew', 'peanut', 'walnut', 'trail mix',
    'popcorn', 'pretzel', 'gummy', 'snack', 'wafer', 'toffees', 'caramel',
    'brownie', 'pastry', 'donut', 'doughnut', 'gelato', 'ice cream', 'sorbet'
  ];
  if (snackKeywords.some(kw => combinedText.includes(kw))) {
    return 'Snacks';
  }

  // Default fallback
  return 'Pantry & Other';
}

export type ProcessingLevelCategory =
  | 'Whole & Unprocessed (NOVA 1)'
  | 'Minimally Processed (NOVA 2)'
  | 'Processed Foods (NOVA 3)'
  | 'Ultra-Processed (NOVA 4)'
  | 'Unclassified';

export function mapToProcessingCategory(novaClass?: number): ProcessingLevelCategory {
  switch (novaClass) {
    case 1:
      return 'Whole & Unprocessed (NOVA 1)';
    case 2:
      return 'Minimally Processed (NOVA 2)';
    case 3:
      return 'Processed Foods (NOVA 3)';
    case 4:
      return 'Ultra-Processed (NOVA 4)';
    default:
      return 'Unclassified';
  }
}

