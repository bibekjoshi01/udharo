import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import { CUSTOMER_STRINGS } from '../constants';
import type { RootStackParamList } from '../../../navigation/types';
import { useCustomer } from '../hooks';
import { ScreenHeader } from '../components';
import { deleteCustomer } from '../../../db/database';
import { AppPressable } from '../../../components/AppPressable';
import { Skeleton } from '../../../components/Skeleton';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CustomerDetail'>;

const ICON_SIZE = 24;

const formatAmount = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function CustomerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const customerId = (route.params as { customerId: number }).customerId;
  const { customer, balance, totalCredits, totalPayments, loading, refresh, error } = useCustomer(customerId);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (loading || !customer) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          {error ? (
            <Text style={styles.loadingText}>{error}</Text>
          ) : (
            <View style={styles.skeletonStack}>
              <Skeleton height={22} width="45%" radius={8} style={styles.skeletonTitle} />
              <Skeleton height={110} radius={16} style={styles.skeletonCard} />
              <Skeleton height={180} radius={16} style={styles.skeletonCard} />
            </View>
          )}
        </View>
      </View>
    );
  }

  const isDebt = balance > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={customer.name}
        onBack={() => navigation.goBack()}
        rightElement={
          <View style={styles.headerActions}>
            <AppPressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate('EditCustomer', { customerId })}
            >
              <Ionicons name="pencil" size={ICON_SIZE} color={COLORS.primary} />
            </AppPressable>
            <AppPressable
              style={[styles.iconBtn, styles.iconBtnSpacing]}
              onPress={() => {
                Alert.alert(
                  STRINGS.deleteCustomer,
                  STRINGS.confirmDeleteCustomer,
                  [
                    { text: STRINGS.cancel, style: 'cancel' },
                    {
                      text: STRINGS.delete,
                      style: 'destructive',
                      onPress: async () => {
                        await deleteCustomer(customerId);
                        navigation.goBack();
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={ICON_SIZE} color={COLORS.debt} />
            </AppPressable>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>{STRINGS.outstandingBalance}</Text>
        <Text
          style={[
            styles.balanceValue,
            isDebt ? styles.balanceDebt : styles.balancePaid,
          ]}
        >
          {STRINGS.currencyPrefix}{formatAmount(balance)}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{STRINGS.totalCredits}</Text>
            <Text style={styles.summaryValue}>
              {STRINGS.currencyPrefix}{formatAmount(totalCredits)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{STRINGS.totalPayments}</Text>
            <Text style={styles.summaryValue}>
              {STRINGS.currencyPrefix}{formatAmount(totalPayments)}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{STRINGS.mobileNumber}</Text>
          <Text style={styles.infoValue}>{customer.mobile ?? '–'}</Text>
        </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{STRINGS.address}</Text>
            <Text style={styles.infoValue}>{customer.address ?? '–'}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>{STRINGS.note}</Text>
            <Text style={styles.infoValue}>{customer.note ?? '–'}</Text>
          </View>
        </View>
      </ScrollView>
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
  skeletonStack: {
    width: '100%',
  },
  skeletonTitle: {
    marginBottom: SPACING.lg,
  },
  skeletonCard: {
    marginBottom: SPACING.md,
  },
  iconBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtnSpacing: { marginLeft: 4 },
  balanceSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceLabel: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  balanceDebt: { color: COLORS.debt },
  balancePaid: { color: COLORS.paid },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: FONTS.body,
    color: COLORS.text,
    fontWeight: '700',
  },
  infoRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONTS.body,
    color: COLORS.text,
  },
});
