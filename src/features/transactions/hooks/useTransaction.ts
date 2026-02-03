import { useCallback, useEffect, useState } from 'react';
import type { Customer, TransactionType, CustomerCredit, CustomerPayment } from '../../../types';
import { getCustomerById, getCreditById, getPaymentById } from '../../../db/database';

type Tx = CustomerCredit | CustomerPayment;

export function useTransaction(type: TransactionType, transactionId: number | null) {
  const [transaction, setTransaction] = useState<Tx | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (transactionId == null) {
      setTransaction(null);
      setCustomer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const tx =
      type === 'udharo' ? await getCreditById(transactionId) : await getPaymentById(transactionId);
    setTransaction(tx);
    if (tx) {
      const c = await getCustomerById(tx.customer_id);
      setCustomer(c);
    } else {
      setCustomer(null);
    }
    setLoading(false);
  }, [transactionId, type]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { transaction, customer, loading, refreshing, refresh, reload: load };
}
