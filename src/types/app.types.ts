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
  sugarGrams: number; // sugar per serving or total
  sugarTeaspoons: number; // sugarGrams / 3.2
  servingSize?: string;
  calories?: number;
  carbsGrams?: number;
  fatGrams?: number;
  proteinGrams?: number;
  timestamp: number;
  imageUrl?: string;
}
