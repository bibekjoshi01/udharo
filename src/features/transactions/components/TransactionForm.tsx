import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import { AppPressable } from '../../../components/AppPressable';

export interface TransactionFormProps {
  mode: 'udharo' | 'payment';
  onModeChange?: (mode: 'udharo' | 'payment') => void;
  amountStr: string;
  onAmountChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  saving?: boolean;
  disabled?: boolean;
  allowModeToggle?: boolean;
}

export function TransactionForm({
  mode,
  onModeChange,
  amountStr,
  onAmountChange,
  note,
  onNoteChange,
  onSubmit,
  submitLabel = STRINGS.save,
  saving = false,
  disabled = false,
  allowModeToggle = true,
}: TransactionFormProps) {
  return (
    <View>
      {allowModeToggle ? (
        <View style={styles.modeToggle}>
          <AppPressable
            style={[
              styles.modeBtn,
              mode === 'udharo' && styles.modeBtnActive,
              mode === 'udharo' && styles.modeBtnUdharo,
            ]}
            onPress={() => onModeChange?.('udharo')}
          >
            <Text style={[styles.modeBtnText, mode === 'udharo' && styles.modeBtnTextActive]}>
              {STRINGS.addCreditTitle}
            </Text>
          </AppPressable>
          <AppPressable
            style={[
              styles.modeBtn,
              mode === 'payment' && styles.modeBtnActive,
              mode === 'payment' && styles.modeBtnPayment,
            ]}
            onPress={() => onModeChange?.('payment')}
          >
            <Text style={[styles.modeBtnText, mode === 'payment' && styles.modeBtnTextActive]}>
              {STRINGS.paymentTitle}
            </Text>
          </AppPressable>
        </View>
      ) : null}

      <TextInput
        style={styles.amountInput}
        placeholder={STRINGS.amountPlaceholder}
        placeholderTextColor={COLORS.textSecondary}
        value={amountStr}
        onChangeText={onAmountChange}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.noteInput}
        placeholder={STRINGS.notePlaceholder}
        placeholderTextColor={COLORS.textSecondary}
        value={note}
        onChangeText={onNoteChange}
        multiline
        numberOfLines={4}
      />

      <AppPressable
        style={[styles.saveBtn, (disabled || saving) && styles.saveBtnDisabled]}
        onPress={onSubmit}
        disabled={disabled || saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'सेभ हुँदैछ...' : submitLabel}</Text>
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modeBtn: {
    flex: 1,
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  modeBtnActive: {},
  modeBtnUdharo: { backgroundColor: COLORS.debtLight },
  modeBtnPayment: { backgroundColor: COLORS.paidLight },
  modeBtnText: { fontSize: FONTS.body, color: COLORS.textSecondary },
  modeBtnTextActive: { color: COLORS.text, fontWeight: '600' },
  amountInput: {
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: 24,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  noteInput: {
    minHeight: 120,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlignVertical: 'top',
  },
  saveBtn: {
    height: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.white,
  },
});
