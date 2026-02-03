import { useCallback, useState, useEffect } from 'react';
import { getCustomersWithBalancePage, getCustomersCount } from '../../../db/database';
import type { CustomerWithBalance } from '../../../types';

export function useCustomers(options?: { query?: string; pageSize?: number }) {
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const query = options?.query ?? '';
  const pageSize = options?.pageSize ?? 100;

  const load = useCallback(async () => {
    setError(null);
    const [count, list] = await Promise.all([
      getCustomersCount(query),
      getCustomersWithBalancePage({ limit: pageSize, offset: 0, query }),
    ]);
    setTotalCount(count);
    setCustomers(list);
    setOffset(list.length);
  }, [pageSize, query]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (customers.length >= totalCount) return;
    setLoadingMore(true);
    try {
      const next = await getCustomersWithBalancePage({
        limit: pageSize,
        offset,
        query,
      });
      setCustomers((prev) => [...prev, ...next]);
      setOffset((prev) => prev + next.length);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoadingMore(false);
    }
  }, [customers.length, loadingMore, offset, pageSize, query, totalCount]);

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
    customers,
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
