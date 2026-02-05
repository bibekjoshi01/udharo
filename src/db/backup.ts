import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { initDatabase } from './database';
import { getStrings } from '../constants/strings';

const TABLES = [
  'customers',
  'customer_credits',
  'customer_payments',
  'customer_credit_logs',
  'customer_payment_logs',
  'schema_migrations',
];

function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  const s = String(value).replace(/'/g, "''");
  return `'${s}'`;
}

function buildInsert(table: string, row: Record<string, unknown>) {
  const columns = Object.keys(row);
  const values = columns.map((c) => escapeSqlValue(row[c]));
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

export async function exportDatabaseToSql(): Promise<string | null> {
  const STRINGS = getStrings();
  const db = await initDatabase();
  const parts: string[] = [];
  parts.push('-- Udharo backup');
  parts.push('PRAGMA foreign_keys=OFF;');
  parts.push('BEGIN;');
  for (const table of TABLES) {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
    parts.push(`DELETE FROM ${table};`);
    for (const row of rows ?? []) {
      parts.push(buildInsert(table, row));
    }
  }
  parts.push('COMMIT;');
  parts.push('PRAGMA foreign_keys=ON;');
  const sql = parts.join('\n');

  const fileName = `udharo-backup-${new Date().toISOString().slice(0, 10)}.sql`;
  const backupFile = new File(Paths.document, fileName);
  backupFile.write(sql, { encoding: 'utf8' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(backupFile.uri, {
      mimeType: 'application/sql',
      dialogTitle: STRINGS.exportLabel,
    });
  } else {
    Alert.alert(STRINGS.backupReady, backupFile.uri);
  }
  return backupFile.uri;
}

export async function importDatabaseFromSql(): Promise<boolean> {
  const STRINGS = getStrings();
  const pick = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (pick.canceled || !pick.assets?.[0]?.uri) return false;

  const asset = pick.assets[0];
  const name = (asset.name ?? '').toLowerCase();
  if (!name.endsWith('.sql')) {
    Alert.alert(STRINGS.invalidFileTitle, STRINGS.invalidFileMessage);
    return false;
  }

  const importFile = new File(asset.uri);
  const sql = await importFile.text();
  const statements = sql
    .split(';')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .filter((stmt) => {
      const upper = stmt.toUpperCase();
      return !(
        upper.startsWith('BEGIN') ||
        upper.startsWith('COMMIT') ||
        upper.startsWith('ROLLBACK') ||
        upper.startsWith('PRAGMA')
      );
    });

  const db = await initDatabase();
  // Ensure new columns exist before import (backups may include them).
  const creditsCols = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(customer_credits)',
  );
  const creditsColSet = new Set((creditsCols as { name: string }[]).map((c) => c.name));
  if (!creditsColSet.has('expected_payment_date')) {
    await db.execAsync('ALTER TABLE customer_credits ADD COLUMN expected_payment_date TEXT');
  }
  await db.execAsync('PRAGMA foreign_keys=OFF;');
  await db.execAsync('BEGIN;');
  try {
    for (const stmt of statements) {
      await db.execAsync(stmt);
    }
    await db.execAsync('COMMIT;');
    await db.execAsync('PRAGMA foreign_keys=ON;');
    return true;
  } catch (e) {
    await db.execAsync('ROLLBACK;');
    await db.execAsync('PRAGMA foreign_keys=ON;');
    throw e;
  }
}
