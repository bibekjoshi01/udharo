import * as SQLite from 'expo-sqlite';
import {
  CREATE_CUSTOMERS_TABLE,
  CREATE_CREDITS_TABLE,
  CREATE_PAYMENTS_TABLE,
  CREATE_INDEX_CREDITS_CUSTOMER_ID,
  CREATE_INDEX_PAYMENTS_CUSTOMER_ID,
  CREATE_INDEX_CREDITS_DATE,
  CREATE_INDEX_PAYMENTS_DATE,
  CREATE_SCHEMA_MIGRATIONS_TABLE,
  CREATE_CREDITS_LOGS_TABLE,
  CREATE_PAYMENTS_LOGS_TABLE,
  CREATE_INDEX_CREDIT_LOGS,
  CREATE_INDEX_PAYMENT_LOGS,
  CREATE_TRIGGER_CREDIT_AMOUNT_LOG,
  CREATE_TRIGGER_PAYMENT_AMOUNT_LOG,
} from './schema';
import type {
  Customer,
  CustomerWithBalance,
  CustomerCredit,
  CustomerPayment,
  CustomerCreditWithCustomer,
  CustomerPaymentWithCustomer,
} from '../types';

let db: SQLite.SQLiteDatabase | null = null;
const DB_VERSION = 2;

async function recordMigration(database: SQLite.SQLiteDatabase, version: number) {
  await database.execAsync(CREATE_SCHEMA_MIGRATIONS_TABLE);
  await database.runAsync(
    'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, datetime(\'now\'))',
    version,
  );
}

