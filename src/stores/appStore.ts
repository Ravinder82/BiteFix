import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BloodSugarLog, ScanHistoryItem } from '../types/app.types';
import { determineBloodSugarStatus } from '../utils/bloodSugar';

interface AppState {
  onboardingComplete: boolean;
  theme: 'light' | 'dark' | 'system';
  unit: 'mg/dL' | 'mmol/L';
  logs: BloodSugarLog[];
  scans: ScanHistoryItem[];

  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setUnit: (unit: 'mg/dL' | 'mmol/L') => void;

  // Log Actions
  addLog: (value: number, type: 'fasting' | 'post-meal', notes?: string, customTimestamp?: number) => void;
  deleteLog: (id: string) => void;

  // Scan Actions
  addScan: (
    name: string,
    sugarGrams: number,
    brand?: string,
    imageUrl?: string,
    barcode?: string,
    servingSize?: string,
    calories?: number,
    carbsGrams?: number,
    fatGrams?: number,
    proteinGrams?: number
  ) => void;
  deleteScan: (id: string) => void;
  clearScans: () => void;

  // Global Actions
  clearAllData: () => void;
}

const SUGAR_CONVERSION_GRAMS_PER_TEASPOON = 3.2; // 1 teaspoon = 3.2 grams of sugar

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      theme: 'system',
      unit: 'mg/dL',
      logs: [],
      scans: [],

      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setTheme: (theme) => set({ theme }),
      setUnit: (unit) => set({ unit }),

      addLog: (value, type, notes, customTimestamp) => set((state) => {
        const timestamp = customTimestamp || Date.now();
        const status = determineBloodSugarStatus(value, type, state.unit);
        const newLog: BloodSugarLog = {
          id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          value,
          unit: state.unit,
          timestamp,
          type,
          notes,
          status,
        };
        // Keep logs sorted by timestamp descending
        const logs = [newLog, ...state.logs].sort((a, b) => b.timestamp - a.timestamp);
        return { logs };
      }),

      deleteLog: (id) => set((state) => ({
        logs: state.logs.filter((log) => log.id !== id),
      })),

      addScan: (
        name,
        sugarGrams,
        brand,
        imageUrl,
        barcode,
        servingSize,
        calories,
        carbsGrams,
        fatGrams,
        proteinGrams
      ) => set((state) => {
        const timestamp = Date.now();
        const sugarTeaspoons = sugarGrams / SUGAR_CONVERSION_GRAMS_PER_TEASPOON;
        const newScan: ScanHistoryItem = {
          id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          name: name || 'Unknown Product',
          brand: brand || 'Generic Brand',
          sugarGrams,
          sugarTeaspoons: parseFloat(sugarTeaspoons.toFixed(1)),
          timestamp,
          imageUrl,
          barcode,
          servingSize,
          calories,
          carbsGrams,
          fatGrams,
          proteinGrams,
        };
        const scans = [newScan, ...state.scans];
        return { scans };
      }),

      deleteScan: (id) => set((state) => ({
        scans: state.scans.filter((scan) => scan.id !== id),
      })),

      clearScans: () => set({ scans: [] }),

      clearAllData: () => set({
        onboardingComplete: false,
        theme: 'system',
        unit: 'mg/dL',
        logs: [],
        scans: [],
      }),
    }),
    {
      name: '@goodbye-sugar-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
