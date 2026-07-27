# Guide: Re-creating In-App Subscriptions in App Store Connect

If Apple's Sandbox environment returns `sku-not-found` for your subscription products, you should delete the old products and create fresh ones. This flushes Apple's Sandbox cache.

Follow these step-by-step instructions:

---

### Step 1: Open Subscriptions in App Store Connect
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Click **Apps** -> select your app: **BiteFix: Food & Swap Scanner**.
3. In the left-hand sidebar, under **App Store**, click **Subscriptions**.

### Step 2: Delete/Deactivate Old Subscription Products
1. Click into your existing Subscription Group: **BiteFix Premium Access**.
2. Click on the first subscription product: **BiteFix Premium Monthly** (`com.ravinderpoonia.bitefix.monthly`).
3. Scroll to the bottom to **Subscription Availability** and click **Remove from Sale** or **Delete Subscription**.
4. Repeat the same steps for **BiteFix Premium Yearly** (`com.ravinderpoonia.bitefix.yearly`).

### Step 3: Create New Subscriptions with Clean Product IDs
Within the same **BiteFix Premium Access** subscription group, click the **`+` (Create Subscription)** button to add new subscriptions:

#### 1. Monthly Plan:
- **Reference Name**: `BiteFix Monthly`
- **Product ID**: `com.ravinderpoonia.bitefix.sub.monthly`
- Click **Create**.
- Under **Subscription Duration**, select **1 Month**.
- Under **Subscription Prices**, click **`+` (Add Price)** -> select **USD $5.99** (or your local equivalent) -> Save.
- Under **App Store Localization**, click **`+`** -> select **English (U.S.)**:
  - **Display Name**: `BiteFix Monthly`
  - **Description**: `Full access to Gut Shield, Smart Swaps, and scanning.`
- Click **Save**.

#### 2. Yearly Plan:
- Click the **`+` (Create Subscription)** button again.
- **Reference Name**: `BiteFix Yearly`
- **Product ID**: `com.ravinderpoonia.bitefix.sub.yearly`
- Click **Create**.
- Under **Subscription Duration**, select **1 Year**.
- Under **Subscription Prices**, click **`+` (Add Price)** -> select **USD $17.99** -> Save.
- Under **App Store Localization**, click **`+`** -> select **English (U.S.)**:
  - **Display Name**: `BiteFix Yearly`
  - **Description**: `Full annual access to all BiteFix premium features.`
- Click **Save**.

Verify that both subscriptions now display the status **Ready for Review**.

---

### Step 4: Update the Code
After creating the new IDs in App Store Connect, open your [src/services/iapService.ts](file:///Users/ravinderpoonia/BiteFix/src/services/iapService.ts#L39-L42) file and update lines 39-42 to match the new Product IDs:

```typescript
export const PRODUCT_IDS = {
  MONTHLY: 'com.ravinderpoonia.bitefix.sub.monthly',
  ANNUAL:  'com.ravinderpoonia.bitefix.sub.yearly',
} as const;
```
