import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { useStrings } from '../../../constants/strings';
import { Skeleton } from '../../../components/Skeleton';
import { AppPressable } from '../../../components/AppPressable';

export interface SummaryCardProps {
  total: number;
  loading?: boolean;
}

const formatAmount = (n: number) =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export function SummaryCard({ total, loading = false }: SummaryCardProps) {
  const STRINGS = useStrings();
  const directionArrow = total > 0 ? '↑' : total < 0 ? '↓' : '';
  const showInfo = () => {
    Alert.alert(STRINGS.balanceInfoTitle, STRINGS.balanceInfoBody);
  };
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryLabel}>{STRINGS.totalReceivables}</Text>
        <AppPressable style={styles.infoBtn} onPress={showInfo}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.white} />
        </AppPressable>
      </View>
      {loading ? (
        <Skeleton height={28} width="55%" radius={10} style={styles.skeletonAmount} />
      ) : (
        <View style={styles.summaryAmountRow}>
          <Text style={styles.summaryAmount}>
            {`${STRINGS.currencyPrefix}${formatAmount(total)}`}
          </Text>
          {directionArrow ? <Text style={styles.summaryArrow}>{directionArrow}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontSize: FONTS.body,
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  summaryArrow: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    opacity: 0.9,
  },
  skeletonAmount: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