async function ensureSchema(database: SQLite.SQLiteDatabase) {
  // Tables (create if missing)
  await database.execAsync(CREATE_CUSTOMERS_TABLE);
  await database.execAsync(CREATE_CREDITS_TABLE);
  await database.execAsync(CREATE_PAYMENTS_TABLE);

  // Lightweight migrations: older installed DBs might be missing columns.
  // If any SELECT later references missing columns, hooks can get stuck "loading".
  const customerCols = await database.getAllAsync<{ name: string }>('PRAGMA table_info(customers)');
  const customerColSet = new Set((customerCols as { name: string }[]).map((c) => c.name));
  if (!customerColSet.has('mobile'))
    await database.runAsync('ALTER TABLE customers ADD COLUMN mobile TEXT');
  if (!customerColSet.has('address'))
    await database.runAsync('ALTER TABLE customers ADD COLUMN address TEXT');
  if (!customerColSet.has('note'))
    await database.runAsync('ALTER TABLE customers ADD COLUMN note TEXT');
  if (!customerColSet.has('created_at')) {
    await database.runAsync('ALTER TABLE customers ADD COLUMN created_at TEXT');
    await database.runAsync(
      "UPDATE customers SET created_at = COALESCE(created_at, datetime('now'))",
    );
  }

  const creditsCols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(customer_credits)',
  );
  const creditsColSet = new Set((creditsCols as { name: string }[]).map((c) => c.name));
  if (!creditsColSet.has('note'))
    await database.runAsync('ALTER TABLE customer_credits ADD COLUMN note TEXT');
  if (!creditsColSet.has('date')) {
    await database.runAsync('ALTER TABLE customer_credits ADD COLUMN date TEXT');
    await database.runAsync("UPDATE customer_credits SET date = COALESCE(date, date('now'))");
  }
  if (!creditsColSet.has('created_at')) {
    await database.runAsync('ALTER TABLE customer_credits ADD COLUMN created_at TEXT');
    await database.runAsync(
      "UPDATE customer_credits SET created_at = COALESCE(created_at, datetime('now'))",
    );
  }
  await database.runAsync(
    "UPDATE customer_credits SET date = COALESCE(date, substr(created_at, 1, 10), date('now'))",
  );
  await database.runAsync(
    "UPDATE customer_credits SET created_at = COALESCE(created_at, datetime('now'))",
  );

  const paymentsCols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(customer_payments)',
  );
  const paymentsColSet = new Set((paymentsCols as { name: string }[]).map((c) => c.name));
  if (!paymentsColSet.has('note'))
    await database.runAsync('ALTER TABLE customer_payments ADD COLUMN note TEXT');
  if (!paymentsColSet.has('date')) {
    await database.runAsync('ALTER TABLE customer_payments ADD COLUMN date TEXT');
    await database.runAsync("UPDATE customer_payments SET date = COALESCE(date, date('now'))");
  }
  if (!paymentsColSet.has('created_at')) {
    await database.runAsync('ALTER TABLE customer_payments ADD COLUMN created_at TEXT');
    await database.runAsync(
      "UPDATE customer_payments SET created_at = COALESCE(created_at, datetime('now'))",
    );
  }
  await database.runAsync(
    "UPDATE customer_payments SET date = COALESCE(date, substr(created_at, 1, 10), date('now'))",
  );
  await database.runAsync(
    "UPDATE customer_payments SET created_at = COALESCE(created_at, datetime('now'))",
  );

  // Indexes last: older DBs might not have the indexed columns until we migrate above.
  await database.execAsync(CREATE_INDEX_CREDITS_CUSTOMER_ID);
  await database.execAsync(CREATE_INDEX_PAYMENTS_CUSTOMER_ID);
  await database.execAsync(CREATE_INDEX_CREDITS_DATE);
  await database.execAsync(CREATE_INDEX_PAYMENTS_DATE);

  // Seed minimal demo data for first run (dev-friendly). Won't run once users have real data.
  const row = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM customers',
  );
  const count = Number((row as any)?.cnt ?? 0);
  if (count === 0 && typeof __DEV__ !== 'undefined' && __DEV__) {
    const c1 = await database.runAsync(
      'INSERT INTO customers (name, mobile, address, note) VALUES (?, ?, ?, ?)',
      'राम प्रसाद',
      '9812345678',
      'काठमाडौं',
      'Demo',
    );
    const c2 = await database.runAsync(
      'INSERT INTO customers (name, mobile, address, note) VALUES (?, ?, ?, ?)',
      'सीता देवी',
      '9800000000',
      'ललितपुर',
      'Demo',
    );

    const today = new Date().toISOString().slice(0, 10);
    await database.runAsync(
      'INSERT INTO customer_credits (customer_id, amount, note, date) VALUES (?, ?, ?, ?)',
      Number(c1.lastInsertRowId),
      500,
      'चामल',
      today,
    );
    await database.runAsync(
      'INSERT INTO customer_payments (customer_id, amount, note, date) VALUES (?, ?, ?, ?)',
      Number(c2.lastInsertRowId),
      200,
      'आंशिक भुक्तानी',
      today,
    );
  }
}

async function migrateDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(CREATE_SCHEMA_MIGRATIONS_TABLE);
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = Number((row as any)?.user_version ?? 0);

  if (version < 1) {
    await ensureSchema(database);
    await database.execAsync('PRAGMA user_version = 1');
    await recordMigration(database, 1);
    version = 1;
  } else {
    await ensureSchema(database);
  }

  if (version < 2) {
    await database.execAsync('PRAGMA user_version = 2');
    await recordMigration(database, 2);
    version = 2;
  }

  // If a legacy transactions table exists, migrate once into new tables.
  const legacyTable = await database.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'",
  );
  if (legacyTable?.name) {
    const creditsCountRow = await database.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM customer_credits',
    );
    const paymentsCountRow = await database.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM customer_payments',
    );
    const creditsCount = Number((creditsCountRow as any)?.cnt ?? 0);
    const paymentsCount = Number((paymentsCountRow as any)?.cnt ?? 0);
    if (creditsCount === 0 && paymentsCount === 0) {
      await database.runAsync(
        `INSERT INTO customer_credits (customer_id, amount, note, date, created_at)
         SELECT customer_id, amount, note, date, created_at
         FROM transactions WHERE type = 'udharo'`,
      );
      await database.runAsync(
        `INSERT INTO customer_payments (customer_id, amount, note, date, created_at)
         SELECT customer_id, amount, note, date, created_at
         FROM transactions WHERE type = 'payment'`,
      );
    }
  }

  // Always ensure log tables/triggers exist (idempotent).
  await database.execAsync(CREATE_CREDITS_LOGS_TABLE);
  await database.execAsync(CREATE_PAYMENTS_LOGS_TABLE);
  await database.execAsync(CREATE_INDEX_CREDIT_LOGS);
  await database.execAsync(CREATE_INDEX_PAYMENT_LOGS);
  await database.execAsync(CREATE_TRIGGER_CREDIT_AMOUNT_LOG);
  await database.execAsync(CREATE_TRIGGER_PAYMENT_AMOUNT_LOG);

  if (version !== DB_VERSION) {
    await database.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
  }
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('udharo.db');
  }
  await db.execAsync('PRAGMA foreign_keys = ON');
  await migrateDatabase(db);
  return db;
}

