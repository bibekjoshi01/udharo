import 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import React from 'react';
import { AppState, Text, TextInput } from 'react-native';
import { useStore } from './src/store/useStore';
import { LockScreen } from './src/screens/LockScreen';
import { COLORS } from './src/constants/theme';
import { useFonts } from 'expo-font';
import { initializeNotifications, scheduleDailyReminderAtNine } from './src/utils/notifications';
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
  const [boundaryKey, setBoundaryKey] = React.useState(0);
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

  const showLock = isDbReady && prefs.lockEnabled && !isUnlocked;

  if (!fontsLoaded) {
    return null;
  }

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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
