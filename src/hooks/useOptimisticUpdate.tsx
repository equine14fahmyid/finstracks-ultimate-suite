
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface OptimisticUpdateOptions<T> {
  mutationFn: (data: T) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useOptimisticUpdate = <T,>({
  mutationFn,
  onSuccess,
  onError,
  successMessage = 'Operasi berhasil',
  errorMessage = 'Terjadi kesalahan'
}: OptimisticUpdateOptions<T>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: T) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(data);
      
      toast({
        title: "Sukses",
        description: successMessage,
      });

      onSuccess?.(result);
      return { data: result, error: null };
    } catch (err: any) {
      const errorMsg = err?.message || errorMessage;
      setError(errorMsg);
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });

      onError?.(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, successMessage, errorMessage]);

  const retry = useCallback((data: T) => {
    return execute(data);
  }, [execute]);

  return {
    execute,
    retry,
    loading,
    error,
  };
};
