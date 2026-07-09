# CleanBite App: AI Agent Execution Roadmap & Instructions

This document is the **Ultimate Blueprint** for the AI Agent tasked with building the `CleanBite` app. It provides a crystal clear path to spin off from the `CutSugar` codebase and transform it into a highly engaging, gamified, clean-eating scanner app.

## 🌟 The Vision: CleanBite
**CleanBite** is a gamified, ultra-processed food scanner. While *CutSugar* focused strictly on metabolic health and diabetes management, *CleanBite* focuses on **NOVA scores, food additives, ingredient transparency, and a dynamic Mascot Health Score**.

---

## Phase 1: The Codebase Spin-Off (Starting Point)
You (the AI Agent) will begin with the finalized `CutSugar` codebase. Your first task is a clean, surgical pivot.

- [ ] **Clone/Duplicate:** Copy the final `CutSugar` codebase into a new directory named `CleanBite`.
- [ ] **Rebrand Configuration:** Update `app.json`, `package.json`, bundle identifiers, schemes, and display names from "CutSugar" to "CleanBite".
- [ ] **Surgical Removal of Glucose/Sugar logic:** 
  - Delete blood glucose logging screens and components.
  - Remove teaspoon conversion logic and "sugar pile" visualizations.
  - Strip out clinical/diabetes terminology.

## Phase 2: Building the "Clean" Data Layer (OpenFoodFacts)
The OpenFoodFacts (OFF) integration is already built, but needs to be expanded for CleanBite.

- [ ] **Extract NOVA & Additives:** Parse the `nova_group` (1-4), `additives_n`, and `ingredients_text` from the OFF API payload.
- [ ] **Allergen & Diet Engine:** Build logic to parse `allergens_hierarchy` so users can set profiles (Vegan, Nut Allergy, Gluten-Free) and get instant warnings.
- [ ] **Smart Swaps Integration:** Implement API calls to fetch alternative products. If a user scans a NOVA 4 item, fetch the same category from OFF sorted by `nova_group` ascending to recommend a NOVA 1/2 alternative.

## Phase 3: The Gamified Mascot Engine
This is the core differentiator. The user's home screen is no longer a dashboard; it is a digital pet that reflects their diet.

- [ ] **The Health Score (0-100):** Implement the calculation engine:
  - Base Score = 100.
  - Minus points for scanning NOVA 4 or high-additive foods.
  - Plus points for scanning NOVA 1/2 (whole foods).
- [ ] **Mascot States (Zustand Store):**
  - **0-40 (The Hatchling):** Tired, sitting in a toxic bubble (caused by too many additives).
  - **41-75 (The Companion):** Active, standard mood.
  - **76-100 (The Guardian):** Glowing, radiant, holding a shield.
- [ ] **Animations:** Integrate smooth, dynamic animations (using Lottie or Reanimated) to transition the mascot based on the current score.

## Phase 4: Re-designing the UI/UX & Theming
- [ ] **Color Palette Pivot:** Shift from CutSugar's clinical amber/blue to organic, vibrant **greens, teals, and earthy tones**.
- [ ] **Product Detail Sheets:** Redesign the scanner result sheet to prominently display:
  - A massive NOVA score indicator.
  - An expandable list of additives (with AI-generated brief explanations of harmful ones).
  - The "Smart Swap" recommendation banner.
- [ ] **Onboarding:** Create a fresh 4-6 screen onboarding flow introducing the Mascot and the concept of "Ultra-Processed Foods".

## Phase 5: Final Polish & App Store Prep
- [ ] **Performance Audit:** Ensure camera scanner loads instantly and the 10-second timeout logic (from CutSugar) is preserved.
- [ ] **Asset Generation:** Generate app icons, splash screens, and App Store preview images highlighting the Mascot and NOVA scanning.

---

> [!IMPORTANT]  
> **Agent Instructions:** When you are invoked to start this project, do not attempt to do everything at once. Work strictly Phase by Phase. Verify the app compiles and runs cleanly at the end of each Phase before moving to the next. Do NOT reintroduce any sugar-tracking specific UI. Keep the user experience playful, encouraging, and fast.
