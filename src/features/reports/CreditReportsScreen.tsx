import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';
import { getReportTotals, getCreditsByDateRange, getPaymentsByDateRange } from '../../db/database';
import type { RootStackParamList } from '../../navigation/types';
import { AppPressable } from '../../components/AppPressable';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { formatNepaliDate, getNepaliRange } from '../../utils/date';
import { exportReportPdf } from '../../utils/pdf';
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

  const load = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }
      try {
        const { startAD, endAD } = getNepaliRange(range);
        const t = await getReportTotals(startAD, endAD);
        setTotals(t);
      } catch {
        setTotals({ totalCredits: 0, totalPayments: 0, netBalance: 0 });
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [range],
  );

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

  const maxBar = Math.max(
    Math.abs(totals.totalCredits),
    Math.abs(totals.totalPayments),
    Math.abs(totals.netBalance),
    1,
  );
  const barHeight = (value: number) => Math.max(8, Math.round((Math.abs(value) / maxBar) * 120));

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={STRINGS.creditReportTitle}
        onBack={() => navigation.goBack()}
        rightElement={
          <AppPressable
            style={styles.downloadBtn}
            onPress={() => {
              Alert.alert('PDF डाउनलोड', 'PDF डाउनलोड गर्न चाहनुहुन्छ?', [
                { text: STRINGS.cancel, style: 'cancel' },
                {
                  text: 'डाउनलोड',
                  onPress: async () => {
                    try {
                      const { startAD, endAD } = getNepaliRange(range);
                      const credits = await getCreditsByDateRange(startAD, endAD);
                      const payments = await getPaymentsByDateRange(startAD, endAD);
                      const startNep = formatNepaliDate(startAD);
                      const endNep = formatNepaliDate(endAD);
                      const rangeLabel = `from-${startNep}-to-${endNep}`;
                      await exportReportPdf({
                        title: STRINGS.creditReportTitle,
                        totalCredits: totals.totalCredits,
                        totalPayments: totals.totalPayments,
                        netBalance: totals.netBalance,
                        credits,
                        payments,
                        rangeLabel,
                      });
                    } catch (e: any) {
                      Alert.alert('PDF असफल', String(e?.message ?? e));
                    }
                  },
                },
              ]);
            }}
          >
            <Ionicons name="download-outline" size={20} color={COLORS.text} />
          </AppPressable>
        }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                {STRINGS.currencyPrefix}
                {formatAmount(totals.totalCredits)}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>{STRINGS.totalPayments}</Text>
              <Text style={[styles.cardAmount, styles.cardAmountGreen]}>
                {STRINGS.currencyPrefix}
                {formatAmount(totals.totalPayments)}
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
                {STRINGS.currencyPrefix}
                {formatAmount(totals.netBalance)}
              </Text>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>समग्र तुलना</Text>
              <View style={styles.chartRow}>
                <View style={styles.chartBarWrap}>
                  <View style={[styles.chartBar, { height: barHeight(totals.totalCredits) }]} />
                  <Text style={styles.chartLabel}>{STRINGS.totalCredits}</Text>
                </View>
                <View style={styles.chartBarWrap}>
                  <View
                    style={[
                      styles.chartBar,
                      styles.chartBarPaid,
                      { height: barHeight(totals.totalPayments) },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{STRINGS.totalPayments}</Text>
                </View>
                <View style={styles.chartBarWrap}>
                  <View
                    style={[
                      styles.chartBar,
                      totals.netBalance >= 0 ? styles.chartBarDebt : styles.chartBarPaid,
                      { height: barHeight(totals.netBalance) },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{STRINGS.netBalance}</Text>
                </View>
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.chartBarDebt]} />
                  <Text style={styles.legendText}>{STRINGS.totalCredits}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.chartBarPaid]} />
                  <Text style={styles.legendText}>{STRINGS.totalPayments}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      totals.netBalance >= 0 ? styles.chartBarDebt : styles.chartBarPaid,
                    ]}
                  />
                  <Text style={styles.legendText}>{STRINGS.netBalance}</Text>
                </View>
              </View>
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
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardNet: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardLabel: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardAmountGreen: { color: COLORS.paid },
  cardAmountDebt: { color: COLORS.debt },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingHorizontal: SPACING.sm,
  },
  chartBarWrap: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 28,
    borderRadius: 10,
    backgroundColor: COLORS.debtLight,
  },
  chartBarDebt: {
    backgroundColor: COLORS.debt,
  },
  chartBarPaid: {
    backgroundColor: COLORS.paid,
  },
  chartLabel: {
    marginTop: SPACING.xs,
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  chartLegend: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  downloadBtn: {
    minHeight: 36,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadText: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
});
