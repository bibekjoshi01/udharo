import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { AppPressable } from './AppPressable';
import { openStoreUrl } from '../utils/appUpdate';

export interface UpdatePromptProps {
  visible: boolean;
  forceUpdate: boolean;
  storeUrl: string | null;
  onCancel?: () => void;
}

export function AppUpdatePrompt({ visible, forceUpdate, storeUrl, onCancel }: UpdatePromptProps) {
  function handleConfirm() {
    if (storeUrl) {
      openStoreUrl(storeUrl);
    }
  }

  function handleCancel() {
    if (!forceUpdate && onCancel) {
      onCancel();
    }
  }

  const title = 'Update Available';

  const message = forceUpdate
    ? 'Your app version is no longer supported. Please update to continue.'
    : 'A new version of the app is available. Update now for the best experience.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {!forceUpdate && (
              <AppPressable style={[styles.btn, styles.btnGhost]} onPress={handleCancel}>
                <Text style={styles.btnGhostText}>Later</Text>
              </AppPressable>
            )}

            <AppPressable style={[styles.btn, styles.btnPrimary]} onPress={handleConfirm}>
              <Text style={styles.btnText}>Update</Text>
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
