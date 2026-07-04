# 🚀 CUTSUGAR: GENZ ONBOARDING FLOW & GRAPHICS SPECIFICATION

This document outlines the final 5-step onboarding flow for **CutSugar**. It integrates the newly designed premium 9:16 App Store-style layered graphics (with 3D glassmorphic elements and shadows) and specifies the exact text and interactive layouts that the user will experience.

---

## I. Global Onboarding Design System & Layout

- **Layout Grid (9:16 vertical):**
  - **Upper 55%:** Visual container hosting the 9:16 GenZ graphics layer and the animated Mascot.
  - **Lower 45%:** Interactive glassmorphic sheet for form fields, selections, progress indicators, and navigation controls.
- **Global Skip Action:** A clean, minimal "Skip" button resides at the top-right corner of every screen, allowing users to instantly skip the tutorial steps and navigate to the dashboard.
- **Color Token System:**
  - **Primary Warm Amber:** `#E8820C` (glowing orange accent)
  - **Secondary Gold:** `#F5A623` (golden warnings and buttons)
  - **Dark Obsidian:** `#000000` / `#111111` (premium glass panels & background depth)
  - **Success Emerald:** `#22C55E` / `#34d399` (safe ratings and scanning beams)

---

## II. Step-by-Step Onboarding Screen Specification

### 1. Slide 1: Welcome & Cravings Setup
* **Screen Focus:** Asking for user's Name and identifying their Sweet Tooth profile.
* **Graphic Asset (Screen 1):**
  ![CutSugar - Slide 1 Welcome Screen](file:///Users/ravinderpoonia/GoodBye-Sugar/assets/app-screenshots/onboarding_screen_1.png)
* **Visual & Style Layers:** Collaged light-mode and dark-mode iPhone interfaces floating with deep drop shadows against an obsidian gradient. Surrounded by glowing amber rings and floating glass-like sugar cubes.
* **Core Information to Read:**
  - **Title:** "Let's personalize your path."
  - **Subtitle:** "Tell us your name and how often your sweet tooth acts up."
* **Mascot Animation Context:** Mascot stands in the center waving hello with a happy expression.

---

### 2. Slide 2: Real-Time Scanner Intro
* **Screen Focus:** Introducing the barcode lookup engine translating grams into teaspoons.
* **Graphic Asset (Screen 2):**
  ![CutSugar - Slide 2 Scanner Results](file:///Users/ravinderpoonia/GoodBye-Sugar/assets/app-screenshots/onboarding_screen_2.png)
* **Visual & Style Layers:** Overlapping cards showing Coca-Cola's sugar details (`25.2 tsp`) and the Scan History page. Surrounded by a grid of glossy orange cubes on a dark platform.
* **Core Information to Read:**
  - **Title:** "Real-Time Sugar Scanner"
  - **Subtitle:** "No more confusing labels. Scan any product to see the exact sugar content translated into teaspoons."
* **Mascot Animation Context:** Mascot smiles proudly pointing at the teaspoons calculation.

---

### 3. Slide 3: Scanner Viewfinder Walkthrough
* **Screen Focus:** Showing the active camera viewfinder interface.
* **Graphic Asset (Screen 3):**
  ![CutSugar - Slide 3 Viewfinder](file:///Users/ravinderpoonia/GoodBye-Sugar/assets/app-screenshots/onboarding_screen_3.png)
* **Visual & Style Layers:** Interactive camera preview overlay with glowing scanning brackets. A neon success green (#34d399) and warm amber laser beam sweeps over a floating barcode.
* **Core Information to Read:**
  - **Title:** "Point & Scan"
  - **Subtitle:** "Just align any food barcode inside the frame. We do the rest instantly."
* **Mascot Animation Context:** Mascot dressed as a tiny explorer looking through a magnifying glass at the barcode.

---

### 4. Slide 4: Daily Burn & Better Choices
* **Screen Focus:** Finding low-sugar alternatives and tracking the Daily Burn.
* **Graphic Asset (Screen 4):**
  ![CutSugar - Slide 4 Alternatives](file:///Users/ravinderpoonia/GoodBye-Sugar/assets/app-screenshots/onboarding_screen_4.png)
* **Visual & Style Layers:** Floating cards representing alternative options and daily energy burn meters. Glassmorphic overlays with glowing circular halos.
* **Core Information to Read:**
  - **Title:** "Smart Swaps & Daily Burn"
  - **Subtitle:** "High sugar product? We'll suggest a healthier choice with less sugar, while tracking your energy burn."
* **Mascot Animation Context:** Mascot happily swapping a red soda can for a healthy orange drink with a smiley face.

---

### 5. Slide 5: Blood Sugar Tracker (Your Health Insurance)
* **Screen Focus:** Logging fasting and post-meal glucose trends to keep health in check.
* **Graphic Asset (Screen 5):**
  ![CutSugar - Slide 5 Health Tracker](file:///Users/ravinderpoonia/GoodBye-Sugar/assets/app-screenshots/onboarding_screen_5.png)
* **Visual & Style Layers:** Floating clinic-style digital dashboard displaying Fasting and Post-meal glucose metrics (`103 mg/dL` and `129 mg/dL`) with diagnostic ranges. Glowing orange grid base.
* **Core Information to Read:**
  - **Title:** "Clinical Blood Sugar Tracker"
  - **Subtitle:** "Log your fasting and post-meal glucose levels in a secure health diary to track your metabolic trends."
* **Mascot Animation Context:** Glassmorphic mascot writing actively inside a digital logbook with a glowing heartbeat pattern.

---

## III. Key UX Transition & Animation Guidelines

To ensure the 5-screen flow feels responsive, tactile, and matches the GenZ vibe, use the following coding patterns:

### 1. Spring-Loaded Slide Swiping
Use React Native Reanimated to interpolate the slide positions with high responsiveness:
```tsx
const slideTransition = useDerivedValue(() => {
  return withSpring(activeIndex * -SCREEN_WIDTH, {
    damping: 15,
    stiffness: 110,
    mass: 0.8,
  });
});
```

### 2. Haptic Feedback Milestones
Trigger soft haptic feedback on each slide change, and a triumphant success haptic upon finishing the flow:
```tsx
import * as Haptics from 'expo-haptics';

const handleNextSlide = () => {
  if (activeIndex < 4) {
    Haptics.selectionAsync();
    setActiveIndex(prev => prev + 1);
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }
};
```