export function getDb(): SQLite.SQLiteDatabase | null {
  return db;
}

// --- Customers ---
export async function getAllCustomers(): Promise<Customer[]> {
  const database = db ?? (await initDatabase());
  const rows = await database.getAllAsync<Customer>(
    'SELECT id, name, mobile, address, note, created_at FROM customers ORDER BY name COLLATE NOCASE',
  );
  return rows as Customer[];
}

export async function getCustomersWithBalance(): Promise<CustomerWithBalance[]> {
  const database = db ?? (await initDatabase());
  // Single query (avoids N+1) so the customer list doesn't feel "stuck loading"
  // on larger datasets.
  const rows = await database.getAllAsync<CustomerWithBalance>(
    `SELECT
      c.id, c.name, c.mobile, c.address, c.note, c.created_at,
      COALESCE((SELECT SUM(amount) FROM customer_credits WHERE customer_id = c.id), 0) -
      COALESCE((SELECT SUM(amount) FROM customer_payments WHERE customer_id = c.id), 0) as balance,
      (
        SELECT MAX(d) FROM (
          SELECT MAX(date) as d FROM customer_credits WHERE customer_id = c.id
          UNION ALL
          SELECT MAX(date) as d FROM customer_payments WHERE customer_id = c.id
        )
      ) as last_transaction_date,
      COALESCE((SELECT COUNT(*) FROM customer_credits WHERE customer_id = c.id), 0) +
      COALESCE((SELECT COUNT(*) FROM customer_payments WHERE customer_id = c.id), 0) as transaction_count
     FROM customers c
     ORDER BY COALESCE(last_transaction_date, c.created_at) DESC, balance DESC`,
  );
  return (rows as CustomerWithBalance[]) ?? [];
}

export async function getCustomersWithBalancePage(params: {
  limit: number;
  offset: number;
  query?: string;
}): Promise<CustomerWithBalance[]> {
  const database = db ?? (await initDatabase());
  const q = (params.query ?? '').trim().toLowerCase();
  const hasQuery = q.length > 0;
  const like = `%${q}%`;
  const rows = await database.getAllAsync<CustomerWithBalance>(
    `SELECT
      c.id, c.name, c.mobile, c.address, c.note, c.created_at,
      COALESCE((SELECT SUM(amount) FROM customer_credits WHERE customer_id = c.id), 0) -
      COALESCE((SELECT SUM(amount) FROM customer_payments WHERE customer_id = c.id), 0) as balance,
      (
        SELECT MAX(d) FROM (
          SELECT MAX(date) as d FROM customer_credits WHERE customer_id = c.id
          UNION ALL
          SELECT MAX(date) as d FROM customer_payments WHERE customer_id = c.id
        )
      ) as last_transaction_date,
      COALESCE((SELECT COUNT(*) FROM customer_credits WHERE customer_id = c.id), 0) +
      COALESCE((SELECT COUNT(*) FROM customer_payments WHERE customer_id = c.id), 0) as transaction_count
     FROM customers c
     ${hasQuery ? 'WHERE lower(c.name) LIKE ? OR lower(c.mobile) LIKE ?' : ''}
     ORDER BY COALESCE(last_transaction_date, c.created_at) DESC, balance DESC
     LIMIT ? OFFSET ?`,
    ...(hasQuery ? [like, like] : []),
    params.limit,
    params.offset,
  );
  return (rows as CustomerWithBalance[]) ?? [];
}

