
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface QueryConfig {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  cacheKey?: string;
  cacheTTL?: number; // in milliseconds
}

interface QueryResult<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidateCache: () => void;
}

const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const useOptimizedQuery = <T = any>(config: QueryConfig): QueryResult<T> => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const cacheKey = config.cacheKey || JSON.stringify(config);
  const cacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5 minutes default

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setData(cached.data as T[]);
        setLoading(false);
        return;
      }

      // Build query - start with basic from() call and select
      let query = supabase.from(config.table as any).select(config.select || '*');

      // Apply filters
      if (config.filters) {
        Object.entries(config.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'string' && value.includes('%')) {
              query = query.ilike(key, value);
            } else if (typeof value === 'string' && value.startsWith('gte.')) {
              query = query.gte(key, value.substring(4));
            } else if (typeof value === 'string' && value.startsWith('lte.')) {
              query = query.lte(key, value.substring(4));
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Apply ordering
      if (config.orderBy) {
        query = query.order(config.orderBy.column, { 
          ascending: config.orderBy.ascending !== false 
        });
      }

      // Apply limit
      if (config.limit) {
        query = query.limit(config.limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Cache the result
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: cacheTTL
      });

      setData(result as T[]);
    } catch (err) {
      console.error('Query error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey, cacheTTL, config]);

  const invalidateCache = useCallback(() => {
    queryCache.delete(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidateCache
  };
};
