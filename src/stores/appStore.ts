import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHistoryItem, CollectionItem, CleanBiteCategory } from '../types/app.types';
import { mapToCleanBiteCategory } from '../utils/categoryMapper';

interface AppState {
  onboardingComplete: boolean;
  theme: 'light' | 'dark' | 'system';
  sugarUnit: 'g' | 'oz';
  scans: ScanHistoryItem[];
  collection: CollectionItem[];
  userName?: string;
  userGoal?: 'energy' | 'weight' | 'mental' | 'none';

  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSugarUnit: (sugarUnit: 'g' | 'oz') => void;
  setProfile: (profile: {
    userName?: string;
    userGoal?: 'energy' | 'weight' | 'mental' | 'none';
  }) => void;

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
    proteinGrams?: number,
    sugarPer100g?: number,
    categoryTag?: string,
    totalSugarGrams?: number,
    packageSize?: string,
    totalCalories?: number,
    totalCarbsGrams?: number,
    totalFatGrams?: number,
    totalProteinGrams?: number
  ) => void;
  deleteScan: (id: string) => void;
  clearScans: () => void;

  // Collection Actions
  addToCollection: (item: ScanHistoryItem, category?: CleanBiteCategory, notes?: string) => void;
  removeFromCollection: (id: string) => void;
  toggleFavoriteCollectionItem: (id: string) => void;
  clearCollection: () => void;

  // Global Actions
  clearAllData: () => void;
}

const SUGAR_CONVERSION_GRAMS_PER_TEASPOON = 4.2; // 1 teaspoon = 4.2 grams of sugar

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      theme: 'light',
      sugarUnit: 'g',
      scans: [],
      collection: [],
      userName: undefined,
      userGoal: 'none',

      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setTheme: (theme) => set({ theme }),
      setSugarUnit: (sugarUnit) => set({ sugarUnit }),
      setProfile: (profile) => set((state) => ({
        userName: profile.userName !== undefined ? profile.userName : state.userName,
        userGoal: profile.userGoal !== undefined ? profile.userGoal : state.userGoal,
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
        proteinGrams,
        sugarPer100g,
        categoryTag,
        totalSugarGrams,
        packageSize,
        totalCalories,
        totalCarbsGrams,
        totalFatGrams,
        totalProteinGrams
      ) => set((state) => {
        const timestamp = Date.now();
        const sugarTeaspoons = sugarGrams / SUGAR_CONVERSION_GRAMS_PER_TEASPOON;
        const totalSugarTeaspoons = totalSugarGrams !== undefined 
          ? totalSugarGrams / SUGAR_CONVERSION_GRAMS_PER_TEASPOON
          : undefined;

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
          sugarPer100g,
          categoryTag,
          totalSugarGrams,
          totalSugarTeaspoons: totalSugarTeaspoons !== undefined ? parseFloat(totalSugarTeaspoons.toFixed(1)) : undefined,
          packageSize,
          totalCalories,
          totalCarbsGrams,
          totalFatGrams,
          totalProteinGrams,
        };
        const scans = [newScan, ...state.scans];
        return { scans };
      }),

      deleteScan: (id) => set((state) => ({
        scans: state.scans.filter((scan) => scan.id !== id),
      })),

      clearScans: () => set({ scans: [] }),

      addToCollection: (item, category, notes) => set((state) => {
        // Prevent duplicates by ID or barcode/name
        if (state.collection.some((col) => col.id === item.id || (col.barcode && item.barcode && col.barcode === item.barcode))) {
          return state;
        }
        const cleanBiteCategory = category || mapToCleanBiteCategory(item.name, item.brand, item.categoryTag);
        const newItem: CollectionItem = {
          ...item,
          addedAt: Date.now(),
          cleanBiteCategory,
          notes,
          isFavorite: false,
        };
        return { collection: [newItem, ...state.collection] };
      }),

      removeFromCollection: (id) => set((state) => ({
        collection: state.collection.filter((item) => item.id !== id),
      })),

      toggleFavoriteCollectionItem: (id) => set((state) => ({
        collection: state.collection.map((item) =>
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        ),
      })),

      clearCollection: () => set({ collection: [] }),

      clearAllData: () => set({
        onboardingComplete: false,
        theme: 'light',
        sugarUnit: 'g',
        scans: [],
        collection: [],
        userName: undefined,
        userGoal: 'none',
      }),
    }),
    {
      name: '@cutsugar-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          persistedState.theme = 'light';
        }
        if (version < 2) {
          persistedState.sugarUnit = 'g';
        }
        if (version < 3) {
          persistedState.collection = [];
        }
        return persistedState as AppState;
      },
    }
  )
);
