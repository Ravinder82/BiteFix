export interface BloodSugarLog {
  id: string;
  value: number; // e.g. 95 or 5.3
  unit: 'mg/dL' | 'mmol/L';
  timestamp: number;
  type: 'fasting' | 'post-meal';
  notes?: string;
  status: 'normal' | 'pre-diabetes' | 'diabetes' | 'low';
}

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
