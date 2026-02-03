import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import type { RootStackParamList } from '../navigation/types';
import { AppPressable } from '../components/AppPressable';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

const appConfig = require('../../app.json');
const appVersion = appConfig?.expo?.version ?? '1.0.0';
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

  const handleComingSoon = () => {
    Alert.alert(STRINGS.menuTitle, STRINGS.comingSoon);
  };

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
      label: STRINGS.privacyPolicy,
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      label: STRINGS.termsOfUse,
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('Terms'),
    },
    {
      label: STRINGS.dataBackup,
      icon: 'cloud-upload-outline',
      onPress: handleComingSoon,
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
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.logo}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.appName}>{STRINGS.appName}</Text>
              <Text style={styles.tagline}>{STRINGS.tagline}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{STRINGS.appVersion}</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{STRINGS.appInfo}</Text>
        <View style={styles.menuCard}>{mainItems.map(renderItem)}</View>

        <Text style={styles.sectionTitle}>{STRINGS.support}</Text>
        <View style={styles.menuCard}>{supportItems.map(renderItem)}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoLabel: { fontSize: FONTS.small, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.small, color: COLORS.text, fontWeight: '600' },
  sectionTitle: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
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
