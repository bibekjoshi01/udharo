import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useStrings } from '../../constants/strings';
import { getCollectionPriorityCustomers, getTotalReceivables } from '../../db/database';
import type { RootStackParamList } from '../../navigation/types';
import type { CollectionPriorityCustomer } from '../../types';
import { formatNepaliDate } from '../../utils/date';
import { AppPressable } from '../../components/AppPressable';
import { HomeHeader, SummaryCard, ActionGrid } from './components';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const formatAmount = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const [totalReceivables, setTotalReceivables] = useState<number>(0);
  const [priorityCustomers, setPriorityCustomers] = useState<CollectionPriorityCustomer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);

  const loadHomeData = useCallback(async () => {
    setLoadingTotal(true);
    setLoadingPriority(true);
    try {
      const [total, priority] = await Promise.all([
        getTotalReceivables(),
        getCollectionPriorityCustomers(5),
      ]);
      setTotalReceivables(total);
      setPriorityCustomers(priority);
    } catch {
      setTotalReceivables(0);
      setPriorityCustomers([]);
    } finally {
      setLoadingTotal(false);
      setLoadingPriority(false);
    }
  }, []);

  React.useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useFocusEffect(
    React.useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHomeData();
    } finally {
      setRefreshing(false);
    }
  }, [loadHomeData]);

  return (
    <View style={styles.container}>
      <HomeHeader onMenuPress={() => navigation.navigate('Menu')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <SummaryCard total={totalReceivables} loading={loadingTotal} />
        <ActionGrid
          onCustomers={() => navigation.navigate('CustomerList')}
          onUdharo={() => navigation.navigate('CreditList')}
          onBhuktani={() => navigation.navigate('PaymentList')}
          onReports={() => navigation.navigate('CreditReports')}
        />
        <View style={styles.priorityCard}>
          <Text style={styles.priorityTitle}>{STRINGS.collectionPriorityTitle}</Text>
          {loadingPriority ? (
            <Text style={styles.priorityEmpty}>{STRINGS.loading}</Text>
          ) : priorityCustomers.length === 0 ? (
            <Text style={styles.priorityEmpty}>{STRINGS.collectionPriorityEmpty}</Text>
          ) : (
            priorityCustomers.map((item, index) => (
              <AppPressable
                key={item.id}
                style={[styles.priorityRow, index > 0 && styles.priorityRowDivider]}
                onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
              >
                <View style={styles.priorityLeft}>
                  <Text style={styles.priorityName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.priorityMeta}>
                    {STRINGS.expectedPaymentDate}:{' '}
                    {item.oldest_due_date ? formatNepaliDate(item.oldest_due_date) : '—'}
                  </Text>
                </View>
                <Text style={styles.priorityAmount}>
                  {STRINGS.currencyPrefix}
                  {formatAmount(item.balance)}
                </Text>
              </AppPressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  priorityCard: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  priorityTitle: {
    fontSize: FONTS.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  priorityEmpty: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  priorityRowDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priorityLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  priorityName: {
    fontSize: FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  priorityMeta: {
    marginTop: 2,
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
  },
  priorityAmount: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.debt,
  },
});
