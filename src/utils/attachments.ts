import { Alert, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { getStrings } from '../constants/strings';

export type Attachment = {
  uri: string;
  name: string;
  mimeType?: string;
};

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

function safeFileName(value: string) {
  const match = value.match(/(\.[a-zA-Z0-9]+)$/);
  const ext = match ? match[1] : '';
  const base = match ? value.slice(0, -ext.length) : value;
  const safeBase = base.replace(/[^a-zA-Z0-9\u0900-\u097F_-]+/g, '_');
  return `${safeBase}${ext}`;
}

function isAllowed(mimeType?: string, name?: string) {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return true;
    if (mimeType === 'application/pdf') return true;
  }
  const lower = (name ?? '').toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function pickAttachment(): Promise<Attachment | null> {
  const STRINGS = getStrings();
  const pick = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (pick.canceled || !pick.assets?.[0]?.uri) return null;

  const asset = pick.assets[0];
  if (!isAllowed(asset.mimeType, asset.name)) {
    Alert.alert(STRINGS.attachmentInvalidTitle, STRINGS.attachmentInvalidMessage);
    return null;
  }

  const originalName = asset.name ?? `attachment-${Date.now()}`;
  const safeName = safeFileName(originalName);
  const destName = `${Date.now()}-${safeName}`;
  const destFile = new File(Paths.document, destName);

  try {
    const sourceFile = new File(asset.uri);
    sourceFile.copy(destFile);
    return { uri: destFile.uri, name: safeName, mimeType: asset.mimeType };
  } catch {
    // fallback to original uri
    return { uri: asset.uri, name: safeName, mimeType: asset.mimeType };
  }
}

export async function openAttachment(attachment: Attachment) {
  const STRINGS = getStrings();
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(attachment.uri, {
        dialogTitle: attachment.name,
        mimeType: attachment.mimeType,
      });
      return;
    }
    await Linking.openURL(attachment.uri);
  } catch {
    Alert.alert(STRINGS.attachmentOpenFailedTitle, STRINGS.attachmentOpenFailedMessage);
  }
}
