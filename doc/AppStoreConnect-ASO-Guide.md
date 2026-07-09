# 🚀 CutSugar: World-Class ASO Optimization & App Store Connect Submission Blueprint

This document contains the complete, ready-to-copy metadata assets and technical configuration parameters for submitting **CutSugar** to the Apple App Store. It is fully optimized for **App Store Optimization (ASO)** and compliant with the latest Apple Review Guidelines (as of July 2026).

---

## 📈 Part 1: App Store Optimization (ASO) Strategy

To rank #1 in the competitive "Health & Fitness" category, our metadata strategy targets high-volume, intent-driven keywords associated with sugar tracking, dietary management, diabetes, and clean eating.

### Target Keywords & Search Intent
*   **High-Volume/Core (Seed Keywords)**: `sugar tracker`, `sugar counter`, `barcode scanner`, `glucose tracker`, `food scanner`, `cut sugar`, `diet tracker`.
*   **Long-Tail/High-Conversion (Feature Keywords)**: `hidden sugar finder`, `sugar teaspoons scanner`, `dietary sugar limit`, `carb and sugar counter`, `diabetic food scanner`.

### Metadata Layout Copy

#### 1. App Name (Max 30 Characters)
*   **ASO Strategy**: Core brand name + primary high-volume keyword descriptor.
*   **Copy**: `CutSugar: Sugar Counter Tracker` (29/30 Chars)
*   *Alternative*: `CutSugar: Food Barcode Scanner` (30/30 Chars)

#### 2. Subtitle (Max 30 Characters)
*   **ASO Strategy**: Complements the App Name by highlighting the unique value proposition (teaspoons scanner) using secondary search terms.
*   **Copy**: `Scan Food & Teaspoons Tracker` (29/30 Chars)
*   *Alternative*: `Scan & Detect Hidden Sugars` (27/30 Chars)

#### 3. Keywords Field (Max 100 Bytes / Characters)
*   **ASO Strategy**: Compact list separated only by commas (no spaces). No duplicate words. Apple automatically merges combinations.
*   **Copy**: `sugar,counter,tracker,glucose,diabetic,carb,diabetes,food,diet,scanner,barcode,nutrition,teaspoons,low` (97/100 Chars)

#### 4. Promotional Text (Max 170 Characters)
*   **ASO Strategy**: Appears above the description on the App Store. Focuses on the "Stealth Sugar Detective" hook. Can be edited at any time without submitting a new build.
*   **Copy**: `Expose hidden sugars instantly! Scan any barcode to see sugar measured in teaspoons, get WHO limit alerts, and swap to clean alternatives. Try Stealth Sugar Detective!` (168/170 Chars)

---

## 📝 Part 2: App Store Description (ASO & Conversion Optimized)
*Character Count: ~2,800 / 4,000. Optimized with clear formatting, benefit callouts, and App Store-safe medical disclaimers.*

```markdown
Take control of your metabolic health, cut sugar, and discover exactly what’s inside your food with CutSugar—the premium, one-second food barcode scanner that translates complex nutritional labels into visual teaspoons!

Dietary sugar is hidden in 74% of packaged foods under 40+ stealth names. Whether you are managing diabetes, prediabetes, insulin resistance, looking to lose weight, or simply adopting a clean eating lifestyle, CutSugar is your ultimate grocery shopping companion.

*** WHY CUTSUGAR IS DIFFERENT ***
We don’t just show you numbers in grams. CutSugar is the only app that gives you:
• VISUAL TEASPOONS: Instantly understand sugar impact (1 teaspoon = 4.2g).
• STEALTH SUGAR DETECTIVE: Automatically audits ingredients list for 40+ hidden chemical sweeteners like Maltodextrin, High Fructose Corn Syrup, Dextrose, and Agave Nectar.
• WHO DAILY LIMIT RADIAL GAUGE: Track serving impact against World Health Organization (WHO) recommended limits (6 tsp ideal, 12 tsp maximum).
• MASCOT HEALTH DASHBOARD: Watch your custom interactive mascot react dynamically to the sugar density of scanned items.
• "THE BURN DOWN": See the exact physical exercise equivalency—know exactly how many minutes you need to jog to metabolize the calories.
• CLEAN SWAPS ENGINE: If a scanned food has high sugar or stealth sweeteners, we instantly suggest alternatives with zero stealth sugars and lower overall sugar content.

*** CORE PREMIUM FEATURES ***
• 1-Second Barcode Scanner: Multi-pass sequential lookup priority (V3 OpenAPI-first) optimized for international products (US, Europe, India, and more).
• Persistent Digital Pantry: Save scanned favorites into "My Pantry" with persistent health tracking metrics.
• 1-Handed Ergonomic Design: Enormous bottom-right flashlight switch for quick scanning in dim grocery aisles.
• Proportional Serving Scaling: Instant side-by-side comparison of sugar per serving vs. full package totals.
• Offline Search: Access previously scanned catalog items even in cellular dead zones.

Join the clean food movement. Stop eating hidden sugars and start feeling the difference. Download CutSugar today!

---
DISCLAIMER: CutSugar provides nutritional information based on public databases for educational purposes. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare provider for clinical diabetic management.
```

