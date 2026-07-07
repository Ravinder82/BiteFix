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

  timestamp: number;
  imageUrl?: string;
  sugarPer100g?: number;
  categoryTag?: string;
  isDefaultServing?: boolean;
  whoLimitServingPercent?: number;
  whoLimitIdealServingPercent?: number;
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
