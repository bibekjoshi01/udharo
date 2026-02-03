import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import { AppPressable } from '../../../components/AppPressable';

const ICON_SIZE_LG = 28;

export interface ActionGridProps {
  onCustomers: () => void;
  onUdharo: () => void;
  onBhuktani: () => void;
  onReports: () => void;
}

export function ActionGrid({ onCustomers, onUdharo, onBhuktani, onReports }: ActionGridProps) {
  return (
    <View style={styles.actionGrid}>
      <AppPressable style={styles.actionCard} onPress={onCustomers}>
        <Ionicons
          name="people-outline"
          size={ICON_SIZE_LG}
          color={COLORS.primary}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>{STRINGS.customers}</Text>
      </AppPressable>

      <AppPressable style={styles.actionCard} onPress={onUdharo}>
        <Ionicons
          name="document-text-outline"
          size={ICON_SIZE_LG}
          color={COLORS.primary}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>{STRINGS.udharoharu}</Text>
      </AppPressable>

      <AppPressable style={styles.actionCard} onPress={onBhuktani}>
        <Ionicons
          name="wallet-outline"
          size={ICON_SIZE_LG}
          color={COLORS.primary}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>{STRINGS.bhuktaniharu}</Text>
      </AppPressable>

      <AppPressable style={styles.actionCard} onPress={onReports}>
        <Ionicons
          name="bar-chart-outline"
          size={ICON_SIZE_LG}
          color={COLORS.primary}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>{STRINGS.creditReports}</Text>
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    minHeight: MIN_TOUCH * 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: { marginBottom: SPACING.sm },
  actionLabel: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
