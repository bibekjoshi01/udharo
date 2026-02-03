export const CREATE_CUSTOMERS_TABLE = `
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('udharo', 'payment')),
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );
`;

export const CREATE_CREDITS_TABLE = `
  CREATE TABLE IF NOT EXISTS customer_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );
`;

export const CREATE_PAYMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS customer_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );
`;

export const CREATE_INDEX_CUSTOMER_ID = `
  CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions (customer_id);
`;

export const CREATE_INDEX_TRANSACTION_DATE = `
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
`;

export const CREATE_INDEX_CREDITS_CUSTOMER_ID = `
  CREATE INDEX IF NOT EXISTS idx_credits_customer_id ON customer_credits (customer_id);
`;

export const CREATE_INDEX_PAYMENTS_CUSTOMER_ID = `
  CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON customer_payments (customer_id);
`;

export const CREATE_INDEX_CREDITS_DATE = `
  CREATE INDEX IF NOT EXISTS idx_credits_date ON customer_credits (date);
`;

export const CREATE_INDEX_PAYMENTS_DATE = `
  CREATE INDEX IF NOT EXISTS idx_payments_date ON customer_payments (date);
`;
