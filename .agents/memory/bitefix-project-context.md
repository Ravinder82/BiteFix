# BiteFix — Persistent Project Memory

## What BiteFix is
BiteFix (React Native + Expo, TypeScript, Expo Router, Zustand) is a **food DATA-analysis barcode scanner app**. Data comes from openfoodfacts.org and USDA APIs. Unlike other scanner apps that dump long explanations and walls of text, BiteFix gives **direct, instant visual insights** (NOVA score, additives, nutrition, sugar, eco) so the user can decide fast while grocery/snack shopping. Core brand promise: **quick, fast decision-making — "Stop Reading. Start Scanning. Get Instant Insights."** Every design choice should reinforce speed-to-insight, not reading.

## Product positioning rules
- Differentiator = instant data insights, NOT explanations/content to read.
- Copy must be short, plain, decision-oriented. No walls of text, no AI hype wording.
- Data source honesty: insights come from *available product data*.

## Onboarding flow (10 screens, files below — paywall after screen 10 is OFF-LIMITS)
Flow files (only these 3 may be modified for onboarding tasks):
1. `src/app/onboarding/index.tsx` — host pager, state, CTA gating, screen order
2. `src/components/onboarding/OnboardingScreens.tsx` — screen components
3. `src/components/onboarding/OnboardingVisuals.tsx` — hero visuals per screen

Screen order (0-indexed):
- 0 Welcome (scan hero) ✅ done
- 1 Identity — name input (AssistantCard + OrbMascot + emoji stickers) ✅
- 2 Context — how often buys packaged food ✅
- 3 Label reading — how often reads labels ✅
- 4 Pain — what makes choosing from the label hard. Visual: realistic tilted cream-paper ingredients label ("the label is the villain", product = Organic Dark Chocolate 72%, same product as screen 8's result card), amber reading-band animation, no mascot ✅
- 5 Revelation — unlock/power-up narrative: ring fills & counts to 78, then ONE-SHOT surge (ring flash, mascot pop, lime sparks, "UNLOCKED" lime stamp on badge). Copy: "BiteFix Intelligence / unlocked." + "Your assistant is powered up — turn labels into answers in seconds." Steps = static glass cards w/ green icons (glow animation removed). This is the TRAILER for screen 8's full feature presentation ✅
- 6 Allergies — multi-select allergen tiles ✅ (CTA: "Let's Continue")
- 7 Priorities — **CURRENT WORK SCREEN** (PriorityConstellation + multi-select priorities: ultra_processed, nutrition, ingredients, sugar, environment)
- 8 Moment of Truth — profile summary + MomentResultCard (full feature result card; expands on screen 5's trailer)
- 9 Final Activation — orbiting feature pills, CTA "Activate BiteFix" → completes onboarding → routes to /paywall (untouchable)

## Working method (user's process)
- User perfects screens **one by one, in order**. Screens 1–6 are locked/done; don't restyle them unless asked.
- Analysis lens: does the screen's content fit the onboarding narrative from the USER's point of view?
- Brand green `#01922A`; screen-6 ramp tokens (in OnboardingScreens.tsx): GREEN_DEEP `#014F18`, GREEN_BRIGHT `#1FB44E`, GREEN_LIGHT `#6FE38B`, LIME `#A9E34B` (accent only). Dark-mode aware, reduce-motion respected, OrbMascot is the recurring character, haptics on interactions.
- Never touch: paywall (`src/app/paywall.tsx`) and anything outside the 3 onboarding files unless explicitly told.
