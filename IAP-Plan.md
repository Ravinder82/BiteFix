# Apple In-App Purchase (IAP) Integration Plan

This document provides a step-by-step roadmap for setting up iOS-only subscriptions for **CutSugar** in the Apple Developer Portal and integrating the logic into our React Native/Expo codebase.

---

## 📋 The Subscription Offerings

We recommend launching with a single subscription group ("Pro Access") containing two simple options:

| Plan Option | Price (USD) | App Store Product ID (Target) | Best For |
| :--- | :--- | :--- | :--- |
| **Monthly Pro** | **$2.99 / month** | `com.ravinderpoonia.cutsugar.pro.monthly` | Users who want to try the premium features with zero commitment. |
| **Annual Pro** | **$19.99 / year** | `com.ravinderpoonia.cutsugar.pro.yearly` | Users committing to long-term health (approx. 45% discount compared to monthly). |

---

## 🛠️ Step-by-Step Apple Developer Portal & App Store Connect Setup

Before we write IAP code, you must configure the subscription items inside your Apple Developer Account.

### Step 1: Agreements, Tax, and Banking
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Navigate to **Business** (or Agreements, Tax, and Banking).
3. Ensure you have accepted the **Paid Apps Agreement**.
4. Fill out your **Tax Forms** and link your **Bank Account** (Apple cannot process sandboxed or live purchases until this agreement is active).

### Step 2: Create a Subscription Group
1. Go to **Apps** and click on your **CutSugar** app.
2. Under the **Features** tab in the left sidebar, click **In-App Purchases** -> **Subscriptions**.
3. Under **Subscription Groups**, click **Create**.
4. Set the Group Name to: `Pro Group` (this ensures users can upgrade or downgrade between monthly/yearly plans).

### Step 3: Add the Subscription Products
Inside your new Subscription Group:
1. Click **Create** under the Subscriptions list.
2. Enter the **Reference Name** (e.g., `Monthly Pro`) and **Product ID** (`com.ravinderpoonia.cutsugar.pro.monthly`).
3. Set the **Duration** to `1 Month`.
4. Define the **Pricing** (e.g., `$2.99 USD` — Apple automatically localizes this price worldwide).
5. Add **Localization** info (App Store Display Name: `CutSugar Pro Monthly`, Description: `Access to custom collections, bento dashboards, and safety score reports`).
6. Repeat the exact same steps for your Annual product:
   - Reference Name: `Annual Pro`
   - Product ID: `com.ravinderpoonia.cutsugar.pro.yearly`
   - Duration: `1 Year`
   - Price: `$19.99 USD`

### Step 4: Create a Sandbox Tester Account
To test payments on your device without using real money:
1. In App Store Connect, go to **Users and Access**.
2. Under the **Sandbox** section on the left, select **Testers**.
3. Click **"+"** to add a new tester using a real email address that is **not** currently associated with an Apple ID.

---

## 📥 What I Need From You to Write the Code

Once you have configured the products in App Store Connect, please provide:

1. **Active Product IDs**: Confirm if you used the recommended IDs (`com.ravinderpoonia.cutsugar.pro.monthly` and `com.ravinderpoonia.cutsugar.pro.yearly`) or created custom ones.
2. **Entitlement Gate Strategy**: Confirm which parts of the app we should lock. Our proposal is to lock:
   - The ability to save products to **My Collections** (Slide 5 on Onboarding & My Collections Screen).
   - Access to the **Basket Health Score** dashboard at the top of the collections screen.
3. **Paywall Design Style**: Do you want a clean full-screen paywall modal overlay when they try to access locked items, or a sliding bento sheet?
