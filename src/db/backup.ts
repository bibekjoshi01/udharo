import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { initDatabase } from './database';

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
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, sql, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/sql',
      dialogTitle: 'Export Backup',
    });
  } else {
    Alert.alert('Backup saved', fileUri);
  }
  return fileUri;
}

export async function importDatabaseFromSql(): Promise<boolean> {
  const pick = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (pick.canceled || !pick.assets?.[0]?.uri) return false;

  const asset = pick.assets[0];
  const name = (asset.name ?? '').toLowerCase();
  if (!name.endsWith('.sql')) {
    Alert.alert('गलत फाइल', 'कृपया .sql फाइल मात्र छान्नुहोस्।');
    return false;
  }

  const sql = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
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
