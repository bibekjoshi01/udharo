import * as Application from 'expo-application';
import { Linking, Platform } from 'react-native';
import { compareVersions } from 'compare-versions';

type UpdateApiResponse = {
  latestVersion: string;
  minSupportedVersion: string;
  force: boolean;
  androidStoreUrl: string;
  iosStoreUrl: string;
};

type UpdateCheckResult = {
  updateAvailable: boolean;
  forceUpdate: boolean;
  storeUrl: string | null;
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

    if (!data?.latestVersion) return null;

    const installedVersion = Application.nativeApplicationVersion;

    if (!installedVersion) return null;

    const storeUrl = Platform.OS === 'android' ? data.androidStoreUrl : data.iosStoreUrl;

    const needsUpdate = compareVersions(installedVersion, data.latestVersion) < 0;

    const forceUpdate = compareVersions(installedVersion, data.minSupportedVersion) < 0;

    if (!needsUpdate) {
      return {
        updateAvailable: false,
        forceUpdate: false,
        storeUrl: null,
      };
    }

    return {
      updateAvailable: true,
      forceUpdate,
      storeUrl,
    };
  } catch {
    return null;
  }
}

export async function openStoreUrl(storeUrl: string): Promise<boolean> {
  if (!storeUrl) return false;

  try {
    const supported = await Linking.canOpenURL(storeUrl);

    if (supported) {
      await Linking.openURL(storeUrl);
      return true;
    }

    // Android Play Store fallback
    if (Platform.OS === 'android') {
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