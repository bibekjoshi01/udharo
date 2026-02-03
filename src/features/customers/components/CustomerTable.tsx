import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { CUSTOMER_STRINGS } from '../constants';
import { STRINGS } from '../../../constants/strings';
import type { CustomerWithBalance } from '../../../types';
import { AppPressable } from '../../../components/AppPressable';

const formatAmount = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

type RefreshControlElement = React.ReactElement<React.ComponentProps<typeof RefreshControl>>;

export interface CustomerTableProps {
  data: CustomerWithBalance[];
  onRowPress: (customer: CustomerWithBalance) => void;
  emptyComponent?: React.ReactElement;
  refreshControl?: RefreshControlElement;
}

export function CustomerTable({
  data,
  onRowPress,
  emptyComponent,
  refreshControl,
}: CustomerTableProps) {
  const renderRow = ({ item }: { item: CustomerWithBalance }) => {
    const isDebt = item.balance > 0;
    return (
      <AppPressable style={styles.row} onPress={() => onRowPress(item)}>
        <View style={styles.cellName}>
          <Text style={styles.cellText} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={styles.cellMobile}>
          <Text style={styles.cellTextSecondary} numberOfLines={1}>
            {item.mobile ?? '–'}
          </Text>
        </View>
        <View style={styles.cellBalance}>
          <Text
            style={[styles.cellBalanceText, isDebt ? styles.balanceDebt : styles.balancePaid]}
            numberOfLines={1}
          >
            {STRINGS.currencyPrefix}
            {formatAmount(item.balance)}
          </Text>
        </View>
        <View style={styles.cellAddress}>
          <Text style={styles.cellTextSecondary} numberOfLines={1}>
            {item.address ?? '–'}
          </Text>
        </View>
      </AppPressable>
    );
  };

  return (
    <View style={styles.tableOuter}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScrollContent}
      >
        <View style={styles.tableInner}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.cellName]}>
              {CUSTOMER_STRINGS.tableHeaderName}
            </Text>
            <Text style={[styles.headerCell, styles.cellMobile]}>
              {CUSTOMER_STRINGS.tableHeaderMobile}
            </Text>
            <Text style={[styles.headerCell, styles.cellBalance]}>
              {CUSTOMER_STRINGS.tableHeaderBalance}
            </Text>
            <Text style={[styles.headerCell, styles.cellAddress]}>
              {CUSTOMER_STRINGS.tableHeaderAddress}
            </Text>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderRow}
            contentContainerStyle={data.length === 0 ? styles.listEmpty : styles.listContent}
            ListEmptyComponent={emptyComponent}
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableOuter: {
    flex: 1,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  hScrollContent: { flexGrow: 1 },
  tableInner: { flex: 1, minWidth: 520 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cellName: { width: 160, paddingRight: SPACING.sm },
  cellMobile: { width: 130, paddingRight: SPACING.sm },
  cellBalance: { width: 110, alignItems: 'flex-end', paddingRight: SPACING.sm },
  cellAddress: { width: 220, paddingRight: SPACING.sm },
  cellText: {
    fontSize: FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
  cellTextSecondary: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  cellBalanceText: {
    fontSize: FONTS.caption,
    fontWeight: '700',
  },
  balanceDebt: { color: COLORS.debt },
  balancePaid: { color: COLORS.paid },
  listContent: { paddingBottom: 88 },
  listEmpty: { flexGrow: 1, paddingBottom: 88 },
});
