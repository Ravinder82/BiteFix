import { CleanBiteCategory } from '../types/app.types';

/**
 * Automatically categorizes a product into a CleanBite category based on its name, brand, and categoryTag.
 */
export function mapToCleanBiteCategory(
  name: string = '',
  brand: string = '',
  categoryTag: string = ''
): CleanBiteCategory {
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
