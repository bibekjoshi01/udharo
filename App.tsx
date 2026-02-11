import 'react-native-gesture-handler';
import { Alert, AppState, StatusBar, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import React from 'react';
import { useStore } from './src/store/useStore';
import { LockScreen } from './src/screens/LockScreen';
import { COLORS } from './src/constants/theme';
import { useFonts } from 'expo-font';
import { initializeNotifications, scheduleDailyReminderAtNine } from './src/utils/notifications';
import { useStrings } from './src/constants/strings';
import { UpdatePrompt } from './src/components/UpdatePrompt';
import { checkForAppUpdate, openStoreUrl, type UpdateCheckResult } from './src/utils/appUpdate';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';

export default function App() {
  const isDbReady = useStore((s) => s.isDbReady);
  const prefs = useStore((s) => s.prefs);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const setUnlocked = useStore((s) => s.setUnlocked);
  const lastBackgroundAt = useStore((s) => s.lastBackgroundAt);
  const setLastBackgroundAt = useStore((s) => s.setLastBackgroundAt);
  const STRINGS = useStrings();
  const [boundaryKey, setBoundaryKey] = React.useState(0);
  const [updatePrompt, setUpdatePrompt] = React.useState<UpdateCheckResult | null>(null);
  const updateCheckRunning = React.useRef(false);
  const updateLastCheckedAt = React.useRef(0);
  const updateDismissed = React.useRef(false);
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

  React.useEffect(() => {
    (async () => {
      await initializeNotifications();
      await scheduleDailyReminderAtNine();
    })();
  }, []);

  const runUpdateCheck = React.useCallback(async () => {
    if (updateDismissed.current) return;
    if (updatePrompt?.force) return;
    if (updateCheckRunning.current) return;

    const now = Date.now();
    if (now - updateLastCheckedAt.current < 10 * 60 * 1000) return;

    updateCheckRunning.current = true;
    updateLastCheckedAt.current = now;
    try {
      const result = await checkForAppUpdate();
      if (result) setUpdatePrompt(result);
    } finally {
      updateCheckRunning.current = false;
    }
  }, [updatePrompt?.force]);

  React.useEffect(() => {
    if (!isDbReady) return;
    runUpdateCheck();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runUpdateCheck();
    });
    return () => sub.remove();
  }, [isDbReady, runUpdateCheck]);

  const showLock = isDbReady && prefs.lockEnabled && !isUnlocked;
  const showUpdatePrompt = !!updatePrompt;
  const updateTitle = updatePrompt?.title
    ? updatePrompt.title
    : updatePrompt?.force
      ? STRINGS.updateRequiredTitle
      : STRINGS.updateAvailableTitle;
  const updateMessage = updatePrompt?.message
    ? updatePrompt.message
    : updatePrompt?.force
      ? STRINGS.updateRequiredMessage
      : STRINGS.updateAvailableMessage;

  if (!fontsLoaded) {
    return null;
  }

  const handleUpdate = async () => {
    if (!updatePrompt) return;
    const opened = await openStoreUrl(updatePrompt.storeUrl);
    if (!opened) {
      Alert.alert(STRINGS.updateOpenStoreFailed, updatePrompt.storeUrl);
      return;
    }
    if (!updatePrompt.force) {
      updateDismissed.current = true;
      setUpdatePrompt(null);
    }
  };

  const handleUpdateLater = () => {
    updateDismissed.current = true;
    setUpdatePrompt(null);
  };

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
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
          translucent={false}
        />
        <UpdatePrompt
          visible={showUpdatePrompt}
          title={updateTitle}
          message={updateMessage}
          confirmLabel={STRINGS.updateNow}
          cancelLabel={updatePrompt?.force ? undefined : STRINGS.updateLater}
          onConfirm={handleUpdate}
          onCancel={updatePrompt?.force ? undefined : handleUpdateLater}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
