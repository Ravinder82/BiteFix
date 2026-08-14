# BiteFix — Operations & App Store Guide

> Your single reference for pricing changes, App Store submission, Apple Review testing, and dev commands.

---

## Table of Contents
1. [Change Yearly Pricing in RevenueCat](#1-change-yearly-pricing-in-revenuecat)
2. [App Store Screenshots — Recommended Flow](#2-app-store-screenshots--recommended-flow)
3. [Apple Review — Barcode Test Instructions](#3-apple-review--barcode-test-instructions)
4. [Dev Commands Cheatsheet](#4-dev-commands-cheatsheet)

---

## 1. Change Yearly Pricing in RevenueCat

### What RevenueCat Actually Controls
RevenueCat **does not set prices**. Prices live in **App Store Connect**. RevenueCat reads them. So you must update the price in App Store Connect first, then verify it flows through to RevenueCat.

---

### Step 1 — Update Price in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps → BiteFix → Subscriptions** (left sidebar)
3. Click your **Yearly** subscription group
4. Click the **Yearly plan** (e.g. "BiteFix Premium Annual")
5. Click **"+"** next to Pricing → **"Edit Prices"**
6. Set price to **$35.99** (select from the price tier dropdown — pick the tier closest to $35.99, which is **Tier 36 = $35.99**)
7. Set **"Introductory Offer"** if you want to show "50% Off" badge:
   - Type: **Pay Up Front**
   - Duration: e.g. First Year
   - Price: **$17.99** (50% of $35.99)
   - Eligibility: New subscribers
8. Click **Save**

> Apple price changes go live within minutes to hours — no app update required.

---

### Step 2 — Verify in RevenueCat Dashboard

1. Go to [app.revenuecat.com](https://app.revenuecat.com)
2. **Project → Products** (left sidebar)
3. Find your **annual product ID** (e.g. `bitefix_annual`)
4. Click it — you should see the new price reflected automatically
5. If it still shows old price → click **"Sync"** or wait up to 24 hrs for cache refresh

---

### Step 3 — Verify in Your App (Sandbox)

1. On a physical iPhone: Settings → App Store → Sandbox Account → sign in with your **Sandbox Test Account**
2. Open BiteFix → go to Paywall → confirm $35.99 is shown
3. The "50% off" badge appears only if you set an Introductory Offer in Step 1

---

### RevenueCat Offerings (only if adding a new product ID)

1. RevenueCat Dashboard → **Offerings**
2. Click your **Default Offering**
3. Under **Packages** → click the Annual package → **Attach Product**
4. Select the new product ID from App Store Connect

---

## 2. App Store Screenshots — Recommended Flow

### Device Requirements
Apple requires screenshots for:
- **6.9" (iPhone 16 Pro Max)** — required
- **6.5" (iPhone 14 Plus / 13 Pro Max)** — required
- **iPad Pro 13"** — required if you support iPad

Use [Previewed.app](https://previewed.app) or [AppMockUp.com](https://appmockup.com) to frame them.

---

### Recommended 6-Screenshot Story Flow

| # | Screen to Capture | Headline Overlay Text |
|---|---|---|
| 1 | **Welcome / Scan CTA screen** | *"Know What's Inside Your Food"* |
| 2 | **Live scan result — NOVA Score** | *"Ultra-Processed? Caught Instantly."* |
| 3 | **Full product result — Health Score + Additives** | *"Every Additive, Exposed."* |
| 4 | **Gut Shield alert on a product** | *"Your Gut Shield Is Always On."* |
| 5 | **Carbon Footprint screen** | *"Eat Clean. Save the Planet."* |
| 6 | **Paywall / Premium screen** | *"7 Layers of Food Intelligence — Unlocked."* |

---

### Screenshot Best Practices
- Use **real product scan results** — not mocked data (reviewers notice)
- Keep headline text **under 5 words**, large font
- **First screenshot = most important** — shows in search results without tapping
- Match brand green `#4A602F` as accent on overlays
- Show the **OrbMascot** where possible — it's a brand differentiator

---

## 3. Apple Review — Barcode Test Instructions

> BiteFix uses camera barcode scanning only (no manual entry). Paste the below into App Store Connect → App Review Information → Notes.

---

### Copy-Paste This into Review Notes

```
BiteFix uses barcode scanning to analyse food products.
To test the app, please point the camera at any of the barcodes below.
These are printed on common grocery products available worldwide.

Test Barcodes (EAN/UPC — point camera directly at these numbers):

1. Coca-Cola 330ml Can       → 5449000000996
2. Lay's Classic Chips       → 028400090179
3. Kellogg's Corn Flakes     → 5010029211300
4. Nutella 400g              → 3017620422003
5. Quaker Oats               → 030000010686

To display a barcode without a physical product:
1. Open https://barcode.tec-it.com/en/EAN13 on a second screen
2. Enter any barcode number above → Generate
3. Point the test device camera at the barcode on screen

No login is required. The app begins onboarding immediately on launch.
```

---

### Sandbox Account (Required in Review Notes)

- **Sign-in Required**: Yes
- **Username**: your-sandbox@icloud.com
- **Password**: YourSandboxPassword

> Create one: App Store Connect → Users & Access → Sandbox Testers → "+"

---

## 4. Dev Commands Cheatsheet

### Start & Run

```bash
# Daily dev — start with cache clear
npx expo start -c

# Physical device on different network
npx expo start -c --tunnel

# iOS Simulator only
npx expo start --ios

# Android Emulator only
npx expo start --android
```

### Build (EAS)

```bash
# Install EAS CLI (one-time)
npm install -g eas-cli && eas login

# Production build → App Store / TestFlight
eas build --platform ios --profile production

# Internal preview build (faster)
eas build --platform ios --profile preview

# Android Play Store
eas build --platform android --profile production
```

### Submit to App Store

```bash
# Submit latest build
eas submit --platform ios

# Submit specific build
eas submit --platform ios --id <build-id>
```

### OTA Updates (no App Store review needed)

```bash
# Push JS-only update to all production users instantly
eas update --branch production --message "Fix: image preload"

# Push to preview/TestFlight users
eas update --branch preview --message "Test: new feature"
```

### Cache & Dependencies

```bash
# Install dependencies
npm install

# Nuclear cache reset
watchman watch-del-all && rm -rf node_modules/.cache && npm install

# Check for config issues
npx expo-doctor
```

### Git

```bash
# Commit all changes
git add -A && git commit -m "feat: description"

# Push
git push origin main

# Tag a release
git tag v1.2.0 && git push origin v1.2.0
```

---

*Last updated: August 2026 — BiteFix*
