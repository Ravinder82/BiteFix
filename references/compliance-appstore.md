# App Store Compliance — First-Attempt Approval Guide

> Follow this checklist 100%. Every checked item is a known rejection reason.

## Pre-Submission: Assets

| Item | Spec | Status |
|---|---|---|
| App Icon | 1024×1024 PNG, no alpha channel, no rounded corners | [ ] |
| Screenshots — 6.9" | 1320×2868px or 1290×2796px, 3–10 screens | [ ] |
| Screenshots — 6.5" | 1242×2688px, 3–10 screens | [ ] |
| Screenshots — 5.5" | 1242×2208px (required if supporting older devices) | [ ] |
| iPad screenshots | Required if `supportsTablet: true` | [ ] |
| App Preview (optional) | 15–30 sec, MP4, same dimensions as screenshots | [ ] |

**Screenshot Rules:**
- Show REAL app UI, not marketing design
- If screenshots show UI content, it must be available in the app
- No device frames required but allowed
- No text saying "No.1" or "#1" without proof
- No competitor references

---

## Pre-Submission: Metadata

| Field | Limit | Rules |
|---|---|---|
| App Name | 30 chars | Unique, no keyword stuffing, no competitors |
| Subtitle | 30 chars | Adds searchability, must reflect actual feature |
| Description | 4000 chars | No pricing info, no "free" if not fully free, no other platforms |
| Keywords | 100 chars | Comma-separated, no spaces, no plurals of existing words |
| Category | 2 max | Be accurate — wrong category = rejection |
| Support URL | Required | Must be live (200 status), in English |
| Marketing URL | Optional | Must be live if provided |
| Privacy Policy URL | REQUIRED | Must be live, HTTPS |

---

## Pre-Submission: App Store Connect Config

### App Information
- [ ] Age Rating completed (answer all questions honestly)
- [ ] Content Rights: declare if using third-party content
- [ ] Pricing set (including free tier if applicable)
- [ ] Availability: select countries/regions

### App Privacy (Data Safety)
Declare EVERY type of data collected:

| Data Type | If You Collect | Required Declaration |
|---|---|---|
| Name, Email | For account | ✅ Must declare |
| Crash data | Via Firebase Crashlytics | ✅ Must declare |
| Usage analytics | Via Firebase Analytics | ✅ Must declare |
| Purchase history | Via RevenueCat | ✅ Must declare |
| Device ID | Via expo-device | ✅ Must declare |
| Location | Only if requested | ✅ Must declare |

**Undeclared data collection = rejection**

### Export Compliance
- Uses standard HTTPS encryption: select "Yes, uses encryption" → "Qualifies for exemption" (standard HTTPS is exempt from export regulations)
- Custom encryption: consult a lawyer

---

## Pre-Submission: Technical Checks

### Required Features

- [ ] **Apple Sign-In**: If ANY third-party login (Google, Facebook, etc.) exists, Apple Sign-In is MANDATORY
- [ ] **Delete Account**: In-app account deletion that actually works (not just "email us")
- [ ] **Demo Account**: If app has login, provide test credentials in Review Notes
- [ ] **All URLs work**: Settings links, legal URLs, support links all return 200
- [ ] **No placeholder content**: No "Lorem ipsum", no test data, no "Coming soon" screens

### Performance Requirements

- [ ] App launches in < 5 seconds on oldest supported device
- [ ] No crashes on startup (test on real device + simulator)
- [ ] No hangs > 2 seconds on user interaction
- [ ] Memory usage reasonable (< 500MB peak)
- [ ] Works in airplane mode (or shows appropriate error)

### UI/UX Requirements

- [ ] Follows iOS Human Interface Guidelines
- [ ] No Android-specific UI patterns (hamburger menu, FAB, Material Design)
- [ ] Back navigation works correctly throughout
- [ ] Status bar properly handled (no overlap)
- [ ] Safe areas respected (notch, home indicator)
- [ ] Dark mode supported (or explicitly not supported — both are fine)
- [ ] Landscape mode: either supported properly or locked to portrait
- [ ] Dynamic Type: text scales with system font size setting
- [ ] VoiceOver: basic accessibility labels on interactive elements

### Privacy Requirements

- [ ] Permission requests include usage description strings in `Info.plist`
- [ ] Only request permissions when needed (not upfront)
- [ ] App functions (at reduced capacity) if permissions denied
- [ ] Tracking: implement `AppTrackingTransparency` if using ad networks

---

## Review Notes Template

When submitting, fill in "Notes for App Review":

```
Demo Account Credentials:
  Email:    test@yourapp.com
  Password: TestPass123!

Note: The app requires account creation for full access. The demo account
above has been pre-verified and loaded with sample data.

[If IAP] IAP Testing:
  Sandbox account: sandbox@yourapp.com / SandboxPass123!
  Test products are configured in the sandbox environment.

[If special hardware needed] Hardware:
  This app does not require special hardware.

[If background modes used] Background:
  Background fetch is used to sync user data in the background.
  This improves the experience when reopening the app.

[Any other relevant info for reviewers]
```

---

## Common Rejection Reasons (Avoid These)

| Guideline | Issue | Fix |
|---|---|---|
| 2.1 | Crashes or bugs | Test on real device, oldest iOS supported |
| 2.3.3 | Placeholder content | Remove all "Coming soon" / Lorem ipsum |
| 3.1.1 | Payment bypasses Apple | Use IAP for all digital goods |
| 4.0 | No value / incomplete app | Must be fully functional at submission |
| 4.3 | Duplicate app | Must have unique value proposition |
| 5.1.1 | Privacy — no policy | Privacy Policy URL must be valid |
| 5.1.2 | Data use consent | Explain why each permission is needed |
| 5.1.5 | No account deletion | Delete Account must be in-app and functional |
| 17 | Apple Sign-In missing | Required if any social login exists |

---

## Post-Approval: Live Monitoring

- [ ] Monitor crash rates via Firebase Crashlytics
- [ ] Monitor reviews in App Store Connect
- [ ] Set up `expo-updates` for OTA patches (JS-only changes don't need review)
- [ ] Alert on any ANRs or high exit rate
- [ ] Respond to App Store reviews (good and bad) within 48 hours

---

## Google Play Compliance (Quick Reference)

For Play Store (submit after iOS approval):

- [ ] Privacy Policy URL in Play Console AND in app
- [ ] Data Safety form completed (similar to Apple's App Privacy)
- [ ] Target API level = latest required level (updated annually)
- [ ] 64-bit app required (Expo handles this via EAS)
- [ ] App Bundle (.aab) not APK for production
- [ ] Content rating questionnaire completed
- [ ] Account deletion: same requirement as Apple (in-app deletion)
- [ ] For subscription apps: link to subscription management in Play Console
- [ ] Sensitive permissions: Camera, Contacts, Location need explicit justification
- [ ] Review declaration for apps accessing sensitive data (1 year validity)

Full Play Store checklist → `references/compliance-playstore.md`
