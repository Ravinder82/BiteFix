# Privacy Policy for BiteFix: Food & Swap Scanner

**Effective Date:** June 1, 2026  
**Last Updated:** July 28, 2026

BiteFix ("we," "our," or "us") operates the BiteFix mobile application (the "Service"). This Privacy Policy explains how we handle your information when you use our application.

BiteFix is built with a **privacy-first architecture**. Your scan data, custom allergen filters, and health goals are stored locally on your device and are never sold or shared with third parties.

---

## 1. Information We Collect and Process

### A. Local Device Storage (Personal Data)
* **Scan History & Baskets:** Scanned barcodes, product ingredient analysis, food scores, and saved food swaps.
* **App Preferences:** Personal allergen selections (e.g., Gluten, Dairy, Soy), sugar unit display choices (Grams vs. Ounces), theme settings, and food quality alert thresholds.
* **Account Info:** Display name and basic authentication identifiers if you sign in via Google or Apple Authentication.

**Storage Location:** All scanning and preference data is stored locally on your iOS device using encrypted storage (`AsyncStorage` and `SecureStore`). We do not maintain external database servers storing your personal food logs.

### B. Third-Party API Requests (Open Food Facts)
When you scan a product barcode, the app sends a lightweight HTTP query containing **only the numeric barcode value** (e.g., `0123456789`) to the open-source Open Food Facts database to retrieve ingredients and nutritional tables.
* No personal identifiers, IP logs, location coordinates, or user profile information are transmitted during product queries.

---

## 2. In-App Purchases and Billing Data

BiteFix offers optional auto-renewing subscriptions processed directly through Apple's App Store Billing System (StoreKit 2). 

* We do not collect, process, or store your credit card numbers, banking details, or billing addresses.
* All financial transactions are governed exclusively by [Apple's Privacy Policy](https://www.apple.com/legal/privacy/).
* Subscription entitlement verification is handled locally using native Apple StoreKit tokens.

---

## 3. Data Retention and Account Deletion

You retain 100% control over your data footprint:

### A. Clearing Scan History
You can erase all your scanned food logs and saved baskets at any time in the app by going to **Settings -> Data Management -> Clear Scan History**.

### B. Permanent Account Deletion
In accordance with Apple App Store Guideline 5.1.1(m), you can permanently delete your account directly inside the app:
1. Open **Settings**.
2. Tap **Delete Account**.
3. Confirm re-authentication.

Deleting your account immediately terminates your authentication session and wipes all local app storage.

---

## 4. Children’s Privacy

BiteFix does not knowingly collect or solicit personal information from children under the age of 13. If you believe a child has provided us with personal information, please contact us immediately so we can purge the data.

---

## 5. Changes to This Privacy Policy

We may update our Privacy Policy periodically. We will notify you of any changes by updating the "Effective Date" at the top of this document.

---

## 6. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:
* **Email:** support@bitefixapp.com
* **GitHub Repository:** https://github.com/Ravinder82/BiteFix
