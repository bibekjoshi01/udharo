import { useCallback, useEffect, useState } from 'react';
import type { Customer, TransactionType, CustomerCredit, CustomerPayment } from '../../../types';
import { getCustomerById, getCreditById, getPaymentById } from '../../../db/database';

type Tx = CustomerCredit | CustomerPayment;

export function useTransaction(type: TransactionType, transactionId: number | null) {
  const [transaction, setTransaction] = useState<Tx | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    if (transactionId == null) {
      setTransaction(null);
      setCustomer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const tx =
        type === 'credit' ? await getCreditById(transactionId) : await getPaymentById(transactionId);
      setTransaction(tx);
      if (tx) {
        const c = await getCustomerById(tx.customer_id);
        setCustomer(c);
      } else {
        setCustomer(null);
      }
    } catch (e: any) {
      setTransaction(null);
      setCustomer(null);
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [transactionId, type]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { transaction, customer, loading, refreshing, refresh, reload: load, error };
}
