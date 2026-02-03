import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import type { RootStackParamList } from '../../../navigation/types';
import { getCreditLogs, getPaymentLogs } from '../../../db/database';
import { formatNepaliDateTime } from '../../../utils/date';
import type { CreditLog, PaymentLog } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TransactionAuditLogs'>;

export function TransactionAuditLogsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { mode, transactionId } = route.params as {
    mode: 'udharo' | 'payment';
    transactionId: number;
  };
  const [logs, setLogs] = React.useState<(CreditLog | PaymentLog)[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data =
        mode === 'udharo'
          ? await getCreditLogs(transactionId)
          : await getPaymentLogs(transactionId);
      if (mounted) {
        setLogs(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [mode, transactionId]);

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.auditLogsTitle} onBack={() => navigation.goBack()} />
      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={logs.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loadingText}>{STRINGS.loading}</Text>
          ) : (
            <Text style={styles.emptyText}>{STRINGS.auditLogsEmpty}</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{formatNepaliDateTime(item.changed_at)}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>{STRINGS.oldAmount}</Text>
              <Text style={styles.value}>
                {STRINGS.currencyPrefix}
                {item.old_amount ?? 0}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{STRINGS.newAmount}</Text>
              <Text style={styles.value}>
                {STRINGS.currencyPrefix}
                {item.new_amount ?? 0}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.body },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.body },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: COLORS.textSecondary, fontSize: FONTS.body },
  value: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.body },
});
