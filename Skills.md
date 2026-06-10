---
name: react-native-expo-app-builder
description: >
  End-to-end blueprint for building a production-ready, beautiful, App Store-approved
  React Native + Expo app — fast and correctly from day one. Use this skill any time
  the task involves: scaffolding a new Expo project, designing a mascot or color system,
  setting up Firebase Auth, integrating IAP/Stripe/Razorpay/UPI payments, building
  animated onboarding flows, configuring settings screens with full compliance links,
  or preparing a production EAS build for iOS App Store (first) and Google Play (next).
  ALWAYS trigger this skill at any mention of: "React Native", "Expo app", "mobile app
  build", "app store submission", "payment integration", "Firebase auth", "onboarding
  screens", "EAS build", "Expo Router", "NativeWind", or "mobile app from scratch".
  This skill covers all 9 phases of the complete app-building lifecycle and is designed
  for guaranteed first-attempt App Store and Play Store approval.
compatibility:
  platforms: [Claude, Codex, Antigravity, Tembo, Cursor, Windsurf]
  requires: [Node.js 20+, Expo CLI, EAS CLI, Git, Firebase Account, Stripe Account]
  optional: [Figma, Stitch, RevenueCat, Razorpay]
version: "1.0.0"
last_updated: "2025-06"
---

# React Native + Expo App Builder

> Build beautiful, production-ready, App-Store-approved mobile apps — fast, clean,
> and correctly from the very first line of code.

## Master Phase Checklist

Work through phases **in order**. Each phase gates the next.

- [ ] **Phase 1** — Initial Setup & Project Scaffold
- [ ] **Phase 2** — Architecture, Codebase Standards & Tooling
- [ ] **Phase 3** — Design System (Mascot → Colors → Components)
- [ ] **Phase 4** — App Shell (Header · Settings · Compliance Docs)
- [ ] **Phase 5** — Home Screen, Navigation & Motion Animations
- [ ] **Phase 6** — Firebase Auth (Email · Google · Apple Sign-In)
- [ ] **Phase 7** — Payment System (IAP iOS · Stripe/Razorpay Android)
- [ ] **Phase 8** — Onboarding Screens (Mascot · Animations · AsyncStorage)
- [ ] **Phase 9** — Production Build, Testing & Store Submission

> Detailed implementation for each phase → `references/phase-0X-*.md`
> App Store compliance deep-dive → `references/compliance-appstore.md`
> Play Store compliance deep-dive → `references/compliance-playstore.md`

---

## Phase 1 · Initial Setup

> Read `references/phase-01-setup.md` for full commands and config files.

### Scaffold

```bash
npx create-expo-app@latest MyApp --template blank-typescript
cd MyApp
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install expo-secure-store expo-font expo-image expo-blur
npx expo install @react-native-async-storage/async-storage
eas init --id <your-project-id>
```

### Core Dependencies (always install)

| Category | Package |
|---|---|
| Navigation | `expo-router` v4+ |
| Animations | `react-native-reanimated` v3+, `react-native-gesture-handler` |
| State | `zustand` + `immer` |
| Server State | `@tanstack/react-query` v5 |
| Styling | `nativewind` v4 + `tailwindcss` |
| Icons | `@expo/vector-icons`, `lucide-react-native` |
| Storage | `@react-native-async-storage/async-storage`, `expo-secure-store` |
| Env | `expo-constants` + `.env` via `dotenv` |
| Auth | `firebase` v10+ |
| Lottie | `lottie-react-native` |
| Image | `expo-image` (faster than RN Image) |
| Haptics | `expo-haptics` |

### `app.json` Must-Haves

```json
{
  "expo": {
    "name": "YourApp",
    "slug": "your-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "resizeMode": "contain" },
    "ios": {
      "bundleIdentifier": "com.company.appname",
      "supportsTablet": false,
      "usesAppleSignIn": true,
      "infoPlist": { "NSCameraUsageDescription": "...", "NSPhotoLibraryUsageDescription": "..." }
    },
    "android": {
      "package": "com.company.appname",
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png" }
    },
    "plugins": ["expo-router", "expo-secure-store", ["expo-build-properties", {}]]
  }
}
```

---

## Phase 2 · Architecture & Codebase Standards

> Read `references/phase-02-architecture.md` for full folder tree and patterns.

### Folder Structure (Non-Negotiable)

