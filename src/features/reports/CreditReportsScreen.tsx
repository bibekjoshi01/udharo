import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';
import { getReportTotals } from '../../db/database';
import type { RootStackParamList } from '../../navigation/types';
import { AppPressable } from '../../components/AppPressable';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getNepaliRange } from '../../utils/date';
import { Skeleton } from '../../components/Skeleton';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreditReports'>;

type Range = 'today' | 'week' | 'month' | 'year';

export function CreditReportsScreen() {
  const navigation = useNavigation<Nav>();
  const [range, setRange] = useState<Range>('month');
  const [totals, setTotals] = useState({
    totalCredits: 0,
    totalPayments: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    const { startAD, endAD } = getNepaliRange(range);
    try {
      const t = await getReportTotals(startAD, endAD);
      setTotals(t);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [range]);

  React.useEffect(() => {
    load(true);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  }, [load]);

  const formatAmount = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={STRINGS.creditReportTitle}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.rangeToggle}>
        <AppPressable
          style={[styles.rangeBtn, range === 'today' && styles.rangeBtnActive]}
          onPress={() => setRange('today')}
        >
          <Text style={[styles.rangeBtnText, range === 'today' && styles.rangeBtnTextActive]}>
            {STRINGS.today}
          </Text>
        </AppPressable>
        <AppPressable
          style={[styles.rangeBtn, range === 'week' && styles.rangeBtnActive]}
          onPress={() => setRange('week')}
        >
          <Text style={[styles.rangeBtnText, range === 'week' && styles.rangeBtnTextActive]}>
            {STRINGS.thisWeek}
          </Text>
        </AppPressable>
        <AppPressable
          style={[styles.rangeBtn, range === 'month' && styles.rangeBtnActive]}
          onPress={() => setRange('month')}
        >
          <Text style={[styles.rangeBtnText, range === 'month' && styles.rangeBtnTextActive]}>
            {STRINGS.thisMonth}
          </Text>
        </AppPressable>
        <AppPressable
          style={[styles.rangeBtn, range === 'year' && styles.rangeBtnActive]}
          onPress={() => setRange('year')}
        >
          <Text style={[styles.rangeBtnText, range === 'year' && styles.rangeBtnTextActive]}>
            {STRINGS.thisYear}
          </Text>
        </AppPressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.skeletonStack}>
            <Skeleton height={92} radius={16} style={styles.skeletonCard} />
            <Skeleton height={92} radius={16} style={styles.skeletonCard} />
            <Skeleton height={102} radius={16} style={styles.skeletonCard} />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{STRINGS.totalCredits}</Text>
              <Text style={styles.cardAmount}>
                {STRINGS.currencyPrefix}{formatAmount(totals.totalCredits)}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>{STRINGS.totalPayments}</Text>
              <Text style={[styles.cardAmount, styles.cardAmountGreen]}>
                {STRINGS.currencyPrefix}{formatAmount(totals.totalPayments)}
              </Text>
            </View>

            <View style={[styles.card, styles.cardNet]}>
              <Text style={styles.cardLabel}>{STRINGS.netBalance}</Text>
              <Text
                style={[
                  styles.cardAmount,
                  totals.netBalance >= 0 ? styles.cardAmountDebt : styles.cardAmountGreen,
                ]}
              >
                {STRINGS.currencyPrefix}{formatAmount(totals.netBalance)}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { fontSize: 24, color: COLORS.primary },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.title,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerRight: { width: 44, height: 44 },
  rangeToggle: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  rangeBtn: {
    flex: 1,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  rangeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  rangeBtnText: { fontSize: FONTS.body, color: COLORS.textSecondary },
  rangeBtnTextActive: { color: COLORS.white, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  skeletonStack: { width: '100%' },
  skeletonCard: { marginBottom: SPACING.md },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardNet: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardLabel: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardAmountGreen: { color: COLORS.paid },
  cardAmountDebt: { color: COLORS.debt },
});
