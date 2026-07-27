# Apple In-App Purchase (IAP) Integration Plan

This document provides a step-by-step roadmap for setting up iOS-only subscriptions for **BiteFix** in the Apple Developer Portal and integrating the logic into our React Native/Expo codebase.

---

## 📋 The Subscription Offerings

We recommend launching with a single subscription group ("Pro Access") containing two simple options:

| Plan Option | Price (USD) | App Store Product ID (Target) | Best For |
| :--- | :--- | :--- | :--- |
| **Monthly Pro** | **$2.99 / month** | `com.ravinderpoonia.bitefix.pro.monthly` | Users who want to try the premium features with zero commitment. |
| **Annual Pro** | **$19.99 / year** | `com.ravinderpoonia.bitefix.pro.yearly` | Users committing to long-term health (approx. 45% discount compared to monthly). |

---

## 🛠️ Step-by-Step Apple Developer Portal & App Store Connect Setup

Before we write IAP code, you must configure the subscription items inside your Apple Developer Account.

### Step 1: Agreements, Tax, and Banking
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Navigate to **Business** (or Agreements, Tax, and Banking).
3. Ensure you have accepted the **Paid Apps Agreement**.
4. Fill out your **Tax Forms** and link your **Bank Account** (Apple cannot process sandboxed or live purchases until this agreement is active).

### Step 2: Create a Subscription Group
1. Go to **Apps** and click on your **BiteFix** app.
2. Under the **Features** tab in the left sidebar, click **In-App Purchases** -> **Subscriptions**.
3. Under **Subscription Groups**, click **Create**.
4. Set the Group Name to: `Pro Group` (this ensures users can upgrade or downgrade between monthly/yearly plans).

### Step 3: Add the Subscription Products
Inside your new Subscription Group:
1. Click **Create** under the Subscriptions list.
2. Enter the **Reference Name** (e.g., `Monthly Pro`) and **Product ID** (`com.ravinderpoonia.bitefix.pro.monthly`).
3. Set the **Duration** to `1 Month`.
4. Define the **Pricing** (e.g., `$2.99 USD` — Apple automatically localizes this price worldwide).
5. Add **Localization** info (App Store Display Name: `BiteFix Pro Monthly`, Description: `Access to custom collections, bento dashboards, and safety score reports`).
6. Repeat the exact same steps for your Annual product:
   - Reference Name: `Annual Pro`
   - Product ID: `com.ravinderpoonia.bitefix.pro.yearly`
   - Duration: `1 Year`
   - Price: `$19.99 USD`

### Step 4: Create a Sandbox Tester Account
To test payments on your device without using real money:
1. In App Store Connect, go to **Users and Access**.
2. Under the **Sandbox** section on the left, select **Testers**.
3. Click **"+"** to add a new tester using a real email address that is **not** currently associated with an Apple ID.


---

## 📜 Apple App Store Subscription Compliance & Paywall Guidelines (July 2026)

To avoid rejection during App Store Review, any Subscription Screen (Paywall) we build must strictly adhere to Apple's **App Store Review Guidelines (specifically Guideline 3.1.2)**. 

Below are the mandatory compliance features and layouts that we must provide on the paywall screen:

### 1. Transparent Billing & Subscription Terms
*   **Localized Pricing**: Prices must be retrieved dynamically from App Store Connect via the StoreKit/RevenueCat API (never hardcoded in UI strings) so they display in the user's local currency.
*   **Clear Billing Intervals**: The screen must state the price and billing interval clearly (e.g., **"$2.99 / month"** or **"$19.99 / year"**). If there is a free trial, it must state: *"7-day free trial, then $19.99/year. Cancel anytime."*
*   **Subscription Disclaimers**: Include the standard auto-renewal disclosure text (usually in a small-print footer):
    > *"Payment will be charged to your iTunes Account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Account will be charged for renewal within 24 hours prior to the end of the current period."*

### 2. Functional Action Buttons
*   **Restore Purchases Button**: Apple **requires** a clear, functional "Restore Purchases" button on the paywall. If a user deletes the app or switches devices, they must be able to restore their premium state without paying again.
*   **Clear "Close" Option**: A prominent Close (`X`) button must be present from the start. Hiding the close button, delaying its appearance, or making it low-contrast/microscopic to force a subscription will trigger an immediate rejection under **Guideline 2.3 (Deceptive Design / Dark Patterns)**.

### 3. Legal Document Links
The paywall must feature direct, clickable links to:
*   **Privacy Policy** (must match the link provided in App Store Connect).
*   **Terms of Use / End User License Agreement (EULA)** (Apple's standard EULA link is acceptable, but it must be accessible in the UI).

---

## 📥 What I Need From You to Write the Code

Once you have configured the products in App Store Connect, please provide:

1. **Active Product IDs**: Confirm if you used the recommended IDs (`com.ravinderpoonia.bitefix.pro.monthly` and `com.ravinderpoonia.bitefix.pro.yearly`) or created custom ones.
2. **Entitlement Gate Strategy**: Confirm which parts of the app we should lock. Our proposal is to lock:
   - The ability to save products to **My Collections** (Slide 5 on Onboarding & My Collections Screen).
3. **Paywall Design Style**: Do you want a clean full-screen paywall modal overlay when they try to access locked items, or a sliding bento sheet?
