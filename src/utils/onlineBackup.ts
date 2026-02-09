import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from 'firebase/storage';
import type { User } from 'firebase/auth';
import { auth, firestore, storage, isConfigured } from '../services/firebase';
import { createBackupSqlFile, importDatabaseFromSqlFile } from '../db/backup';
import { DB_VERSION, getPaymentAttachments, updatePaymentAttachment } from '../db/database';

const SETTINGS_KEY = '@udharo_online_backup';
const BACKUP_LIMIT_BYTES = 500 * 1024 * 1024;
const BACKUP_VERSION = 1;

export type OnlineBackupSettings = {
  autoBackupEnabled: boolean;
  lastBackupAt?: string | null;
};

export type BackupProfile = {
  uid: string;
  phone?: string | null;
  paid: boolean;
  storageUsedBytes: number;
  lastBackupAt?: string | null;
  deviceId?: string | null;
};

export async function getOnlineBackupSettings(): Promise<OnlineBackupSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return { autoBackupEnabled: false, lastBackupAt: null };
  try {
    return JSON.parse(raw) as OnlineBackupSettings;
  } catch {
    return { autoBackupEnabled: false, lastBackupAt: null };
  }
}

export async function setOnlineBackupSettings(next: Partial<OnlineBackupSettings>) {
  const current = await getOnlineBackupSettings();
  const merged = { ...current, ...next };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!state.isConnected && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId() || 'unknown-device';
    }
    if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      return id || 'unknown-device';
    }
    return Application.applicationId || 'unknown-device';
  } catch {
    return 'unknown-device';
  }
}

function requireFirebase() {
  if (!isConfigured || !auth || !firestore || !storage) {
    throw new Error('Firebase not configured');
  }
}

export async function getCurrentUser(): Promise<User | null> {
  requireFirebase();
  return auth!.currentUser;
}

export async function updateUserPhone(phone: string): Promise<void> {
  requireFirebase();
  const user = auth!.currentUser;
  if (!user) throw new Error('Not signed in');
  await updateDoc(doc(firestore!, 'users', user.uid), {
    phone: phone.trim(),
    updated_at: serverTimestamp(),
  });
}

export async function ensureUserProfile(user: User, deviceId: string): Promise<void> {
  requireFirebase();
  const phone = user.phoneNumber ?? null;
  const refDoc = doc(firestore!, 'users', user.uid);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) {
    await setDoc(refDoc, {
      phone,
      device_id: deviceId,
      paid: false,
      storage_used_bytes: 0,
      last_backup_at: null,
      limit_bytes: BACKUP_LIMIT_BYTES,
      backup_version: BACKUP_VERSION,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } else {
    const updates: Record<string, unknown> = {
      device_id: deviceId,
      updated_at: serverTimestamp(),
    };
    if (phone) updates.phone = phone;
    await updateDoc(refDoc, updates);
  }
}

export async function fetchUserProfile(user: User): Promise<BackupProfile | null> {
  requireFirebase();
  const refDoc = doc(firestore!, 'users', user.uid);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    uid: user.uid,
    phone: data.phone ?? null,
    paid: !!data.paid,
    storageUsedBytes: Number(data.storage_used_bytes ?? 0),
    lastBackupAt: data.last_backup_at ?? null,
    deviceId: data.device_id ?? null,
  };
}

function getFileSize(file: File): number {
  try {
    const info = file.info();
    return info.size ?? 0;
  } catch {
    return 0;
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9\u0900-\u097F_-]+/g, '_');
}

