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

export const CREATE_CREDITS_TABLE = `
  CREATE TABLE IF NOT EXISTS customer_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    expected_payment_date TEXT,
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

export const CREATE_SCHEMA_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
  );
`;

export const CREATE_CREDITS_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS customer_credit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    old_amount REAL,
    new_amount REAL,
    changed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (credit_id) REFERENCES customer_credits (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );
`;

export const CREATE_PAYMENTS_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS customer_payment_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    old_amount REAL,
    new_amount REAL,
    changed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (payment_id) REFERENCES customer_payments (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );
`;

export const CREATE_INDEX_CREDIT_LOGS = `
  CREATE INDEX IF NOT EXISTS idx_credit_logs_credit_id ON customer_credit_logs (credit_id);
`;

export const CREATE_INDEX_PAYMENT_LOGS = `
  CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON customer_payment_logs (payment_id);
`;

export const CREATE_TRIGGER_CREDIT_AMOUNT_LOG = `
  CREATE TRIGGER IF NOT EXISTS trg_credit_amount_update
  AFTER UPDATE OF amount ON customer_credits
  FOR EACH ROW
  WHEN OLD.amount IS NOT NEW.amount
  BEGIN
    INSERT INTO customer_credit_logs (credit_id, customer_id, old_amount, new_amount, changed_at)
    VALUES (OLD.id, OLD.customer_id, OLD.amount, NEW.amount, datetime('now'));
  END;
`;

export const CREATE_TRIGGER_PAYMENT_AMOUNT_LOG = `
  CREATE TRIGGER IF NOT EXISTS trg_payment_amount_update
  AFTER UPDATE OF amount ON customer_payments
  FOR EACH ROW
  WHEN OLD.amount IS NOT NEW.amount
  BEGIN
    INSERT INTO customer_payment_logs (payment_id, customer_id, old_amount, new_amount, changed_at)
    VALUES (OLD.id, OLD.customer_id, OLD.amount, NEW.amount, datetime('now'));
  END;
`;
