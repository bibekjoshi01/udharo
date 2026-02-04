import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { useStrings } from '../constants/strings';
import type { RootStackParamList } from '../navigation/types';
import { AppPressable } from '../components/AppPressable';
import { exportDatabaseToSql, importDatabaseFromSql } from '../db/backup';
import { showToast } from '../utils/toast';
import { useStore } from '../store/useStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

const appConfig = require('../../app.json');
const packageName = appConfig?.expo?.android?.package ?? 'com.udharo.app';
const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
const shareUrl = playStoreUrl;

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function MenuScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const language = prefs.language === 'en' ? 'en' : 'ne';

  const handleRate = async () => {
    const url = playStoreUrl;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(STRINGS.rateApp, url);
      return;
    }
    await Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${STRINGS.shareMessage}${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      Alert.alert(STRINGS.shareApp, shareUrl);
    }
  };

  const mainItems: MenuItem[] = [
    {
      label: STRINGS.aboutApp,
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('AboutApp'),
    },
    {
      label: STRINGS.appLockTitle,
      icon: 'lock-closed-outline',
      onPress: () => navigation.navigate('LockSettings'),
    },
    {
      label: STRINGS.termsOfUse,
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('Terms'),
    },
  ];

  const supportItems: MenuItem[] = [
    {
      label: STRINGS.support,
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('Support'),
    },
    { label: STRINGS.rateApp, icon: 'star-outline', onPress: handleRate },
    {
      label: STRINGS.shareApp,
      icon: 'share-social-outline',
      onPress: handleShare,
    },
  ];

  const renderItem = (item: MenuItem) => (
    <AppPressable key={item.label} style={styles.menuRow} onPress={item.onPress}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={item.icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </AppPressable>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.menuTitle} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.languageRow}>
          <Text style={styles.languageLabel}>{STRINGS.languageTitle}</Text>
          <View style={styles.languageToggleInline}>
            <AppPressable
              style={[
                styles.languageOption,
                language === 'en' ? styles.languageOptionActive : styles.languageOptionInactive,
              ]}
              onPress={() => setPrefs({ language: 'en' })}
            >
              <Text
                style={[
                  styles.languageText,
                  language === 'en' && styles.languageTextActive,
                ]}
              >
                EN
              </Text>
            </AppPressable>
            <AppPressable
              style={[
                styles.languageOption,
                language === 'ne' ? styles.languageOptionActive : styles.languageOptionInactive,
              ]}
              onPress={() => setPrefs({ language: 'ne' })}
            >
              <Text
                style={[
                  styles.languageText,
                  language === 'ne' && styles.languageTextActive,
                ]}
              >
                NP
              </Text>
            </AppPressable>
          </View>
        </View>
        <View style={styles.backupCard}>
          <Text style={styles.sectionTitle}>{STRINGS.dataBackup}</Text>
          <View style={styles.backupRow}>
            <AppPressable
              style={styles.backupBtn}
              onPress={() => {
                Alert.alert(STRINGS.dataBackup, STRINGS.backupExportConfirm, [
                  { text: STRINGS.cancel, style: 'cancel' },
                  {
                    text: STRINGS.exportLabel,
                    onPress: async () => {
                      try {
                        await exportDatabaseToSql();
                        showToast(STRINGS.backupReady);
                      } catch (e: any) {
                        Alert.alert(STRINGS.backupFailed, String(e?.message ?? e));
                      }
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.backupBtnText}>{STRINGS.exportLabel}</Text>
            </AppPressable>
            <AppPressable
              style={[styles.backupBtn, styles.backupBtnSecondary]}
              onPress={() => {
                Alert.alert(
                  STRINGS.dataBackup,
                  STRINGS.backupImportConfirm,
                  [
                    { text: STRINGS.cancel, style: 'cancel' },
                    {
                      text: STRINGS.importLabel,
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const ok = await importDatabaseFromSql();
                          if (ok) showToast(STRINGS.importSuccess);
                        } catch (e: any) {
                          Alert.alert(STRINGS.importFailed, String(e?.message ?? e));
                        }
                      },
                    },
                  ],
                );
              }}
            >
              <Text style={[styles.backupBtnText, styles.backupBtnTextSecondary]}>
                {STRINGS.importLabel}
              </Text>
            </AppPressable>
          </View>
        </View>
        <View style={styles.menuCard}>{mainItems.map(renderItem)}</View>
        <View style={styles.menuCard}>{supportItems.map(renderItem)}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  languageLabel: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  languageToggleInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
    gap: 2,
  },
  languageOption: {
    minWidth: 38,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageOptionInactive: {
    backgroundColor: COLORS.surface,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  languageTextActive: {
    color: COLORS.white,
  },
  backupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  backupRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  backupBtn: {
    flex: 1,
    minHeight: MIN_TOUCH,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupBtnSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backupBtnText: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.white,
  },
  backupBtnTextSecondary: {
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2F3F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  infoText: { flex: 1 },
  appName: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  tagline: { fontSize: FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0,
    borderBottomColor: COLORS.border,
    minHeight: MIN_TOUCH,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuLabel: { flex: 1, fontSize: FONTS.body, color: COLORS.text },
});
