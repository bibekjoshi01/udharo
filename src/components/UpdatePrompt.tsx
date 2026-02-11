import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { AppPressable } from './AppPressable';

export interface UpdatePromptProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function UpdatePrompt({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
}: UpdatePromptProps) {
  const handleRequestClose = onCancel ?? (() => {});
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {cancelLabel ? (
              <AppPressable style={[styles.btn, styles.btnGhost]} onPress={onCancel}>
                <Text style={styles.btnGhostText}>{cancelLabel}</Text>
              </AppPressable>
            ) : null}
            <AppPressable style={[styles.btn, styles.btnPrimary]} onPress={onConfirm}>
              <Text style={styles.btnText}>{confirmLabel}</Text>
            </AppPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONTS.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  btn: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnGhostText: {
    fontSize: FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnText: {
    fontSize: FONTS.body,
    color: COLORS.white,
    fontWeight: '700',
  },
});
