import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, MIN_TOUCH } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { TransactionForm } from '../components';
import type { RootStackParamList } from '../../../navigation/types';
import { deleteCredit, deletePayment, updateCredit, updatePayment } from '../../../db/database';
import { useTransaction } from '../hooks';
import { AppPressable } from '../../../components/AppPressable';
import { Skeleton } from '../../../components/Skeleton';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditTransaction'>;
type Route = RouteProp<RootStackParamList, 'EditTransaction'>;

export function EditTransactionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { transactionId, mode } = route.params;
  const { transaction, customer, loading } = useTransaction(mode, transactionId);

  const [currentMode, setCurrentMode] = useState<'udharo' | 'payment'>(mode);
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setCurrentMode(mode);
      setAmountStr(String(transaction.amount));
      setNote(transaction.note ?? '');
    }
  }, [mode, transaction]);

  const amount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  const isValid = amount > 0;

  const onSave = async () => {
    if (!transaction || !isValid || saving) return;
    setSaving(true);
    try {
      if (currentMode === 'udharo') {
        await updateCredit(transaction.id, {
          amount,
          note: note.trim() || undefined,
        });
      } else {
        await updatePayment(transaction.id, {
          amount,
          note: note.trim() || undefined,
        });
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!transaction) return;
    setShowDelete(true);
  };

  if (loading || !transaction) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <View style={styles.skeletonStack}>
            <Skeleton height={20} width="50%" radius={8} style={styles.skeletonLine} />
            <Skeleton height={48} radius={10} style={styles.skeletonField} />
            <Skeleton height={120} radius={12} style={styles.skeletonField} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScreenHeader
        title={STRINGS.editTransactionTitle}
        onBack={() => navigation.goBack()}
        rightElement={
          <AppPressable style={styles.iconBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={24} color={COLORS.debt} />
          </AppPressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {customer ? <Text style={styles.customerName}>{customer.name}</Text> : null}
        <TransactionForm
          mode={currentMode}
          onModeChange={undefined}
          amountStr={amountStr}
          onAmountChange={setAmountStr}
          note={note}
          onNoteChange={setNote}
          onSubmit={onSave}
          saving={saving}
          disabled={!isValid}
          allowModeToggle={false}
        />
      </ScrollView>
      <ConfirmDialog
        visible={showDelete}
        title={STRINGS.deleteTransaction}
        message={STRINGS.confirmDeleteTransaction}
        confirmLabel={STRINGS.delete}
        cancelLabel={STRINGS.cancel}
        destructive
        onCancel={() => setShowDelete(false)}
        onConfirm={async () => {
          if (!transaction) return;
          setShowDelete(false);
          if (currentMode === 'udharo') {
            await deleteCredit(transaction.id);
          } else {
            await deletePayment(transaction.id);
          }
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
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
  skeletonLine: {
    marginBottom: SPACING.sm,
  },
  skeletonField: {
    marginBottom: SPACING.md,
  },
  customerName: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  iconBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
