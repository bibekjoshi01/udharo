export type TransactionType = 'credit' | 'payment';

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
  expected_payment_date?: string;
  date: string;
  created_at: string;
}

export interface CustomerPayment {
  id: number;
  customer_id: number;
  amount: number;
  note?: string;
  is_verified?: number;
  verified_at?: string | null;
  attachment_uri?: string;
  attachment_name?: string;
  attachment_mime?: string;
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
  expected_payment_date?: string;
}

export interface CustomerPaymentWithCustomer extends CustomerPayment {
  customer_name: string;
  customer_mobile?: string;
}

export interface CollectionPriorityCustomer {
  id: number;
  name: string;
  balance: number;
  oldest_due_date?: string | null;
}

export interface CustomerWithBalance extends Customer {
  balance: number;
  last_transaction_date?: string;
  transaction_count?: number;
}
