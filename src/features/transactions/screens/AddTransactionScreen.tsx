import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Text,
  TextInput,
} from 'react-native';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { useStrings } from '../../../constants/strings';
import { insertCredit, insertPayment } from '../../../db/database';
import type { RootStackParamList } from '../../../navigation/types';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { TransactionForm } from '../components';
import { useCustomers } from '../../customers/hooks';
import { AppPressable } from '../../../components/AppPressable';
import { showToast } from '../../../utils/toast';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { NepaliDatePicker } from '../../../components/NepaliDatePicker';
import { AttachmentViewer } from '../../../components/AttachmentViewer';
import { pickAttachment, type Attachment } from '../../../utils/attachments';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddTransaction'>;
type Route = RouteProp<RootStackParamList, 'AddTransaction'>;

export function AddTransactionScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const route = useRoute<Route>();
  const { customerId, mode: initialMode, lockMode } = route.params;

  const [mode, setMode] = useState<'credit' | 'payment'>(initialMode);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(customerId ?? null);
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [confirmRemoveAttachment, setConfirmRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebouncedValue(search, 300);
  const { customers } = useCustomers({ query: debouncedSearch, pageSize: 200 });
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  const amount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  const isValid = amount > 0 && selectedCustomerId != null;

  React.useEffect(() => {
    if (mode !== 'credit') {
      setExpectedPaymentDate('');
    } else {
      setAttachment(null);
    }
  }, [mode]);

  const onSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      if (mode === 'credit') {
        await insertCredit({
          customer_id: selectedCustomerId as number,
          amount,
          note: note.trim() || undefined,
          expected_payment_date: expectedPaymentDate.trim() || undefined,
        });
        showToast(STRINGS.creditAdded);
      } else {
        await insertPayment({
          customer_id: selectedCustomerId as number,
          amount,
          note: note.trim() || undefined,
          attachment_uri: attachment?.uri,
          attachment_name: attachment?.name,
          attachment_mime: attachment?.mimeType,
        });
        showToast(STRINGS.paymentAdded);
      }
      const targetList = mode === 'credit' ? 'CreditList' : 'PaymentList';
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: 'Home' }, { name: targetList }],
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'credit' ? STRINGS.addCreditTitle : STRINGS.addPaymentTitle;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{STRINGS.customerName} *</Text>
        <AppPressable style={styles.selectField} onPress={() => setPickerOpen(true)}>
          <Text
            style={[styles.selectText, !selectedCustomer && styles.selectPlaceholder]}
            numberOfLines={1}
          >
            {selectedCustomer
              ? `${selectedCustomer.name} • ${selectedCustomer.mobile ?? '—'}`
              : STRINGS.selectCustomerTitle}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
        </AppPressable>

        <TransactionForm
          mode={mode}
          onModeChange={lockMode ? undefined : setMode}
          amountStr={amountStr}
          onAmountChange={setAmountStr}
          afterAmount={
            mode === 'credit' ? (
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
            mode === 'payment' ? (
              <View style={styles.attachmentWrap}>
                <Text style={styles.label}>{STRINGS.attachmentLabel}</Text>
                <View style={styles.attachmentRow}>
                  <AppPressable
                    style={styles.attachmentBtn}
                    onPress={async () => {
                      const next = await pickAttachment();
                      if (next) setAttachment(next);
                    }}
                  >
                    <Ionicons name="attach-outline" size={18} color={COLORS.text} />
                    <Text style={styles.attachmentBtnText}> {STRINGS.attachmentAdd}</Text>
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
          allowModeToggle={!lockMode}
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

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <AppPressable
            style={styles.modalBackdrop}
            onPress={() => setPickerOpen(false)}
            disableRipple
          />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{STRINGS.selectCustomerTitle}</Text>
            <View style={styles.searchWrap}>
              <Ionicons
                name="search"
                size={18}
                color={COLORS.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={STRINGS.searchPlaceholder}
                placeholderTextColor={COLORS.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <ScrollView style={styles.list}>
              {customers.map((c) => (
                <AppPressable
                  key={c.id}
                  style={styles.customerRow}
                  onPress={() => {
                    setSelectedCustomerId(c.id);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.customerName}>{c.name}</Text>
                  <Text style={styles.customerMeta}>{c.mobile ?? '—'}</Text>
                </AppPressable>
              ))}
              {customers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{STRINGS.emptyCustomers}</Text>
                  <AppPressable
                    style={styles.emptyButton}
                    onPress={() => {
                      setPickerOpen(false);
                      navigation.navigate('AddCustomer');
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.emptyButtonText}> {STRINGS.addCustomer}</Text>
                  </AppPressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  label: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  selectField: {
    minHeight: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  selectText: {
    flex: 1,
    fontSize: FONTS.body,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  selectPlaceholder: {
    color: COLORS.textSecondary,
  },
  attachmentWrap: {
    marginBottom: SPACING.lg,
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
    borderRadius: BORDER_RADIUS.sm,
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
    borderRadius: BORDER_RADIUS.sm,
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    position: 'absolute',
    left: SPACING.sm + 8,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: SPACING.lg + 24,
    paddingRight: SPACING.md,
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  list: { marginTop: SPACING.xs },
  customerRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customerName: {
    fontSize: FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  customerMeta: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  emptyButtonText: {
    fontSize: FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
