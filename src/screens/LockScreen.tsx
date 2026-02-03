import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import { AppPressable } from '../components/AppPressable';
import { useStore } from '../store/useStore';

export function LockScreen() {
  const prefs = useStore((s) => s.prefs);
  const setUnlocked = useStore((s) => s.setUnlocked);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [biometricReady, setBiometricReady] = useState(false);

  const storedPin = prefs.pin ?? '';
  const biometricEnabled = prefs.biometricEnabled ?? false;

  const canUseBiometric = useMemo(
    () => biometricReady && biometricEnabled,
    [biometricReady, biometricEnabled]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted) setBiometricReady(hasHardware && enrolled);
      } catch {
        if (mounted) setBiometricReady(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tryPinUnlock = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 6);
    setPin(next);
    if (next.length < 4) return;
    if (next === storedPin) {
      setError('');
      setPin('');
      setUnlocked(true);
      return;
    }
    setError('PIN मिलेन, पुनः प्रयास गर्नुहोस्।');
    setPin('');
  };

  const handleBiometric = async () => {
    if (!canUseBiometric) return;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: STRINGS.unlockApp,
      cancelLabel: STRINGS.cancel,
      disableDeviceFallback: false,
    });
    if (result.success) {
      setUnlocked(true);
    } else if (result.error) {
      setError('बायोमेट्रिक प्रमाणीकरण असफल भयो।');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Ionicons name="book-outline" size={28} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{STRINGS.appName}</Text>
      <Text style={styles.subtitle}>{STRINGS.enterPin}</Text>

      <TextInput
        value={pin}
        onChangeText={tryPinUnlock}
        style={styles.input}
        keyboardType="number-pad"
        secureTextEntry
        placeholder="••••"
        placeholderTextColor={COLORS.textSecondary}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {canUseBiometric ? (
        <AppPressable style={styles.biometricButton} onPress={handleBiometric}>
          <Ionicons name="finger-print" size={20} color={COLORS.white} />
          <Text style={styles.biometricText}>{STRINGS.useBiometric}</Text>
        </AppPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  input: {
    width: '60%',
    minHeight: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.text,
    letterSpacing: 6,
  },
  error: {
    marginTop: SPACING.sm,
    color: COLORS.debt,
    fontSize: FONTS.small,
  },
  biometricButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: MIN_TOUCH,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricText: {
    marginLeft: SPACING.xs,
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONTS.body,
  },
});
