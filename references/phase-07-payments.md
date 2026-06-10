# Phase 7 — Payment System: IAP · Stripe · Razorpay · UPI

## 7.1 Platform Rules Summary

| Platform | Digital Goods | Physical Goods |
|---|---|---|
| iOS App Store | **MUST use Apple IAP** (RevenueCat) | Stripe/PayPal allowed |
| Google Play | Google Play Billing required for in-app | Stripe/Razorpay allowed |
| Android (sideload/APK) | Any payment | Any payment |

**Violating Apple IAP rule = instant rejection. No exceptions for subscriptions or digital unlocks.**

---

## 7.2 RevenueCat + Apple IAP Setup (iOS)

### Step 1: App Store Connect
1. Go to `appstoreconnect.apple.com` → Your App → Subscriptions
2. Create Subscription Group → Add subscription products
3. Set pricing, duration (weekly/monthly/annual), free trial
4. Write subscription description (shown to user pre-purchase)
5. Submit for review (can do separately from app)

### Step 2: RevenueCat Account
1. `app.revenuecat.com` → Create Project
2. Connect iOS app → enter App Store App-Specific Shared Secret
3. Create Entitlements (e.g., `premium_access`)
4. Create Offerings → add your App Store products
5. Get `REVENUECAT_IOS_API_KEY` from API Keys section

### Step 3: Install & Configure

```bash
npx expo install react-native-purchases react-native-purchases-ui
```

```ts
// src/config/revenuecat.ts
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export async function initRevenueCat(userId?: string) {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
  });

  await Purchases.configure({ apiKey: apiKey! });
  if (userId) await Purchases.logIn(userId);
}
```

### Step 4: Paywall Component

```tsx
// src/components/features/Paywall.tsx
import { useEffect, useState } from 'react';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { Alert } from 'react-native';

export function Paywall() {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    Purchases.getOfferings().then(offerings => {
      setOffering(offerings.current);
    });
  }, []);

  const handlePurchase = async (packageToPurchase) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      if (customerInfo.entitlements.active['premium_access']) {
        // Unlock premium
      }
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message);
    }
  };

  const handleRestore = async () => {
    const customerInfo = await Purchases.restorePurchases();
    if (customerInfo.entitlements.active['premium_access']) {
      Alert.alert('Restored!', 'Your subscription has been restored.');
    }
  };

  // Render offering packages...
}
```

---

## 7.3 Stripe Setup (Android / Web / Physical Goods)

### Step 1: Create Stripe Account
1. `stripe.com` → Create Account
2. Complete business verification (takes 1-3 days)
3. For India: use Stripe India or Razorpay (Stripe India has limited availability)
4. Activate account (needed for live payments)
5. Get API keys from `dashboard.stripe.com/apikeys`

### Step 2: Backend (Firebase Cloud Function)

```ts
// functions/src/createPaymentIntent.ts
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const { amount, currency = 'usd' } = data;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,           // in cents
    currency,
    customer: await getOrCreateStripeCustomer(context.auth.uid),
    automatic_payment_methods: { enabled: true },
  });

  return { clientSecret: paymentIntent.client_secret };
});
```

### Step 3: React Native Client

```bash
npx expo install @stripe/stripe-react-native
```

```tsx
// src/app/_layout.tsx — wrap at root
import { StripeProvider } from '@stripe/stripe-react-native';

<StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
  <Stack />
</StripeProvider>
```

```tsx
// src/components/features/StripePayment.tsx
import { useStripe } from '@stripe/stripe-react-native';

export function StripePaymentButton({ amount }: { amount: number }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handlePayment = async () => {
    // 1. Get client secret from your backend
    const { clientSecret } = await createPaymentIntent({ amount });

    // 2. Init payment sheet
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Your App Name',
      paymentIntentClientSecret: clientSecret,
      defaultBillingDetails: { name: 'Jane Doe' },
    });

    if (initError) return;

    // 3. Present payment sheet
    const { error } = await presentPaymentSheet();
    if (!error) {
      // Payment success
    }
  };

  return <Button title={`Pay ₹${amount}`} onPress={handlePayment} />;
}
```

---

## 7.4 Razorpay Setup (India · UPI · Android)

### Step 1: Razorpay Account
1. `razorpay.com` → Create Account
2. KYC verification with business documents
3. Get `key_id` and `key_secret` from Dashboard → Settings → API Keys
4. Enable UPI, Cards, Netbanking in Payment Methods

### Step 2: Install

```bash
npm install react-native-razorpay
npx expo prebuild  # Required: Razorpay has native module
```

### Step 3: Backend Order Creation

```ts
// Firebase Function
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await razorpay.orders.create({
    amount: data.amount * 100, // paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  });

  return { orderId: order.id };
});
```

### Step 4: React Native Payment

```tsx
import RazorpayCheckout from 'react-native-razorpay';

const handleRazorpay = async (amount: number) => {
  const { orderId } = await createRazorpayOrder({ amount });

  RazorpayCheckout.open({
    key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency: 'INR',
    name: 'Your App Name',
    description: 'Premium Subscription',
    order_id: orderId,
    prefill: { email: user.email, contact: user.phone },
    theme: { color: '#6366F1' },
  })
    .then(data => { /* payment success, data.razorpay_payment_id */ })
    .catch(error => { /* payment failed or cancelled */ });
};
```

---

## 7.5 Payment Compliance Checklist

### App Store Requirements

- [ ] All in-app digital purchases go through Apple IAP
- [ ] Subscription terms shown BEFORE purchase (price, duration, auto-renew)
- [ ] "Restore Purchases" button visible in app
- [ ] Cancel subscription instructions provided (Settings → Apple ID → Subscriptions)
- [ ] EULA linked and accessible
- [ ] No external payment links for digital goods (no "buy on website")
- [ ] Free trial terms clearly stated

### Google Play Requirements

- [ ] For digital goods: use Google Play Billing (or RevenueCat Android)
- [ ] Subscription management link provided (links to Play Store subscription mgmt)
- [ ] Refund policy clearly stated

### General Compliance

- [ ] Payment screen shows itemized price breakdown
- [ ] Tax disclosure if applicable
- [ ] Refund policy linked
- [ ] No dark patterns (pre-checked boxes, hidden fees, misleading CTAs)
- [ ] PCI DSS compliance: never log or store raw card numbers

---

## 7.6 Subscription UI Requirements (Pre-Purchase Screen)

Must display BEFORE user taps "Subscribe":

```
╔════════════════════════════════════╗
║  🌟 Go Premium                    ║
║                                    ║
║  ✅ Feature 1                      ║
║  ✅ Feature 2                      ║
║  ✅ Feature 3                      ║
║                                    ║
║  [ Monthly — $4.99/mo ]           ║
║  [ Annual — $39.99/yr (Save 33%) ]║
║                                    ║
║  3-day free trial, then $4.99/mo  ║
║  Auto-renews. Cancel anytime.     ║
║                                    ║
║  [      Start Free Trial     ]    ║
║                                    ║
║  Privacy Policy | Terms | Restore ║
╚════════════════════════════════════╝
```

All three links (Privacy Policy, Terms, Restore) are REQUIRED on paywall.
