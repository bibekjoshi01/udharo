import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { AppState, Platform, StatusBar, Text, TextInput, StatusBarStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import crashlytics from '@react-native-firebase/crashlytics';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LockScreen } from './src/screens/LockScreen';

import { useStore } from './src/store/useStore';
import {
  ensureChannel,
  ensureNotificationPermission,
  initializeNotifications,
  scheduleDailyReminderAtNine,
} from './src/utils/notifications';

import { useFonts } from 'expo-font';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import { checkForAppUpdate } from './src/utils/appUpdate';
import { AppUpdatePrompt } from './src/components/UpdatePrompt';
import { COLORS } from './src/constants/theme';

export default function App() {
  useEffect(() => {
    const defaultHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      crashlytics().recordError(error);
      defaultHandler(error, isFatal);
    });
  }, []);

  // App Update
  // ------------------------------------------------------------------
  const [updateInfo, setUpdateInfo] = useState<{
    visible: boolean;
    forceUpdate: boolean;
    storeUrl: string | null;
  }>({
    visible: false,
    forceUpdate: false,
    storeUrl: null,
  });

  useEffect(() => {
    checkUpdate();
  }, []);

  async function checkUpdate() {
    // Check internet
    const network = await Network.getNetworkStateAsync();

    if (!network.isConnected) {
      return;
    }

    // Call update API
    const result = await checkForAppUpdate();

    if (!result) return;

    if (result.updateAvailable) {
      setUpdateInfo({
        visible: true,
        forceUpdate: result.forceUpdate,
        storeUrl: result.storeUrl,
      });
    }
  }

  // Store
  // ------------------------------------------------------------------
  const isDbReady = useStore((s) => s.isDbReady);
  const prefs = useStore((s) => s.prefs);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const setUnlocked = useStore((s) => s.setUnlocked);
  const lastBackgroundAt = useStore((s) => s.lastBackgroundAt);
  const setLastBackgroundAt = useStore((s) => s.setLastBackgroundAt);

  // Local State
  // ------------------------------------------------------------------
  const [boundaryKey, setBoundaryKey] = React.useState(0);

  // Fonts
  // ------------------------------------------------------------------
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });

  React.useEffect(() => {
    const TextAny = Text as unknown as { defaultProps?: { style?: any } };
    const TextInputAny = TextInput as unknown as { defaultProps?: { style?: any } };

    TextAny.defaultProps = TextAny.defaultProps || {};
    TextAny.defaultProps.style = [
      { fontFamily: 'NotoSansDevanagari_400Regular' },
      TextAny.defaultProps.style,
    ];

    TextInputAny.defaultProps = TextInputAny.defaultProps || {};
    TextInputAny.defaultProps.style = [
      { fontFamily: 'NotoSansDevanagari_400Regular' },
      TextInputAny.defaultProps.style,
    ];
  }, []);

  // App Lock Handling
  // ------------------------------------------------------------------
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!prefs.lockEnabled) return;

      if (state === 'active') {
        if (lastBackgroundAt == null) return;

        const delayMs = prefs.lockDelayMs ?? 60_000;
        if (Date.now() - lastBackgroundAt >= delayMs) {
          setUnlocked(false);
        }

        setLastBackgroundAt(null);
        return;
      }

      if (state === 'background' || state === 'inactive') {
        setLastBackgroundAt(Date.now());
      }
    });

    return () => sub.remove();
  }, [prefs.lockEnabled, prefs.lockDelayMs, lastBackgroundAt, setUnlocked, setLastBackgroundAt]);

  React.useEffect(() => {
    if (prefs.lockEnabled) {
      setUnlocked(false);
    }
  }, [prefs.lockEnabled, setUnlocked]);

  // Notifications
  // ------------------------------------------------------------------
  React.useEffect(() => {
    if (!fontsLoaded) return;

    (async () => {
      await initializeNotifications();
      if (Platform.OS === 'android') await ensureChannel();
      const allowed = await ensureNotificationPermission();
      if (!allowed) return;

      await scheduleDailyReminderAtNine();
    })();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const showLock = isDbReady && prefs.lockEnabled && !isUnlocked;

  // Main Render
  // ------------------------------------------------------------------
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary, gap: 0 }} edges={['top']}>
          <AppUpdatePrompt
            visible={updateInfo.visible}
            forceUpdate={updateInfo.forceUpdate}
            storeUrl={updateInfo.storeUrl}
            onCancel={() =>
              setUpdateInfo((prev) => ({
                ...prev,
                visible: false,
              }))
            }
          />
          {showLock ? (
            <LockScreen />
          ) : (
            <ErrorBoundary onReset={() => setBoundaryKey((k) => k + 1)}>
              <AppNavigator key={boundaryKey} />
            </ErrorBoundary>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
