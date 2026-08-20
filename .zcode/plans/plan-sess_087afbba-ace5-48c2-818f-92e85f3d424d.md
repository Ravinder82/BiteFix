# Screen 2 (name input) — keyboard jerk fix

**Two files only:** `src/app/onboarding/index.tsx` + `src/components/onboarding/OnboardingScreens.tsx`. No new deps, no paywall/CTA-semantics changes, nothing in `OnboardingVisuals.tsx`. All other onboarding screens stay inert/unchanged.

## Root cause
`KeyboardAvoidingView behavior="padding"` (index.tsx:754) AND the inner vertical `ScrollView`'s `automaticallyAdjustKeyboardInsets` (index.tsx:680, default true) BOTH react to the keyboard — single event, two reflows → the screen "shifts upward" twice (the visible jerk). On top of that, the inner `ScrollView` has a rigid `contentContainerStyle.minHeight = screenHeight - insets - 42 - 100` (index.tsx:674) computed once from full window height and never recomputed when the keyboard shrinks the available area — so content is taller than the shrunk window, forcing a relayout war. Then `handleNext` (index.tsx:527) never calls `Keyboard.dismiss()`, and the `TextInput` has no `onSubmitEditing` — so tapping Continue *with the keyboard up* starts the horizontal slide before the keyboard retracts, the two animations overlap and read as "laggy." Only Screen 2 has a `TextInput`, so the misconfigured (but global) avoidance only manifests there.

## File 1 — `src/app/onboarding/index.tsx`
1. Add `Keyboard` to the `react-native` import (lines 6-19). Not currently imported.
2. Inner vertical `ScrollView` (line 670): add `automaticallyAdjustKeyboardInsets={false}`. KAV becomes the sole iOS adjuster; Android keeps native `adjustResize` (AndroidManifest). Kills the double-shift.
3. `contentContainerStyle` (lines 672-676): remove the fixed-pixel `minHeight: Math.max(0, screenHeight - insets.top - insets.bottom - (screen > 0 ? 42 : 0) - 100)`; keep `flexGrow: 1, paddingBottom: 18`. The slide's `height:'100%'` + `flex:1` wrappers already flex to the KAV-adjusted size, so content reflows smoothly instead of fighting a taller-than-window minimum.
4. `handleNext` (lines 527-535): call `Keyboard.dismiss()` before `goTo(...)`. Mirror this in the back-button handler (located during impl). Slide transitions now have the keyboard down first.
5. `renderScreenContent` `case 1` (lines 568-569): pass `onSubmit={() => { if (name.trim().length >= 1) handleNext(); }}` to `<IdentityScreen>`. Matches the existing CTA-disabled gate (`name.trim().length < 1`), so Done-empty is a safe no-op.

## File 2 — `src/components/onboarding/OnboardingScreens.tsx`
6. `IdentityScreen` (lines 1143-1155): add optional `onSubmit?: () => void`. Attach `onSubmitEditing={onSubmit}` to the `TextInput` (line 1287). Keep `returnKeyType="done"`; leave `blurOnSubmit` default so the page-slide naturally blurs the field.

## Verify
- `npx tsc --noEmit` clean.
- Manual (iOS + Android if possible): tap input → keyboard rises → screen settles once, smoothly. Tap Done with a name → keyboard retracts as page advances. Tap Next CTA with keyboard up → retracts + advances cleanly. Back from name screen with keyboard up retracts cleanly. Other slides unaffected (no input → avoidance inert).

## Out of scope
- No new deps. `react-native-reanimated 4.1.7` exposes `useAnimatedKeyboard()` for extra-smooth worklet-driven avoidance; evaluated, but the dependency-free fix removes the primary double-shift + rigid-floor cause. If still not buttery enough after this, I can layer `useAnimatedKeyboard()` as a separate contained step.
- No `app.json` / `AndroidManifest.xml` `windowSoftInputMode` change (`adjustResize` is the right Android pair for this JS approach).
- Nothing in `OnboardingVisuals.tsx`, paywall, CTA shimmer/labels, or screens 1/3-9.