export async function performOnlineBackup(): Promise<BackupProfile> {
  requireFirebase();
  const user = auth!.currentUser;
  if (!user) throw new Error('Not signed in');

  const deviceId = await getDeviceId();
  await ensureUserProfile(user, deviceId);
  const profile = (await fetchUserProfile(user)) ?? {
    uid: user.uid,
    phone: user.phoneNumber ?? null,
    paid: false,
    storageUsedBytes: 0,
    lastBackupAt: null,
    deviceId,
  };

  const sqlFile = await createBackupSqlFile();
  const sqlSize = getFileSize(sqlFile);

  const attachments = await getPaymentAttachments();
  const attachmentFiles = attachments
    .map((a) => ({
      id: a.id,
      uri: a.attachment_uri,
      name: a.attachment_name ?? `payment-${a.id}`,
      mime: a.attachment_mime ?? null,
    }))
    .filter((a) => !!a.uri);
  const attachmentMap = new Map(attachmentFiles.map((item) => [item.id, item]));

  let attachmentsSize = 0;
  const attachmentEntries: {
    payment_id: number;
    name: string;
    mime: string | null;
    storage_path: string;
  }[] = [];

  for (const entry of attachmentFiles) {
    const file = new File(entry.uri);
    if (!file.exists) continue;
    attachmentsSize += getFileSize(file);
    const safeName = sanitizeFileName(entry.name);
    const storagePath = `backups/${user.uid}/latest/attachments/${entry.id}_${safeName}`;
    attachmentEntries.push({
      payment_id: entry.id,
      name: entry.name,
      mime: entry.mime,
      storage_path: storagePath,
    });
  }

  const totalSize = sqlSize + attachmentsSize;
  if (!profile.paid && totalSize > BACKUP_LIMIT_BYTES) {
    const err = new Error('LIMIT_EXCEEDED');
    throw err;
  }

  const basePath = `backups/${user.uid}/latest`;
  const attachmentsPath = ref(storage!, `${basePath}/attachments`);

  try {
    const existing = await listAll(attachmentsPath);
    await Promise.all(existing.items.map((item) => deleteObject(item).catch(() => null)));
  } catch {
    // ignore cleanup failures
  }

  const sqlRef = ref(storage!, `${basePath}/backup.sql`);
  await uploadBytes(sqlRef, sqlFile, { contentType: 'application/sql' });

  for (const entry of attachmentEntries) {
    const info = attachmentMap.get(entry.payment_id);
    if (!info?.uri) continue;
    const localFile = new File(info.uri);
    if (!localFile.exists) continue;
    await uploadBytes(ref(storage!, entry.storage_path), localFile, {
      contentType: entry.mime ?? 'application/octet-stream',
    });
  }

  const manifest = {
    backup_version: BACKUP_VERSION,
    schema_version: DB_VERSION,
    created_at: new Date().toISOString(),
    device_id: deviceId,
    sql_path: `${basePath}/backup.sql`,
    attachments: attachmentEntries,
  };

  const manifestRef = ref(storage!, `${basePath}/manifest.json`);
  const manifestFile = new File(Paths.cache, 'manifest.json');
  manifestFile.write(JSON.stringify(manifest), { encoding: 'utf8' });
  await uploadBytes(manifestRef, manifestFile, { contentType: 'application/json' });

  await updateDoc(doc(firestore!, 'users', user.uid), {
    storage_used_bytes: totalSize,
    last_backup_at: new Date().toISOString(),
    device_id: deviceId,
    backup_version: BACKUP_VERSION,
    updated_at: serverTimestamp(),
  });

  const nextProfile = (await fetchUserProfile(user))!;
  await setOnlineBackupSettings({ lastBackupAt: nextProfile.lastBackupAt });
  return nextProfile;
}

export async function performOnlineRestore(): Promise<void> {
  requireFirebase();
  const user = auth!.currentUser;
  if (!user) throw new Error('Not signed in');

  const basePath = `backups/${user.uid}/latest`;
  const manifestUrl = await getDownloadURL(ref(storage!, `${basePath}/manifest.json`));
  const manifestRes = await fetch(manifestUrl);
  const manifest = (await manifestRes.json()) as {
    sql_path: string;
    attachments?: { payment_id: number; name: string; mime: string | null; storage_path: string }[];
  };

  const sqlUrl = await getDownloadURL(ref(storage!, manifest.sql_path));
  const sqlRes = await fetch(sqlUrl);
  const sqlArrayBuffer = await sqlRes.arrayBuffer();
  const sqlFile = new File(Paths.document, 'online-restore.sql');
  sqlFile.write(new Uint8Array(sqlArrayBuffer));

  await importDatabaseFromSqlFile(sqlFile.uri);

  const attachments = manifest.attachments ?? [];
  for (const attachment of attachments) {
    try {
      const url = await getDownloadURL(ref(storage!, attachment.storage_path));
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      const safeName = sanitizeFileName(attachment.name);
      const localFile = new File(Paths.document, `attachment-${attachment.payment_id}-${safeName}`);
      localFile.write(new Uint8Array(buffer));
      await updatePaymentAttachment(attachment.payment_id, {
        attachment_uri: localFile.uri,
        attachment_name: attachment.name,
        attachment_mime: attachment.mime ?? undefined,
      });
    } catch {
      // ignore missing attachments
    }
  }
}

export async function redeemActivationCode(code: string): Promise<void> {
  requireFirebase();
  const user = auth!.currentUser;
  if (!user) throw new Error('Not signed in');

  const clean = code.trim().toUpperCase();
  if (!clean) throw new Error('INVALID_CODE');
  const codeRef = doc(firestore!, 'activation_codes', clean);
  await runTransaction(firestore!, async (txn) => {
    const codeSnap = await txn.get(codeRef);
    if (!codeSnap.exists()) throw new Error('INVALID_CODE');
    const data = codeSnap.data() as any;
    if (data.used) throw new Error('CODE_USED');
    txn.update(codeRef, {
      used: true,
      used_by: user.uid,
      used_at: serverTimestamp(),
    });
    txn.set(
      doc(firestore!, 'users', user.uid),
      {
        paid: true,
        plan: 'lifetime',
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function maybeRunAutoOnlineBackup() {
  if (!(await isOnline())) return;
  requireFirebase();
  const user = auth!.currentUser;
  if (!user) return;
  const settings = await getOnlineBackupSettings();
  if (!settings.autoBackupEnabled) return;
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : 0;
  if (Date.now() - last < 24 * 60 * 60 * 1000) return;
  try {
    await performOnlineBackup();
  } catch {
    // ignore auto failures
  }
}

export { BACKUP_LIMIT_BYTES };
