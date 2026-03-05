import 'react-native-gesture-handler';
import React from 'react';
import { AppState, Platform, StatusBar, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LockScreen } from './src/screens/LockScreen';

import { useStore } from './src/store/useStore';
import { COLORS } from './src/constants/theme';
import { useStrings } from './src/constants/strings';
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

export default function App() {
  // Store
  // ------------------------------------------------------------------
  const isDbReady = useStore((s) => s.isDbReady);
  const prefs = useStore((s) => s.prefs);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const setUnlocked = useStore((s) => s.setUnlocked);
  const lastBackgroundAt = useStore((s) => s.lastBackgroundAt);
  const setLastBackgroundAt = useStore((s) => s.setLastBackgroundAt);

  const STRINGS = useStrings();

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
        {showLock ? (
          <LockScreen />
        ) : (
          <ErrorBoundary onReset={() => setBoundaryKey((k) => k + 1)}>
            <AppNavigator key={boundaryKey} />
          </ErrorBoundary>
        )}
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
