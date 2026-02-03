import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AboutApp'>;

const appConfig = require('../../app.json');
const appVersion = appConfig?.expo?.version ?? '1.0.0';

export function AboutAppScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.aboutApp} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{STRINGS.appName}</Text>
          <Text style={styles.tagline}>{STRINGS.tagline}</Text>
          <Text style={styles.body}>{STRINGS.aboutBody}</Text>
          <Text style={styles.note}>{STRINGS.aboutNote}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {STRINGS.appVersion}: {appVersion}
            </Text>
            <Text style={styles.developer}>Developer: Bibek Joshi</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  tagline: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  body: {
    fontSize: FONTS.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  note: {
    marginTop: SPACING.sm,
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  developer: {
    marginTop: SPACING.md,
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    marginTop: SPACING.sm,
    borderTopColor: COLORS.border,
  },
  infoLabel: { fontSize: FONTS.small, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.small, color: COLORS.text, fontWeight: '600' },
});
