## What is BiteFix?

BiteFix is a food intelligence scanner. Point your camera at any packaged food barcode and instantly see:

- **Health Score** — 0–100 quality gauge
- **NOVA Scale** — processing level (1–4)
- **Nutri-Score** — European A–E grade
- **Additive Alerts** — colours, emulsifiers, preservatives
- **Gut Shield** — flags gut-disrupting ingredients
- **Sugar Detective** — unmasks hidden sugars & sweeteners
- **Carbon Footprint** — CO₂ impact per product

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (SDK 51) + React Native |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Animations | React Native Reanimated 3 |
| Camera / Scan | expo-camera + barcode scanner |
| Images | expo-image (with asset preloading) |
| Subscriptions | RevenueCat (expo-iap) |
| State | Zustand |
| Styling | StyleSheet (inline, design tokens) |
| Food Data | OpenFoodFacts API |

---

## Project Structure

```
BiteFix/
├── assets/
│   ├── icon.png
│   └── images/
│       ├── welcome_bg.png
│       └── oil_paint/          # Carousel artwork
├── src/
│   ├── app/
│   │   ├── (tabs)/             # Main tab screens
│   │   ├── onboarding/         # Onboarding flow
│   │   └── paywall.tsx         # Subscription screen
│   ├── components/
│   │   ├── features/
│   │   │   ├── OrbMascot.tsx
│   │   │   └── MagicalBackground.tsx
│   │   └── SubscriptionModal.tsx
│   ├── stores/                 # Zustand stores
│   ├── hooks/                  # useTheme, etc.
│   └── services/               # API calls
├── OPERATIONS.md               # Pricing · App Store · Dev commands
├── app.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- EAS CLI (`npm install -g eas-cli`)
- Xcode (iOS) or Android Studio (Android)

### Install & Run

```bash
git clone https://github.com/your-org/bitefix.git
cd bitefix
npm install
npx expo start -c
```

Press `i` for iOS Simulator, `a` for Android, or scan the QR with Expo Go.

---

## Environment Setup

Create a `.env` file in the root:

```env
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_rc_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_rc_android_key
```

---

## Build & Deploy

```bash
# TestFlight / Internal testing
eas build --platform ios --profile preview

# App Store production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# OTA update (no store review)
eas update --branch production --message "description"
```

---

## Key Features in Depth

### Onboarding
12-step personalised flow that builds a **Food Shield** — user's allergen blocklist, NOVA guard, and gut watchlist — before they reach the scanner.

### Paywall
RevenueCat-powered subscription with Monthly and Annual plans. Annual plan shown at 50% off. Introductory offers managed via App Store Connect.

### Asset Loading
Carousel images load through `expo-image` with memory-disk caching, so artwork is cached after the first launch. There is no explicit preloading step.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## Docs

See [`OPERATIONS.md`](./OPERATIONS.md) for:
- Changing RevenueCat / App Store pricing
- App Store screenshot flow
- Apple Review barcode test instructions
- Full dev commands reference

---

## License

Private — All rights reserved © BiteFix 2026
