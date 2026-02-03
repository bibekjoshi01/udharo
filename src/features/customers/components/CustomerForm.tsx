import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';
import { CUSTOMER_STRINGS } from '../constants';
import { AppPressable } from '../../../components/AppPressable';
import {
  validateCustomerInput,
  type CustomerFormInput,
  type ValidationResult,
} from '../validation';

export interface CustomerFormProps {
  initialValues?: Partial<CustomerFormInput>;
  onSubmit: (values: CustomerFormInput) => Promise<void>;
  submitLabel: string;
  isSubmitting?: boolean;
}

export function CustomerForm({
  initialValues = {},
  onSubmit,
  submitLabel,
  isSubmitting = false,
}: CustomerFormProps) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [mobile, setMobile] = useState(initialValues.mobile ?? '');
  const [address, setAddress] = useState(initialValues.address ?? '');
  const [note, setNote] = useState(initialValues.note ?? '');
  const [errors, setErrors] = useState<ValidationResult['errors']>({});
  const [touched, setTouched] = useState({ name: false, mobile: false });

  const values: CustomerFormInput = {
    name: name.trim(),
    mobile: mobile.trim() || undefined,
    address: address.trim() || undefined,
    note: note.trim() || undefined,
  };

  const validationResult = validateCustomerInput(values);

  const validateAndSet = useCallback(
    (next: CustomerFormInput) => {
      const result = validateCustomerInput(next);
      setErrors(result.errors);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setErrors(validationResult.errors);
    setTouched({ name: true, mobile: true });
    if (!validationResult.valid) return;
    if (isSubmitting) return;
    await onSubmit(values);
  }, [validationResult.valid, validationResult.errors, isSubmitting, values.name, values.mobile, values.address, values.note]);

  const valid = validationResult.valid;
  const showNameError = touched.name && errors.name;
  const showMobileError = touched.mobile && errors.mobile;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>{STRINGS.customerName} *</Text>
          <TextInput
            style={[styles.input, showNameError && styles.inputError]}
            placeholder={CUSTOMER_STRINGS.namePlaceholder}
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={(t) => {
              const nextName = t;
              setName(nextName);
              setTouched((prev) => ({ ...prev, name: true }));
              validateAndSet({
                ...values,
                name: nextName.trim(),
              });
            }}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            autoFocus
          />
          {showNameError ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{STRINGS.mobileNumber}</Text>
          <TextInput
            style={[styles.input, showMobileError && styles.inputError]}
            placeholder={CUSTOMER_STRINGS.mobilePlaceholder}
            placeholderTextColor={COLORS.textSecondary}
            value={mobile}
            onChangeText={(t) => {
              const nextMobile = t.replace(/\D/g, '').slice(0, 10);
              setMobile(nextMobile);
              setTouched((prev) => ({ ...prev, mobile: true }));
              validateAndSet({
                ...values,
                mobile: nextMobile.trim() || undefined,
              });
            }}
            onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
            keyboardType="phone-pad"
            maxLength={10}
          />
          {showMobileError ? (
            <Text style={styles.errorText}>{errors.mobile}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{STRINGS.address}</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder={CUSTOMER_STRINGS.addressPlaceholder}
            placeholderTextColor={COLORS.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{STRINGS.note}</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder={CUSTOMER_STRINGS.notePlaceholder}
            placeholderTextColor={COLORS.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
          />
        </View>

        <AppPressable
          style={[styles.submitBtn, (!valid || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!valid || isSubmitting}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? CUSTOMER_STRINGS.saving : submitLabel}
          </Text>
        </AppPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  field: { marginBottom: SPACING.md },
  label: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.body,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.debt,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: FONTS.small,
    color: COLORS.debt,
    marginTop: SPACING.xs,
  },
  submitBtn: {
    minHeight: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.white,
  },
});
