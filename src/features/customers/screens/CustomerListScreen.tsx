import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import type { RootStackParamList } from '../../../navigation/types';
import { useCustomers } from '../hooks';
import { ScreenHeader } from '../components';
import { CUSTOMER_STRINGS } from '../constants';
import { formatNepaliDateTime } from '../../../utils/date';
import { AppPressable } from '../../../components/AppPressable';
import { Skeleton } from '../../../components/Skeleton';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CustomerList'>;

const ICON_SIZE = 24;

export function CustomerListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState('');
  const [sortMode, setSortMode] = React.useState<'none' | 'asc' | 'desc'>('none');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { customers, totalCount, loading, refreshing, loadingMore, refresh, loadMore, error } =
    useCustomers({ query: debouncedSearch, pageSize: 100 });

  const sortedCustomers = useMemo(() => {
    if (sortMode === 'none') return customers;
    const next = [...customers];
    next.sort((a, b) => {
      const diff = (a.balance ?? 0) - (b.balance ?? 0);
      return sortMode === 'asc' ? diff : -diff;
    });
    return next;
  }, [customers, sortMode]);

  const cycleSort = () => {
    setSortMode((prev) => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'));
  };

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{STRINGS.emptyCustomers}</Text>
        <AppPressable style={styles.emptyButton} onPress={() => navigation.navigate('AddCustomer')}>
          <Ionicons name="add-circle-outline" size={ICON_SIZE} color={COLORS.primary} />
          <Text style={styles.emptyButtonText}> {STRINGS.addCustomer}</Text>
        </AppPressable>
      </View>
    ),
    [navigation],
  );

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} />;

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const screenTitle = `${STRINGS.customerListTitle} (${totalCount})`;
  return (
    <View style={styles.container}>
      <ScreenHeader title={screenTitle} onBack={() => navigation.goBack()} />
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
              sortMode === 'asc'
                ? 'arrow-up'
                : sortMode === 'desc'
                  ? 'arrow-down'
                  : 'swap-vertical'
            }
            size={18}
            color={sortMode === 'none' ? COLORS.textSecondary : COLORS.text}
          />
        </AppPressable>
      </View>
      <FlatList
        data={sortedCustomers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          customers.length === 0
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
                  <Skeleton height={80} radius={12} style={styles.skeletonItem} />
                  <Skeleton height={80} radius={12} style={styles.skeletonItem} />
                  <Skeleton height={80} radius={12} style={styles.skeletonItem} />
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
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isDebt = item.balance > 0;
          const balanceText = item.balance.toLocaleString('en-US', { maximumFractionDigits: 0 });
          const txCount = item.transaction_count ?? 0;
          const lastActivity = item.last_transaction_date ?? item.created_at;
          return (
            <AppPressable
              style={styles.card}
              onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.cardBalance, isDebt ? styles.balanceDebt : styles.balancePaid]}
                >
                  {STRINGS.currencyPrefix}
                  {balanceText}
                </Text>
              </View>
              <View style={styles.cardMetaRow}>
                <Ionicons
                  name="call-outline"
                  size={14}
                  color={COLORS.textSecondary}
                  style={styles.metaIcon}
                />
                <Text style={styles.cardMetaText}>{item.mobile ?? '—'}</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={COLORS.textSecondary}
                  style={styles.metaIcon}
                />
                <Text style={styles.cardMetaText} numberOfLines={1}>
                  {item.address ?? '—'}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  {CUSTOMER_STRINGS.transactionsTitle}: {txCount}
                </Text>
                <Text style={styles.cardFooterText}>{formatNepaliDateTime(lastActivity)}</Text>
              </View>
            </AppPressable>
          );
        }}
        ListFooterComponent={
          loadingMore ? <Text style={styles.loadingMore}>लोड हुँदैछ...</Text> : null
        }
      />
      <AppPressable
        style={[styles.fab, { bottom: SPACING.lg + insets.bottom }]}
        onPress={() => navigation.navigate('AddCustomer')}
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
  loadingText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  skeletonList: {
    width: '100%',
  },
  skeletonItem: {
    marginBottom: SPACING.md,
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
    marginLeft: 6,
  },
  searchInput: {
    flex: 1,
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
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
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listEmpty: {
    flexGrow: 1,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardName: {
    flex: 1,
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  cardBalance: {
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  metaIcon: {
    marginRight: SPACING.xs,
  },
  cardMetaText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  cardFooterText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  balanceDebt: { color: COLORS.debt },
  balancePaid: { color: COLORS.paid },
  loadingMore: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: SPACING.sm,
  },
});
