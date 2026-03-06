import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getStrings } from '../constants/strings';
import { logError } from './crashlytics';

const CHANNEL_ID = 'daily-reminder';
let handlerInitialized = false;

/**
 * Initialize notification handler (required for Expo to show alerts in foreground)
 */
export async function initializeNotifications(): Promise<void> {
  if (handlerInitialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  handlerInitialized = true;
}

/**
 * Check or request notification permissions
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
    ) {
      return true;
    }

    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

/**
 * Android notification channel
 */
export async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Schedule daily notification at 9 AM
 */
export async function scheduleDailyReminderAtNine() {
  try {
    const STRINGS = getStrings();

    // Cancel existing daily reminder notifications
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of existing) {
      if (n.content?.data?.type === 'daily-reminder') {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    // Daily trigger fires when the hour/minute match (will pick the next occurrence automatically).
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    };

    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: STRINGS.dailyReminderTitle,
        body: STRINGS.dailyReminderBody,
        data: { type: 'daily-reminder' },
        sound: 'default',
      },
      trigger,
    });

  } catch (err) {
    logError(err);
  }
}
