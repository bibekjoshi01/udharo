export type TransactionType = 'udharo' | 'payment';

export interface Customer {
  id: number;
  name: string;
  mobile?: string;
  address?: string;
  note?: string;
  created_at: string;
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

export interface CreditLog {
  id: number;
  credit_id: number;
  customer_id: number;
  old_amount: number | null;
  new_amount: number | null;
  changed_at: string;
}

export interface PaymentLog {
  id: number;
  payment_id: number;
  customer_id: number;
  old_amount: number | null;
  new_amount: number | null;
  changed_at: string;
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
