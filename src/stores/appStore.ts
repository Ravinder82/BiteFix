import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHistoryItem, CollectionItem, BiteFixCategory, NOVAClass, AdditiveDetail } from '../types/app.types';
import { mapToBiteFixCategory } from '../utils/categoryMapper';

interface AppState {
  onboardingComplete: boolean;
  theme: 'light' | 'dark' | 'system';
  sugarUnit: 'g' | 'oz';
  collection: CollectionItem[];
  userName?: string;
  userGoal?: 'ultra_processed' | 'nutri_score' | 'clean_swaps' | 'healthy_habits' | 'none';
  allergenFilters: string[];
  strictNovaAlert: boolean;
  stealthAdditivesAlert: boolean;
  isPremium: boolean;
  freeScansUsed: number;
  trialStarted: boolean;
  dietPreference: 'vegan' | 'vegetarian' | 'standard';
  trackEcoScore: boolean;
  trackOrganic: boolean;
  activeScanResult: any | null;

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
  setDietPreference: (diet: 'vegan' | 'vegetarian' | 'standard') => void;
  setTrackEcoScore: (track: boolean) => void;
  setTrackOrganic: (track: boolean) => void;
  setActiveScanResult: (result: any | null) => void;

  // Collection Actions
  addToCollection: (item: ScanHistoryItem, category?: BiteFixCategory, notes?: string) => void;
  removeFromCollection: (id: string) => void;
  toggleFavoriteCollectionItem: (id: string) => void;
  clearCollection: () => void;

  clearAllData: () => void;
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
  if (version < 5) {
    state.allergenFilters = state.allergenFilters ?? [];
    state.strictNovaAlert = state.strictNovaAlert ?? true;
    state.stealthAdditivesAlert = state.stealthAdditivesAlert ?? true;
  }
  if (version < 6) {
    state.dietPreference = state.dietPreference ?? 'standard';
    state.trackEcoScore = state.trackEcoScore ?? false;
    state.trackOrganic = state.trackOrganic ?? false;
  }

  return {
    ...state,
    activeScanResult: null,
    onboardingComplete: typeof state.onboardingComplete === 'boolean' ? state.onboardingComplete : false,
    theme: THEMES.includes(state.theme) ? state.theme : 'light',
    sugarUnit: SUGAR_UNITS.includes(state.sugarUnit) ? state.sugarUnit : 'g',
    collection: normalizeObjectArray<CollectionItem>(state.collection),
    userName: typeof state.userName === 'string' ? state.userName : undefined,
    userGoal: USER_GOALS.includes(state.userGoal) ? state.userGoal : 'none',
    allergenFilters: Array.isArray(state.allergenFilters) ? state.allergenFilters.filter((item: unknown) => typeof item === 'string') : [],
    strictNovaAlert: typeof state.strictNovaAlert === 'boolean' ? state.strictNovaAlert : true,
    stealthAdditivesAlert: typeof state.stealthAdditivesAlert === 'boolean' ? state.stealthAdditivesAlert : true,
    isPremium: typeof state.isPremium === 'boolean' ? state.isPremium : false,
    freeScansUsed: typeof state.freeScansUsed === 'number' ? state.freeScansUsed : 0,
    trialStarted: typeof state.trialStarted === 'boolean' ? state.trialStarted : false,
    dietPreference: ['vegan', 'vegetarian', 'standard'].includes(state.dietPreference) ? state.dietPreference : 'standard',
    trackEcoScore: typeof state.trackEcoScore === 'boolean' ? state.trackEcoScore : false,
    trackOrganic: typeof state.trackOrganic === 'boolean' ? state.trackOrganic : false,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      theme: 'light',
      sugarUnit: 'g',
      collection: [],
      userName: undefined,
      userGoal: 'none',
      allergenFilters: [],
      strictNovaAlert: true,
      stealthAdditivesAlert: true,
      isPremium: false,
      freeScansUsed: 0,
      trialStarted: false,
      dietPreference: 'standard',
      trackEcoScore: false,
      trackOrganic: false,
      activeScanResult: null,

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
      setDietPreference: (diet) => set({ dietPreference: diet }),
      setTrackEcoScore: (track) => set({ trackEcoScore: track }),
      setTrackOrganic: (track) => set({ trackOrganic: track }),
      setActiveScanResult: (result) => set({ activeScanResult: result }),

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
        collection: [],
        userName: undefined,
        userGoal: 'none',
        allergenFilters: [],
        strictNovaAlert: true,
        stealthAdditivesAlert: true,
        isPremium: false,
        freeScansUsed: 0,
        activeScanResult: null,
      }),
    }),
    {
      name: '@bitefix-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      partialize: (state) => {
        // Exclude ephemeral in-memory activeScanResult from persistent storage
        const { activeScanResult, ...rest } = state;
        return rest as any;
      },
      migrate: normalizePersistedState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedState(persistedState, 6),
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
