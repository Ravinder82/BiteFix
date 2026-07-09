# CODEX COMPLIANCE SHIELD 🛡️
## App Store Submission Protocol & Codebase Refactoring Roadmap
**Target Release**: CutSugar v1.0.0 (Local-First Release)

---

## I. Codex Persona & Mission

> **Protocol Name**: `Codex App Store Gatekeeper Shield (Codex-AGS)`
> **Mission**: Build an unbreakable, policy-compliant, and production-hardened binary for *CutSugar v1.0.0* that breezes through the Apple App Store Review team on the **first attempt** with zero friction.
>
> We operate under the assumption that the Apple Reviewer is extremely rigorous, specifically looking for compliance regarding **health tracking apps (Guideline 1.4.1)** and **user data privacy (Guideline 5.1.1)**. Our codebase must be bulletproof, self-contained, and perfectly declared.

---

## II. App Store Compliance Audit (Guideline-by-Guideline)

### 1. Guideline 1.4.1 - Physical Harm (Medical App Disclaimers)
* **Rule**: Apps that track health data (like blood sugar logs) must clearly state they are not medical devices and that users should consult a physician before making medical decisions.
* **Current Status**: 
  * The `Terms of Service` text inside `settings.tsx` contains a solid medical disclaimer.
  * *Critical Action Item*: To avoid subjective rejection by a reviewer who doesn't read the terms modal, we must add a visible, neat, 1-line **medical disclaimer footer** on the `TrackerScreen` (in `tracker.tsx`) directly under the stats or history.
* **Compliance Check**: ⚠️ *Needs a minor UI addition in `tracker.tsx` to display a persistent warning footnote.*

### 2. Guideline 5.1.1 - Data Collection and Privacy (Account Deletion & Data Control)
* **Rule**: If an app allows account creation or stores personal records, it must offer a simple, functional way to delete the account and purge all data.
* **Current Status**: 
  * **Excellent**: We have a dedicated `DeleteAccountScreen` (`delete-account.tsx`) linked from `SettingsScreen` which calls `clearAllData()` to wipe AsyncStorage and SecureStore, then routes back to onboarding. This is fully compliant.
  * **Excellent**: Data collection is 100% local. The app does not transmit sensitive health statistics or barcodes to any private servers (only hits the open public *Open Food Facts* API).
* **Compliance Check**: ✅ *Fully Compliant.*

### 3. Guideline 4.8 - Sign in with Apple
* **Rule**: Apps that offer third-party logins (like Google/Facebook) must also offer Sign in with Apple.
* **Current Status**: 
  * **Perfect**: CutSugar v1.0.0 does not use third-party OAuth (like Google or Apple Login). The user simply inputs their name locally during onboarding. Since there is no remote database registration, Sign in with Apple is **not required**.
* **Compliance Check**: ✅ *Fully Compliant.*

### 4. Guideline 3.1.1 - In-App Purchase (IAP) & Paywall Cleanup
* **Rule**: Apps cannot have dead payment screens, disabled "Purchase" buttons, or inactive subscriptions. The app must not mention subscriptions unless the IAP system is active and approved.
* **Current Status**:
  * **Excellent**: We have no IAP SDKs (`react-native-iap`, `expo-in-app-purchases`) in `package.json`.
  * **Excellent**: No active paywall screens or locked premium gates exist in our layout.
  * **Check**: The `Terms of Service` text has a placeholder clause: *"Payments & Subscriptions (if applicable)..."*. This is harmless standard legal language and won't trigger a rejection since there are no functional references to purchases in the app.
* **Compliance Check**: ✅ *Fully Compliant.*

### 5. Guideline 2.1 - Performance & Crash-Free Execution
* **Rule**: Apps must not crash on launch or contain broken routing/missing permission disclosures.
* **Current Status**:
  * **Permissions**: `app.json` contains `NSCameraUsageDescription` and the `expo-camera` plugin is correctly declared. This prevents runtime permission crashes when opening the Barcode Scanner.
  * **TypeScript Integrity**: Compiles successfully with zero errors (`npx tsc --noEmit` checks out).
* **Compliance Check**: ✅ *Fully Compliant.*

---

## III. Action Items for Codebase Cleanup & Refactoring

To make the codebase 100% ready for App Store submission, perform the following refactoring tasks:

### 1. Add Medical Disclaimer Footnote on Tracker Screen (`src/app/(tabs)/tracker.tsx`)
Add a clean, styled footnote at the bottom of the ScrollView in `tracker.tsx` so the reviewer immediately sees the safety warning.

* **Target Content**:
```tsx
<Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center', marginVertical: 16, lineHeight: 14 }}>
  Disclaimer: CutSugar is an informational log tracker and not a medical device. Consult a physician before acting on blood sugar readings.
</Text>
```

### 2. Clean Up Log Output & Console Statements
Ensure there are no verbose console statements leaks or debug placeholders.
* Run a clean pass across `src/` to ensure production readiness.

### 3. Verify App Store Connect Privacy Details
When submitting to App Store Connect, declare that the app collects:
* **Health & Fitness Data**: Stored locally on device, *not linked to the user's identity* (since there are no account logins), and *not used for tracking*.
* **Identifiers (Device ID / Name)**: Stored locally, *not linked*, *not used for tracking*.

---

## IV. Apple App Store Submission Checklist

Use this checklist during submission in App Store Connect:

- [ ] **Privacy Policy URL**: Link to a hosted static privacy policy page (matching the text in `settings.tsx`).
- [ ] **Terms of Use (EULA) URL**: Use Apple's standard EULA link or link to the text in `settings.tsx`.
- [ ] **Camera Description Clarification**: Confirm the App Store Connect metadata notes specify that camera permission is used strictly to read product barcodes.
- [ ] **Reviewer Demo Credentials**: Since there is no login required, select "No sign-in required" for the App Store reviewer.
- [ ] **No In-App Purchase Flag**: Ensure "In-App Purchases" is turned off in the provisioning profile.
- [ ] **Device Compliance**: Tested on iPhone and iPad compatibility check.
