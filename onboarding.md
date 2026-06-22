# Onboarding Restructuring Plan & Asset Production Strategy

This document outlines the detailed restructuring of the Goodbye Sugar onboarding flow and specifies the asset details (video loops, stills, screenshots, and prompts) required to build a premium, high-converting onboarding experience.

---

## 1. Current Onboarding Screens & Content Details

The current onboarding flow in `src/app/onboarding/index.tsx` is a 9-step static setup:

1. **Slide 1: Name Input (`NameCard`)**
   - *Title:* "Welcome! What's your name?"
   - *Subtitle:* "Let's personalize your path to a sugar-free lifestyle."
   - *Content:* A clean text input for the name with a privacy note.
2. **Slide 2: Goal Selection (`GoalCard`)**
   - *Title:* "What brings you here?"
   - *Subtitle:* "Select your primary goal so we can tailor your experience."
   - *Options:* "Boost daily energy", "Lose weight naturally", "Medical/Health reasons".
3. **Slide 3: Sweet Tooth Assessment (`SweetToothCard`)**
   - *Title:* "Your Sweet Tooth"
   - *Subtitle:* "How would you describe your current sugar cravings?"
   - *Options:* "High (craves often)", "Moderate (occasional)", "Low (already cautious)".
4. **Slide 4: Pace / Commitment (`PaceCard`)**
   - *Title:* "Your Commitment"
   - *Subtitle:* "Choose the pace that works best for you."
   - *Options:* "Cold Turkey (100% sugar-free)", "Gradual Reduction", "Just Tracking".
5. **Slide 5: Tutorial Opt-In (`TutorialOptInCard`)**
   - *Title:* "Your Personalized Roadmap"
   - *Subtitle:* "Our Tools Help you Track and Manage Sugar Intake for Better Control."
   - *Options:* "See how it works", "Skip to the dashboard".
6. **Slide 6: Feature Intro - Scanner (`NutritionCard`)**
   - *Title:* "Real Time Sugar Scanner"
   - *Subtitle:* "Scan any barcode or label and App will tell you exact amount of Sugar."
7. **Slide 7: Feature Intro - Teaspoons (`TeaspoonCard`)**
   - *Title:* "See it to Believe it"
   - *Subtitle:* "We translate abstract grams into a universal metric—teaspoons."
8. **Slide 8: Feature Intro - Blood Sugar (`ProgressCard`)**
   - *Title:* "Log your Blood Sugar."
   - *Subtitle:* "We help you log your Blood Sugar on an empty stomach and post-meal."
9. **Slide 9: Setup Complete (`SetupCompleteCard`)**
   - *Title:* "Your Setup is Complete"
   - *Subtitle:* "We're ready to start this life-changing journey together."

---

## 2. Restructured 9-Step Funnel Strategy

We will pivot to a video-backed, interactive, high-converting funnel:

### Phase 1: The Hook (Video-Backed Setup)
*UI: Upper 60% of the screen plays compressed, seamless MP4/WebM video loops of the app in action. Lower 40% is a glassmorphic bottom sheet for user inputs.*

1. **Screen 1: Personalization (Name & Goal)** 
   - *Background Video:* Video 1 (Dashboard and Stats Montage).
   - *Action:* "Hi! What's your name?" & "What's your primary goal?" (Energy / Weight / Health).
2. **Screen 2: Current Habits (Sweet Tooth & Pace)**
   - *Background Video:* Video 2 (Lifestyle & Scanner Action).
   - *Action:* "How's your sweet tooth?" & "Choose your commitment level."

### Phase 2: The "Aha!" Moment (Interactive Core Loop)
*UI: Full-screen camera experience.*

3. **Screen 3: The Challenge**
   - *UI:* Camera activates in the background.
   - *Action:* "Let's find the hidden sugar in your house. Grab any packaged food and scan the barcode." (With a "Scan a Demo Product" button).
4. **Screen 4: The Reveal (Scanner Results)**
   - *UI:* Scanner Results screen with the 3D Orb Mascot.
   - *Action:* Displays exact sugar in teaspoons.
5. **Screen 5: The Emotional Hook**
   - *UI:* Dramatic dark mode.
   - *Action:* "If you consumed this daily, you'd eat X lbs of sugar a year. Let's fix that." -> Tap "Transform My Health".

### Phase 3: The Conversion (Auth & Paywall)
*UI: Premium, sleek, confidence-inspiring design.*

6. **Screen 6: The Paywall**
   - *UI:* Tailored message based on selected goals (e.g., "Your Weight Loss Plan"). Shows plan comparison and features.
   - *Action:* User selects subscription tier and hits "Continue".