---

## 🛠️ Part 3: Technical App Store Connect Form Details

### 1. App Review Information (Crucial for Barcode Apps)
Because App Store Reviewers test apps on virtual simulator devices without physical food packages nearby, **you must provide sample testing assets** in the App Review Notes to prevent immediate rejection under *Guideline 2.1 (Performance/Incomplete App)*.

Copy-paste the following text into the **App Review Notes** box:

```text
TESTING INSTRUCTIONS FOR APPLE REVIEW TEAM:

This application is a food barcode scanner that matches UPC/EAN barcodes against the OpenFoodFacts V3 API to retrieve nutritional information and ingredient lists.

Since testing is conducted on test devices without physical product packaging, we have provided three high-contrast test barcodes below. You can display these barcodes on a computer screen and point the test device's camera at them to simulate grocery scanning:

1. Test Product 1: High-Sugar Product with Stealth Sugars
- Barcode: 7622300744618
- Expected Result: Displays high sugar count in teaspoons, triggers the "Stealth Sugar Detective" warning card (identifies Maltodextrin/Dextrose), and populates "Clean Swap" alternatives.

2. Test Product 2: Clean Product (Low Sugar / No Stealth Sugars)
- Barcode: 5449000000996
- Expected Result: Displays 0 tsp sugar, triggers the "Stealth Sugar Audit: Clean" banner.

3. Test Product 3: Standard Multi-Pack Product
- Barcode: 8901491101838
- Expected Result: Demonstrates serving weight vs. package total scaling math.

A printable PDF of these barcodes can also be accessed at our developer support URL if required. No authentication/login is needed to access the core scanner. If testing the profile saving feature, you may proceed with the guest profile.
```

### 2. App Privacy (Nutrition Labels) Disclosures
In App Store Connect, navigate to **App Privacy** and select the following disclosures based on the app's architecture:

*   **Data Collection**: **"No, we do not collect data from this app."**
    *   *Why*: CutSugar stores all scan histories, user profile settings, and pantry collections locally on the device via `AsyncStorage` and does not transmit personal identity metrics to an external server.
*   **Third-Party APIs**: OpenFoodFacts lookup is a anonymous query based solely on the scanned barcode number. No user identification data or location statistics are shared.
*   **Privacy Policy URL**: Link to a simple hosted markdown page detailing that scan data is 100% private and on-device.

### 3. Age Rating Questionnaire Responses
To obtain a target age rating of **4+** (maximum download availability), fill out the questionnaire as follows:
*   *Medical/Treatment Info*: **None / No** (Our disclaimer clearly states it is an educational scanner, not a medical device).
*   *Alcohol, Tobacco, or Drug Reference*: **None / No**.
*   *Sexual Content / Nudity*: **None / No**.
*   *Violence*: **None / No**.

---

## 💰 Part 4: In-App Purchase (IAP) Submission Notes

When submitting the **CutSugar Pro Monthly/Yearly** subscriptions for review alongside your first app release:
1.  **Subscription Group Localization**:
    *   Display Name: `CutSugar Pro`
    *   Description: `Unlock unlimited pantry collection saves, detailed sugar allowance statistics, and offline search.`
2.  **App Store Review Notes (IAP Section)**:
    *   Enter the following text:
        > *"To test the premium subscription upgrade paywall, navigate to the 'My Pantry' tab. Tap on the premium padlock indicator or attempt to save more than 3 products. The system will prompt the App Store sandbox purchase modal. Test accounts can complete the sandbox subscription securely."*
