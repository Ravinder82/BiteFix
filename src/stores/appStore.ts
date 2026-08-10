import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHistoryItem, CollectionItem, BiteFixCategory, NOVAClass, AdditiveDetail } from '../types/app.types';
import { mapToBiteFixCategory } from '../utils/categoryMapper';

interface AppState {
  onboardingComplete: boolean;
  theme: 'light' | 'dark' | 'system';
  sugarUnit: 'g' | 'oz';
  scans: ScanHistoryItem[];
  collection: CollectionItem[];
  userName?: string;
  userGoal?: 'ultra_processed' | 'nutri_score' | 'clean_swaps' | 'healthy_habits' | 'none';
  allergenFilters: string[];
  strictNovaAlert: boolean;
  stealthAdditivesAlert: boolean;
  isPremium: boolean;
  freeScansUsed: number;
  trialStarted: boolean;

  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSugarUnit: (sugarUnit: 'g' | 'oz') => void;
  setPremium: (premium: boolean) => void;
  setTrialStarted: (started: boolean) => void;
  incrementFreeScans: () => void;
  syncFreeScansFromKeychain: () => Promise<void>;
  resetSubscriptionAndScans: () => void;
  setAllergenFilters: (allergens: string[]) => void;
  toggleAllergenFilter: (allergen: string) => void;
  setStrictNovaAlert: (enabled: boolean) => void;
  setStealthAdditivesAlert: (enabled: boolean) => void;
  setProfile: (profile: {
    userName?: string;
    userGoal?: 'ultra_processed' | 'nutri_score' | 'clean_swaps' | 'healthy_habits' | 'none';
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
    isDefaultServing?: boolean,
    whoLimitServingPercent?: number,
    whoLimitIdealServingPercent?: number,
    ingredientsText?: string,
    hasHiddenSugars?: boolean,
    hiddenSugars?: string[],
    hiddenSugarCount?: number,
    novaClass?: NOVAClass,
    additives?: AdditiveDetail[],
    additiveCount?: number,
    allergens?: string[],
    nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e',
    biteFixScore?: number
  ) => void;
  deleteScan: (id: string) => void;
  clearScans: () => void;

  // Collection Actions
  addToCollection: (item: ScanHistoryItem, category?: BiteFixCategory, notes?: string) => void;
  removeFromCollection: (id: string) => void;
  toggleFavoriteCollectionItem: (id: string) => void;
  clearCollection: () => void;

  // Global Actions
  clearAllData: () => void;
  pruneExpiredScans: () => void;
}

const SUGAR_CONVERSION_GRAMS_PER_TEASPOON = 4.2; // 1 teaspoon = 4.2 grams of sugar
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const THEMES = ['light', 'dark', 'system'] as const;
const SUGAR_UNITS = ['g', 'oz'] as const;
const USER_GOALS = ['ultra_processed', 'nutri_score', 'clean_swaps', 'healthy_habits', 'none'] as const;

function normalizeObjectArray<T>(value: unknown): T[] {
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object') as T[]
    : [];
}

function normalizePersistedState(persistedState: unknown, version: number): Partial<AppState> {
  const state = persistedState && typeof persistedState === 'object'
    ? { ...(persistedState as Record<string, any>) }
    : {};

  if (version === 0) {
    state.theme = 'light';
  }
  if (version < 2) {
    state.sugarUnit = 'g';
  }
  if (version < 3) {
    state.collection = [];
  }
  if (version < 4 && Array.isArray(state.scans)) {
    state.scans = state.scans.map((scan: any) => ({
      ...scan,
      novaClass: scan.novaClass ?? undefined,
      additives: scan.additives ?? [],
      additiveCount: scan.additiveCount ?? 0,
      allergens: scan.allergens ?? [],
      nutriScore: scan.nutriScore ?? undefined,
      biteFixScore: scan.biteFixScore ?? 50,
    }));
  }
  if (version < 5) {
    state.allergenFilters = state.allergenFilters ?? [];
    state.strictNovaAlert = state.strictNovaAlert ?? true;
    state.stealthAdditivesAlert = state.stealthAdditivesAlert ?? true;
  }

  return {
    ...state,
    onboardingComplete: typeof state.onboardingComplete === 'boolean' ? state.onboardingComplete : false,
    theme: THEMES.includes(state.theme) ? state.theme : 'light',
    sugarUnit: SUGAR_UNITS.includes(state.sugarUnit) ? state.sugarUnit : 'g',
    scans: normalizeObjectArray<ScanHistoryItem>(state.scans),
    collection: normalizeObjectArray<CollectionItem>(state.collection),
    userName: typeof state.userName === 'string' ? state.userName : undefined,
    userGoal: USER_GOALS.includes(state.userGoal) ? state.userGoal : 'none',
    allergenFilters: Array.isArray(state.allergenFilters) ? state.allergenFilters.filter((item: unknown) => typeof item === 'string') : [],
    strictNovaAlert: typeof state.strictNovaAlert === 'boolean' ? state.strictNovaAlert : true,
    stealthAdditivesAlert: typeof state.stealthAdditivesAlert === 'boolean' ? state.stealthAdditivesAlert : true,
    isPremium: typeof state.isPremium === 'boolean' ? state.isPremium : false,
    freeScansUsed: typeof state.freeScansUsed === 'number' ? state.freeScansUsed : 0,
    trialStarted: typeof state.trialStarted === 'boolean' ? state.trialStarted : false,
  };
}

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
      allergenFilters: [],
      strictNovaAlert: true,
      stealthAdditivesAlert: true,
      isPremium: false,
      freeScansUsed: 0,
      trialStarted: false,

      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setTheme: (theme) => set({ theme }),
      setSugarUnit: (sugarUnit) => set({ sugarUnit }),
      setPremium: (isPremium) => set({ isPremium }),
      setTrialStarted: (trialStarted) => set({ trialStarted }),
      incrementFreeScans: () => {
        set((state) => {
          const newCount = state.freeScansUsed + 1;
          import('../utils/keychainStorage').then(({ keychainStorage }) => {
            keychainStorage.setFreeScansUsed(newCount);
          });
          return { freeScansUsed: newCount };
        });
      },
      syncFreeScansFromKeychain: async () => {
        try {
          const { keychainStorage } = await import('../utils/keychainStorage');
          const count = await keychainStorage.getFreeScansUsed();
          // Always trust the keychain count on sync (it persists across reinstalls)
          set({ freeScansUsed: count });
        } catch (e) {}
      },
      resetSubscriptionAndScans: () => {
        set({
          isPremium: false,
          freeScansUsed: 0,
          trialStarted: false,
          scans: [],
          collection: [],
          onboardingComplete: false,
        });
        import('../utils/keychainStorage').then(({ keychainStorage }) => {
          keychainStorage.clearFreeScansUsed();
        });
      },
      setAllergenFilters: (allergenFilters) => set({ allergenFilters }),
      toggleAllergenFilter: (allergen) => set((state) => ({
        allergenFilters: state.allergenFilters.includes(allergen)
          ? state.allergenFilters.filter((a) => a !== allergen)
          : [...state.allergenFilters, allergen],
      })),
      setStrictNovaAlert: (strictNovaAlert) => set({ strictNovaAlert }),
      setStealthAdditivesAlert: (stealthAdditivesAlert) => set({ stealthAdditivesAlert }),
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
        isDefaultServing,
        whoLimitServingPercent,
        whoLimitIdealServingPercent,
        ingredientsText,
        hasHiddenSugars,
        hiddenSugars,
        hiddenSugarCount,
        novaClass,
        additives,
        additiveCount,
        allergens,
        nutriScore,
        biteFixScore
      ) => set((state) => {
        const timestamp = Date.now();
        const sugarTeaspoons = sugarGrams / SUGAR_CONVERSION_GRAMS_PER_TEASPOON;

        const calculatedWhoServing = whoLimitServingPercent ?? Math.min(500, Math.round((sugarTeaspoons / 12) * 100));
        const calculatedWhoIdeal = whoLimitIdealServingPercent ?? Math.min(500, Math.round((sugarTeaspoons / 6) * 100));

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
          isDefaultServing,
          whoLimitServingPercent: calculatedWhoServing,
          whoLimitIdealServingPercent: calculatedWhoIdeal,
          ingredientsText,
          hasHiddenSugars,
          hiddenSugars,
          hiddenSugarCount,
          novaClass,
          additives,
          additiveCount,
          allergens,
          nutriScore,
          biteFixScore,
        };
        const cutoff = Date.now() - THIRTY_DAYS_MS;
        const validExistingScans = state.scans.filter((scan) => scan.timestamp >= cutoff);
        const scans = [newScan, ...validExistingScans];
        return { scans };
      }),

      pruneExpiredScans: () => set((state) => {
        const cutoff = Date.now() - THIRTY_DAYS_MS;
        const freshScans = state.scans.filter((scan) => scan.timestamp >= cutoff);
        if (freshScans.length === state.scans.length) return state;
        return { scans: freshScans };
      }),

      deleteScan: (id) => set((state) => ({
        scans: state.scans.filter((scan) => scan.id !== id),
      })),

      clearScans: () => set({ scans: [], collection: [] }),

      addToCollection: (item, category, notes) => set((state) => {
        // Prevent duplicates by ID or barcode/name
        if (state.collection.some((col) => col.id === item.id || (col.barcode && item.barcode && col.barcode === item.barcode))) {
          return state;
        }
        const biteFixCategory = category || mapToBiteFixCategory(item.name, item.brand, item.categoryTag);
        const newItem: CollectionItem = {
          ...item,
          addedAt: Date.now(),
          biteFixCategory,
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
        allergenFilters: [],
        strictNovaAlert: true,
        stealthAdditivesAlert: true,
        isPremium: false,
        freeScansUsed: 0,
      }),
    }),
    {
      name: '@bitefix-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
      migrate: normalizePersistedState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedState(persistedState, 5),
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('[AppStore] Failed to hydrate persisted state. Clearing local storage:', error);
          AsyncStorage.removeItem('@bitefix-storage').catch((removeError) => {
            console.error('[AppStore] Failed to clear corrupted local storage:', removeError);
          });
        }
      },
    }
  )
);
