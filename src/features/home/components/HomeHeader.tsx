import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, MIN_TOUCH } from '../../../constants/theme';
import { AppPressable } from '../../../components/AppPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNepaliDateLong } from '../../../utils/date';

const ICON_SIZE = 24;

export interface HomeHeaderProps {
  onMenuPress?: () => void;
}

export function HomeHeader({ onMenuPress }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + SPACING.sm;
  const todayLabel = React.useMemo(() => formatNepaliDateLong(), []);

  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.headerLeft}>
        <View style={styles.logoWrap}>
          <Ionicons name="book-outline" size={20} color={COLORS.primary} />
        </View>
      </View>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{todayLabel}</Text>
      </View>
      <AppPressable
        style={styles.menuButton}
        onPress={onMenuPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="menu" size={ICON_SIZE} color={COLORS.text} />
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2F3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: '#F1F5F9',
  },
});
