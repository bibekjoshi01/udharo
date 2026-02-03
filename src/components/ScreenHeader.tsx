import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, MIN_TOUCH } from '../constants/theme';
import { AppPressable } from './AppPressable';

const ICON_SIZE = 24;

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  showBackIcon?: boolean;
}

export function ScreenHeader({
  title,
  onBack,
  rightElement,
  leftElement,
  showBackIcon = true,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + SPACING.xs;

  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.side}>
        {leftElement ??
          (showBackIcon && onBack ? (
            <AppPressable
              style={styles.iconBtn}
              onPress={onBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={ICON_SIZE} color={COLORS.primary} />
            </AppPressable>
          ) : null)}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {rightElement ?? <View style={styles.iconBtn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  side: {
    minWidth: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  iconBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: FONTS.title,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
});
