
import { useState, useEffect } from 'react';

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useAsyncDebounce = <T extends any[]>(
  callback: (...args: T) => Promise<void> | void,
  delay: number
) => {
  const [loading, setLoading] = useState(false);

  const debouncedCallback = useState(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        setLoading(true);
        try {
          await callback(...args);
        } finally {
          setLoading(false);
        }
      }, delay);
    };
  })[0];

  return { debouncedCallback, loading };
};
