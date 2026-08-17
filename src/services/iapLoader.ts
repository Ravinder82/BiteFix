import { iapService } from './iapService';

type IAPService = typeof iapService;

/**
 * Returns the shared IAP service singleton.
 * Ensures the SDK is initialized once via the service singleton.
 */
export async function getIapService(): Promise<IAPService | null> {
  try {
    const success = await iapService.initialize();
    return success ? iapService : null;
  } catch (error) {
    console.error('[BitefixIAP] Failed to retrieve IAP service:', error);
    return null;
  }
}

/**
 * Synchronously returns the IAP service instance if already configured.
 */
export function getLoadedIapService(): IAPService | null {
  return iapService.isReady() ? iapService : null;
}

