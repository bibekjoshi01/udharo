import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { useStrings } from '../../../constants/strings';
import { formatNepaliDate, getNepaliRange } from '../../../utils/date';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { useTransactions } from '../hooks';
import type { RootStackParamList } from '../../../navigation/types';
import type {
  TransactionType,
  CustomerCreditWithCustomer,
  CustomerPaymentWithCustomer,
} from '../../../types';
import { AppPressable } from '../../../components/AppPressable';
import { Skeleton } from '../../../components/Skeleton';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ICON_SIZE = 24;

const formatAmount = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export interface TransactionListScreenProps {
  type: TransactionType;
  title: string;
}

export function TransactionListScreen({ type, title }: TransactionListScreenProps) {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState('');
  const [sortMode, setSortMode] = React.useState<'none' | 'asc' | 'desc'>('none');
  const todayAd = getNepaliRange('today').startAD;
  const debouncedSearch = useDebouncedValue(search, 300);
  const { transactions, totalCount, loading, refreshing, loadingMore, refresh, loadMore, error } =
    useTransactions(type, { query: debouncedSearch, pageSize: 100 });

  const sortedTransactions = useMemo(() => {
    if (sortMode === 'none') return transactions;
    const next = [...transactions];
    next.sort((a, b) => {
      const diff = a.amount - b.amount;
      return sortMode === 'asc' ? diff : -diff;
    });
    return next;
  }, [transactions, sortMode]);

  const cycleSort = () => {
    setSortMode((prev) => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'));
  };

  const emptyComponent = (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{STRINGS.noTransactions}</Text>
      <AppPressable
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddTransaction', { mode: type, lockMode: true })}
      >
        <Ionicons name="add-circle-outline" size={ICON_SIZE} color={COLORS.primary} />
        <Text style={styles.emptyButtonText}>
          {' '}
          {type === 'credit' ? STRINGS.addCreditTitle : STRINGS.addPaymentTitle}
        </Text>
      </AppPressable>
    </View>
  );

  const renderItem = ({
    item,
  }: {
    item: CustomerCreditWithCustomer | CustomerPaymentWithCustomer;
  }) => {
    return (
      <AppPressable
        style={styles.row}
        onPress={() =>
          navigation.navigate('EditTransaction', { transactionId: item.id, mode: type })
        }
      >
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>{item.customer_name}</Text>
          {type !== 'credit' && item.note ? (
            <Text style={styles.rowNote} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
          <Text style={styles.rowDate}>
            {type === 'credit' ? STRINGS.creditDate : STRINGS.paymentDate}:{' '}
            {formatNepaliDate(item.date)}
          </Text>
          {type === 'credit' && 'expected_payment_date' in item && item.expected_payment_date ? (
            <Text style={styles.rowDate}>
              {STRINGS.paymentDueDate}:{' '}
              <Text
                style={item.expected_payment_date <= todayAd ? styles.rowExpectedOverdue : undefined}
              >
                {formatNepaliDate(item.expected_payment_date)}
              </Text>
            </Text>
          ) : null}
        </View>
        <View style={styles.rowRight}>
          <Text
            style={[
              styles.rowAmount,
              type === 'credit' ? styles.amountCredit : styles.amountPayment,
            ]}
          >
            {STRINGS.currencyPrefix}
            {formatAmount(item.amount)}
          </Text>
          <View style={styles.rowActions}>
            <AppPressable
              style={styles.actionBtn}
              onPress={() =>
                navigation.navigate('TransactionAuditLogs', { mode: type, transactionId: item.id })
              }
            >
              <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
            </AppPressable>
          </View>
        </View>
      </AppPressable>
    );
  };

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} />;

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={`${title} (${totalCount})`} onBack={() => navigation.goBack()} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={STRINGS.searchPlaceholder}
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <AppPressable style={styles.sortBtn} onPress={cycleSort}>
          <Ionicons
            name={
              sortMode === 'asc' ? 'arrow-up' : sortMode === 'desc' ? 'arrow-down' : 'swap-vertical'
            }
            size={18}
            color={sortMode === 'none' ? COLORS.textSecondary : COLORS.text}
          />
        </AppPressable>
      </View>
      <FlatList
        data={sortedTransactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={
          transactions.length === 0
            ? [styles.listEmpty, { paddingBottom: SPACING.xl + insets.bottom }]
            : [styles.listContent, { paddingBottom: SPACING.xl + insets.bottom }]
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              {error ? (
                <Text style={styles.loadingText}>{error}</Text>
              ) : (
                <View style={styles.skeletonList}>
                  <Skeleton height={72} radius={10} style={styles.skeletonItem} />
                  <Skeleton height={72} radius={10} style={styles.skeletonItem} />
                  <Skeleton height={72} radius={10} style={styles.skeletonItem} />
                </View>
              )}
            </View>
          ) : (
            emptyComponent
          )
        }
        refreshControl={refreshControl}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <Text style={styles.loadingMore}>{STRINGS.loading}</Text> : null
        }
      />
      <AppPressable
        style={[styles.fab, { bottom: SPACING.lg + insets.bottom }]}
        onPress={() => navigation.navigate('AddTransaction', { mode: type, lockMode: true })}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  skeletonList: {
    width: '100%',
  },
  skeletonItem: {
    marginBottom: SPACING.sm,
  },
  loadingText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchIcon: {
    position: 'absolute',
    left: SPACING.md + 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: SPACING.lg + 16,
    paddingRight: SPACING.md,
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  sortBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  listContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  listEmpty: { flexGrow: 1, padding: SPACING.md, paddingBottom: SPACING.xl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowLeft: { flex: 1 },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 6,
  },
  rowTitle: { fontSize: FONTS.title, fontWeight: '700', color: COLORS.text },
  rowNote: { fontSize: FONTS.body, color: COLORS.textSecondary, marginTop: 2 },
  rowDate: { fontSize: FONTS.body, color: COLORS.textSecondary, marginTop: 4 },
  rowExpected: { fontSize: FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  rowExpectedOverdue: { color: COLORS.debt, fontWeight: '700' },
  rowAmount: { fontSize: FONTS.title, fontWeight: '700' },
  amountCredit: { color: COLORS.debt },
  amountPayment: { color: COLORS.paid },
  actionBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  emptyButtonText: {
    fontSize: FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingMore: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
