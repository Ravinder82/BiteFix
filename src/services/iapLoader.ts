import { iapService } from './iapService';

type IAPService = typeof iapService;

let initialized = false;

export async function getIapService(): Promise<IAPService | null> {
  try {
    if (!initialized) {
      await iapService.connect();
      initialized = true;
    }
    return iapService;
  } catch (error) {
    console.error('[BitefixIAP] Failed to initialize IAP service:', error);
    return null;
  }
}

export function getLoadedIapService(): IAPService | null {
  return initialized ? iapService : null;
}