export async function getCustomersCount(query?: string): Promise<number> {
  const database = db ?? (await initDatabase());
  const q = (query ?? '').trim().toLowerCase();
  const hasQuery = q.length > 0;
  const like = `%${q}%`;
  const row = await database.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM customers
     ${hasQuery ? 'WHERE lower(name) LIKE ? OR lower(mobile) LIKE ?' : ''}`,
    ...(hasQuery ? [like, like] : []),
  );
  return Number(row?.total ?? 0);
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const database = db ?? (await initDatabase());
  const row = await database.getFirstAsync<Customer>(
    'SELECT id, name, mobile, address, note, created_at FROM customers WHERE id = ?',
    [id],
  );
  return (row as Customer) ?? null;
}

export async function insertCustomer(data: {
  name: string;
  mobile?: string;
  address?: string;
  note?: string;
}): Promise<number> {
  const database = db ?? (await initDatabase());
  const createdAt = new Date().toISOString();
  const result = await database.runAsync(
    'INSERT INTO customers (name, mobile, address, note, created_at) VALUES (?, ?, ?, ?, ?)',
    data.name,
    data.mobile ?? null,
    data.address ?? null,
    data.note ?? null,
    createdAt,
  );
  return Number(result.lastInsertRowId);
}

export async function updateCustomer(
  id: number,
  data: { name?: string; mobile?: string; address?: string; note?: string },
): Promise<void> {
  const database = db ?? (await initDatabase());
  await database.runAsync(
    'UPDATE customers SET name = COALESCE(?, name), mobile = ?, address = ?, note = ? WHERE id = ?',
    data.name ?? null,
    data.mobile ?? null,
    data.address ?? null,
    data.note ?? null,
    id,
  );
}

export async function deleteCustomer(id: number): Promise<void> {
  const database = db ?? (await initDatabase());
  await database.runAsync('DELETE FROM customer_credits WHERE customer_id = ?', id);
  await database.runAsync('DELETE FROM customer_payments WHERE customer_id = ?', id);
  await database.runAsync('DELETE FROM customers WHERE id = ?', id);
}

// --- Balance ---
export async function getBalanceForCustomer(customerId: number): Promise<number> {
  const database = db ?? (await initDatabase());
  const row = await database.getFirstAsync<{ balance: number }>(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM customer_credits WHERE customer_id = ?), 0) -
       COALESCE((SELECT SUM(amount) FROM customer_payments WHERE customer_id = ?), 0) as balance`,
    [customerId],
  );
  return row?.balance ?? 0;
}

export async function getTotalCreditsForCustomer(customerId: number): Promise<number> {
  const database = db ?? (await initDatabase());
  const row = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM customer_credits WHERE customer_id = ?',
    [customerId],
  );
  return row?.total ?? 0;
}

export async function getTotalPaymentsForCustomer(customerId: number): Promise<number> {
  const database = db ?? (await initDatabase());
  const row = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM customer_payments WHERE customer_id = ?',
    [customerId],
  );
  return row?.total ?? 0;
}

// --- Credits ---
export async function getCreditsForCustomer(customerId: number): Promise<CustomerCredit[]> {
  const database = db ?? (await initDatabase());
  const rows = await database.getAllAsync<CustomerCredit>(
    `SELECT id, customer_id, amount, note, date, created_at
     FROM customer_credits WHERE customer_id = ?
     ORDER BY date DESC, created_at DESC`,
    [customerId],
  );
  return (rows as CustomerCredit[]) ?? [];
}

export async function getCreditsWithCustomerPage(params: {
  limit: number;
  offset: number;
  query?: string;
}): Promise<CustomerCreditWithCustomer[]> {
  const database = db ?? (await initDatabase());
  const q = (params.query ?? '').trim().toLowerCase();
  const hasQuery = q.length > 0;
  const like = `%${q}%`;
  const rows = await database.getAllAsync<CustomerCreditWithCustomer>(
    `SELECT 
      c.id, c.customer_id, c.amount, c.note, c.date, c.created_at,
      cu.name as customer_name, cu.mobile as customer_mobile
     FROM customer_credits c
     JOIN customers cu ON cu.id = c.customer_id
     ${hasQuery ? 'WHERE lower(cu.name) LIKE ? OR lower(cu.mobile) LIKE ?' : ''}
     ORDER BY c.date DESC, c.created_at DESC
     LIMIT ? OFFSET ?`,
    ...(hasQuery ? [like, like] : []),
    params.limit,
    params.offset,
  );
  return (rows as CustomerCreditWithCustomer[]) ?? [];
}

