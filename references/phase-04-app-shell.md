# Phase 4 — App Shell: Header, Settings & Compliance Docs

## 4.1 Top Header Component

```tsx
// src/components/layout/AppHeader.tsx
import { View, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Settings, Bell } from 'lucide-react-native';
import { useTheme } from '@hooks/useTheme';
import Animated, { FadeIn } from 'react-native-reanimated';

export function AppHeader() {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{ backgroundColor: colors.surface }}
      className="flex-row items-center justify-between px-4 pt-2 pb-3"
    >
      {/* Logo */}
      <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.8}>
        <Image source={require('@assets/logo.png')} className="h-8 w-32" resizeMode="contain" />
      </TouchableOpacity>

      {/* Actions */}
      <View className="flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.push('/notifications')} activeOpacity={0.7}>
          <Bell size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7}>
          <Settings size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
```

## 4.2 Settings Screen (Complete)

```tsx
// src/app/(tabs)/settings.tsx
import { ScrollView, View, Text, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@stores/authStore';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';

const LEGAL_URLS = {
  privacyPolicy:  'https://yourapp.com/privacy',
  termsOfUse:     'https://yourapp.com/terms',
  eula:           'https://yourapp.com/eula',
  cookiePolicy:   'https://yourapp.com/cookies',
  support:        'https://yourapp.com/support',
  faq:            'https://yourapp.com/faq',
};

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const { user, signOut } = useAuthStore();

  const openURL = (url: string) => Linking.openURL(url);

  const handleRateUs = async () => {
    if (await StoreReview.hasAction()) {
      StoreReview.requestReview();
    } else {
      // Fallback: deep link to store listing
      Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID');
    }
  };

  return (
    <ScrollView>
      {/* ACCOUNT SECTION */}
      <SettingsSection title="Account">
        <SettingsRow label="Profile" onPress={() => router.push('/profile')} />
        <SettingsRow label="Change Password" onPress={() => router.push('/change-password')} />
        <SettingsRow label="Manage Subscription" onPress={() => router.push('/subscription')} />
        <SettingsRow label="Restore Purchases" onPress={handleRestorePurchases} />
      </SettingsSection>

      {/* PREFERENCES */}
      <SettingsSection title="Preferences">
        <SettingsRow
          label="Dark Mode"
          right={<Switch value={theme === 'dark'} onValueChange={toggleTheme} />}
        />
        <SettingsRow label="Notifications" onPress={() => router.push('/notification-settings')} />
        <SettingsRow label="Language" onPress={() => router.push('/language')} />
      </SettingsSection>

      {/* SUPPORT */}
      <SettingsSection title="Support">
        <SettingsRow label="Help Center / FAQ" onPress={() => openURL(LEGAL_URLS.faq)} />
        <SettingsRow label="Contact Support" onPress={() => openURL(LEGAL_URLS.support)} />
        <SettingsRow label="Report a Problem" onPress={() => router.push('/report-problem')} />
      </SettingsSection>

      {/* LEGAL */}
      <SettingsSection title="Legal">
        <SettingsRow label="Privacy Policy" onPress={() => openURL(LEGAL_URLS.privacyPolicy)} />
        <SettingsRow label="Terms of Use" onPress={() => openURL(LEGAL_URLS.termsOfUse)} />
        <SettingsRow label="EULA" onPress={() => openURL(LEGAL_URLS.eula)} />
        <SettingsRow label="Cookie Policy" onPress={() => openURL(LEGAL_URLS.cookiePolicy)} />
      </SettingsSection>

      {/* STORE */}
      <SettingsSection title="Store">
        <SettingsRow label="Rate Us ⭐" onPress={handleRateUs} />
        <SettingsRow label="Share App" onPress={handleShare} />
        <SettingsRow label="What's New" onPress={() => router.push('/changelog')} />
      </SettingsSection>

      {/* DANGER ZONE */}
      <SettingsSection title="Account Actions">
        <SettingsRow label="Sign Out" onPress={signOut} textColor="orange" />
        <SettingsRow label="Delete Account" onPress={() => router.push('/delete-account')} textColor="red" />
      </SettingsSection>

      {/* VERSION */}
      <Text className="text-center text-xs text-muted py-6">
        Version {Constants.expoConfig?.version} ({Constants.expoConfig?.ios?.buildNumber})
      </Text>
    </ScrollView>
  );
}
```

