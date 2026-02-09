import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { useStrings } from '../constants/strings';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppPressable } from '../components/AppPressable';
import type { RootStackParamList } from '../navigation/types';
import { auth, isConfigured } from '../services/firebase';
import {
  BACKUP_LIMIT_BYTES,
  getOnlineBackupSettings,
  setOnlineBackupSettings,
  isOnline,
  getDeviceId,
  ensureUserProfile,
  fetchUserProfile,
  performOnlineBackup,
  performOnlineRestore,
  redeemActivationCode,
  updateUserPhone,
  type BackupProfile,
} from '../utils/onlineBackup';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OnlineBackup'>;

export function OnlineBackupScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const [phone, setPhone] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<BackupProfile | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    (async () => {
      const settings = await getOnlineBackupSettings();
      setAutoBackupEnabled(!!settings.autoBackupEnabled);
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    const updateNetwork = async () => {
      const ok = await isOnline();
      if (alive) setOnline(ok);
    };
    updateNetwork();
    const interval = setInterval(updateNetwork, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      const deviceId = await getDeviceId();
      await ensureUserProfile(user, deviceId);
      const next = await fetchUserProfile(user);
      setProfile(next);
    });
    return () => unsub();
  }, []);

  const handleContinue = async () => {
    if (!auth || !isConfigured) {
      Alert.alert(STRINGS.backupNotConfigured);
      return;
    }
    if (!phone.trim()) {
      Alert.alert(STRINGS.phoneRequired);
      return;
    }
    setLoading(true);
    try {
      await signInAnonymously(auth);
      await updateUserPhone(phone.trim());
    } catch (e: any) {
      Alert.alert(STRINGS.loginFailed, String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const next = await performOnlineBackup();
      setProfile(next);
      Alert.alert(STRINGS.backupSuccess);
    } catch (e: any) {
      if (String(e?.message ?? e) === 'LIMIT_EXCEEDED') {
        Alert.alert(STRINGS.backupLimitReached, STRINGS.backupLimitNote);
      } else {
        Alert.alert(STRINGS.backupFailed, String(e?.message ?? e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(STRINGS.restoreConfirmTitle, STRINGS.restoreConfirmBody, [
      { text: STRINGS.cancel, style: 'cancel' },
      {
        text: STRINGS.restoreNow,
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await performOnlineRestore();
            Alert.alert(STRINGS.restoreSuccess);
          } catch (e: any) {
            Alert.alert(STRINGS.restoreFailed, String(e?.message ?? e));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleRedeem = async () => {
    if (!activationCode.trim()) return;
    setLoading(true);
    try {
      await redeemActivationCode(activationCode);
      const user = auth?.currentUser;
      if (user) {
        const next = await fetchUserProfile(user);
        setProfile(next);
      }
      setActivationCode('');
      Alert.alert(STRINGS.redeemSuccess);
    } catch (e: any) {
      Alert.alert(STRINGS.redeemFailed, String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoBackup = async (value: boolean) => {
    setAutoBackupEnabled(value);
    await setOnlineBackupSettings({ autoBackupEnabled: value });
  };

  const storageUsedMb = profile ? (profile.storageUsedBytes / (1024 * 1024)).toFixed(1) : '0';
  const limitMb = (BACKUP_LIMIT_BYTES / (1024 * 1024)).toFixed(0);
  const isLimitReached = profile ? !profile.paid && profile.storageUsedBytes >= BACKUP_LIMIT_BYTES : false;
  const disableBackup = !online || loading || isLimitReached;

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.onlineBackupTitle} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!online ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{STRINGS.connectInternet}</Text>
          </View>
        ) : null}

        {!isConfigured ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{STRINGS.backupNotConfigured}</Text>
          </View>
        ) : null}

        {!auth?.currentUser ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{STRINGS.phoneLoginTitle}</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.phonePlaceholder}
              placeholderTextColor={COLORS.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <AppPressable style={styles.primaryBtn} onPress={handleContinue} disabled={loading}>
              <Text style={styles.primaryBtnText}>{STRINGS.backupContinue}</Text>
            </AppPressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{STRINGS.onlineBackupTitle}</Text>
              <Text style={styles.metaText}>
                {STRINGS.backupStorage}: {storageUsedMb}MB / {limitMb}MB
              </Text>
              <Text style={styles.metaText}>
                {profile?.paid ? STRINGS.backupStatusPaid : STRINGS.backupStatusFree}
              </Text>
              {profile?.lastBackupAt ? (
                <Text style={styles.metaText}>
                  {STRINGS.lastBackup}: {profile.lastBackupAt}
                </Text>
              ) : null}
              {isLimitReached ? (
                <Text style={styles.limitText}>{STRINGS.backupLimitNote}</Text>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.metaText}>{STRINGS.autoBackup}</Text>
                <Switch
                  value={autoBackupEnabled}
                  onValueChange={handleToggleAutoBackup}
                  thumbColor={autoBackupEnabled ? COLORS.primary : COLORS.border}
                />
              </View>
              <View style={styles.btnRow}>
                <AppPressable
                  style={[styles.primaryBtn, disableBackup && styles.btnDisabled]}
                  onPress={handleBackup}
                  disabled={disableBackup}
                >
                  <Text style={styles.primaryBtnText}>{STRINGS.backupNow}</Text>
                </AppPressable>
                <AppPressable
                  style={[styles.secondaryBtn, !online && styles.btnDisabled]}
                  onPress={handleRestore}
                  disabled={!online || loading}
                >
                  <Text style={styles.secondaryBtnText}>{STRINGS.restoreNow}</Text>
                </AppPressable>
              </View>
            </View>

            {!profile?.paid ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{STRINGS.upgradeTitle}</Text>
                <Text style={styles.metaText}>{STRINGS.paymentInstruction}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={STRINGS.activationCode}
                  placeholderTextColor={COLORS.textSecondary}
                  value={activationCode}
                  onChangeText={setActivationCode}
                  autoCapitalize="characters"
                />
                <AppPressable style={styles.primaryBtn} onPress={handleRedeem} disabled={loading}>
                  <Text style={styles.primaryBtnText}>{STRINGS.redeemCode}</Text>
                </AppPressable>
              </View>
            ) : null}

            <AppPressable
              style={styles.linkBtn}
              onPress={async () => {
                if (!auth) return;
                await signOut(auth);
              }}
            >
              <Text style={styles.linkText}>{STRINGS.signOut}</Text>
            </AppPressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  primaryBtn: {
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONTS.body,
  },
  secondaryBtn: {
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: FONTS.body,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  limitText: {
    color: COLORS.debt,
    fontSize: FONTS.caption,
    marginTop: SPACING.xs,
  },
  linkBtn: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: COLORS.debtLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  offlineText: {
    color: COLORS.debt,
    fontSize: FONTS.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.5 },
});
