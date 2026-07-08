# CleanFood: Architecture & Spin-Off Implementation Guide

Welcome to the **CleanFood** (formerly CleanBite) codebase guide. This document serves as the implementation blueprint, capturing the design systems, authentication flows, and feature architectures developed during the creation of **CutSugar**, tailored for rapid deployment of the new **CleanFood** application.

---

## 🎨 1. Design Language & Premium UI Architecture

CleanFood inherits a bespoke, glassmorphic, micro-animated design system designed to look clean, fluid, and premium.

### Color System & Tokens
The application uses a semantic, dark-mode-first color palette. The configuration values are defined in your theme system (e.g., `src/constants/colors.ts`):

*   **Primary (Amber Accent)**: `#FF9500` (represents energy, caution, and clean warmth).
*   **Success (Emerald Clean)**: `#34C759` (represents audited products, safety, and healthy choices).
*   **Error (Crimson Alert)**: `#FF3B30` (exposing high sugars/danger limits).
*   **Background (Sleek Dark)**: `#0B0B0C` (or `#FFFFFF` in light mode).
*   **Surfaces (Glassmorphic Panels)**: Semi-transparent backgrounds with a subtle border.
    *   *Dark Surface*: `rgba(255, 255, 255, 0.03)` with border `rgba(255, 255, 255, 0.08)`.
    *   *Light Surface*: `rgba(0, 0, 0, 0.01)` with border `rgba(0, 0, 0, 0.05)`.

### Key UI Features to Maintain
1.  **Apple Fitness Liquid Progress Ring**:
    *   A custom SVG radial progress ring utilizing linear gradients, path caps, specular highlights, and a glowing bulb that slides dynamically based on the health grade.
2.  **3-Card Bento Stack**:
    *   A layout containing three highly polished metrics cards (Items Saved, Average Metrics, and Total Metrics) with colored background tints and clean, typography-driven numbers.
3.  **Orb Mascot State Indicator**:
    *   Instead of generic placeholders, the custom `<OrbMascot state="..." size={...} />` component is used to display the app's character showing contextual moods (e.g., `happy` for low sugar, `dizzy` for moderate, `shocked` for high).

---

## 🔑 2. Firebase Google & Apple Authentication Setup

Setting up Google & Apple Authentication from scratch is a critical step for CleanFood. Follow these precise platform configuration steps:

### Part A: Firebase Console Setup
1.  **Create a Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**. Name it `cleanfood-app`.
2.  **Enable Web App**: In Project Settings, add a **Web App** to generate the Web Configuration keys (API Key, Auth Domain, Project ID, App ID).
3.  **Enable Providers**: Go to **Authentication → Sign-in method**:
    *   Enable **Google** and save. Copy the generated **Web Client ID**.
    *   Enable **Apple** and click Save.

---

## 🚀 4. CleanFood Bootstrap Checklist

Use the following checklist to initialize the CleanFood project:

- [ ] Run the rsync command to copy the base structure.
- [ ] Configure Apple signing bundle identifier in `app.json`.
- [ ] Set up a new Firebase console project `cleanfood-app`.
- [ ] Fetch the fresh Firebase configuration and populate the `.env` file.
- [ ] Download the iOS `GoogleService-Info.plist` and place it in the project root.
- [ ] Run `npm install` (or `yarn install`) to download node dependencies.
- [ ] Run `npx expo prebuild --clean` to re-generate platform-native `ios/` and `android/` folders.
- [ ] Test local compilation using `npx tsc --noEmit`.
