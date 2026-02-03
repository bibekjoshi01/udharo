import React from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import { formatNepaliDate } from '../../../utils/date';
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
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { transactions, totalCount, loading, refreshing, loadingMore, refresh, loadMore, error } =
    useTransactions(type, { query: debouncedSearch, pageSize: 100 });

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
          {type === 'udharo' ? STRINGS.addCreditTitle : STRINGS.paymentTitle}
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
          {item.note ? (
            <Text style={styles.rowNote} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
          <Text style={styles.rowDate}>{formatNepaliDate(item.date)}</Text>
        </View>
        <Text
          style={[styles.rowAmount, type === 'udharo' ? styles.amountCredit : styles.amountPayment]}
        >
          {STRINGS.currencyPrefix}
          {formatAmount(item.amount)}
        </Text>
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
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={transactions.length === 0 ? styles.listEmpty : styles.listContent}
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
          loadingMore ? <Text style={styles.loadingMore}>लोड हुँदैछ...</Text> : null
        }
      />
      <AppPressable
        style={styles.fab}
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
    paddingHorizontal: SPACING.md + 20,
    fontSize: FONTS.body,
    color: COLORS.text,
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
  rowTitle: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.text },
  rowNote: { fontSize: FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  rowDate: { fontSize: FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  rowAmount: { fontSize: FONTS.amount, fontWeight: '700' },
  amountCredit: { color: COLORS.debt },
  amountPayment: { color: COLORS.paid },
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
