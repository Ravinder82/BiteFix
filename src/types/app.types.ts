export interface ScanHistoryItem {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  
  // Serving-based values
  sugarGrams: number; 
  sugarTeaspoons: number; 
  servingSize?: string;
  calories?: number;
  carbsGrams?: number;
  fatGrams?: number;
  proteinGrams?: number;

  // Package/Total-based values
  totalSugarGrams?: number;
  totalSugarTeaspoons?: number;
  packageSize?: string;
  totalCalories?: number;
  totalCarbsGrams?: number;
  totalFatGrams?: number;
  totalProteinGrams?: number;

  timestamp: number;
  imageUrl?: string;
  sugarPer100g?: number;
  categoryTag?: string;
}

export type CleanBiteCategory = 
  | 'All' 
  | 'Beverages' 
  | 'Breakfast' 
  | 'Snacks' 
  | 'Dairy & Alternatives' 
  | 'Condiments & Sauces' 
  | 'Pantry & Other';

export interface CollectionItem extends ScanHistoryItem {
  addedAt: number;
  cleanBiteCategory: CleanBiteCategory;
  notes?: string;
  isFavorite?: boolean;
}
