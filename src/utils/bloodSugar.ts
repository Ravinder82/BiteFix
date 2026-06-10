import { BloodSugarLog } from '../types/app.types';

export function determineBloodSugarStatus(
  value: number,
  type: 'fasting' | 'post-meal',
  unit: 'mg/dL' | 'mmol/L'
): BloodSugarLog['status'] {
  // Convert to mg/dL for standardized internal checks if in mmol/L
  const valMgDl = unit === 'mmol/L' ? value * 18.0182 : value;

  if (valMgDl < 70) {
    return 'low';
  }

  if (type === 'fasting') {
    if (valMgDl < 100) return 'normal';
    if (valMgDl < 126) return 'pre-diabetes';
    return 'diabetes';
  } else {
    // post-meal
    if (valMgDl < 140) return 'normal';
    if (valMgDl < 200) return 'pre-diabetes';
    return 'diabetes';
  }
}

export function formatBloodSugarValue(value: number, unit: 'mg/dL' | 'mmol/L'): string {
  if (unit === 'mmol/L') {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
}

export function getStatusColor(status: BloodSugarLog['status'], colors: any): string {
  switch (status) {
    case 'low':
      return colors.warning;
    case 'normal':
      return colors.success;
    case 'pre-diabetes':
      return colors.warning;
    case 'diabetes':
      return colors.error;
    default:
      return colors.textSecondary;
  }
}

export function getStatusLabel(status: BloodSugarLog['status']): string {
  switch (status) {
    case 'low':
      return 'Low (Hypoglycemia)';
    case 'normal':
      return 'Normal';
    case 'pre-diabetes':
      return 'Pre-Diabetes';
    case 'diabetes':
      return 'Diabetes Target';
    default:
      return 'Unknown';
  }
}
