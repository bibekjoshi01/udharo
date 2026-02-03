import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import React from 'react';
import { AppState } from 'react-native';
import { useStore } from './src/store/useStore';
import { LockScreen } from './src/screens/LockScreen';

export default function App() {
  const isDbReady = useStore((s) => s.isDbReady);
  const prefs = useStore((s) => s.prefs);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const setUnlocked = useStore((s) => s.setUnlocked);
  const [boundaryKey, setBoundaryKey] = React.useState(0);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && prefs.lockEnabled) {
        setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [prefs.lockEnabled, setUnlocked]);

  React.useEffect(() => {
    if (prefs.lockEnabled) {
      setUnlocked(false);
    }
  }, [prefs.lockEnabled, setUnlocked]);

  const showLock = isDbReady && prefs.lockEnabled && !isUnlocked;

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
        <StatusBar style="dark" backgroundColor="#fff" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