7. **Screen 7: Authentication**
   - *UI:* Apple & Google Sign-In bottom sheet.
   - *Action:* "Create an account to save your premium plan."
8. **Screen 8: Checkout (IAP)**
   - *Action:* Native IAP payment dialog.
9. **Screen 9: Welcome Aboard**
   - *Action:* Transition directly to Dashboard.

---

## 3. Video Assets & Production Specification

For the video backgrounds in **Phase 1**, you need two highly compressed, high-quality, looping video files.

### Video 1: "Dashboard and Stats Montage" (Background for Screen 1)
- **First Frame Still:** A close-up, angled macro shot of a sleek, dark-mode iPhone displaying a glowing green ring representing "You Consumed 4 tsp of Sugar Today" with soft particles floating in the background.
- **Last Frame Still:** The camera slowly pans out and rotates 15 degrees to reveal a second orange ring ("WHO suggests max 6 to 12 tsp Sugar a day") in full view. The video ends exactly in a position that matches the beginning frame to loop seamlessly.
- **Video Prompt (AI/Studio Generation):**
  > "High-end cinematic tech advertisement. Ultra-slow pan and roll across a premium iOS mobile dashboard. Sleek glassmorphic card elements with vibrant neon-green and amber circular progress rings showing sugar metrics. The background is a beautifully blurred obsidian kitchen marble counter with warm, ambient soft-focus lights. 8k resolution, ARRI Alexa camera quality, shallow depth of field, fluid 60fps motion, luxury brand aesthetic."
- **Camera Flow & Style:** 
  - *Camera:* Slow, crane-down motion with a slight roll.
  - *Quality:* Studio-level lighting with high-contrast shadows.
  - *Animations:* Circular rings pulse with light, and text values have a subtle shimmering glow running left-to-right.

### Video 2: "Lifestyle & Scanner Action" (Background for Screen 2)
- **First Frame Still:** A first-person view of a hand lifting an organic sauce bottle from a marble kitchen table.
- **Last Frame Still:** An iPhone screen enters the frame, holds the scan line over the product barcode, and just as the green "Success" bracket flashes, the iPhone screen drops out of frame and the bottle is set back down.
- **Video Prompt (AI/Studio Generation):**
  > "Cinematic first-person perspective lifestyle loop. A hand picks up an organic food package on a clean, sunlit white marble kitchen counter. A phone enters the frame scanning the barcode with a sleek green laser scan line. Natural warm lighting, shallow depth of field, shot on RED V-Raptor, ultra-smooth handheld gimbal movement, modern wellness aesthetic, 4k."
- **Camera Flow & Style:**
  - *Camera:* Gentle, organic handheld breathing motion (using a gimbal for stability).
  - *Quality:* Bright, airy, high-key lighting mimicking natural sunlight streaming through a window.
  - *Animations:* A neon-green laser line sweeps up and down the barcode twice. Soft glassmorphic data cards showing nutritional stats float slightly in 3D space next to the phone.

---

## 4. Screenshots to Collect & Polish

To construct the mockups or layers inside the videos, prepare the following high-resolution screenshot assets:

1. **The Hero Dashboard (Dark Mode & Light Mode)**
   - *Capture:* The home screen dashboard containing the today's sugar budget and rings.
   - *Polish:* Remove status bar indicators (carrier names, low battery icons). Make sure numbers shown are clean and relatable (e.g., 4 tsp consumed, 8 tsp budget). Apply a slight neon outer glow to the active ring paths in Photoshop/Figma.
2. **The Scanner UI (Active & Success States)**
   - *Capture:* The active camera view with scanning brackets, and the slide-up results card.
   - *Polish:* Ensure the camera background is clean and aesthetic. Overlay a clean mock barcode that is perfectly centered. Add a glowing green horizontal laser sweep line.
3. **The Progress Trends Screen**
   - *Capture:* The history and weekly trends charts screen.
   - *Polish:* Smooth out the SVG chart path. Increase the thickness of the line chart and add a soft gradient fill below it to enhance readability.

---

## 5. Implementation Roadmap

1. **Asset Preparation:**
   - Record and edit the 3-5 second looping videos.
   - Compress them to MP4/WebM with low bitrates (optimized for mobile loading).
2. **Onboarding Code Refactoring:**
   - Modify `src/app/onboarding/index.tsx` to display the video player component (`expo-video` or `expo-av`) covering the top 60% of the screen.
   - Adjust questionnaire layouts to fit within the bottom glassmorphic sheet.
3. **Integrate Scanner & Paywall Funnel:**
   - Wire the scanner directly into Phase 2 of the onboarding flow.
   - Integrate IAP packages and Google/Apple auth triggers.
