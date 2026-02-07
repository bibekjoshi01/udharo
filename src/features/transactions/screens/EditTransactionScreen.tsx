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
import { useStrings } from '../../../constants/strings';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { TransactionForm } from '../components';
import type { RootStackParamList } from '../../../navigation/types';
import { deleteCredit, deletePayment, updateCredit, updatePayment } from '../../../db/database';
import { useTransaction } from '../hooks';
import { AppPressable } from '../../../components/AppPressable';
import { Skeleton } from '../../../components/Skeleton';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { NepaliDatePicker } from '../../../components/NepaliDatePicker';
import { pickAttachment, type Attachment } from '../../../utils/attachments';
import { AttachmentViewer } from '../../../components/AttachmentViewer';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditTransaction'>;
type Route = RouteProp<RootStackParamList, 'EditTransaction'>;

export function EditTransactionScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const route = useRoute<Route>();
  const { transactionId, mode } = route.params;
  const { transaction, customer, loading } = useTransaction(mode, transactionId);

  const [currentMode, setCurrentMode] = useState<'credit' | 'payment'>(mode);
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [confirmRemoveAttachment, setConfirmRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setCurrentMode(mode);
      setAmountStr(String(transaction.amount));
      setNote(transaction.note ?? '');
      setExpectedPaymentDate(
        (transaction as { expected_payment_date?: string })?.expected_payment_date ?? '',
      );
      setAttachment(
        (transaction as { attachment_uri?: string; attachment_name?: string; attachment_mime?: string })
          ?.attachment_uri
          ? {
              uri: (transaction as { attachment_uri?: string }).attachment_uri as string,
              name:
                (transaction as { attachment_name?: string }).attachment_name ??
                (transaction as { attachment_uri?: string }).attachment_uri ??
                '',
              mimeType: (transaction as { attachment_mime?: string }).attachment_mime ?? undefined,
            }
          : null,
      );
    }
  }, [mode, transaction]);

  const amount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  const isValid = amount > 0;

  const onSave = async () => {
    if (!transaction || !isValid || saving) return;
    setSaving(true);
    try {
      if (currentMode === 'credit') {
        await updateCredit(transaction.id, {
          amount,
          note: note.trim() || undefined,
          expected_payment_date: expectedPaymentDate.trim() || undefined,
        });
      } else {
        await updatePayment(transaction.id, {
          amount,
          note: note.trim() || undefined,
          attachment_uri: attachment?.uri ?? null,
          attachment_name: attachment?.name ?? null,
          attachment_mime: attachment?.mimeType ?? null,
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
        title={currentMode === 'credit' ? STRINGS.editCreditTitle : STRINGS.editPaymentTitle}
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
          afterAmount={
            currentMode === 'credit' ? (
              <NepaliDatePicker
                label={STRINGS.expectedPaymentDate}
                value={expectedPaymentDate}
                onChange={(next) => setExpectedPaymentDate(next ?? '')}
                placeholder={STRINGS.expectedPaymentDatePlaceholder}
              />
            ) : null
          }
          note={note}
          onNoteChange={setNote}
          afterNote={
            currentMode === 'payment' ? (
              <View style={styles.attachmentWrap}>
                <Text style={styles.attachmentLabel}>{STRINGS.attachmentLabel}</Text>
                <View style={styles.attachmentRow}>
                  <AppPressable
                    style={styles.attachmentBtn}
                    onPress={async () => {
                      const next = await pickAttachment();
                      if (next) setAttachment(next);
                    }}
                  >
                    <Ionicons name="attach-outline" size={18} color={COLORS.text} />
                    <Text style={styles.attachmentBtnText}>
                      {' '}
                      {attachment ? STRINGS.attachmentReplace : STRINGS.attachmentAdd}
                    </Text>
                  </AppPressable>
                  {attachment ? (
                    <View style={styles.attachmentActions}>
                      <AppPressable
                        style={styles.attachmentActionBtn}
                        onPress={() => setViewerOpen(true)}
                      >
                        <Ionicons name="eye-outline" size={18} color={COLORS.text} />
                      </AppPressable>
                      <AppPressable
                        style={styles.attachmentActionBtn}
                        onPress={() => setConfirmRemoveAttachment(true)}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.debt} />
                      </AppPressable>
                    </View>
                  ) : null}
                </View>
                {attachment ? (
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                ) : null}
              </View>
            ) : null
          }
          onSubmit={onSave}
          saving={saving}
          disabled={!isValid}
          allowModeToggle={false}
        />
      </ScrollView>
      <AttachmentViewer
        visible={viewerOpen}
        attachment={attachment}
        onClose={() => setViewerOpen(false)}
      />
      <ConfirmDialog
        visible={confirmRemoveAttachment}
        title={STRINGS.attachmentDeleteTitle}
        message={STRINGS.attachmentDeleteMessage}
        confirmLabel={STRINGS.delete}
        cancelLabel={STRINGS.cancel}
        destructive
        onCancel={() => setConfirmRemoveAttachment(false)}
        onConfirm={() => {
          setAttachment(null);
          setConfirmRemoveAttachment(false);
        }}
      />
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
          if (currentMode === 'credit') {
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
    fontSize: FONTS.title,
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
  attachmentWrap: {
    marginBottom: SPACING.lg,
  },
  attachmentLabel: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  attachmentBtn: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  attachmentBtnText: {
    fontSize: FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  attachmentActionBtn: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  attachmentName: {
    marginTop: SPACING.xs,
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
  },
});