```
src/
├── app/                   ← Expo Router file-based screens
│   ├── (auth)/            ← Auth group (login, register, forgot)
│   ├── (tabs)/            ← Bottom tab group
│   ├── onboarding/        ← Onboarding screens
│   └── _layout.tsx        ← Root layout with providers
├── components/
│   ├── ui/                ← Base design system (Button, Input, Card…)
│   ├── layout/            ← Header, Footer, SafeArea wrappers
│   └── features/          ← Feature-specific composites
├── hooks/                 ← Custom hooks (useAuth, useTheme, useStorage)
├── stores/                ← Zustand stores
├── services/              ← API, Firebase, Payment service layers
├── utils/                 ← Pure helpers, formatters, validators
├── constants/             ← Colors, Fonts, Sizes, Routes, Config
├── types/                 ← Global TypeScript types & interfaces
├── assets/                ← Fonts, images, Lottie JSONs, mascot SVGs
└── config/                ← Firebase config, env, feature flags
```

### Code Rules (enforce strictly)

1. **TypeScript strict mode on** — no `any`, no `!` assertions without comment
2. **No inline styles** — all styling via NativeWind classes or `StyleSheet.create`
3. **No logic in screens** — screens are thin; all logic in hooks/stores/services
4. **Single responsibility** — one concern per file, one exported component per file
5. **Error boundaries** at route group level minimum
6. **Barrel exports** via `index.ts` in each folder
7. **ESLint + Prettier** enforced via Husky pre-commit hook

---

## Phase 3 · Design System

> Read `references/phase-03-design-system.md` for full token tables and Figma workflow.

### Step-by-Step Order

1. **Design Mascot First** — character that embodies the app personality. Export as SVG + Lottie animation. Mascot used in: splash, onboarding, empty states, error screens, success moments.
2. **Derive Color Theme** from mascot's palette. Define in `src/constants/Colors.ts`:

```ts
export const Colors = {
  light: {
    primary:     '#XXXX',   // brand primary
    secondary:   '#XXXX',   // accents
    background:  '#FAFAFA',
    surface:     '#FFFFFF',
    text:        '#111111',
    textMuted:   '#666666',
    border:      '#E5E5E5',
    error:       '#EF4444',
    success:     '#22C55E',
    warning:     '#F59E0B',
  },
  dark: { /* mirror set, dark-optimised */ }
};
```

3. **Typography Scale** — define 5 sizes (xs/sm/base/lg/xl/2xl) with font weights
4. **Spacing Scale** — 4px base unit (4,8,12,16,20,24,32,40,48)
5. **Component Library** — use Figma/Stitch for base wireframes, then build in code

### Component Build Order

`Button → Input → Card → Badge → Avatar → Modal → Toast → Skeleton → BottomSheet`

---

## Phase 4 · App Shell (Header · Settings · Compliance)

> Read `references/phase-04-app-shell.md` for full component code and compliance doc templates.

### Top Header — Required Elements

```
[ Logo/Mascot Icon ] ←—————————————→ [ Notification Bell ] [ Settings Gear ]
```

- Logo tap → navigates Home
- Settings icon → opens Settings screen (stack, not modal)
- Light/Dark toggle visible in Settings AND optionally in header

### Settings Screen — Complete Link List

**Account**
- [ ] User Profile (edit name, avatar, email)
- [ ] Change Password
- [ ] Delete Account *(required for App Store — must actually work)*
- [ ] Sign Out / Logout

**App Preferences**
- [ ] Appearance (Light / Dark / System)
- [ ] Notifications (push toggle + granular controls)
- [ ] Language / Region

**Support**
- [ ] Help Center / FAQ (WebView → your URL)
- [ ] Contact Support (mailto: or in-app form)
- [ ] Report a Problem

**Legal (ALL REQUIRED for App Store approval)**
- [ ] Privacy Policy *(URL to hosted doc)*
- [ ] Terms of Use / Terms of Service *(URL to hosted doc)*
- [ ] End User License Agreement / EULA *(especially if payments exist)*
- [ ] Cookie Policy *(if web views used)*
- [ ] Licenses (open source) *(optional but good)*

**Store**
- [ ] Rate Us ← deep links to App Store / Play Store listing
- [ ] Share App ← `expo-sharing`
- [ ] What's New / Changelog

**Version Info**
- [ ] App Version (auto-pulled from `expo-constants`)
- [ ] Build Number

### Auto-Update Compliance Script

Run `node scripts/update-legal-docs.js` to validate all legal doc URLs respond with 200 and content is non-empty. See `references/phase-04-app-shell.md` for full script.

---

## Phase 5 · Home Screen, Navigation & Animations

