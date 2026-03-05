import * as Application from 'expo-application';
import { Linking, Platform } from 'react-native';

export type UpdateCheckResult = {
  force: boolean;
};

type UpdateApiResponse = {
  currentVersion: string;
  force: boolean;
  storeUrl: string;
};

const UPDATE_URL = 'https://udharo.cloud/update-config';
const REQUEST_TIMEOUT_MS = 5000;

export async function checkForAppUpdate(): Promise<UpdateCheckResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(UPDATE_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = (await response.json()) as UpdateApiResponse;

    if (!data?.currentVersion) return null;

    const installedVersion = Application.nativeApplicationVersion;

    if (!installedVersion) return null;

    // SIMPLE STRING CHECK
    if (installedVersion === data.currentVersion) {
      return null;
    }

    return {
      force: Boolean(data.force),
    };
  } catch {
    return null;
  }
}

export async function openStoreUrl(storeUrl: string): Promise<boolean> {
  if (!storeUrl) return false;

  try {
    // First try opening directly
    const supported = await Linking.canOpenURL(storeUrl);

    if (supported) {
      await Linking.openURL(storeUrl);
      return true;
    }

    // Fallback logic (mainly Android edge cases)
    if (Platform.OS === 'android') {
      // If you pass https Play Store URL, it always works
      if (storeUrl.startsWith('market://')) {
        const fallback = storeUrl.replace(
          'market://details?id=',
          'https://play.google.com/store/apps/details?id=',
        );
        await Linking.openURL(fallback);
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
