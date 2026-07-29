type IAPService = typeof import('./iapService').iapService;

let service: IAPService | null = null;
let servicePromise: Promise<IAPService | null> | null = null;

export async function getIapService(): Promise<IAPService | null> {
  if (service) return service;

  if (!servicePromise) {
    servicePromise = import('./iapService')
      .then((module) => {
        service = module.iapService;
        return service;
      })
      .catch((error) => {
        console.error('[BitefixIAP] Failed to load IAP service:', error);
        servicePromise = null;
        return null;
      });
  }

  return servicePromise;
}

export function getLoadedIapService(): IAPService | null {
  return service;
}