> Read `references/phase-05-navigation-animations.md` for full Expo Router config and animation recipes.

### Navigation Architecture

```
Root Layout (_layout.tsx)
├── Onboarding Stack (shown until onboarding complete)
├── Auth Stack (shown until user logged in)
└── Main App (Tab Navigator)
    ├── Tab 1: Home
    ├── Tab 2: [Feature]
    ├── Tab 3: [Feature]
    └── Tab 4: Profile
```

### UI Build Order for Home Screen

1. **Skeleton UI first** — build full layout with grey placeholder boxes
2. **Hook up real data** — connect Zustand store / React Query
3. **Add micro-interactions** — entry animations, press feedback, scroll effects
4. **Polish** — haptics on key actions, loading states, error states, empty states

### Animation Stack (Priority Order)

| Type | Tool |
|---|---|
| Screen transitions | Expo Router + Reanimated `useAnimatedStyle` |
| List items | `FadeInDown` / `SlideInRight` from `react-native-reanimated` |
| Gesture-driven | `react-native-gesture-handler` + Reanimated |
| Lottie (mascot, success) | `lottie-react-native` |
| Skeleton loading | `react-native-skeleton-placeholder` or custom |
| Tab bar | Custom animated bottom tab with `Reanimated` |
| Shared element | `react-native-reanimated` shared transitions |

### Bottom Tab Bar Rules

- Custom animated tab bar — never use default RN tab bar
- Use `Reanimated` scale + opacity for active indicator
- Haptic feedback `expo-haptics` on tab press
- Safe area aware via `react-native-safe-area-context`

---

## Phase 6 · Firebase Auth

> Read `references/phase-06-firebase-auth.md` for full setup code and provider configs.

### Auth Providers (implement in this order)

1. **Email/Password** — with verification flow
2. **Google Sign-In** — `@react-native-google-signin/google-signin`
3. **Apple Sign-In** — **MANDATORY for iOS App Store** if any social auth exists
4. **Phone OTP** — optional, via Firebase Phone Auth

### Critical Rules

- Store auth tokens in `expo-secure-store` (NOT AsyncStorage — it's unencrypted)
- Implement **full account deletion** — Firebase user + Firestore data + Storage files
- Email verification gate before granting full app access
- Refresh token silently on app foreground via `AppState` listener
- Auth state persisted via `onAuthStateChanged` listener in root `_layout.tsx`

### Firebase Security Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Phase 7 · Payment System

> Read `references/phase-07-payments.md` for full setup, compliance docs, and store rules.

### Platform Strategy

| Platform | Primary | Fallback |
|---|---|---|
| iOS | **RevenueCat + StoreKit (IAP)** | Stripe (digital goods) |
| Android | **Stripe** or **Razorpay** | UPI via Razorpay |

### iOS IAP — Non-Negotiable Rules

- ALL in-app purchases on iOS MUST go through Apple IAP (30% fee)
- Stripe for iOS is ONLY allowed for physical goods / services delivered offline
- Violation = App Store rejection (100% guaranteed)
- Use **RevenueCat** SDK — it abstracts StoreKit 2 and handles receipts
- Install: `npx expo install react-native-purchases`

### Android — Stripe Setup Steps

1. Create Stripe account at `dashboard.stripe.com`
2. Enable test mode first; get `pk_test_` and `sk_test_` keys
3. Set up Stripe backend (Cloudflare Worker / Firebase Function) to create PaymentIntents
4. Install: `npx expo install @stripe/stripe-react-native`
5. For Razorpay (India): `npm install react-native-razorpay`
6. For UPI: routed through Razorpay or PhonePe SDK

### Payment Compliance Checklist (REQUIRED)

- [ ] EULA linked in Settings → clearly states payment terms
- [ ] Subscription terms visible BEFORE purchase (price, period, auto-renewal)
- [ ] Cancel subscription instructions in Settings
- [ ] Refund policy linked (link to platform's policy + your own)
- [ ] "Restore Purchases" button for iOS IAP
- [ ] No dark patterns — no hidden fees, no misleading free trial framing

### RevenueCat Account Setup

1. `app.revenuecat.com` → New Project → Connect App Store app
2. Add products in App Store Connect first, then import to RevenueCat
3. Set up Offerings (what you sell) and Entitlements (what access they get)
4. Configure webhooks to Firebase for entitlement sync

---

## Phase 8 · Onboarding Screens

> Read `references/phase-08-onboarding.md` for screen designs and animation recipes.

### Onboarding Strategy

```
Splash (Mascot Animation)
  → Onboarding Slide 1 (Value Prop + Mascot)
  → Onboarding Slide 2 (Feature Highlight + Animation)
  → Onboarding Slide 3 (Social Proof / Permissions Ask)
  → Auth Gate (Sign Up / Log In / Continue as Guest)
```

### Rules

- Mark complete in `AsyncStorage` key `'@onboarding_complete'`
- Check at root `_layout.tsx` BEFORE rendering main app
- Use `react-native-reanimated` for slide-to-slide transitions (not ScrollView default)
- Mascot Lottie animation plays on EACH slide (different pose per slide)
- "Skip" always available (except permission screens which explain WHY)
- Ask permissions (notifications, camera) ONLY in onboarding, ONLY after explaining value

---

## Phase 9 · Production Build

> Read `references/phase-09-production.md` for full EAS config, signing, and submission steps.

### EAS Build Config (`eas.json`)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": {
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "YOUR_APPLE_ID", "ascAppId": "YOUR_APP_ID", "appleTeamId": "TEAM_ID" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json", "track": "internal" }
    }
  }
}
```

### Build Commands

```bash
# Development build (use with Expo Go replacement)
eas build --profile development --platform ios

