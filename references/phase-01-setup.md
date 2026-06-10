# Phase 1 — Initial Setup & Project Scaffold

## 1.1 Prerequisites

```bash
node --version    # Must be 20+
npm --version     # Must be 10+
eas --version     # Install: npm install -g eas-cli
expo --version    # Install: npm install -g expo-cli (optional, npx works)
```

## 1.2 Create Project

```bash
npx create-expo-app@latest MyApp --template blank-typescript
cd MyApp
git init && git add . && git commit -m "chore: initial expo scaffold"
```

## 1.3 Full Dependency Install

```bash
# Core navigation
npx expo install expo-router expo-constants expo-linking expo-status-bar

# Animations (MUST install together)
npx expo install react-native-reanimated react-native-gesture-handler react-native-screens

# Storage
npx expo install @react-native-async-storage/async-storage expo-secure-store expo-file-system

# Media
npx expo install expo-image expo-font expo-splash-screen expo-av lottie-react-native

# UX
npx expo install expo-haptics expo-blur expo-linear-gradient

# Web/Sharing
npx expo install expo-web-browser expo-sharing expo-clipboard

# System
npx expo install expo-device expo-notifications expo-updates

# Build tools
npx expo install expo-build-properties

# UI/Styling
npm install nativewind tailwindcss
npm install --save-dev tailwindcss

# State
npm install zustand immer

# Server state
npm install @tanstack/react-query @tanstack/react-query-devtools

# Icons
npm install lucide-react-native

# Firebase
npm install firebase @react-native-firebase/app @react-native-firebase/auth

# Utils
npm install date-fns zod react-hook-form @hookform/resolvers

# Dev tools
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-expo prettier husky lint-staged
```

## 1.4 TypeScript Config (`tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@constants/*": ["src/constants/*"],
      "@types/*": ["src/types/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

## 1.5 Metro Config (`metro.config.js`)

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './src/global.css' });
```

## 1.6 Tailwind Config (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:    'var(--color-primary)',
        secondary:  'var(--color-secondary)',
        background: 'var(--color-background)',
        surface:    'var(--color-surface)',
      },
      fontFamily: {
        sans:   ['Inter-Regular'],
        medium: ['Inter-Medium'],
        bold:   ['Inter-Bold'],
      },
    },
  },
};
```

## 1.7 Environment Variables

Create `.env.local`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_APP_ENV=development
```

Access in code:
```ts
import Constants from 'expo-constants';
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
```

## 1.8 Husky + Lint-Staged Setup

```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

`.lintstagedrc.json`:
```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

## 1.9 EAS Project Init

```bash
eas init
# Creates EAS project and adds "projectId" to app.json
eas build:configure
# Generates eas.json
```
