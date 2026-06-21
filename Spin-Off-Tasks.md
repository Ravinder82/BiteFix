# Spin-Off Strategy: Task Roadmap

This document outlines the step-by-step process for splitting the current project into two highly focused, premium apps: **GoodBye-Sugar** and **CleanBite**. We will execute this extremely carefully, ensuring no data or stability is lost in the process.

## Phase 1: Safe Duplication (The Split)
- [x] Duplicate the entire `GoodBye-Sugar` folder to a new directory named `CleanBite`.
- [x] Inside `CleanBite`, update the app configuration (`app.json`, `package.json`) to change the app name, bundle identifier, and schema to "CleanBite".

## Phase 2: Finalizing GoodBye-Sugar (Metabolic Focus)
- [ ] *Only after stability is confirmed:* Safely strip out the NOVA, Additives, and "Clean Eating" specific UI/data structures from the `GoodBye-Sugar` codebase to make it hyper-lightweight.

## Phase 3: Transforming CleanBite (Clean-Eating & Mascot Gamification)
- [ ] In `CleanBite`, safely remove the blood glucose logging features, the tracker screens, and diabetes-related terminology.
- [ ] Re-design the `CleanBite` Home Screen to focus on the **Mascot Health Score**.
- [ ] Build the Mascot Evolution Engine (calculating the 0-100 score based on NOVA penalties and additive safety).
- [ ] Update the product detail sheet in `CleanBite` to fully expand on Additives, Alternatives (Smart Swaps), and Complete RDA % Nutrition values.

## Phase 4: Final Polish & Separation
- [ ] Update the branding colors in `CleanBite` (e.g., shifting from clinical amber/blue to organic greens/teals).
- [ ] Perform a final manual QA test on both independent apps.
- [ ] Prepare the separated release bundles.
