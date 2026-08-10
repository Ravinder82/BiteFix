import * as SecureStore from 'expo-secure-store';

const FREE_SCANS_KEY = 'bitefix_free_scans_used';

export const keychainStorage = {
  async getFreeScansUsed(): Promise<number> {
    try {
      const value = await SecureStore.getItemAsync(FREE_SCANS_KEY);
      if (value) {
        return parseInt(value, 10);
      }
      return 0;
    } catch (error) {
      console.error('[keychainStorage] Error getting free scans:', error);
      return 0;
    }
  },

  async setFreeScansUsed(count: number): Promise<void> {
    try {
      await SecureStore.setItemAsync(FREE_SCANS_KEY, count.toString());
    } catch (error) {
      console.error('[keychainStorage] Error setting free scans:', error);
    }
  },

  async clearFreeScansUsed(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(FREE_SCANS_KEY);
    } catch (error) {
      console.error('[keychainStorage] Error clearing free scans:', error);
    }
  },
};
