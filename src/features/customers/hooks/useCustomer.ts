import { useCallback, useState, useEffect } from 'react';
import {
  getCustomerById,
  getTotalCreditsForCustomer,
  getTotalPaymentsForCustomer,
} from '../../../db/database';
import type { Customer } from '../../../types';

export function useCustomer(customerId: number | null) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    if (customerId == null) {
      setCustomer(null);
      setBalance(0);
      setLoading(false);
      return;
    }
    const c = await getCustomerById(customerId);
    setCustomer(c ?? null);
    if (!c) {
      setBalance(0);
      setTotalCredits(0);
      setTotalPayments(0);
      return;
    }
    try {
      const [credits, payments] = await Promise.all([
        getTotalCreditsForCustomer(customerId),
        getTotalPaymentsForCustomer(customerId),
      ]);
      setTotalCredits(credits);
      setTotalPayments(payments);
      setBalance(credits - payments);
    } catch (e: any) {
      setTotalCredits(0);
      setTotalPayments(0);
      setBalance(0);
      setError(String(e?.message ?? e));
    }
  }, [customerId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return {
    customer,
    balance,
    totalCredits,
    totalPayments,
    loading,
    refreshing,
    refresh,
    reload: load,
    error,
  };
}
