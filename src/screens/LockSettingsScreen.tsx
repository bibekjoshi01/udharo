import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppPressable } from '../components/AppPressable';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { useStrings } from '../constants/strings';
import type { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/useStore';
import { showToast } from '../utils/toast';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LockSettings'>;

export function LockSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const setUnlocked = useStore((s) => s.setUnlocked);

  const [enabled, setEnabled] = useState(!!prefs.lockEnabled);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(!!prefs.biometricEnabled);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted) setBiometricAvailable(hasHardware && enrolled);
      } catch {
        if (mounted) setBiometricAvailable(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = (value: boolean) => {
    if (!value) {
      Alert.alert(STRINGS.appLockTitle, STRINGS.lockDisableConfirm, [
        { text: STRINGS.cancel, style: 'cancel' },
        {
          text: STRINGS.disable,
          style: 'destructive',
          onPress: () => {
            setEnabled(false);
            setPrefs({ lockEnabled: false, pin: undefined, biometricEnabled: false });
            setUnlocked(true);
            showToast(STRINGS.lockDisabled);
          },
        },
      ]);
      return;
    }
    setEnabled(true);
  };

  const handleSave = () => {
    if (!enabled) return;
    if (pin.length < 4) {
      Alert.alert(STRINGS.appLockTitle, STRINGS.pinRequired);
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert(STRINGS.appLockTitle, STRINGS.pinMismatch);
      return;
    }
    setPrefs({ lockEnabled: true, pin, biometricEnabled: biometricEnabled && biometricAvailable });
    setUnlocked(true);
    setPin('');
    setConfirmPin('');
    showToast(STRINGS.lockEnabled);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.appLockTitle} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>{STRINGS.enableAppLock}</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
          />
        </View>

        {enabled ? (
          <>
            <Text style={styles.inputLabel}>{STRINGS.setPin}</Text>
            <TextInput
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))}
              style={styles.input}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>{STRINGS.confirmPin}</Text>
            <TextInput
              value={confirmPin}
              onChangeText={(v) => setConfirmPin(v.replace(/\D/g, '').slice(0, 6))}
              style={styles.input}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={COLORS.textSecondary}
            />

            <View style={styles.row}>
              <Text style={styles.label}>{STRINGS.biometricUnlock}</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={(v) => setBiometricEnabled(v)}
                disabled={!biometricAvailable}
                trackColor={{ true: COLORS.primary, false: COLORS.border }}
              />
            </View>

            <AppPressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>{STRINGS.save}</Text>
            </AppPressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  label: { fontSize: FONTS.body, color: COLORS.text },
  inputLabel: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.body,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  saveButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONTS.body,
  },
});
