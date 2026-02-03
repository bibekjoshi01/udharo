export type TransactionType = 'udharo' | 'payment';

export interface Customer {
  id: number;
  name: string;
  mobile?: string;
  address?: string;
  note?: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  customer_id: number;
  amount: number;
  type: TransactionType;
  note?: string;
  date: string;
  created_at: string;
}

export interface TransactionWithCustomer extends Transaction {
  customer_name: string;
  customer_mobile?: string;
}

export interface CustomerCredit {
  id: number;
  customer_id: number;
  amount: number;
  note?: string;
  date: string;
  created_at: string;
}

export interface CustomerPayment {
  id: number;
  customer_id: number;
  amount: number;
  note?: string;
  date: string;
  created_at: string;
}

export interface CustomerCreditWithCustomer extends CustomerCredit {
  customer_name: string;
  customer_mobile?: string;
}

export interface CustomerPaymentWithCustomer extends CustomerPayment {
  customer_name: string;
  customer_mobile?: string;
}

export interface CustomerWithBalance extends Customer {
  balance: number;
  last_transaction_date?: string;
  transaction_count?: number;
}