# Production iOS (submits to TestFlight)
eas build --profile production --platform ios
eas submit --profile production --platform ios

# Production Android (submits to Play Store internal track)
eas build --profile production --platform android
eas submit --profile production --platform android
```

### Pre-Submission Checklist (App Store — First Attempt Approval)

**Assets**
- [ ] App icon 1024×1024 PNG (no alpha, no rounded corners — Apple applies them)
- [ ] All required screenshot sizes: 6.9" + 6.5" + 5.5" (iPad if supported)
- [ ] App Preview video (optional but strongly recommended)

**Metadata**
- [ ] App name ≤ 30 chars, unique, no keyword stuffing
- [ ] Subtitle ≤ 30 chars
- [ ] Description ≤ 4000 chars, no pricing info, no references to other platforms
- [ ] Keywords ≤ 100 chars total (comma-separated, no spaces after comma)
- [ ] Category: Primary + Secondary
- [ ] Content Rating completed accurately
- [ ] Age Rating: 4+ unless content justifies otherwise

**Compliance**
- [ ] Privacy Policy URL live and accessible (https, not http)
- [ ] Export Compliance answered (uses encryption → Yes via HTTPS = standard exemption)
- [ ] Data collection section in App Store Connect filled completely
- [ ] Advertising Identifier (IDFA) declared if used
- [ ] Tracking usage declared (AppTrackingTransparency if analytics used)

**Functionality**
- [ ] Demo account credentials provided if app requires login (MANDATORY)
- [ ] App works offline gracefully or shows clear error
- [ ] No crash on any screen (test on oldest supported iOS)
- [ ] Delete Account feature fully functional
- [ ] All URLs in Settings resolve (no 404s)
- [ ] IAP products approved in App Store Connect before submission
- [ ] Apple Sign-In implemented if any third-party auth exists

---

## Reference Files Index

| File | When to Read |
|---|---|
| `references/phase-01-setup.md` | Setting up new project, installing deps |
| `references/phase-02-architecture.md` | Structuring files, state management patterns |
| `references/phase-03-design-system.md` | Building components, color tokens, typography |
| `references/phase-04-app-shell.md` | Header/Settings components + legal doc templates |
| `references/phase-05-navigation-animations.md` | Expo Router config, animation recipes |
| `references/phase-06-firebase-auth.md` | Firebase setup, auth flows, security rules |
| `references/phase-07-payments.md` | IAP, Stripe, Razorpay setup + compliance |
| `references/phase-08-onboarding.md` | Onboarding flow, splash, permission asks |
| `references/phase-09-production.md` | EAS build, signing, submission, rejection fixes |
| `references/compliance-appstore.md` | Full App Store Review Guidelines checklist |
| `references/compliance-playstore.md` | Full Play Store Policy checklist |

---

## Golden Rules (Never Break)

1. **iOS first, Android second** — design and test on iOS, then verify Android parity
2. **Apple Sign-In is mandatory** if ANY social login exists
3. **Account deletion must work end-to-end** — it's a hard App Store requirement
4. **All legal URLs must be live** before submission — automate validation
5. **Demo credentials MUST be provided** for any app with auth
6. **Never store sensitive data in AsyncStorage** — always `expo-secure-store`
7. **Test on real devices** not just simulator/emulator before submission
8. **One platform at a time** — get iOS approved first, then submit to Play Store