export async function getCreditsCount(query?: string): Promise<number> {
  const database = db ?? (await initDatabase());
  const q = (query ?? '').trim().toLowerCase();
  const hasQuery = q.length > 0;
  const like = `%${q}%`;
  const row = await database.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM customer_credits c
     JOIN customers cu ON cu.id = c.customer_id
     ${hasQuery ? 'WHERE lower(cu.name) LIKE ? OR lower(cu.mobile) LIKE ?' : ''}`,
    ...(hasQuery ? [like, like] : []),
  );
  return Number(row?.total ?? 0);
}

export async function getCreditById(id: number): Promise<CustomerCredit | null> {
  const database = db ?? (await initDatabase());
  const row = await database.getFirstAsync<CustomerCredit>(
    `SELECT id, customer_id, amount, note, date, created_at
     FROM customer_credits WHERE id = ?`,
    [id],
  );
  return (row as CustomerCredit) ?? null;
}

export async function insertCredit(data: {
  customer_id: number;
  amount: number;
  note?: string;
  date?: string;
}): Promise<number> {
  const database = db ?? (await initDatabase());
  const date = data.date ?? new Date().toISOString().slice(0, 10);
  const result = await database.runAsync(
    'INSERT INTO customer_credits (customer_id, amount, note, date) VALUES (?, ?, ?, ?)',
    data.customer_id,
    data.amount,
    data.note ?? null,
    date,
  );
  return Number(result.lastInsertRowId);
}

export async function updateCredit(
  id: number,
  data: { amount?: number; note?: string; date?: string },
): Promise<void> {
  const database = db ?? (await initDatabase());
  await database.runAsync(
    `UPDATE customer_credits 
     SET amount = COALESCE(?, amount),
         note = ?,
         date = COALESCE(?, date)
     WHERE id = ?`,
    data.amount ?? null,
    data.note ?? null,
    data.date ?? null,
    id,
  );
}

export async function deleteCredit(id: number): Promise<void> {
  const database = db ?? (await initDatabase());
  await database.runAsync('DELETE FROM customer_credits WHERE id = ?', id);
}

// --- Payments ---
export async function getPaymentsForCustomer(customerId: number): Promise<CustomerPayment[]> {
  const database = db ?? (await initDatabase());
  const rows = await database.getAllAsync<CustomerPayment>(
    `SELECT id, customer_id, amount, note, date, created_at
     FROM customer_payments WHERE customer_id = ?
     ORDER BY date DESC, created_at DESC`,
    [customerId],
  );
  return (rows as CustomerPayment[]) ?? [];
}

export async function getPaymentsWithCustomerPage(params: {
  limit: number;
  offset: number;
  query?: string;
}): Promise<CustomerPaymentWithCustomer[]> {
  const database = db ?? (await initDatabase());
  const q = (params.query ?? '').trim().toLowerCase();
  const hasQuery = q.length > 0;
  const like = `%${q}%`;
  const rows = await database.getAllAsync<CustomerPaymentWithCustomer>(
    `SELECT 
      p.id, p.customer_id, p.amount, p.note, p.date, p.created_at,
      cu.name as customer_name, cu.mobile as customer_mobile
     FROM customer_payments p
     JOIN customers cu ON cu.id = p.customer_id
     ${hasQuery ? 'WHERE lower(cu.name) LIKE ? OR lower(cu.mobile) LIKE ?' : ''}
     ORDER BY p.date DESC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    ...(hasQuery ? [like, like] : []),
    params.limit,
    params.offset,
  );
  return (rows as CustomerPaymentWithCustomer[]) ?? [];
}

