import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getStrings } from '../constants/strings';

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
async function ensureChannel() {
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

    // Calculate next 9 AM
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    if (now >= next9AM) next9AM.setDate(next9AM.getDate() + 1);

    // Calendar trigger
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: next9AM.getHours(),
      minute: next9AM.getMinutes(),
      repeats: true,
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

    console.log('Daily reminder scheduled at 9 AM');
  } catch (err) {
    console.log('Failed to schedule daily reminder', err);
  }
}
