---
name: react-native-expo-app-builder
description: >
  End-to-end blueprint for building production-ready React Native + Expo apps.
  Covers all 9 phases: Setup, Architecture, Design System, App Shell, Navigation,
  Firebase Auth, Payments (IAP/Stripe/Razorpay), Onboarding, and Production Build.
  Triggers on: React Native, Expo app, mobile app build, app store submission,
  payment integration, Firebase auth, onboarding screens, EAS build.
version: 1.0.0
---

# React Native + Expo App Builder

**Full skill installed. Upgrade to the complete version:**
```bash
npx rn-expo-skill --plain
```

Or download from: https://github.com/YOUR_GITHUB_USER/rn-expo-skill

## Quick Reference — 9 Phases

1. **Setup**: `npx create-expo-app@latest MyApp --template blank-typescript`
2. **Architecture**: Zustand + TanStack Query + NativeWind + Expo Router
3. **Design**: Mascot → Color tokens → Component library (Figma/Stitch)
4. **App Shell**: Header, Settings, Privacy Policy, Terms, EULA, Delete Account
5. **Home + Nav**: Expo Router, custom animated tab bar, Reanimated animations
6. **Auth**: Firebase + Apple Sign-In (mandatory iOS) + Google Sign-In
7. **Payments**: RevenueCat/IAP (iOS) + Stripe/Razorpay/UPI (Android)
8. **Onboarding**: Splash → Slides → Permissions → Auth gate
9. **Production**: EAS Build → TestFlight → App Store → Play Store

## Golden Rules
- Apple Sign-In mandatory if ANY social login exists
- Delete Account must work end-to-end (App Store requirement)
- All legal URLs must be live before submission
- Demo credentials MUST be provided for review
- Never store sensitive data in AsyncStorage — use expo-secure-store
- iOS first, then Android