export async function getPaymentsCount(query?: string): Promise<number> {
  const database = db ?? (await initDatabase());
  const q = (query ?? '').trim().toLowerCase();
  const hasQuery = q.length > 0;
  const like = `%${q}%`;
  const row = await database.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM customer_payments p
     JOIN customers cu ON cu.id = p.customer_id
     ${hasQuery ? 'WHERE lower(cu.name) LIKE ? OR lower(cu.mobile) LIKE ?' : ''}`,
    ...(hasQuery ? [like, like] : []),
  );
  return Number(row?.total ?? 0);
}

export async function getPaymentById(id: number): Promise<CustomerPayment | null> {
  const database = db ?? (await initDatabase());
  const row = await database.getFirstAsync<CustomerPayment>(
    `SELECT id, customer_id, amount, note, date, created_at
     FROM customer_payments WHERE id = ?`,
    [id],
  );
  return (row as CustomerPayment) ?? null;
}

export async function insertPayment(data: {
  customer_id: number;
  amount: number;
  note?: string;
  date?: string;
}): Promise<number> {
  const database = db ?? (await initDatabase());
  const date = data.date ?? new Date().toISOString().slice(0, 10);
  const result = await database.runAsync(
    'INSERT INTO customer_payments (customer_id, amount, note, date) VALUES (?, ?, ?, ?)',
    data.customer_id,
    data.amount,
    data.note ?? null,
    date,
  );
  return Number(result.lastInsertRowId);
}

export async function updatePayment(
  id: number,
  data: { amount?: number; note?: string; date?: string },
): Promise<void> {
  const database = db ?? (await initDatabase());
  await database.runAsync(
    `UPDATE customer_payments 
     SET amount = COALESCE(?, amount),
         note = ?,
         date = COALESCE(?, date)
     WHERE id = ?`,
    data.amount ?? null,
    data.note ?? null,
    data.date ?? null,
    id,
  );
}

export async function deletePayment(id: number): Promise<void> {
  const database = db ?? (await initDatabase());
  await database.runAsync('DELETE FROM customer_payments WHERE id = ?', id);
}

export async function getCreditLogs(creditId: number) {
  const database = db ?? (await initDatabase());
  const rows = await database.getAllAsync<{
    id: number;
    credit_id: number;
    customer_id: number;
    old_amount: number | null;
    new_amount: number | null;
    changed_at: string;
  }>(
    `SELECT id, credit_id, customer_id, old_amount, new_amount, changed_at
     FROM customer_credit_logs
     WHERE credit_id = ?
     ORDER BY changed_at DESC`,
    [creditId],
  );
  return rows ?? [];
}

export async function getPaymentLogs(paymentId: number) {
  const database = db ?? (await initDatabase());
  const rows = await database.getAllAsync<{
    id: number;
    payment_id: number;
    customer_id: number;
    old_amount: number | null;
    new_amount: number | null;
    changed_at: string;
  }>(
    `SELECT id, payment_id, customer_id, old_amount, new_amount, changed_at
     FROM customer_payment_logs
     WHERE payment_id = ?
     ORDER BY changed_at DESC`,
    [paymentId],
  );
  return rows ?? [];
}

// --- Reports (date range) ---
export async function getReportTotals(
  startDate: string,
  endDate: string,
): Promise<{
  totalCredits: number;
  totalPayments: number;
  netBalance: number;
}> {
  const database = db ?? (await initDatabase());
  const credits = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM customer_credits WHERE date >= ? AND date <= ?',
    [startDate, endDate],
  );
  const payments = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM customer_payments WHERE date >= ? AND date <= ?',
    [startDate, endDate],
  );
  const totalCredits = credits?.total ?? 0;
  const totalPayments = payments?.total ?? 0;
  return {
    totalCredits,
    totalPayments,
    netBalance: totalCredits - totalPayments,
  };
}

export async function getTotalReceivables(): Promise<number> {
  const database = db ?? (await initDatabase());
  const row = await database.getFirstAsync<{ total: number }>(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM customer_credits), 0) -
       COALESCE((SELECT SUM(amount) FROM customer_payments), 0) as total`,
  );
  return Number(row?.total ?? 0);
}
