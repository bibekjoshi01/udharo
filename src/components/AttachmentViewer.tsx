import React from 'react';
import { Modal, View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { AppPressable } from './AppPressable';
import { useStrings } from '../constants/strings';
import { openAttachment, type Attachment } from '../utils/attachments';

type Props = {
  visible: boolean;
  attachment: Attachment | null;
  onClose: () => void;
};

const isImageAttachment = (attachment: Attachment | null) => {
  if (!attachment) return false;
  if (attachment.mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp)$/i.test(attachment.name);
};

export function AttachmentViewer({ visible, attachment, onClose }: Props) {
  const STRINGS = useStrings();
  if (!attachment) return null;
  const isImage = isImageAttachment(attachment);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title} numberOfLines={2}>
            {attachment.name}
          </Text>
          {isImage ? (
            <Image source={{ uri: attachment.uri }} style={styles.image} resizeMode="contain" />
          ) : (
            <Text style={styles.info}>{STRINGS.attachmentPdfInfo}</Text>
          )}
          <View style={styles.actions}>
            <AppPressable style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>{STRINGS.close}</Text>
            </AppPressable>
            {!isImage ? (
              <AppPressable
                style={[styles.btn, styles.primaryBtn]}
                onPress={async () => {
                  await openAttachment(attachment);
                  onClose();
                }}
              >
                <Text style={styles.primaryText}>{STRINGS.attachmentView}</Text>
              </AppPressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  info: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  actions: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  btn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  cancelBtn: {
    backgroundColor: COLORS.border,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  cancelText: { color: COLORS.text, fontWeight: '600' },
  primaryText: { color: COLORS.white, fontWeight: '700' },
});
