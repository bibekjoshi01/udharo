import { useCallback, useEffect, useState } from 'react';
import type {
  TransactionType,
  CustomerCreditWithCustomer,
  CustomerPaymentWithCustomer,
} from '../../../types';
import {
  getCreditsWithCustomerPage,
  getPaymentsWithCustomerPage,
  getCreditsCount,
  getPaymentsCount,
} from '../../../db/database';

type TxRow = CustomerCreditWithCustomer | CustomerPaymentWithCustomer;

export function useTransactions(
  type: TransactionType,
  options?: { query?: string; pageSize?: number },
) {
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const query = options?.query ?? '';
  const pageSize = options?.pageSize ?? 100;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [count, rows] =
        type === 'udharo'
          ? await Promise.all([
              getCreditsCount(query),
              getCreditsWithCustomerPage({ limit: pageSize, offset: 0, query }),
            ])
          : await Promise.all([
              getPaymentsCount(query),
              getPaymentsWithCustomerPage({ limit: pageSize, offset: 0, query }),
            ]);
      setTotalCount(count);
      setTransactions(rows);
      setOffset(rows.length);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [pageSize, query, type]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (transactions.length >= totalCount) return;
    setLoadingMore(true);
    try {
      const next =
        type === 'udharo'
          ? await getCreditsWithCustomerPage({ limit: pageSize, offset, query })
          : await getPaymentsWithCustomerPage({ limit: pageSize, offset, query });
      setTransactions((prev) => [...prev, ...next]);
      setOffset((prev) => prev + next.length);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, offset, pageSize, query, totalCount, transactions.length, type]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    transactions,
    totalCount,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
    reload: load,
    error,
  };
}
