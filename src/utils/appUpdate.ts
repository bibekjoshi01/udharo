import * as Application from 'expo-application';
import { Linking, Platform } from 'react-native';

type UpdateMode = 'flexible' | 'immediate';

type UpdatePolicy = {
  updateAvailable?: boolean;
  force?: boolean;
  mode?: UpdateMode;
  latestVersionCode?: number | null;
  minVersionCode?: number | null;
  latestVersionName?: string;
  minVersionName?: string;
  title?: string;
  message?: string;
  storeUrl?: string;
};

export type UpdateCheckResult = {
  force: boolean;
  mode: UpdateMode;
  storeUrl: string;
  title?: string;
  message?: string;
};

const appConfig = require('../../app.json');
const UPDATE_CONFIG_URL: string = appConfig?.expo?.extra?.updateConfigUrl ?? '';
const DEFAULT_PACKAGE: string = appConfig?.expo?.android?.package ?? 'com.udharo.app';
const DEFAULT_VERSION_NAME: string = appConfig?.expo?.version ?? '0.0.0';
const DEFAULT_BUILD: number = appConfig?.expo?.android?.versionCode ?? 0;

export async function checkForAppUpdate(): Promise<UpdateCheckResult | null> {
  if (!UPDATE_CONFIG_URL) return null;

  const appInfo = getCurrentAppInfo();
  const url = appendQuery(UPDATE_CONFIG_URL, {
    platform: Platform.OS,
    version: appInfo.versionName,
    build: appInfo.versionCode != null ? String(appInfo.versionCode) : '',
    appId: appInfo.applicationId ?? '',
  });

  const payload = await fetchJson(url, 6000);
  const policy = normalizePolicy(payload);
  if (!policy) return null;

  const updateAvailable =
    policy.updateAvailable ??
    (isNewer(policy.latestVersionCode, appInfo.versionCode) ||
      isRequired(policy.minVersionCode, appInfo.versionCode) ||
      isNewerVersion(policy.latestVersionName, appInfo.versionName) ||
      isRequiredVersion(policy.minVersionName, appInfo.versionName));

  if (!updateAvailable) return null;

  const forcedByPolicy = policy.force === true || policy.mode === 'immediate';
  const isForced =
    forcedByPolicy ||
    isRequired(policy.minVersionCode, appInfo.versionCode) ||
    isRequiredVersion(policy.minVersionName, appInfo.versionName);

  const mode: UpdateMode = isForced ? 'immediate' : (policy.mode ?? 'flexible');

  return {
    force: isForced,
    mode,
    storeUrl: policy.storeUrl ?? getPlayStoreUrl(appInfo.applicationId),
    title: policy.title,
    message: policy.message,
  };
}

export async function openStoreUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

function getCurrentAppInfo() {
  return {
    versionName: Application.nativeApplicationVersion ?? DEFAULT_VERSION_NAME,
    versionCode: toNumber(Application.nativeBuildVersion) ?? DEFAULT_BUILD,
    applicationId: Application.applicationId ?? DEFAULT_PACKAGE,
  };
}

function getPlayStoreUrl(applicationId?: string | null) {
  const pkg = applicationId || DEFAULT_PACKAGE;
  return `https://play.google.com/store/apps/details?id=${pkg}`;
}

function appendQuery(url: string, params: Record<string, string>) {
  const entries = Object.entries(params).filter(([, value]) => value);
  if (!entries.length) return url;
  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

async function fetchJson(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePolicy(raw: unknown): UpdatePolicy | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const android = record.android;
  const source = android && typeof android === 'object' ? { ...record, ...android } : record;

  return {
    updateAvailable: toBoolean(source.updateAvailable ?? source.update_available),
    force: toBoolean(
      source.force ??
        source.required ??
        source.mandatory ??
        source.force_update ??
        source.forceUpdate,
    ),
    mode: normalizeMode(source.mode ?? source.updateMode ?? source.update_mode),
    latestVersionCode: toNumber(
      source.latestVersionCode ??
        source.latest_version_code ??
        source.latestBuild ??
        source.latest_build,
    ),
    minVersionCode: toNumber(
      source.minVersionCode ??
        source.min_version_code ??
        source.minimumVersionCode ??
        source.minimum_version_code ??
        source.requiredVersionCode ??
        source.required_version_code,
    ),
    latestVersionName: toStringValue(
      source.latestVersionName ??
        source.latest_version_name ??
        source.latestVersion ??
        source.latest_version,
    ),
    minVersionName: toStringValue(
      source.minVersionName ?? source.min_version_name ?? source.minVersion ?? source.min_version,
    ),
    title: toStringValue(source.title ?? source.updateTitle ?? source.update_title),
    message: toStringValue(
      source.message ?? source.updateMessage ?? source.update_message ?? source.body,
    ),
    storeUrl: toStringValue(
      source.storeUrl ?? source.store_url ?? source.playStoreUrl ?? source.play_store_url,
    ),
  };
}

function normalizeMode(value: unknown): UpdateMode | undefined {
  if (typeof value !== 'string') return undefined;
  const mode = value.toLowerCase();
  if (mode === 'immediate' || mode === 'flexible') return mode;
  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return undefined;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isNewer(latest?: number | null, current?: number | null) {
  if (latest == null || current == null) return false;
  return latest > current;
}

function isRequired(min?: number | null, current?: number | null) {
  if (min == null || current == null) return false;
  return current < min;
}

function isNewerVersion(latest?: string, current?: string) {
  if (!latest || !current) return false;
  return compareVersions(current, latest) < 0;
}

function isRequiredVersion(min?: string, current?: string) {
  if (!min || !current) return false;
  return compareVersions(current, min) < 0;
}

function compareVersions(a: string, b: string) {
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const length = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < length; i += 1) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  return 0;
}

function parseVersion(value: string) {
  return value.split('.').map((part) => {
    const cleaned = part.replace(/[^0-9]/g, '');
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  });
}
