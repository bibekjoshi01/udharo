import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getStrings } from '../constants/strings';

const CHANNEL_ID = 'daily-reminder';
let handlerInitialized = false;

export async function initializeNotifications(): Promise<void> {
  if (handlerInitialized) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerInitialized = true;
  } catch {
    // ignore
  }
}

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

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function scheduleDailyReminderAtNine() {
  try {
    await initializeNotifications();
    await ensureChannel();
    const allowed = await ensureNotificationPermission();
    if (!allowed) return;

    const STRINGS = getStrings();
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = existing.some(
      (n) => n.content?.data?.type === 'daily-reminder',
    );
    if (alreadyScheduled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: STRINGS.dailyReminderTitle,
        body: STRINGS.dailyReminderBody,
        data: { type: 'daily-reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  } catch {
    // Ignore notification failures in production builds.
  }
}