## 4.3 Legal Document Templates

### Privacy Policy — Required Sections

```markdown
# Privacy Policy
Last Updated: [DATE]

## 1. Information We Collect
- Account info (email, name)
- Usage data (analytics, crash reports)
- Device info (OS version, device model)
- Payment info (processed by [Stripe/Apple], we do NOT store card details)

## 2. How We Use Your Information
- To provide and improve the service
- To send transactional emails (receipts, password reset)
- To send marketing emails (with opt-out)

## 3. Data Sharing
- We do NOT sell your data
- Service providers: Firebase (Google), Stripe, [Analytics Provider]
- Legal requirements: if required by law

## 4. Data Retention
- Account data: retained until account deletion
- Deleted within 30 days of account deletion request

## 5. Your Rights (GDPR / CCPA)
- Access your data
- Delete your data (use in-app "Delete Account" or email us)
- Export your data
- Opt out of analytics

## 6. Children's Privacy
- App is not directed at children under 13
- We do not knowingly collect data from under-13s

## 7. Contact
privacy@yourapp.com
```

### Terms of Use — Required Sections

```markdown
# Terms of Use
Last Updated: [DATE]

## 1. Acceptance
By using [App Name], you agree to these Terms.

## 2. Eligibility
Must be 13+ (or age of majority in your jurisdiction).

## 3. Subscriptions & Payments
- Subscription auto-renews unless cancelled 24 hours before renewal
- Cancel in App Store / Play Store settings
- Refunds handled per platform policy

## 4. Prohibited Uses
- No reverse engineering
- No illegal use
- No harassment of other users

## 5. Intellectual Property
All content owned by [Company Name].

## 6. Limitation of Liability
Service provided "as is". Not liable for indirect damages.

## 7. Governing Law
Laws of [Your Jurisdiction].

## 8. Contact
legal@yourapp.com
```

## 4.4 Legal URL Validator Script

```js
// scripts/validate-legal-urls.js
const URLS = [
  'https://yourapp.com/privacy',
  'https://yourapp.com/terms',
  'https://yourapp.com/eula',
  'https://yourapp.com/support',
];

async function validate() {
  let allPassed = true;
  for (const url of URLS) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const status = res.ok ? '✅' : '❌';
      console.log(`${status} ${res.status} — ${url}`);
      if (!res.ok) allPassed = false;
    } catch (e) {
      console.log(`❌ UNREACHABLE — ${url}`);
      allPassed = false;
    }
  }
  if (!allPassed) {
    console.error('\n🚫 Fix all URLs before submitting to App Store!\n');
    process.exit(1);
  } else {
    console.log('\n✅ All legal URLs are live and accessible.\n');
  }
}

validate();
```

Add to `package.json`:
```json
"scripts": {
  "validate:legal": "node scripts/validate-legal-urls.js",
  "prebuild": "npm run validate:legal"
}
```

## 4.5 Delete Account Screen (MANDATORY for App Store)

The delete account flow MUST:
1. Confirm intent with typed confirmation ("type DELETE to confirm")
2. Show what data will be deleted
3. Actually delete: Firebase Auth user + Firestore docs + Storage files + revoke tokens
4. Sign user out and navigate to auth screen
5. Show success confirmation

```tsx
// src/app/delete-account.tsx
// Firebase deletion cascade:
async function deleteAccount(userId: string) {
  const batch = writeBatch(db);

  // Delete all user documents
  const userRef = doc(db, 'users', userId);
  batch.delete(userRef);

  // Delete subcollections (must be done separately or via Cloud Function)
  await deleteUserData(userId);

  // Commit batch
  await batch.commit();

  // Delete storage files
  const storageRef = ref(storage, `users/${userId}`);
  await deleteObject(storageRef).catch(() => {});

  // Delete Firebase Auth user (MUST be last)
  const user = auth.currentUser;
  if (user) {
    // Re-authenticate first (required by Firebase for deletion)
    // Then delete
    await deleteUser(user);
  }
}
```
