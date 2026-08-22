// ═══════════════════════════════════════════════════════════
// BiteFix — Local Renewal Reminder Notifications
//
// Strictly and exclusively scoped to the "We will remind you
// before renewal" reassurance feature. One scheduled local
// notification per active trial/subscription — no marketing,
// no unsolicited triggers.
// ═══════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useAppStore } from '../stores/appStore';

const REMINDER_ID_KEY = '@bitefix-renewal-reminder-id';
const REMINDER_CHANNEL_ID = 'renewal-reminders';

/** Days before renewal at which the reminder fires. */
export const REMINDER_LEAD_DAYS = 2;

/** Default trial/subscription period when no expiration date is known. */
const DEFAULT_PERIOD_DAYS = 7;

const DAY_MS = 86_400_000;

// Foreground presentation policy — quiet banner, no sound, no badge.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady = false;
async function ensureAndroidChannel(): Promise<void> {
  if (channelReady || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Renewal Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  channelReady = true;
}

/** Gracefully requests local notification authorization (iOS / Android 13+). */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.requestPermissionsAsync();
    return settings.granted ?? false;
  } catch {
    return false;
  }
}

export interface RenewalReminderResult {
  scheduled: boolean;
  /** When the reminder will fire, when scheduling succeeded. */
  fireDate?: Date;
}

/**
 * Schedules the single local renewal reminder 2 days before renewal.
 * Cancels any previously scheduled reminder first, so calling this
 * repeatedly stays idempotent. Accepts either a plain trial-day count
 * or an explicit renewal date (preferred — taken from the store
 * receipt when available). Never throws into the purchase flow.
 */
export async function scheduleRenewalReminder(
  trialDaysOrOptions?: number | { trialDays?: number; renewalDate?: Date | number | string | null }
): Promise<RenewalReminderResult> {
  try {
    const options: { trialDays?: number; renewalDate?: Date | number | string | null } =
      typeof trialDaysOrOptions === 'number' ? { trialDays: trialDaysOrOptions } : (trialDaysOrOptions ?? {});

    // Respect the user's Settings toggle — opting out stops all scheduling.
    if (useAppStore.getState().renewalRemindersEnabled === false) {
      return { scheduled: false };
    }

    const granted = await requestNotificationPermission();
    if (!granted) return { scheduled: false };

    await cancelRenewalReminder();
    await ensureAndroidChannel();

    const renewalMs =
      options.renewalDate != null && !Number.isNaN(new Date(options.renewalDate).getTime())
        ? new Date(options.renewalDate).getTime()
        : Date.now() + (options.trialDays ?? DEFAULT_PERIOD_DAYS) * DAY_MS;

    const fireMs = renewalMs - REMINDER_LEAD_DAYS * DAY_MS;
    // If the 2-day lead time has already passed, skip rather than
    // sending copy that promises "2 days" inaccurately.
    if (fireMs <= Date.now()) return { scheduled: false };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'BiteFix Subscription Reminder',
        body: 'Your BiteFix trial/subscription will renew in 2 days. You can easily manage or cancel anytime in your Apple ID settings.',
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: fireMs },
    });
    await AsyncStorage.setItem(REMINDER_ID_KEY, id);
    return { scheduled: true, fireDate: new Date(fireMs) };
  } catch {
    return { scheduled: false };
  }
}

/** Whether a renewal reminder is currently scheduled. */
export async function isRenewalReminderScheduled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REMINDER_ID_KEY)) !== null;
  } catch {
    return false;
  }
}

/** Cancels the pending renewal reminder (subscription ended, expired, or reset). */
export async function cancelRenewalReminder(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (id !== null) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(REMINDER_ID_KEY);
    }
  } catch {
    // best-effort — never surface reminder errors to the user
  }
}
